'use strict';

const _ = require("lodash")

module.exports = async () => {

  // allow public routes for account plugin

  // variable to hold all configurated permissions
  const role = await strapi.query('role', 'users-permissions').findOne({ type: 'public' });
  const permissions = await strapi.query('permission', 'users-permissions').find({ type: 'account', role: role.id });
  permissions.forEach(permission => {
    if (
      permission.controller == "account" &&
      permission.action == "create" &&
      permission.enabled == false
    ) {
      let newPermission = permission;
      newPermission.enabled = true;
      strapi.query('permission', 'users-permissions').update({ id: newPermission.id }, newPermission);
    }
  });

  const existentPermissions = permissions.map(permission => `${permission.controller}.${permission.action}`)
  const allowPublicFunctions = ["account.create"]
  allowPublicFunctions.forEach(allow => {
    if (!existentPermissions.includes("account.create")) {
      const [controller, action] = allow.split(".")
      strapi.query('permission', 'users-permissions').create({
        type: 'account',
        controller: controller,
        action: action,
        enabled: true,
        policy: '',
        __v: 0,
        role: role.id,
      });
    }
  })

};
