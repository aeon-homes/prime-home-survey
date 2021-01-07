// eslint-disable-next-line no-undef
myApp.controller(
  'ComputerLabController', 
  ['AdminService', '$mdSidenav', '$scope', 'UserService', function (AdminService, $mdSidenav, $scope, UserService) {
    const self = this
    
    self.propertyList = AdminService.propertyList
    self.allProperties = AdminService.allProperties // list of all property information from the occupancy table  
    self.selectedProperty = AdminService.selectedProperty // Property selected by user to edit
    self.usageReport = AdminService.labUsageReport
    self.labText = AdminService.labText
  
    self.endDate = new Date()
    self.startDate = new Date()
    self.startDate.setMonth((self.endDate.getMonth() || 12) - 1)
    if (self.startDate.getMonth() === 11) self.startDate.setFullYear(self.startDate.getFullYear() - 1)


    self.openLeftMenu = () => {
      $mdSidenav('left').toggle()
    }

    self.logout = () => UserService.logout()

    self.clearProperty = () => { self.selectedProperty = null }
    
    self.generateReport = async (startDate, endDate, property) => {
      const endingTimestamp = new Date(endDate.getTime())
      endingTimestamp.setHours(23)
      endingTimestamp.setMinutes(59)
      endingTimestamp.setSeconds(59)
      
      const startingTimestamp = new Date(startDate.getTime())
      startingTimestamp.setHours(23)
      startingTimestamp.setMinutes(59)
      startingTimestamp.setSeconds(59)

      await AdminService.getLabUsage({ startTime: startingTimestamp.getTime(), endTime: endingTimestamp.getTime(), property })
    }

    self.getLabText = async () => {
      await AdminService.getLabText()

      setTimeout(() => $scope.$apply(), 0)
    }

    self.updateLabText = (element) => AdminService.updateLabText({ 
      databaseKey: element.type,
      localizedText: { english: element.english, spanish: element.spanish, somali: element.somali, hmong: element.hmong, oromo: element.oromo }
    })

    self.getLabText()
  }]
)
