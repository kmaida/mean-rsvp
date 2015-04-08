# reStart-mean

Boilerplate MEAN stack application with simple authentication via third-party Oauth.

* MongoDB
* Express
* AngularJS (with [reStart-angular](https://github.com/kmaida/reStart-angular))
* Node
* Token-based authentication (with [Satellizer](https://github.com/sahat/satellizer))
* FontAwesome
* Bootstrap 3
* Gulp

## To Do

- [x] Enhance services
 - [x] Integrate `success` and `error` with `$http` services
 - [x] Update controllers to use updated services
- [x] Create admin-protected API route
 - [x] GET list of users if admin
 - [x] Write ensureAdmin authentication/authorization function for API
 - [x] Protect UI by showing UI only on successful GET
 - [ ] Develop UI of userlist
- [ ] Base styles
 - [ ] Bootstrap All The Things
 - [ ] Improve default styling for nav
 - [ ] Improve default styling for Account page
 - [ ] Style Admin page
 
## Changelog
 
* **v0.1.0** - 4/6/15: Upload files, improve services