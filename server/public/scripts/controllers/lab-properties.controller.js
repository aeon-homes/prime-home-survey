// eslint-disable-next-line no-undef
myApp.controller(
  'ComputerLabPropertiesController', 
  ['AdminService', '$mdToast', '$mdSidenav', 'UserService', function (AdminService, $mdToast, $mdSidenav, UserService) {
    const self = this
    
    self.propertyList = AdminService.labPropertyList
    self.propertyToAdd = ''
  
    self.openLeftMenu = () => {
      $mdSidenav('left').toggle()
    }

    self.logout = () => UserService.logout()

    self.deleteProperty = async (propertyName) => {
      const serviceResult = await AdminService.deleteLabProperty(propertyName)
      if (serviceResult.status === 204) {
        AdminService.getLabProperties()
        AdminService.getAllLabProperties()  
        $mdToast.show(
          $mdToast.simple()
            .textContent('Property Deleted')
            .position('top right')
        )
      } else {
        console.error(serviceResult)
        $mdToast.show(
          $mdToast.simple()
            .textContent('Problem deleting property')
            .position('top right')
        )
      }
    }

    self.addProperty = async (propertyName) => {
      const serviceResult = await AdminService.addLabProperty(propertyName)
      if (serviceResult.status === 201) {
        self.propertyToAdd = ''
        AdminService.getLabProperties()
        AdminService.getAllLabProperties()  
        $mdToast.show(
          $mdToast.simple()
            .textContent('Property Added')
            .position('top right')
        )
      } else {
        console.error(serviceResult)
        $mdToast.show(
          $mdToast.simple()
            .textContent('Problem adding property')
            .position('top right')
        )
      }
    }
  }]
)
