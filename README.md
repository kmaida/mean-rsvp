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
- [x] Create admin-protected API route
- [x] Base styles / Bootstrap All The Things
- [x] Add ad-blocking detection so that Oauth login buttons aren't blocked
- [x] Deploy demo 
- [x] Clean up!
  - [x] Use one-time data bindings where appropriate
  - [x] Use promises `then`
    - [ ] Verify promise error functionality with `userData.updateUser()` service
 
## Changelog
 
* **v0.1.2** - 4/13/15: Cleaned up and commented, demo deployed
* **v0.1.1** - 4/11/15: Base styles and user functionality in place
* **v0.1.0** - 4/6/15: Upload files, improve services