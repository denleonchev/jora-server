module.exports = {
  mongoURI: process.env.MONGO_URI,
  secret: process.env.SECRET,
  sendgridKey: process.env.SENDGRID_KEY,
  resetPasswordExpiration: Number(process.env.RESET_PASSWORD_EXPIRATION),
};
