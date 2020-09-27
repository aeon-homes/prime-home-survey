const myApp = angular.module('myApp', ['ngMaterial', 'ngRoute', 'md.data.table'])

/// Routes ///
myApp.config(($routeProvider, $locationProvider, $mdThemingProvider) => {
  $locationProvider.hashPrefix('')
  $routeProvider
    .when('/home', {
      templateUrl: '/views/templates/home.html',
      controller: 'LoginController as lc',
    })
    .when('/register/verify/:token', {
      templateUrl: '/views/templates/verify.html',
      controller: 'VerifyController as vc'
    })
    .when('/register', {
      templateUrl: '/views/templates/register.html',
      controller: 'LoginController as lc'
    })
    .when('/survey-language', {
      templateUrl: '/views/templates/survey-language.html',
      controller: 'SurveyController as sc',
      resolve: {
        getUser(UserService) {
          return UserService.getUser('Resident')
        }
      }
    })
    .when('/survey-intro', {
      templateUrl: '/views/templates/survey-intro.html',
      controller: 'SurveyController as sc',
      resolve: {
        getUser(UserService) {
          return UserService.getUser('Resident')
        }
      }
    })
    .when('/survey-demographics', {
      templateUrl: '/views/templates/survey-demographics.html',
      controller: 'SurveyController as sc',
      resolve: {
        getUser(UserService) {
          return UserService.getUser('Resident')
        }
      }
    })
    .when('/survey-household', {
      templateUrl: '/views/templates/survey-household.html',
      controller: 'SurveyController as sc',
      resolve: {
        getUser(UserService) {
          return UserService.getUser('Resident')
        }
      }
    })
    .when('/survey-language', {
      templateUrl: '/views/templates/survey-language.html',
      controller: 'SurveyController as sc',
      resolve: {
        getUser(UserService) {
          return UserService.getUser('Resident')
        }
      }
    })
    .when('/survey-property', {
      templateUrl: '/views/templates/survey-property.html',
      controller: 'SurveyController as sc',
      resolve: {
        getUser(UserService) {
          return UserService.getUser('Resident')
        }
      }
    })
    .when('/survey-q1', {
      templateUrl: '/views/templates/survey-q1.html',
      controller: 'SurveyController as sc',
      resolve: {
        getUser(UserService) {
          return UserService.getUser('Resident')
        }
      }
    })
    .when('/survey-q2', {
      templateUrl: '/views/templates/survey-q2.html',
      controller: 'SurveyController as sc',
      resolve: {
        getUser(UserService) {
          return UserService.getUser('Resident')
        }
      }
    })
    .when('/survey-q3', {
      templateUrl: '/views/templates/survey-q3.html',
      controller: 'SurveyController as sc',
      resolve: {
        getUser(UserService) {
          return UserService.getUser('Resident')
        }
      }
    })
    .when('/survey-q4', {
      templateUrl: '/views/templates/survey-q4.html',
      controller: 'SurveyController as sc',
      resolve: {
        getUser(UserService) {
          return UserService.getUser('Resident')
        }
      }
    })
    .when('/survey-thanks', {
      templateUrl: '/views/templates/survey-thanks.html',
      controller: 'SurveyController as sc',
      resolve: {
        getUser(UserService) {
          return UserService.getUser('Resident')
        }
      }
    })
    .when('/admin', {
      templateUrl: '/views/templates/admin.html',
      controller: 'AdminController as ac',
      resolve: {
        getUser(UserService) {
          return UserService.getUser('Administrator')
        }
      }
    })
    .when('/admin-questions', {
      templateUrl: '/views/templates/admin-questions.html',
      controller: 'AdminController as ac',
      resolve: {
        getUser(UserService) {
          return UserService.getUser('Administrator')
        }
      }
    })    
    .when('/admin-properties', {
      templateUrl: '/views/templates/admin-properties.html',
      controller: 'AdminPropertiesController as apc',
      resolve: {
        getUser(UserService) {
          return UserService.getUser('Administrator')
        }
      }
    })
    .when('/admin-resident-emails', {
      templateUrl: '/views/templates/admin-resident-emails.html',
      controller: 'AdminController as ac',
      resolve: {
        getUser(UserService) {
          return UserService.getUser('Administrator')
        }
      }
    })
    .when('/admin-reporting', {
      templateUrl: '/views/templates/admin-reporting.html',
      controller: 'AdminReportingController as arc',
      resolve: {
        getUser(UserService) {
          return UserService.getUser('Administrator')
        }
      }
    })  
    .when('/admin-users', {
      templateUrl: '/views/templates/admin-users.html',
      controller: 'AdminController as ac',
      resolve: {
        getUser(UserService) {
          return UserService.getUser('Administrator')
        }
      }
    })    
    .when('/admin-site-manager', {
      templateUrl: '/views/templates/admin-site-manager.html',
      controller: 'AdminController as ac',
      resolve: {
        getUser(UserService) {
          return UserService.getUser('Administrator')
        }
      }
    })    
    .when('/site-manager', {
      templateUrl: '/views/templates/site-manager.html',
      controller: 'SiteManagerController as smc',
      resolve: {
        getUser(UserService) {
          return UserService.getUser('Aeon')
        }
      }
    })
    .when('/logout', {
      resolve: {
        logout(UserService) {
          return UserService.logout()
        }
      }
    })
    .otherwise({
      redirectTo: 'home'
    })

  $mdThemingProvider.theme('default')
    .primaryPalette('teal')
    .accentPalette('teal')
})
