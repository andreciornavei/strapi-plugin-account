'use strict';

const { sanitizeEntity } = require("./../utils")

module.exports = async (ctx, next, returnUser) => {
  const params = ctx.query;

  const decodedToken = await strapi.plugins['users-permissions'].services.jwt.verify(
    params.confirmation
  );

  let user = await strapi.plugins['users-permissions'].services.user.edit(
    { id: decodedToken.id },
    { confirmed: true }
  );

  if (returnUser) {
    ctx.send({
      jwt: strapi.plugins['users-permissions'].services.jwt.issue({
        id: user.id,
      }),
      user: sanitizeEntity(user.toJSON ? user.toJSON() : user, {
        model: strapi.query('user', 'users-permissions').model,
      }),
    });
  } else {
    const settings = await strapi
      .store({
        environment: '',
        type: 'plugin',
        name: 'users-permissions',
        key: 'advanced',
      })
      .get();

    ctx.redirect(settings.email_confirmation_redirection || '/');
  }
}