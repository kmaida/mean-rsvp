angular.module("myApp",["ngRoute","ngResource","ngSanitize","ngMessages","mediaCheck","satellizer","ui.bootstrap"]),function(){"use strict";function t(t,e,n,i,a,r,o){function u(){s.btnSaved=!1,s.btnSaveText="Save"}function c(t,e){s.btnSaveText=""===t||null===t?"Enter Name":"Save"}var s=this;s.logins=r.LOGINS,s.isAuthenticated=function(){return n.isAuthenticated()};var l=e.search().view;s.tabs=[{name:"User Info",query:"user-info"},{name:"Manage Logins",query:"manage-logins"},{name:"RSVPs",query:"rsvps"}],s.currentTab=l?l:"user-info",t.$on("$routeUpdate",function(t,e){s.currentTab=e.params.view||"user-info"}),s.getProfile=function(){function t(t){s.user=t,s.administrator=s.user.isAdmin,s.linkedAccounts=o.getLinkedAccounts(s.user,"account"),s.showAccount=!0,s.rsvps=s.user.rsvps}function e(t){s.errorGettingUser=!0}i.getUser().then(t,e)},u(),t.$watch("account.user.displayName",c),s.updateProfile=function(){function t(){s.btnSaved=!0,s.btnSaveText="Saved!",a(u,2500)}function e(){s.btnSaved="error",s.btnSaveText="Error saving!",a(u,3e3)}var n={displayName:s.user.displayName};s.user.displayName&&(s.btnSaveText="Saving...",i.updateUser(n).then(t,e))},s.link=function(t){n.link(t).then(function(){s.getProfile()})["catch"](function(t){alert(t.data.message)})},s.unlink=function(t){n.unlink(t).then(function(){s.getProfile()})["catch"](function(e){alert(e.data?e.data.message:"Could not unlink "+t+" account")})},s.getProfile()}angular.module("myApp").controller("AccountCtrl",t),t.$inject=["$scope","$location","$auth","userData","$timeout","OAUTH","User"]}(),function(){"use strict";function t(t,e,n,i,a,r){function o(t){u.users=t,angular.forEach(u.users,function(t){t.linkedAccounts=a.getLinkedAccounts(t)})}var u=this;i.getUser().then(function(t){u.adminReady=!0,t.isAdmin&&(u.showAdmin=!0)}),u.isAuthenticated=function(){return n.isAuthenticated()};var c=e.search().view;u.tabs=[{name:"Events",query:"events"},{name:"Add Event",query:"add-event"},{name:"Users",query:"users"}],u.currentTab=c?c:"events",t.$on("$routeUpdate",function(t,e){u.currentTab=e.params.view||"events"}),i.getAllUsers().then(o),u.showGuests=function(t,e){u.showGuestsEventId=t,u.showGuestsEventName=e,u.showModal=!0}}angular.module("myApp").controller("AdminCtrl",t),t.$inject=["$scope","$location","$auth","userData","User","rsvpData"]}(),function(){"use strict";function t(t,e,n,i){function a(t){r.events=t,r.eventsReady=!0}var r=this;r.evtUrl=e.protocol()+"://"+e.host()+"/event/",r.blurUrlInput=function(){r.copyInput=null},r.showUrlInput=function(t){r.copyInput=t,n(function(){angular.element("#e"+t).find("input").select()})},t.getAllEvents().then(a),r.sortStartDate=function(t){return i.getJSDatetime(t.startDate,t.startTime)}}angular.module("myApp").controller("AdminEventListCtrl",t),t.$inject=["eventData","$location","$timeout","Event"]}(),function(){"use strict";function t(t,e,n,i,a,r){function o(t){l.editEvent=t,l.showEditForm=!0}function u(){l.btnDelete=!1,l.btnDeleteText="Delete Event"}function c(){l.btnDeleteText="Deleted!",l.btnDelete=!0,l.editEvent={},r(function(){a.path("/admin")},1500)}function s(){l.btnDeleteText="Error deleting!",r(u,3e3)}var l=this,d=i.eventId;l.tabs=["Update Details","Delete Event"],l.currentTab=0,l.changeTab=function(t){l.currentTab=t},e.getUser().then(function(t){l.showEdit=t.isAdmin?!0:!1}),l.isAuthenticated=function(){return t.isAuthenticated()},n.getEvent(d).then(o),u(),l.deleteEvent=function(){l.btnDeleteText="Deleting...",n.deleteEvent(d).then(c,s)}}angular.module("myApp").controller("EditEventCtrl",t),t.$inject=["$auth","userData","eventData","$routeParams","$location","$timeout"]}(),function(){"use strict";function t(t,e,n,i,a){function r(r){function o(){l.btnSaved=!1,l.btnSubmitText=d?"Submit":"Update"}function u(){n.search("view","events")}function c(){l.btnSaved=!0,l.btnSubmitText=d?"Saved!":"Updated!",d&&(l.showRedirectMsg=!0,e(u,2500)),f&&(l.showUpdateDetailLink=!0,e(o,2500))}function s(){l.btnSaved="error",l.btnSubmitText=d?"Error saving!":"Error updating!",e(o,3e3)}var l=this,d=jQuery.isEmptyObject(l.prefillModel),f=!jQuery.isEmptyObject(l.prefillModel);l.timeRegex=/^(0?[1-9]|1[012])(:[0-5]\d) [APap][mM]$/i,f&&(l.formModel=l.prefillModel),l.minDate=new Date,l.dateOptions={showWeeks:!1},l.startDateOpen=!1,l.endDateOpen=!1,l.toggleDatepicker=function(t,e){t.preventDefault(),t.stopPropagation(),l[e+"Open"]=!l[e+"Open"]},l.startDateBlur=function(){l.formModel&&l.formModel.startDate&&!l.formModel.endDate&&(l.formModel.endDate=i("date")(l.formModel.startDate,"MM/dd/yyyy"))},o(),l.validateDaterange=function(){if(l.formModel&&l.formModel.startDate&&l.formModel.startTime&&l.formModel.endDate&&l.formModel.endTime){var t=a.getJSDatetime(l.formModel.startDate,l.formModel.startTime),e=a.getJSDatetime(l.formModel.endDate,l.formModel.endTime);l.validDaterange=0>t-e}},l.submitEvent=function(){d?t.createEvent(l.formModel).then(c,s):f&&t.updateEvent(l.formModel._id,l.formModel).then(c,s)}}return r.$inject=["$scope"],{restrict:"EA",scope:{prefillModel:"="},templateUrl:"/ng-app/admin/eventForm.tpl.html",controller:r,controllerAs:"ef",bindToController:!0}}angular.module("myApp").directive("eventForm",t),t.$inject=["eventData","$timeout","$location","$filter","Event"]}(),function(){"use strict";function t(){function t(t,e,n,i){var a=new Date,r=a.setDate(a.getDate()-1);i.$parsers.unshift(function(t){var e=Date.parse(t),n=0>r-e;return i.$setValidity("pastDate",n),n?t:void 0}),i.$formatters.unshift(function(t){var e=Date.parse(t),n=0>r-e;return i.$setValidity("pastDate",n),t})}return t.$inject=["$scope","$elem","$attrs","ngModel"],{restrict:"A",require:"ngModel",link:t}}angular.module("myApp").directive("validateDateFuture",t),t.$inject=["eventData","$timeout","$location","$filter","Event"]}(),function(){"use strict";function t(t){function e(e){var n=this;e.$watch("g.eventId",function(e,i){function a(t){var e=0;n.guests=t;for(var i=0;i<n.guests.length;i++)e+=n.guests[i].guests;n.totalGuests=e,n.guestsReady=!0}e&&(n.guestsReady=!1,t.getEventGuests(e).then(a))}),n.closeModal=function(){n.showModal=!1}}return e.$inject=["$scope"],{restrict:"EA",scope:{eventId:"=",eventName:"=",showModal:"="},templateUrl:"/ng-app/admin/viewEventGuests.tpl.html",controller:e,controllerAs:"g",bindToController:!0}}angular.module("myApp").directive("viewEventGuests",t),t.$inject=["rsvpData"]}(),function(){"use strict";function t(t,e){function n(t){var n,i=t.startDate,a=new Date(i),r=t.startTime,o=t.endDate,u=new Date(o),c=t.endTime,s="MMM d yyyy",l=e("date")(a,s),d=e("date")(u,s);return n=l===d?l+", "+r+" - "+c:l+", "+r+" - "+d+", "+c}function i(t,e){var n,i=new Date(t),a=e.split(" "),r=a[0].split(":"),o=1*r[0],u=1*r[1],c=a[1];return"PM"==c&&12!==o&&(o+=12),n=new Date(i.getFullYear(),i.getMonth(),i.getDate(),o,u)}function a(t){var e=i(t.endDate,t.endTime),n=new Date;return n>e}return{getPrettyDatetime:n,getJSDatetime:i,expired:a}}angular.module("myApp").factory("Event",t),t.$inject=["Utils","$filter"]}(),function(){"use strict";angular.module("myApp").constant("MQ",{SMALL:"(max-width: 767px)",LARGE:"(min-width: 768px)"})}(),function(){"use strict";angular.module("myApp").constant("OAUTH",{LOGINS:[{account:"google",name:"Google",url:"http://accounts.google.com"},{account:"twitter",name:"Twitter",url:"http://twitter.com"},{account:"facebook",name:"Facebook",url:"http://facebook.com"},{account:"github",name:"GitHub",url:"http://github.com"}]})}(),function(){"use strict";function t(t){function e(e){var n=[];return angular.forEach(t.LOGINS,function(t){var i=t.account;e[i]&&n.push(i)}),n}return{getLinkedAccounts:e}}angular.module("myApp").factory("User",t),t.$inject=["OAUTH"]}(),function(){"use strict";function t(){function t(t){var e=["th","st","nd","rd"],n=t%100;return e[(n-20)%10]||e[n]||e[0]}return{getOrdinal:t}}angular.module("myApp").factory("Utils",t)}(),function(){"use strict";function t(t){t.loginUrl="http://rsvp.kmaida.io/auth/login",t.facebook({clientId:"471837599630371"}),t.google({clientId:"1035478814047-41n8v2umgsupknvmj7q0e6n1gr4nauav.apps.googleusercontent.com"}),t.twitter({url:"/auth/twitter"}),t.github({clientId:"b303ff4b216c0571f6ce"})}function e(t,e,n){t.$on("$routeChangeStart",function(i,a,r){a&&a.$$route&&a.$$route.secure&&!n.isAuthenticated()&&(t.authPath=e.path(),t.$evalAsync(function(){e.path("/login")}))})}angular.module("myApp").config(t).run(e),t.$inject=["$authProvider"],e.$inject=["$rootScope","$location","$auth"]}(),function(){"use strict";function t(t,e){t.when("/",{templateUrl:"ng-app/events/Events.view.html",secure:!0}).when("/login",{templateUrl:"ng-app/login/Login.view.html"}).when("/event/:eventId",{templateUrl:"ng-app/event-detail/EventDetail.view.html",secure:!0}).when("/event/:eventId/edit",{templateUrl:"ng-app/admin/EditEvent.view.html",secure:!0}).when("/account",{templateUrl:"ng-app/account/Account.view.html",secure:!0,reloadOnSearch:!1}).when("/admin",{templateUrl:"ng-app/admin/Admin.view.html",secure:!0,reloadOnSearch:!1}).otherwise({redirectTo:"/"}),e.html5Mode({enabled:!0}).hashPrefix("!")}angular.module("myApp").config(t),t.$inject=["$routeProvider","$locationProvider"]}(),function(){function t(t,e){function n(n,i,a){function r(){var t=i.find(".ad-test");n.ab.blocked=t.height()<=0||!i.find(".ad-test:visible").length}n.ab={},n.ab.host=e.host(),t(r,200)}return n.$inject=["$scope","$elem","$attrs"],{restrict:"EA",link:n,template:'<div class="ad-test fa-facebook fa-twitter" style="height:1px;"></div><div ng-if="ab.blocked" class="ab-message alert alert-danger"><i class="fa fa-ban"></i> <strong>AdBlock</strong> is prohibiting important functionality! Please disable ad blocking on <strong>{{ab.host}}</strong>. This site is ad-free.</div>'}}angular.module("myApp").directive("detectAdblock",t),t.$inject=["$timeout","$location"]}(),function(){"use strict";function t(t){if("object"==typeof t.data)return t.data;throw new Error("retrieved data is not typeof object.")}function e(e){this.getEvent=function(n){return e({method:"GET",url:"/api/event/"+n}).then(t)},this.getAllEvents=function(){return e.get("/api/events").then(t)},this.createEvent=function(t){return e.post("/api/event/new",t)},this.updateEvent=function(t,n){return e.put("/api/event/"+t,n)},this.deleteEvent=function(t){return e["delete"]("/api/event/"+t)}}angular.module("myApp").service("eventData",e),e.$inject=["$http"]}(),function(){"use strict";function t(t){if("object"==typeof t.data)return t.data;throw new Error("retrieved data is not typeof object.")}function e(e){this.getJSON=function(){return e.get("/ng-app/data/data.json").then(t)}}angular.module("myApp").service("localData",e),e.$inject=["$http"]}(),function(){"use strict";var t=angular.module("mediaCheck",[]);t.service("mediaCheck",["$window","$timeout",function(t,e){this.init=function(n){var i,a,r,o,u=n.scope,c=n.mq,s=n.debounce,l=angular.element(t),d=void 0,f=void 0!==t.matchMedia&&!!t.matchMedia("!").addListener,p=void 0,m=void 0,v=s?s:250;if(f)return m=function(t){t.matches&&"function"==typeof n.enter?n.enter(t):"function"==typeof n.exit&&n.exit(t),"function"==typeof n.change&&n.change(t)},(d=function(){return p=t.matchMedia(c),a=function(){return m(p)},p.addListener(a),l.bind("orientationchange",a),u.$on("$destroy",function(){p.removeListener(a),l.unbind("orientationchange",a)}),m(p)})();i={},m=function(t){return t.matches?!!i[c]==!1&&"function"==typeof n.enter&&n.enter(t):(i[c]===!0||null==i[c])&&"function"==typeof n.exit&&n.exit(t),(t.matches&&!i[c]||!t.matches&&(i[c]===!0||null==i[c]))&&"function"==typeof n.change&&n.change(t),i[c]=t.matches};var h=function(t){var e=document.createElement("div");return e.style.width="1em",e.style.position="absolute",document.body.appendChild(e),px=t*e.offsetWidth,document.body.removeChild(e),px},g=function(t,e){var n;switch(n=void 0,e){case"em":n=h(t);break;default:n=t}return n};i[c]=null,r=function(){var e=c.match(/\((.*)-.*:\s*([\d\.]*)(.*)\)/),n=e[1],i=g(parseInt(e[2],10),e[3]),a={},r=t.innerWidth||document.documentElement.clientWidth;return a.matches="max"===n&&i>r||"min"===n&&r>i,m(a)};var $=function(){clearTimeout(o),o=e(r,v)};return l.bind("resize",$),u.$on("$destroy",function(){l.unbind("resize",$)}),r()}}])}(),function(){"use strict";function t(t){if("object"==typeof t.data)return t.data;throw new Error("retrieved data is not typeof object.")}function e(e){this.getEventGuests=function(n){return e.get("/api/rsvps/event/"+n).then(t)},this.createRsvp=function(t,n){return e.post("/api/rsvp/event/"+t,n)},this.updateRsvp=function(t,n){return e.put("/api/rsvp/"+t,n)}}angular.module("myApp").service("rsvpData",e),e.$inject=["$http"]}(),function(){"use strict";function t(t){return function(e){return t.trustAsHtml(e)}}angular.module("myApp").filter("trustAsHTML",t),t.$inject=["$sce"]}(),function(){"use strict";function t(t,e){function n(){var n=this;n.isAuthenticated=function(){return e.isAuthenticated()},t.getUser().then(function(t){n.user=t})}return{restrict:"EA",controller:n,controllerAs:"u",template:'<div ng-if="u.isAuthenticated() && !!u.user" class="user clearfix"><img ng-if="!!u.user.picture" ng-src="{{u.user.picture}}" class="user-picture" /><span class="user-displayName">{{u.user.displayName}}</span></div>'}}angular.module("myApp").directive("user",t),t.$inject=["userData","$auth"]}(),function(){"use strict";function t(t){if("object"==typeof t.data)return t.data;throw new Error("retrieved data is not typeof object.")}function e(e){this.getUser=function(){return e.get("/api/me").then(t)},this.updateUser=function(t){return e.put("/api/me",t)},this.getAllUsers=function(){return e.get("/api/users").then(t)}}angular.module("myApp").service("userData",e),e.$inject=["$http"]}(),function(){"use strict";function t(t,e,n){function i(i){function a(){n(function(){i.vs.viewformat="small"})}function r(){n(function(){i.vs.viewformat="large"})}i.vs={},t.init({scope:i,mq:e.SMALL,enter:a,exit:r})}return i.$inject=["$scope"],{restrict:"EA",link:i}}angular.module("myApp").directive("viewSwitch",t),t.$inject=["mediaCheck","MQ","$timeout"]}(),function(){"use strict";function t(t,e,n,i,a,r,o){function u(){function t(t){l.user=t,l.isAdmin=t.isAdmin;for(var e=l.user.rsvps,n=0;n<e.length;n++){var i=e[n];if(i.eventId===d){l.rsvpObj=i;break}}l.noRsvp=!l.rsvpObj;var a=l.noRsvp?null:l.rsvpObj.guests;!l.noRsvp&&!!a==!1||1==a?l.guestText=l.rsvpObj.name+" is":a&&a>1&&(l.guestText=l.rsvpObj.name+" + "+(a-1)+" are "),l.attendingText=!l.noRsvp&&l.rsvpObj.attending?"attending":"not attending",l.rsvpBtnText=l.noRsvp?"RSVP":"Update my RSVP",l.showEventDownload=l.rsvpObj&&l.rsvpObj.attending,l.createOrUpdate=l.noRsvp?"create":"update",l.rsvpReady=!0}i.getUser().then(t)}function c(){l.cal=ics();var t=o.getJSDatetime(l.detail.startDate,l.detail.startTime),e=o.getJSDatetime(l.detail.endDate,l.detail.endTime);l.cal.addEvent(l.detail.title,l.detail.description,l.detail.location,t,e)}function s(t){l.detail=t,l.detail.prettyDate=o.getPrettyDatetime(l.detail),l.detail.expired=o.expired(l.detail),l.eventReady=!0}var l=this,d=e.eventId;l.isAuthenticated=function(){return n.isAuthenticated()},l.showModal=!1,l.openRsvpModal=function(){l.showModal=!0},u(),r.$on("rsvpSubmitted",u),l.downloadIcs=function(){l.cal.download()},a.getEvent(d).then(s);var f=t.$watch("event.rsvpReady",function(t,e){t&&l.detail&&l.detail.rsvp&&(c(),f())})}angular.module("myApp").controller("EventDetailCtrl",t),t.$inject=["$scope","$routeParams","$auth","userData","eventData","$rootScope","Event"]}(),function(){"use strict";function t(t,e,n){function i(i){function a(){var t=i.$watch("rf.formModel.attending",function(e,n){e!==!0||n||c.formModel.guests||(c.formModel.guests=1,t())})}function r(){c.btnSaved=!1,c.btnSubmitText=s?"Submit RSVP":"Update RSVP"}function o(){c.btnSaved=!0,c.btnSubmitText=s?"Submitted!":"Updated!",n.$broadcast("rsvpSubmitted"),s=!1,l=!0,a(),e(function(){r(),c.showModal=!1},1e3)}function u(){c.btnSaved="error",c.btnSubmitText=s?"Error submitting!":"Error updating!",e(r,3e3)}var c=this,s=!c.formModel,l=!!c.formModel;c.numberRegex=/^([1-9]|10)$/,s&&c.userName&&(c.formModel={userId:c.userId,eventName:c.event.title,name:c.userName}),a(),r(),c.submitRsvp=function(){c.btnSubmitText="Sending...",s?t.createRsvp(c.event._id,c.formModel).then(o,u):l&&t.updateRsvp(c.formModel._id,c.formModel).then(o,u)},c.closeModal=function(){c.showModal=!1}}return i.$inject=["$scope"],{restrict:"EA",scope:{event:"=",userName:"@",userId:"@",formModel:"=",showModal:"="},templateUrl:"/ng-app/event-detail/rsvpForm.tpl.html",controller:i,controllerAs:"rf",bindToController:!0}}angular.module("myApp").directive("rsvpForm",t),t.$inject=["rsvpData","$timeout","$rootScope"]}(),function(){"use strict";function t(t,e,n){function i(t){a.allEvents=t;for(var e=0;e<a.allEvents.length;e++){var i=a.allEvents[e];i.startDateJS=n.getJSDatetime(i.startDate,i.startTime),i.expired=n.expired(i)}a.eventsReady=!0}var a=this;a.isAuthenticated=function(){return t.isAuthenticated()},e.getAllEvents().then(i),a.sortStartDate=function(t){return n.getJSDatetime(t.startDate,t.startTime)}}angular.module("myApp").controller("EventsCtrl",t),t.$inject=["$auth","eventData","Event"]}(),function(){"use strict";function t(){return function(t){var e,n=new Date(t),i=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],a=i[n.getMonth()],r=n.getDate(),o=n.getFullYear();return e=a+" "+r+", "+o}}angular.module("myApp").filter("prettyDate",t)}(),function(){"use strict";function t(t,e,n,i,a){function r(t){u.localData=t}function o(){i.isAuthenticated()&&void 0===u.adminUser&&a.getUser().then(function(t){u.adminUser=t.isAdmin})}var u=this;n.getJSON().then(r),u.logout=function(){u.adminUser=void 0,i.logout("/login")},o(),t.$on("$locationChangeSuccess",o),u.isAuthenticated=function(){return i.isAuthenticated()},u.indexIsActive=function(t){return e.path()===t},u.navIsActive=function(t){return e.path().substr(0,t.length)===t}}angular.module("myApp").controller("HeaderCtrl",t),t.$inject=["$scope","$location","localData","$auth","userData"]}(),function(){"use strict";function t(t,e,n){function i(i){function a(){s.removeClass("nav-closed").addClass("nav-open"),c=!0}function r(){s.removeClass("nav-open").addClass("nav-closed"),c=!1}function o(){r(),n(function(){i.nav.toggleNav=function(){c?r():a()}}),i.$on("$locationChangeSuccess",r)}function u(){n(function(){i.nav.toggleNav=null}),s.removeClass("nav-closed nav-open")}i.nav={};var c,s=angular.element("body");t.init({scope:i,mq:e.SMALL,enter:o,exit:u})}return i.$inject=["$scope","$element","$attrs"],{restrict:"EA",link:i}}angular.module("myApp").directive("navControl",t),t.$inject=["mediaCheck","MQ","$timeout"]}(),function(){"use strict";function t(t,e,n,i,a){function r(t){o.localData=t}var o=this;a.getJSON().then(r),o.logins=e.LOGINS,o.authenticate=function(e){function a(t){o.loggingIn=!1,n.authPath&&i.path(n.authPath)}o.loggingIn=!0,t.authenticate(e).then(a)["catch"](function(t){console.log(t.data),o.loggingIn="error",o.loginMsg=""})}}angular.module("myApp").controller("LoginCtrl",t),t.$inject=["$auth","OAUTH","$rootScope","$location","localData"]}();