'use strict';

const { _, emailRegExp, getAbsoluteServerUrl } = require("./../utils")

module.exports = async (ctx) => {
  const pluginStore = await strapi.store({
    environment: '',
    type: 'plugin',
    name: 'users-permissions',
  });

  const params = _.assign(ctx.request.body);

  if (!params.email) {
    return ctx.badRequest('missing.email');
  }

  const isEmail = emailRegExp.test(params.email);

  if (isEmail) {
    params.email = params.email.toLowerCase();
  } else {
    return ctx.badRequest('wrong.email');
  }

  const user = await strapi.query('user', 'users-permissions').findOne({
    email: params.email,
  });

  if (user.confirmed) {
    return ctx.badRequest('already.confirmed');
  }

  if (user.blocked) {
    return ctx.badRequest('blocked.user');
  }

  const jwt = strapi.plugins['users-permissions'].services.jwt.issue(
    _.pick(user.toJSON ? user.toJSON() : user, ['id'])
  );

  const settings = await pluginStore.get({ key: 'email' }).then(storeEmail => {
    try {
      return storeEmail['email_confirmation'].options;
    } catch (err) {
      return {};
    }
  });

  const userInfo = _.omit(user, ['password', 'resetPasswordToken', 'role', 'provider']);

  settings.message = await strapi.plugins['users-permissions'].services.userspermissions.template(
    settings.message,
    {
      URL: `${getAbsoluteServerUrl(strapi.config)}/auth/email-confirmation`,
      USER: userInfo,
      CODE: jwt,
    }
  );

  settings.object = await strapi.plugins['users-permissions'].services.userspermissions.template(
    settings.object,
    {
      USER: userInfo,
    }
  );

  try {
    await strapi.plugins['email'].services.email.send({
      to: (user.toJSON ? user.toJSON() : user).email,
      from:
        settings.from.email && settings.from.name
          ? `"${settings.from.name}" <${settings.from.email}>`
          : undefined,
      replyTo: settings.response_email,
      subject: settings.object,
      text: settings.message,
      html: settings.message,
    });
    ctx.send({
      email: (user.toJSON ? user.toJSON() : user).email,
      sent: true,
    });
  } catch (err) {
    return ctx.badRequest(null, err);
  }
}