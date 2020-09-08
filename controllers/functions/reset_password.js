'use strict';

const { _, formatError, sanitizeEntity } = require("./../utils")

module.exports = async (ctx) => {
  const params = _.assign({}, ctx.request.body, ctx.params);

  if (
    params.password &&
    params.passwordConfirmation &&
    params.password === params.passwordConfirmation &&
    params.code
  ) {
    const user = await strapi
      .query('user', 'users-permissions')
      .findOne({ resetPasswordToken: `${params.code}` });

    if (!user) {
      return ctx.badRequest(
        null,
        formatError({
          id: 'Auth.form.error.code.provide',
          message: 'Incorrect code provided.',
        })
      );
    }

    const password = await strapi.plugins['users-permissions'].services.user.hashPassword({
      password: params.password,
    });

    // Update the user.
    await strapi
      .query('user', 'users-permissions')
      .update({ id: user.id }, { resetPasswordToken: null, password });

    ctx.send({
      jwt: strapi.plugins['users-permissions'].services.jwt.issue({
        id: user.id,
      }),
      user: sanitizeEntity(user.toJSON ? user.toJSON() : user, {
        model: strapi.query('user', 'users-permissions').model,
      }),
    });
  } else if (
    params.password &&
    params.passwordConfirmation &&
    params.password !== params.passwordConfirmation
  ) {
    return ctx.badRequest(
      null,
      formatError({
        id: 'Auth.form.error.password.matching',
        message: 'Passwords do not match.',
      })
    );
  } else {
    return ctx.badRequest(
      null,
      formatError({
        id: 'Auth.form.error.params.provide',
        message: 'Incorrect params provided.',
      })
    );
  }
}