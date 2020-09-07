'use strict';

const _ = require("lodash")

module.exports = async () => {

  // allow public routes for account plugin

  // variable to hold all configurated permissions
  const role = await strapi.query('role', 'users-permissions').findOne({ type: 'public' });
  role.permissions.forEach(permission => {
    // Change only permissions of application (not plugins)
    if (permission.type === 'account') {
      if (
        permission.controller == "account" &&
        permission.action == "create" &&
        permission.enabled == false
      ) {
        let newPermission = permission;
        newPermission.enabled = true;
        strapi.query('permission', 'users-permissions').update({ id: newPermission.id }, newPermission);
      }
    }
  });

};
