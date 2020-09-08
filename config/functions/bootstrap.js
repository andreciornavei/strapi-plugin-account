'use strict';

const _ = require("lodash")

module.exports = async () => {

  // ************************************************ //
  //  Allow public routes for account plugin          //
  // ************************************************ //

  // retrieve public and private roles
  const rolePublic = await strapi.query('role', 'users-permissions').findOne({ type: 'public' });
  const rolePrivate = await strapi.query('role', 'users-permissions').findOne({ type: 'authenticated' });

  // request all permissions from public and private roles
  const permissions = await strapi.query('permission', 'users-permissions').find({
    type: 'account',
    controller: 'account',
    role_in: [
      rolePublic.id,
      rolePrivate.id
    ]
  });

  // define what actions in 'account' controller must to be allowed
  const allowFunctions = {
    [rolePublic.id]: ["create", "auth", "connect", "forgotpassword", "resetpassword", "emailconfirmation", "sendemailconfirmation"],
    [rolePrivate.id]: ["me", "update", "delete"]
  }

  // create an empty registered actions to be created if action is not registered
  const registeredActions = {
    [rolePublic.id]: [],
    [rolePrivate.id]: []
  }

  // iterate each permission to allow or deny according the allowFunctions
  permissions.forEach(permission => {
    let newPermission = permission;
    newPermission.enabled = allowFunctions[permission.role.id].includes(permission.action);
    strapi.query('permission', 'users-permissions').update({ id: newPermission.id }, newPermission);
    registeredActions[permission.role.id].push(permission.action)
  });

  // create permission for unregistered actions 
  for (const role in registeredActions) {
    for (const fn of allowFunctions[role]) {
      if (!registeredActions[role].includes(fn)) {
        strapi.query('permission', 'users-permissions').create({
          type: 'account',
          controller: 'account',
          action: fn,
          enabled: true,
          policy: '',
          __v: 0,
          role: role,
        });
      }
    }
  }


  // ************************************************* //
  //  Deactivate all users-permissions Auth and User   //
  // ************************************************* //

  // retrieve all 'auth' and 'user' permissions
  const denyPermissions = await strapi.query('permission', 'users-permissions').find({
    type: 'users-permissions',
    controller_in: ['auth', 'user'],
    enabled: true
  });

  // turn all permissions to enabled = false
  denyPermissions.forEach(permission => {
    let newPermission = permission;
    newPermission.enabled = false;
    strapi.query('permission', 'users-permissions').update({ id: newPermission.id }, newPermission);
  });

};
