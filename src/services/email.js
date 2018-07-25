const sendgrid = require('@sendgrid/mail');
const keys = require('../config/keys');

module.exports = ({ subject, to, html }) => {
  sendgrid.setApiKey(keys.sendgridKey);
  sendgrid.sendMultiple({
    to,
    from: 'noreply@jora.com',
    subject,
    html,
  });
};
