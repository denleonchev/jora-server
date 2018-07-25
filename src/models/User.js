const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const keys = require('../config/keys');

const Schema = mongoose.Schema;
const { encrypt, decrypt } = require('../utils/encryption');

const validatePassword = [
  {
    validator: function(value) {
      return value.search(/\d/) !== -1;
    },
    msg: 'Password should contain at least 1 digit',
  },
  {
    validator: function(value) {
      return value.search(/[a-zA-Z]/) !== -1;
    },
    msg: 'Password should contain at least 1 letter',
  },
  {
    validator: function(value) {
      return value.search(/[^\!\@\#\$\%\^\&\*\(\)\_\+]/) !== -1;
    },
    msg: 'Password should not contain bad characters',
  },
  {
    validator: function(value) {
      return value.search(/[\!\@\#\$\%\^\&\*\(\)\_\+]/) !== -1;
    },
    msg: 'Password should contain at least 1 special character',
  },
];

const  schema = new Schema({
  username: {
    type: String,
    minlength: [5, 'Username should be 6 character length'],
    required: [true, 'Username is required'],
    unique: [true, 'The username is already used'],
  },
  password: {
    type: String,
    validate: validatePassword,
    minlength: [6, 'Password should be 6 character length at least'],
    required: [true, 'Password is required'],
  },
  email: {
    type: String,
    validate: {
      validator: function(email) {
        return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email);
      },
      message: 'The provided email does not match email pattern',
    },
    required: [true, 'Email is required'],
    unique: [true, 'The email is already used'],
  },
  emailConfirmed: {
    type: Boolean,
    default: false,
  },
  emailConfirmationToken: String,
  resetPasswordToken: String,
  resetPasswordTokenExpires: Date,
  resetPasswordTokenUsed: {
    type: Boolean,
    default: false,
  },
});

/* hash password before saving user to the database */
schema.pre('save', async function() {
  const user = this;
  const saltAndHashField = async (value) => {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(value, salt, null);
  };
  user.password = await saltAndHashField(user.password);
  user.email = encrypt(user.email);
});

schema.plugin(uniqueValidator);

const User = mongoose.model('User', schema);

User.getUserByUsername = function (username) {
  return this.findOne({ username });
};

User.getEmailOfUser = function (email) {
  return decrypt(email);
};

User.getUserByEmailConfirmationToken = function (emailConfirmationToken) {
  return this.findOne({ emailConfirmationToken });
};

User.getUserByResetPasswordToken = function (resetPasswordToken) {
  return this.findOne({ resetPasswordToken });
};

User.setConfirmedEmail = function (id, emailConfirmed) {
  return this.findByIdAndUpdate(id, { emailConfirmed });
};

User.setNewPassword = function (id, password) {
  return this.findByIdAndUpdate(id, {
    password,
    resetPasswordTokenUsed: true,
  });
};

User.getUserById = function (id) {
  return User.findById(id);
};

User.createToken = async function () {
  const buffer = await crypto.randomBytes(20);
  return await buffer.toString('hex');
};

User.setEmailConfirmationToken = async function (id) {
  const emailConfirmationToken = await User.createToken();
  await this.findByIdAndUpdate(id, { emailConfirmationToken });
  return emailConfirmationToken;
};

User.setResetPasswordToken = async function (id) {
  const resetPasswordToken = await User.createToken();
  await this.findByIdAndUpdate(id, { resetPasswordToken, resetPasswordTokenExpires: Date.now() + keys.resetPasswordExpiration, resetPasswordTokenUsed: false });
  return resetPasswordToken;
};

User.createAndSaveUser = async function (username, password, email) {
  const emailConfirmationToken = await User.createToken();
  const newUser = new User({
    username,
    password,
    email,
    emailConfirmationToken,
  });
  return newUser.save();
};
User.comparePassword = function (candidatePassword, hashedPassword) {
  return bcrypt.compare(candidatePassword, hashedPassword);
};

module.exports = User;