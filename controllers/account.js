'use strict';

const _ = require('lodash');
const { sanitizeEntity, getAbsoluteServerUrl } = require('strapi-utils');
const formatError = error => [
  { messages: [{ id: error.id, data: error.message, field: error.field }] },
];

module.exports = {
  create: async (ctx) => {
    const pluginStore = await strapi.store({
      environment: '',
      type: 'plugin',
      name: 'users-permissions',
    });

    const settings = await pluginStore.get({
      key: 'advanced',
    });

    const params = {
      ..._.omit(ctx.request.body, ['confirmed', 'resetPasswordToken']),
      provider: 'local',
    };

    const role = await strapi
      .query('role', 'users-permissions')
      .findOne({ type: settings.default_role }, []);

    if (!role) {
      return ctx.badRequest(
        null,
        formatError({
          id: 'Auth.form.error.role.notFound',
          message: 'Impossible to find the default role.',
        })
      );
    }

    params.role = role.id;
    params.password = await strapi.plugins['users-permissions'].services.user.hashPassword(params);

    try {
      if (!settings.email_confirmation) {
        params.confirmed = true;
      }

      for (const param in params) {
        if (typeof params[param] === "object") {
          // const relations = await strapi.query()
          const relation = await strapi.query(param).create(params[param])
          params[param] = relation.id
        }
      }

      const user = await strapi.query('user', 'users-permissions').create(params);

      const jwt = strapi.plugins['users-permissions'].services.jwt.issue(
        _.pick(user.toJSON ? user.toJSON() : user, ['id'])
      );

      if (settings.email_confirmation) {
        const settings = await pluginStore.get({ key: 'email' }).then(storeEmail => {
          try {
            return storeEmail['email_confirmation'].options;
          } catch (error) {
            return {};
          }
        });

        settings.message = await strapi.plugins[
          'users-permissions'
        ].services.userspermissions.template(settings.message, {
          URL: `${getAbsoluteServerUrl(strapi.config)}/auth/email-confirmation`,
          USER: _.omit(user.toJSON ? user.toJSON() : user, [
            'password',
            'resetPasswordToken',
            'role',
            'provider',
          ]),
          CODE: jwt,
        });

        settings.object = await strapi.plugins[
          'users-permissions'
        ].services.userspermissions.template(settings.object, {
          USER: _.omit(user.toJSON ? user.toJSON() : user, [
            'password',
            'resetPasswordToken',
            'role',
            'provider',
          ]),
        });

        try {
          // Send an email to the user.
          await strapi.plugins['email'].services.email.send({
            to: (user.toJSON ? user.toJSON() : user).email,
            from:
              settings.from.email && settings.from.name
                ? `${settings.from.name} <${settings.from.email}>`
                : undefined,
            replyTo: settings.response_email,
            subject: settings.object,
            text: settings.message,
            html: settings.message,
          });
        } catch (err) {
          return ctx.badRequest(null, err);
        }
      }

      const sanitizedUser = sanitizeEntity(user.toJSON ? user.toJSON() : user, {
        model: strapi.query('user', 'users-permissions').model,
      });
      if (settings.email_confirmation) {
        ctx.send({
          user: sanitizedUser,
        });
      } else {
        ctx.send({
          jwt,
          user: sanitizedUser,
        });
      }
    } catch (err) {
      ctx.status = 400
      ctx.body = formatError({
        id: 'unknown error',
        message: 'Something wrong happens',
      })
      return ctx
    }
  }

};
