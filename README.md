# strapi-plugin-account

This plugins was created with the purpose to improve some functionalities to default user account provided by plugin `strapi-plugin-users-permissions`, it because default `users-permissions` behavior doesnt attend the business rules of yours project, like create an associated model within the body of users create endpoint like below:

```json
{
    "email": "hello@world.com",
    "username": "helloworld",
    "password": "supersecret",
    "address": {
        "country": "EUA",
        "state": "NY",
        "city": "New York",
        "lat": "40.6974034",
        "lng": "-74.1197637"
    }
}
```
So, imagine that your users cannot be created without an address, then it allows a combined creation in just one query. But in this case, the property `address` is not validated and creating a user without this property will pass, because that, this plugin make uses of another plugin `strapi-plugin-validator` that allows you to create a customized validation for this query. For this example, you must to follow the steps below:

1 - Create a Content-Type for your address on strapi admin panel.

2 - Create a file `validators.json` for your address on path `api/address/config`

3 - Put the following content inside address validation config `api/address/config/validators.json`:

_`It will inherit a default validation config for address content-type, but you can improve yourself validations`_

```json
{
  "validators": {
      "address": {
          "model": "api.address.models.address"
      }
  }
}
```

4 - Create a file `validators.json` on path `extensions/account/config`.

5 - Put the following content inside `extensions/account/config/validators.json`:

_`It will inherit a default validation config for user content-type, and aggregate a validation for address`_


```json
{
  "validators": {
    "create": {
      "model": "plugins.users-permissions.models.user",
      "rules": {
        "address": {
          "rule": "required",
          "validator": "api.address.config.validators.address"
        }
      }
    }
  }
}
```
And tada, if you try to create a new user without address, it will not pass, but if you inform all data correctly, it will pass and create the user plus the address relationated with it.

For mor information about the `strapi-plugin-validator`, see this [link][strapi-plugin-validator].

---

## _🎉 That's all, folks._

How can you see, this plugin was created to make easy the setup of your business rule for user content-type in ` users-permissions` plugin. I hope it helps you to get a better and faster experience on your self projects. 


[strapi-plugin-validator]: https://github.com/andreciornavei/strapi-plugin-validator