'use strict';

module.exports = {
  create: require("./functions/create"),
  auth: require("./functions/auth"),
  me: require("./functions/me"),
  update: require("./functions/update"),
  delete: require("./functions/delete"),
  connect: require("./functions/connect"),
  forgotPassword: require("./functions/forgot_password"),
  resetPassword: require("./functions/reset_password"),
  emailConfirmation: require("./functions/email_confirmation"),
  sendEmailConfirmation: require("./functions/send_email_confirmation")
};