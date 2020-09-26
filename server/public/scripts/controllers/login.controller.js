// eslint-disable-next-line no-undef
myApp.controller('LoginController', function ($window, $http, $location, $mdToast) {
  // --------------------------------------
  // -------------VARIABLES----------------
  // --------------------------------------

  const vm = this

  vm.queryParams = $location.search()

  vm.shadowUser = {
    username: vm.queryParams.a ? vm.queryParams.a : '',
    password: vm.queryParams.z ? vm.queryParams.z : '',
  }
  vm.user = {
    username: '',
    password: '',
    property: vm.queryParams.property ? vm.queryParams.property : '',
    unit: vm.queryParams.unit ? vm.queryParams.unit : '',
  }

  // --------------------------------------
  // -------------FUNCTIONS----------------
  // --------------------------------------

  // logs the user in, then redirects to the appropriate page if they have a role assigned
  vm.login = () => {
    const actualUser = vm.shadowUser.username ? vm.shadowUser : vm.user
    if (actualUser.username && actualUser.password) {
      $http.post('/', actualUser).then((response) => {
        if (response.data.username) {
          if (response.data.role) {
            vm.user.username = actualUser.username
            vm.user.password = actualUser.password
            vm.user.role = response.data.role
          }
          // location works with SPA (ng-route)
          if (vm.user.role === 'Administrator') {
            $location.path('/admin-reporting') // http://localhost:5000/#/admin
          } else if (vm.user.role === 'Site Manager') {
            $location.path('/site-manager') // http://localhost:5000/#/site-manager
          } else if (vm.user.role === 'Resident') {
            const params = vm.user.property ? `?property=${vm.user.property}&unit=${vm.user.unit}` : ''
            $window.location.assign(`/#/survey-language${params}`) // http://localhost:5000/#/survey-language
          } else {
            $mdToast.show(
              $mdToast.simple()
                .textContent('Unauthorized - Please contact an administrator to authorize you as a Site Manager or Administrator.')
                .position('top right'),
            )
          }
        }
      }).catch((response) => {
        console.error(response)
        $mdToast.show(
          $mdToast.simple()
            .textContent('Unauthorized - Invalid username/password, or your account may not have been authorized by an administrator yet.')
            .position('top right'),
        )
      })
    }
  }

  // registers the user with the provided name/password. note user is not active and can't do anything until they get a role assigned by an admin
  vm.registerUser = () => {
    if (vm.user.username === '' || vm.user.password === '') {
      $mdToast.show(
        $mdToast.simple()
          .textContent('Please enter a username and password.')
          .position('top right'),
      )
    } else {
      $http.post('/register', vm.user).then((_) => {
        $location.path('/home')
        $mdToast.show(
          $mdToast.simple()
            .textContent('Registration Successful! Please alert an Aeon administrator so you can be granted permissions.')
            .position('top right'),
        )
      }).catch((_) => {
        $mdToast.show(
          $mdToast.simple()
            .textContent('Please enter a valid email address.')
            .position('top right'),
        )
      })
    }
  }

  // displays a toast if the user cancels their registration
  vm.cancelToast = (_) => {
    $mdToast.show(
      $mdToast.simple()
        .textContent('Registration Canceled.')
        .position('top right'),
    )
  }

  // displays a toast prompting the user to enter a new name/pass.
  // do we still need this?
  vm.registerToast = (_) => {
    $mdToast.show(
      $mdToast.simple()
        .textContent('Enter a new username and password')
        .position('top right'),
    )
  }

  // displays a notification toast if the registration is successful
  vm.successToast = (_) => {
    $mdToast.show(
      $mdToast.simple()
        .textContent('Registration Successful! Enter username and password to login.')
        .position('top right'),
    )
  }

  function initialLogin() {
    setTimeout(() => {
      vm.login()
    }, 0)
  }

  // --------------------------------------
  // -------------RUNTIME CODE-------------
  // --------------------------------------

  if (vm.user.username && vm.user.password) {
    vm.login()
  }

  initialLogin()
})
