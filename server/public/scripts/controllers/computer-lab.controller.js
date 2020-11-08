// eslint-disable-next-line no-undef
myApp.controller(
  'ComputerLabController', 
  ['AdminService', '$mdDialog', '$mdSidenav', '$scope', 'UserService', function (AdminService, $mdDialog, $scope, $mdSidenav, UserService) {
    const self = this
    
    self.propertyList = AdminService.propertyList
    self.allProperties = AdminService.allProperties // list of all property information from the occupancy table  
    self.selectedProperty = AdminService.selectedProperty // Property selected by user to edit
    self.usageReport = AdminService.labUsageReport
  
    self.startDate = new Date()
    self.endDate = new Date()

    self.openLeftMenu = () => {
      $mdSidenav('left').toggle()
    }

    self.logout = () => UserService.logout()

    self.clearProperty = () => { self.selectedProperty = null }
    
    self.generateReport = async (startDate, endDate, property) => {
      console.log('clc.generateReport', startDate.getTime(), endDate.getTime(), property)

      await AdminService.getLabUsage({ startTime: startDate.getTime(), endTime: endDate.getTime(), property })
      $scope.apply() // not working, might not care, might just export
    }

    // todo: add csv export
    // todo: add table to page
  }]
)
