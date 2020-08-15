myApp.service('UserService', function($http, $window){

  //--------------------------------------
  //-------------VARIABLES----------------
  //--------------------------------------

  var self = this;

  self.userObject = {};


  //--------------------------------------
  //-------------FUNCTIONS----------------
  //--------------------------------------

  // checks that the user is logged in, and if so adds their `role` to the userObject
  self.getUser = function(role) {
    role = '/' + role;
    
    $http.get('/user' + role).then(function(response) {
        if(response.data.username) {
            // user has a current session on the server
            self.userObject.userName = response.data.username;
        } else {
            // user has no session, bounce them back to the login page
            $window.location.assign("/#/home");
        }
    }, function(response){
      $window.location.assign("/#/home");
    });
  }

  // logs the user out and returns them to the login page
  self.logout = function(){
    $http.get('/user/logout').then(function(response) {
      $window.location.assign("/#/home");
    });
  }


  
  //--------------------------------------
  //-------------RUNTIME CODE-------------
  //--------------------------------------

  // none



});
