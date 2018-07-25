const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const mongoose = require('mongoose');

const User = mongoose.model('User');
const ServerError = require('../utils/ServerError');

passport.deserializeUser(async function(id, next) {
  try {
    const user = await User.getUserById(id);
    next(null, user);
  } catch (error) {
    next(error, null);
  }
});
passport.serializeUser(function(user, next) {
  next(null, user.id);
});


passport.use(new LocalStrategy(
  async function(username, password, next) {
    if (!username && !password) {
      return next(new ServerError({
        message: 'Please provide fields \'username\' and \'password\' for authentication!',
        code: 401,
      }), false);
    }
    const user = await User.getUserByUsername(username);
    if (!user) {
      return next(new ServerError({
        message: 'There is no user with such username',
        code: 401,
      }), false);
    }
    if(!await User.comparePassword(password, user.password)) {
      return next(new ServerError({
        message: 'The provided password is incorrect',
        code: 401,
      }), false);
    }
    return next(null, user);
  }
));
