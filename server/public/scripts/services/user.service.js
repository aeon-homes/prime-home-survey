// eslint-disable-next-line no-undef
myApp.service('UserService', function ($http, $window) {
  const self = this

  self.userObject = {}

  self.getUser = (role) => {
    $http.get(`/user/${role}`).then((response) => {
      if (response.data.username) {
        // user has a current session on the server
        self.userObject.userName = response.data.username
      } else {
        // user has no session, bounce them back to the login page
        $window.location.assign('/#/home')
      }
    }, (_) => {
      console.warn('getUser caught error')
      $window.location.assign('/#/home')
    })
  }

  // logs the user out and returns them to the login page
  self.logout = () => {
    $http.get('/user/logout').then((_) => {
      $window.location.assign('/#/home')
    })
  }
})
