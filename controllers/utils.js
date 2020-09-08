const _ = require('lodash');
const crypto = require('crypto');
const { sanitizeEntity, getAbsoluteServerUrl } = require('strapi-utils');
const sanitizeUser = user => sanitizeEntity(user, { model: strapi.query('user', 'users-permissions').model });
const formatError = error => [
  { messages: [{ id: error.id, data: error.message, field: error.field }] },
];
const emailRegExp = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

module.exports = {
  _, 
  crypto,
  getAbsoluteServerUrl,
  sanitizeEntity, 
  sanitizeUser,
  formatError,
  emailRegExp,
}