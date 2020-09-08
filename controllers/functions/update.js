'use strict';
const { _, sanitizeEntity, formatError } = require("./../utils");

module.exports = async (ctx) => {
  const user = ctx.state.user;
  if (!user) {
    return ctx.badRequest(null, [{ messages: [{ id: 'No authorization header was found' }] }]);
  }

  try {

    const sanitizedUser = await strapi.connections.default.transaction(async (transacting) => {
      const params = ctx.request.body;
      for (const param in params) {
        const model = _.get(strapi, `plugins.users-permissions.models.user.attributes.${param}.model`)
        if (_.get(strapi, `models.${model}`)) {
          await strapi.query(param).update({ id: user[param] }, params[param], { transacting })
          delete params[param]
        }
      }
      const updatedUser = await strapi.query('user', 'users-permissions').update({ id: user.id }, params, { transacting });
      return sanitizeEntity(user.toJSON ? user.toJSON() : updatedUser, {
        model: strapi.query('user', 'users-permissions').model,
      });
    });

    ctx.send({
      user: sanitizedUser,
    });

  } catch (err) {
    strapi.log.error(err)
    ctx.status = 400
    ctx.body = formatError({
      id: 'unknown error',
      message: 'Something wrong happens',
    })
    return ctx
  }

}