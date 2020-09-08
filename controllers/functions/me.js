'use strict';
const { _, sanitizeUser } = require('./../utils');
module.exports = async (ctx) => {
  const user = ctx.state.user;
  if (!user) {
    return ctx.badRequest(null, [{ messages: [{ id: 'No authorization header was found' }] }]);
  }

  const userFields = sanitizeUser(user);
  for (const param in userFields) {
    const model = _.get(strapi, `plugins.users-permissions.models.user.attributes.${param}.model`)
    if(_.get(strapi, `models.${model}`)){
      userFields[param] = await strapi.query(model).findOne({ id: userFields[param] })
    }
  }

  ctx.body = userFields;
}