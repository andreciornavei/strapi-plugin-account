'use strict';
const { _, sanitizeUser } = require('./../utils');
module.exports = async (ctx) => {
  const user = ctx.state.user;
  if (!user) {
    return ctx.badRequest(null, [{ messages: [{ id: 'No authorization header was found' }] }]);
  }

  // await strapi.connections.default.transaction(async (transacting) => {
    const userFields = sanitizeUser(user);
    for (const param in userFields) {
      const model = _.get(strapi, `plugins.users-permissions.models.user.attributes.${param}.model`)
      if (_.get(strapi, `models.${model}`)) {
        userFields[param] = await strapi.query(model).delete({ id: userFields[param] }/*, { transacting }*/)
      }
    }
    await strapi.query("user", "users-permissions").delete({ id: user.id }/*, { transacting }*/)
  // })

  ctx.status = 204;
  ctx.body = "";
}