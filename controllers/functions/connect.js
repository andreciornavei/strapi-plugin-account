'use strict';

const grant = require('grant-koa');
const { _ } = require('./../utils');

module.exports = async (ctx, next) => {
  const grantConfig = await strapi
    .store({
      environment: '',
      type: 'plugin',
      name: 'users-permissions',
      key: 'grant',
    })
    .get();

  const [requestPath] = ctx.request.url.split('?');
  const provider = requestPath.split('/')[2];

  if (!_.get(grantConfig[provider], 'enabled')) {
    return ctx.badRequest(null, 'This provider is disabled.');
  }

  if (!strapi.config.server.url.startsWith('http')) {
    strapi.log.warn(
      'You are using a third party provider for login. Make sure to set an absolute url in config/server.js. More info here: https://strapi.io/documentation/v3.x/plugins/users-permissions.html#setting-up-the-server-url'
    );
  }

  // Ability to pass OAuth callback dynamically
  grantConfig[provider].callback = _.get(ctx, 'query.callback') || grantConfig[provider].callback;
  grantConfig[provider].redirect_uri = strapi.plugins[
    'users-permissions'
  ].services.providers.buildRedirectUri(provider);

  return grant(grantConfig)(ctx, next);
}