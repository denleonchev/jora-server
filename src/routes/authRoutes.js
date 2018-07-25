const passport = require('passport');
const asyncHandler = require('express-async-handler');

const User = require('../models/User');
const ServerError = require('../utils/ServerError');
const sendEmailNotification = require('../services/email');
const verifyEmailTemplate = require('../services/emailTemplates/verifyEmailTemplate');
const passwordResetTemplate = require('../services/emailTemplates/passwordResetTemplate');
const verifyResetPasswordToken = require('../middleware/verifyResetPasswordToken');

module.exports = (app) => {
  app.post('/api/signup', asyncHandler(async (req, res, next) => {
    const { username, password, email } = req.body;
    const user = await User.createAndSaveUser(username, password, email);
    req.logIn(user, async function (err) {
      if (err) { return next(err); }
      res.send(user);
      await sendEmailNotification({
        to: email,
        subject: 'Verify your email address',
        html: verifyEmailTemplate(req.headers.host, user.emailConfirmationToken),
      });
    });
  }));

  app.get('/api/verify-email/:token', asyncHandler(async (req, res, next) => {
    const user = await User.getUserByEmailConfirmationToken(req.params.token);
    if (!user) {
      return next(new ServerError({
        message: 'Email confirmation token is not valid',
        code: 404,
      }));
    }
    if (user && !user.emailConfirmed) {
      await User.setConfirmedEmail(user._id, true);
      return res.send('Email address is verified');
    }
    return next(new ServerError({
      message: 'Email address is already confirmed',
      code: 409,
    }));
  }));

  app.post('/api/request/email-verification', asyncHandler(async (req, res, next) => {
    const { username } = req.body;
    const user = await User.getUserByUsername(username);
    if (!user) {
      return next(new ServerError({
        message: 'The user was not found',
        code: 404,
      }));
    }
    if (user && !user.emailConfirmed) {
      const token = await User.setEmailConfirmationToken(user._id);
      await sendEmailNotification({
        to: User.getEmailOfUser(user.email),
        subject: 'Verify your email address',
        html: verifyEmailTemplate(req.headers.host, token),
      });
      return res.send('Email with confirmation link was sent');
    }
    return next(new ServerError({
      message: 'Email address is already confirmed',
      code: 409,
    }));
  }));

  app.post('/api/request/reset-password', asyncHandler(async (req, res, next) => {
    const { username } = req.body;
    const user = await User.getUserByUsername(username);
    if (!user) {
      return next(new ServerError({
        message: 'The user was not found',
        code: 404,
      }));
    }
    if (user && user.emailConfirmed) {
      const token = await User.setResetPasswordToken(user._id);
      await sendEmailNotification({
        to: User.getEmailOfUser(user.email),
        subject: 'Reset your password',
        html: passwordResetTemplate(req.headers.host, token),
      });
      return res.send('Email with password reset link was sent');
    }
    return next(new ServerError({
      message: 'Please verify your email address firstly',
      code: 409,
    }));
  }));
  app.get('/api/reset-password/:token', verifyResetPasswordToken, asyncHandler(async (req, res) => {
    return res.send('Reset password token is valid');
  }));

  app.post('/api/reset-password/:token', verifyResetPasswordToken, asyncHandler(async (req, res) => {
    const { password } = req.body;
    await User.setNewPassword(req.userID, password);
    return res.send('The password was successfully changed');
  }));

  app.post('/api/login', function(req, res, next) {
    passport.authenticate('local', function(err, user) {
      if (err) { return next(err); }
      if (!user) {
        return next(new ServerError({
          message: 'Please provide fields \'username\' and \'password\' for authentication!',
          code: 401,
        }));
      }
      req.logIn(user, function(err) {
        if (err) { return next(err); }
        const { username } = user;
        return res.send({ username });
      });
    })(req, res, next);
  });

  app.get('/api/user', (req, res) => {
    res.send(req.user);
  });

  app.post('/api/logout', (req, res) => {
    req.logout();
    res.send({ user: req.user });
  });
};