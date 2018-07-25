const express = require('express');
const bodyParser = require('body-parser').json();
const passport = require('passport');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);

const { secret, mongoURI } = require('./src/config/keys');
const ServerError = require('./src/utils/ServerError');
require('./src/models/User');

require('./src/services/database');
require('./src/services/passport');
const app = express();
app.use(session({
  secret,
  resave: false,
  saveUninitialized: false,
  store: new MongoStore({
    url: mongoURI,
  }),
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(bodyParser);

require('./src/routes/authRoutes')(app);


app.use((error, req, res, next) => { // eslint-disable-line no-unused-vars
  if (error.name === 'ValidationError') {
    const { errors } = error;
    const resBody = { errors: [] };
    for (const key of Object.keys(errors)) {
      resBody.errors.push({
        field: errors[key].path,
        message: errors[key].message,
      });
    }
    return res.status(400)
      .send(resBody);
  }
  if (error instanceof ServerError) {
    return res.status(error.code)
      .send(error.message);
  }
  console.log('Something terrible happened on server!', error);
  return res.status(500)
    .send('Something terrible happened on server!');
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`The server is running on port ${port}`);
});