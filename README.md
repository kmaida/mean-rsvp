# reStart-mean

Boilerplate MEAN stack application with simple authentication via third-party Oauth.

* MongoDB
* Express
* AngularJS (with [reStart-angular](https://github.com/kmaida/reStart-angular))
* Node
* Token-based authentication (with Oauth via [Satellizer](https://github.com/sahat/satellizer))
* FontAwesome (CDN)
* Bootstrap 3 (local)
* Gulp

## Demo

Demo is available at [restart-mean.kmaida.net](http://restart-mean.kmaida.net).

## To Do

- [x] Enhance services
 - [x] Integrate `success` and `error` with `$http` services
 - [x] Update controllers to use updated services
- [x] Create admin-protected API route
 - [x] GET list of users if admin
 - [x] Write ensureAdmin authentication/authorization function for API
 - [x] Protect UI by showing UI only on successful GET
 - [x] Develop UI of userlist
- [x] Base styles
 - [x] Bootstrap All The Things
 - [x] Improve default styling for nav
 - [x] Improve default styling for Account page
 - [x] Style Admin page
- [x] CLEAN UP!
 - [x] Improve module styles
 - [x] Clean up JSDoc comments
 - [x] Clean up code and remove logs (server and client)
 - [x] Remove GlobalObj (unnecessary example)
- [x] Deploy demo 
- [x] Add ad-blocking detection and apply on all pages that have social icons
 
## Changelog
 
* **v0.1.2** - 4/13/15: Cleaned up and commented, demo deployed
* **v0.1.1** - 4/11/15: Base styles and user functionality in place
* **v0.1.0** - 4/6/15: Upload files, improve services