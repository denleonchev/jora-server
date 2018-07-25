const mongoose = require('mongoose');
const mongoURI = require('../config/keys').mongoURI;

(async () => {
  await mongoose.connect(mongoURI, { useNewUrlParser: true });
  console.log('Connected to MongoDB!');
})();
