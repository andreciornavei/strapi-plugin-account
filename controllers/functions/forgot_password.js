'use strict';
const { _, emailRegExp, formatError, crypto } = require("./../utils")

module.exports = async (ctx) => {
  let { email } = ctx.request.body;

  // Check if the provided email is valid or not.
  const isEmail = emailRegExp.test(email);

  if (isEmail) {
    email = email.toLowerCase();
  } else {
    return ctx.badRequest(
      null,
      formatError({
        id: 'Auth.form.error.email.format',
        message: 'Please provide valid email address.',
      })
    );
  }

  const pluginStore = await strapi.store({
    environment: '',
    type: 'plugin',
    name: 'users-permissions',
  });

  // Find the user by email.
  const user = await strapi.query('user', 'users-permissions').findOne({ email });

  // User not found.
  if (!user) {
    return ctx.badRequest(
      null,
      formatError({
        id: 'Auth.form.error.user.not-exist',
        message: 'This email does not exist.',
      })
    );
  }

  // Generate random token.
  const resetPasswordToken = crypto.randomBytes(64).toString('hex');

  const settings = await pluginStore.get({ key: 'email' }).then(storeEmail => {
    try {
      return storeEmail['reset_password'].options;
    } catch (error) {
      return {};
    }
  });

  const advanced = await pluginStore.get({
    key: 'advanced',
  });

  const userInfo = _.omit(user, ['password', 'resetPasswordToken', 'role', 'provider']);

  settings.message = await strapi.plugins['users-permissions'].services.userspermissions.template(
    settings.message,
    {
      URL: advanced.email_reset_password,
      USER: userInfo,
      TOKEN: resetPasswordToken,
    }
  );

  settings.object = await strapi.plugins['users-permissions'].services.userspermissions.template(
    settings.object,
    {
      USER: userInfo,
    }
  );

  try {
    // Send an email to the user.
    await strapi.plugins['email'].services.email.send({
      to: user.email,
      from:
        settings.from.email || settings.from.name
          ? `${settings.from.name} <${settings.from.email}>`
          : undefined,
      replyTo: settings.response_email,
      subject: settings.object,
      text: settings.message,
      html: settings.message,
    });
  } catch (err) {
    strapi.log.error(err)
    return ctx.badRequest(null, err);
  }

  // Update the user.
  await strapi.query('user', 'users-permissions').update({ id: user.id }, { resetPasswordToken });

  ctx.send({ ok: true });

}