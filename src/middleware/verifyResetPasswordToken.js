const User = require('../models/User');
const keys = require('../config/keys');
const ServerError = require('../utils/ServerError');

module.exports = async (req, res, next) => {
  const user = await User.getUserByResetPasswordToken(req.params.token);
  if (!user) {
    return next(new ServerError({
      message: 'Password reset token is not valid',
      code: 404,
    }));
  }
  if (user && user.resetPasswordTokenUsed) {
    return next(new ServerError({
      message: 'Password reset token was already used',
      code: 409,
    }));
  }
  if (user && (Date.parse(user.resetPasswordTokenExpires) - Date.now()) < keys.resetPasswordExpiration) {
    req.userID = user.id;
    return next();
  }
  return next(new ServerError({
    message: 'Reset password token is expired',
    code: 404,
  }));
};
