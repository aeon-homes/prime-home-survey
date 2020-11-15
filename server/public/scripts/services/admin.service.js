// eslint-disable-next-line no-undef
myApp.service('AdminService', ['$http', '$mdToast', function ($http, $mdToast) {
  //--------------------------------------
  // -------------VARIABLES----------------
  //--------------------------------------

  const self = this

  self.responseRate = {
    rate: 0
  } // holds the response rate retrieved from the db
  self.allProperties = {} // holds all unit/property combos
  self.newProperty = {} // data bound to the property and input fields in the Add New Property section
  self.users = {
    list: []
  } // stores all administrators, site manager

  self.emails = { list: [], totalEmails: 0 }

  self.chartData = {} // holds data to be charted

  self.gottenData = {} // holds data gotten from the server for reporting

  self.chartsArray = [] // holds pointers to the charts we've built so that we can .destroy() them later

  // stores list of properties from the database
  // one entry per property. for building selectors
  self.propertyList = {
    list: []
  }

  // Used for the selected Property on the admin-properties page
  self.selectedEditProperty = {
    list: []
  }

  // Used for the selected Property on the admin-site-manager page
  self.selectedSiteManagerProperty = {
    list: []
  }

  self.surveyStatus = {
    data: {
      open_residents: null,
      open_volunteers: null  
    }
  }

  self.labUsageReport = {
    data: null
  }

  self.labText = {
    list: []
  }

  //--------------------------------------
  // -------------FUNCTIONS----------------
  //--------------------------------------

  self.getLabText = async () => {
    try {
      const apiResult = await $http({
        method: 'GET',
        url: '/computerLab/text'
      })

      console.log(apiResult.data)

      self.labText.list = apiResult.data.sort((a, b) => {
        if (a.type > b.type) return 1
        if (a.type < b.type) return -1
        return 0
      })

    } catch (error) {
      console.error(error)
    }
  }

  self.updateLabText = async ({ databaseKey, localizedText }) => {
    try {
      await $http({
        method: 'POST',
        url: '/computerLab/text',
        data: { databaseKey, localizedText }
      })

      self.getLabText()
    } catch (error) {
      console.error(error)
    }
  }

  self.getLabUsage = async ({ startTime, endTime, property }) => {
    try {
      const apiResult = await $http({
        method: 'GET',
        url: '/computerLab/usage',
        params: { startTime, endTime, property }
      })

      self.labUsageReport.data = apiResult.data

      // eslint-disable-next-line no-undef
      const csvData = Papa.unparse(apiResult.data)

      const link = document.createElement('a')
      link.download = 'computer-lab-usage.csv'
      link.href = `data:text/csv;charset=utf-8,${csvData}`
      document.body.appendChild(link)
      link.click()

      console.log(link)
      document.body.removeChild(link)
    } catch (error) {
      console.error(error)
    }
  }

  self.getSurveyStatus = async () => {
    try {
      const statusResponse = await $http({
        method: 'GET',
        url: '/survey/enabled',
      })
      self.surveyStatus.data.open_residents = statusResponse.data && statusResponse.data.open_residents
      self.surveyStatus.data.open_volunteers = statusResponse.data && statusResponse.data.open_volunteers
    } catch (error) {
      console.error(error)
    }
  }

  self.updateSurveyStatus = async (role, state) => {
    try {
      await $http({
        method: 'PUT',
        url: '/survey/enabled',
        params: {
          role,
          state
        }
      })
    } catch (error) {
      console.error(error)
    }
  }

  self.addEmail = async (email) => $http({
    method: 'POST',
    url: `/admin/emails/${encodeURIComponent(email)}`,
  })

  self.getEmails = async ({ searchText, pageNumber, pageSize, year, active }) => {
    $http({
      method: 'GET',
      url: '/admin/emails',
      params: {
        searchText,
        pageNumber,
        pageSize,
        year,
        active
      }
    }).then((response) => {
      self.emails.list = response.data
    }).catch((error) => {
      console.error(error)
      $mdToast.show(
        $mdToast.simple()
          .textContent('Error getting emails.')
          .hideDelay(2000)
      )
    })

    $http({
      method: 'GET',
      url: '/admin/emails/count',
      params: {
        searchText,
        year,
        active
      }
    }).then((response) => {
      self.emails.totalEmails = response && response.data && response.data[0] && response.data[0].count
    })
  }

  self.deleteEmail = (emailDto) => $http({
    method: 'DELETE',
    url: `/admin/emails/${emailDto.id}`,
  })

  self.updateEmail = (emailDto) => {
    $http({
      method: 'PUT',
      url: `/admin/emails/${emailDto.id}`,
      data: emailDto
    }).catch((error) => {
      console.error(error)
      $mdToast.show(
        $mdToast.simple()
          .textContent(`Error updating email ${emailDto.email}.`)
          .hideDelay(2000)
      )
    })
  }

  self.testApiOrder = async () => {
    console.log('service testApiOrder')

    return $http({
      method: 'GET',
      url: '/rewards/test',
    })
  }

  // add a new property to the database
  self.addNewProperty = function (property, unit) {
    // Runs the POST request if the user has entered both and property and unit
    if (property && unit) {
      $http({
        method: 'POST',
        url: '/admin/new-property',
        data: {
          property,
          unit
        }
      }).then((_) => {
        $mdToast.show(
          $mdToast.simple()
            .textContent('Property has been added.')
            .hideDelay(2000)
        )
        self.newProperty = {} // sets new property and unit input boxes to empty
        self.getProperties() // reload all properties to include the new property and unit
      })
      // Alert the user they need to enter in both a property and unit number into the input fields
    } else {
      $mdToast.show(
        $mdToast.simple()
          .textContent('Please enter in both a property name')
          .hideDelay(2000)
      )
    }
  }

  // takes a DOM HTML5 <canvas> element and builds a chart in it based on the chartType data and what's in self.gottenData
  self.buildChart = function (chartTarget, chartType) {
    self.destroyAllCharts()

    if (chartType === 'Gender') {
      self.genderData = [0, 0, 0, 0]
      self.genderStrings = []

      for (let i = 0; i < self.gottenData.list.length; i += 1) {
        const genderAnswer = self.gottenData.list[i].answer25

        switch (genderAnswer) {
          // 1,2,3 (string),null,
          case '1':
            self.genderData[1] += 1
            break
          case '2':
            self.genderData[2] += 1
            break
          case '3':
            self.genderData[3] += 1
            self.genderStrings.push(genderAnswer)
            break
          default:
            self.genderData[0] += 1
        }
      }

      // eslint-disable-next-line no-undef
      const genderPieChart = new Chart(chartTarget, {
        type: 'pie',
        data: {
          labels: ['No Response', 'Male', 'Female', 'Self-Identify'],
          datasets: [{
            label: 'Gender',
            data: self.genderData,
            backgroundColor: [
              '#aaaaaa',
              '#c8e6c9',
              '#a5d6a7',
              '#81c784',
            ],
            borderColor: [
              '#003300',
              '#003300',
              '#003300',
              '#003300',
            ],
            borderWidth: 2
          }]
        },
        options: {
          responsive: false
        }
      })

      self.chartsArray.push(genderPieChart)
    } else if (chartType === 'How Long') {
      self.howLongData = [0, 0, 0, 0, 0, 0]

      for (let i = 0; i < self.gottenData.list.length; i += 1) {
        const howLongAnswer = self.gottenData.list[i].answer23
        if ((howLongAnswer === undefined) || (howLongAnswer == null)) {
          self.howLongData[0] += 1
        } else {
          self.howLongData[howLongAnswer] += 1
        }
      }

      // eslint-disable-next-line no-undef
      const howLongPieChart = new Chart(chartTarget, {
        type: 'pie',
        data: {
          labels: ['No Response', '1-3 Months', '4-11 Months', '1-3 Years', '3-5 Years', '5+ Years'],
          datasets: [{
            label: 'How Long Have You Lived Here?',
            data: self.howLongData,
            backgroundColor: [
              '#aaaaaa',
              '#c8e6c9',
              '#81c784',
              '#4caf50',
              '#388e3c',
              '#1b5e20',
            ],
            borderColor: [
              '#003300',
              '#003300',
              '#003300',
              '#003300',
              '#003300',
              '#003300'
            ],
            borderWidth: 2
          }]
        },
        options: {

        }
      })

      self.chartsArray.push(howLongPieChart)
    } else if (chartType === 'Ethnicity') {
      self.ethnicityData = [0, 0, 0, 0, 0, 0, 0, 0]

      for (let i = 0; i < self.gottenData.list.length; i += 1) {
        const ethnicityAnswer = self.gottenData.list[i].answer24

        if ((ethnicityAnswer === undefined) || (ethnicityAnswer == null)) {
          self.ethnicityData[0] += 1
        } else {
          self.ethnicityData[ethnicityAnswer] += 1
        }
      }

      // eslint-disable-next-line no-undef
      const ethnicityPieChart = new Chart(chartTarget, {
        type: 'pie',
        data: {
          labels: ['No Response', 'American Indian', 'African Immigrant (Somali, Nigerian, Eritrean, other)', 'Asian / Pacific Islander', 'Black / African American', 'Caucasian / White', 'Hispanic / Latino', 'Other'],
          datasets: [{
            label: 'What Ethnicity Best Describes You?',
            data: self.ethnicityData,
            backgroundColor: [
              '#aaaaaa',
              '#c8e6c9',
              '#a5d6a7',
              '#81c784',
              '#4caf50',
              '#388e3c',
              '#1b5e20',
              '#003300'
            ],
            borderColor: [
              '#003300',
              '#003300',
              '#003300',
              '#003300',
              '#003300',
              '#003300',
              '#003300',
              '#003300'
            ],
            borderWidth: 2
          }]
        },
        options: {

        }
      })

      self.chartsArray.push(ethnicityPieChart)
    } else if (chartType === 'Age') {
      self.ageData = [0, 0, 0, 0, 0, 0, 0]

      for (let i = 0; i < self.gottenData.list.length; i += 1) {
        const ageAnswer = self.gottenData.list[i].answer26

        if ((ageAnswer === undefined) || (ageAnswer == null)) {
          self.ageData[0] += 1
        } else {
          self.ageData[ageAnswer] += 1
        }
      }

      // eslint-disable-next-line no-undef
      const agePieChart = new Chart(chartTarget, {
        type: 'pie',
        data: {
          labels: ['No Response', 'Under 18', '18-25', '26-35', '36-45', '46-55', 'Over 55'],
          datasets: [{
            label: 'How Old Are You?',
            data: self.ageData,
            backgroundColor: [
              '#aaaaaa',
              '#c8e6c9',
              '#a5d6a7',
              '#81c784',
              '#4caf50',
              '#388e3c',
              '#1b5e20'
            ],
            borderColor: [
              '#003300',
              '#003300',
              '#003300',
              '#003300',
              '#003300',
              '#003300',
              '#003300',
              '#003300'
            ],
            borderWidth: 2
          }]
        },
        options: {

        }
      })

      self.chartsArray.push(agePieChart)
    } else if (chartType === 'Income') {
      self.incomeData = [0, 0, 0, 0, 0, 0, 0, 0, 0]

      for (let i = 0; i < self.gottenData.list.length; i += 1) {
        const incomeAnswer = self.gottenData.list[i].answer26

        if ((incomeAnswer === undefined) || (incomeAnswer == null)) {
          self.incomeData[0] += 1
        } else {
          self.incomeData[incomeAnswer] += 1
        }
      }

      // eslint-disable-next-line no-undef
      const incomePieChart = new Chart(chartTarget, {
        type: 'pie',
        data: {
          labels: ['No Response', 'Less than $800/mo. (Less than $9,600/yr.)', '$801 - 1,300/mo. ($9601 - 15,600/yr.)', '$1,301 - 1,800/mo. ($15,601 - 21,600/yr.)', '$1,801 - 2,300/mo. ($21,601 - 27,600/yr.)', '$2,301 - 2,800/mo. ($27,601 - 33,600/yr.)', '$2,801 - 3,300/mo. ($33,601 - 39,600/yr.)', '$3,301 - 3,800/mo. ($39,601 - 45,600/yr.)', 'More than $3,800/mo. (More than 45,600/yr.)'],
          datasets: [{
            label: 'What Is Your Income Level?',
            data: self.incomeData,
            backgroundColor: [
              '#aaaaaa',
              '#c8e6c9',
              '#a5d6a7',
              '#81c784',
              '#66bb6a',
              '#4caf50',
              '#388e3c',
              '#1b5e20',
              '#003300'
            ],
            borderColor: [
              '#003300',
              '#003300',
              '#003300',
              '#003300',
              '#003300',
              '#003300',
              '#003300',
              '#003300',
              '#003300'
            ],
            borderWidth: 2
          }]
        },
        options: {

        }
      })

      self.chartsArray.push(incomePieChart)
    } else if (chartType === 'Scores') {
      /* SCORE DEFINITIONS

                Engagement = average of questions 5-13
                Safety = average of questions 1-4
                Ownership = average of questions 14-15, 20
                Staff Performance = average of questions 16-18
                Home Score = average of Safety, Engagement, and Ownership

            */

      // engagement, safety, ownership, staff performance, home
      self.scoreData = [0, 0, 0, 0, 0] // holds the actual data for the chart. eventually.
      const scoreTotals = [
        [0, 0],
        [0, 0],
        [0, 0],
        [0, 0],
      ] // [total points, #of responses]

      for (let i = 0; i < self.gottenData.list.length; i += 1) {
        // Engagement = average of questions 5-13

        const engagementAnswers = [
          self.gottenData.list[i].answer5,
          self.gottenData.list[i].answer6,
          self.gottenData.list[i].answer7,
          self.gottenData.list[i].answer8,
          self.gottenData.list[i].answer9,
          self.gottenData.list[i].answer10,
          self.gottenData.list[i].answer11,
          self.gottenData.list[i].answer12,
          self.gottenData.list[i].answer13
        ]

        for (let j = 0; j < engagementAnswers.length; j += 1) {
          // question 8 is reversed; 1 is a positive response
          if (engagementAnswers[j]) {
            if (j === 3) {
              switch (engagementAnswers[j]) {
                case 0:
                  engagementAnswers[j] = 4
                  break
                case 1:
                  engagementAnswers[j] = 3
                  break
                case 2:
                  engagementAnswers[j] = 2
                  break
                case 3:
                  engagementAnswers[j] = 1
                  break
                default:
                  console.warn('unexpected value in engagement answers')
              }
            }

            scoreTotals[0][0] += engagementAnswers[j]
            scoreTotals[0][1] += 1
          }
        }

        // Safety = average of questions 1-4

        const safetyAnswers = [
          self.gottenData.list[i].answer1,
          self.gottenData.list[i].answer2,
          self.gottenData.list[i].answer3,
          self.gottenData.list[i].answer4
        ]

        for (let j = 0; j < safetyAnswers.length; j += 1) {
          if (safetyAnswers[j]) {
            scoreTotals[1][0] += safetyAnswers[j]
            scoreTotals[1][1] += 1
          }
        }

        // Ownership = average of questions 14-15, 20

        const ownershipAnswers = [
          self.gottenData.list[i].answer14,
          self.gottenData.list[i].answer15,
          self.gottenData.list[i].answer20
        ]

        for (let j = 0; j < ownershipAnswers.length; j += 1) {
          if (ownershipAnswers[j]) {
            scoreTotals[2][0] += ownershipAnswers[j]
            scoreTotals[2][1] += 1
          }
        }

        // Staff Performance = average of questions 16-18

        const staffAnswers = [
          self.gottenData.list[i].answer16,
          self.gottenData.list[i].answer17,
          self.gottenData.list[i].answer18
        ]

        for (let j = 0; j < staffAnswers.length; j += 1) {
          if (staffAnswers[j]) {
            scoreTotals[3][0] += staffAnswers[j]
            scoreTotals[3][1] += 1
          }
        }
      }

      /* so now scoreTotals looks like this:

                [[engagementTotalPoints, engagementResponses],
                [safetyTotalPoints, safetyResponses],
                [ownershipTotalPoints, ownershipResponses],
                [staffTotalPoints, staffResponses],

                note: homeScore will be calculated and added directly to the scoreData array
            */

      // finally actually put the averages in the display array
      // we're also going to be sneaky and calculate homeScore at the same time

      let positiveScores = 0

      for (let j = 0; j < scoreTotals.length; j += 1) {
        if (scoreTotals[j][1] > 0) {
          // non-zero divisor
          self.scoreData[j] = scoreTotals[j][0] / scoreTotals[j][1]
          positiveScores += 1
          self.scoreData[self.scoreData.length - 1] += self.scoreData[j]
        } // else it remains 0
      }

      /* so scoreData is now:

                [engagementAverage,
                safetyAverage,
                ownershipAverage,
                staffAverage,
                homeScoreTotal]

                next: divide homeScore by the number of non-zero averages

            */

      // Home Score = average of Safety, Engagement, and Ownership

      if (positiveScores > 0) {
        self.scoreData[self.scoreData.length - 1] = self.scoreData[self.scoreData.length - 1] / positiveScores
      }

      // VICTORY! (hopefully)

      // eslint-disable-next-line no-undef
      const scoreBarChart = new Chart(chartTarget, {
        type: 'bar',
        data: {
          labels: ['Engagement', 'Safety', 'Ownership', 'Staff Performance', 'Home Score'],
          datasets: [{
            label: 'Scores',
            data: self.scoreData,
            backgroundColor: [
              '#c8e6c9',
              '#a5d6a7',
              '#66bb6a',
              '#388e3c',
              '#003300'
            ],
            borderColor: [
              '#003300',
              '#003300',
              '#003300',
              '#003300',
              '#003300'
            ],
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          scales: {
            yAxes: [{
              ticks: {
                min: 2,
                max: 4,
                stepSize: 0.2
              }
            }]
          }
        }
      })

      self.chartsArray.push(scoreBarChart)
    }
  }

  // Function called from a button on the /admin-properties page that deletes a property/unit combination from the occupancy table
  self.deleteUnit = function (occupancyId) {
    $http({
      method: 'DELETE',
      url: '/admin/delete-unit',
      params: {
        occupancyId
      }
    }).then((_response) => {
      $mdToast.show(
        $mdToast.simple()
          .textContent('Unit has been deleted.')
          .hideDelay(2000)
      )
      self.getProperties()
      self.getSelectedEditProperty(self.selectedEditProperty.list[0].property, self.selectedEditProperty.list[0].year)
    })
  }

  // Delete a user from delete button the user section in admin
  self.deleteUser = function (user) {
    $http.delete(`/user-roles/${user.id}`).then((response) => {
      if (response.status === 200) {
        $mdToast.show(
          $mdToast.simple()
            .textContent('User deleted.')
            .hideDelay(2000)
        )
      } else {
        $mdToast.show(
          $mdToast.simple()
            .textContent('Deletion unsuccessful.')
            .hideDelay(2000)
        )
      }
      self.getUsers() // get a fresh list of users
    })
  }

  self.destroyAllCharts = function () {
    for (let i = 0; i < self.chartsArray.length; i += 1) {
      self.chartsArray[i].destroy()
    }
  }

  // GET request for all occupancy information from the occupancy table
  self.getAllProperties = function () {
    $http.get('/user-roles/allProperties/').then((response) => {
      // stores all occupancy information from the occupancy table via the GET property request
      self.allProperties = response.data
    })
  }

  // properties: array of names or NULL for all
  // year: integer or blank for current year
  self.getResponseRate = function (properties, year) {
    $http.get('/admin/responses', {
      params: {
        properties,
        year
      }
    })
      .then((response) => {
        self.responseRate.rate = +response.data
        self.responseRate.rate *= 100
        self.responseRate.rate = self.responseRate.rate.toFixed(2)
      })
  }

  // get the selected property on the admin properties edit page
  self.getSelectedEditProperty = function (selectedProperty, year) {
    $http({
      method: 'GET',
      url: 'admin/selectedProperty',
      params: {
        selectedProperty,
        year
      }
    }).then((response) => {
      self.selectedEditProperty.list = response.data
    })
  }

  // get the selected property on the admin site manager properties edit page
  self.getSelectedSiteProperty = function (selectedProperty, year) {
    $http({
      method: 'GET',
      url: 'admin/selectedProperty',
      params: {
        selectedProperty,
        year
      }
    }).then((response) => {
      self.selectedSiteManagerProperty.list = response.data
    })
  }

  // take in a year and an array of properties, and get the matching dataset from the server
  self.getData = function (year, properties, chartFunction, domElement) {
    $http({
      method: 'GET',
      url: '/admin/data',
      params: {
        year,
        properties
      }
    }).then((response) => {
      self.gottenData.list = response.data

      self.buildChart(domElement, chartFunction)

      // switch (chartFunction) {
      //     case 'gender':
      //         self.buildDemographicsChart(domElement, 'gender');
      //         break;
      //     case 'howLong':
      //         self.buildDemographicsChart(domElement, 'howLong');
      //         break;
      //     default:
      //         console.log('admin service buildChart got bad callback:', chartFunction);
      //         return;
      // }
    })
  }

  // GET request for properties from the db
  self.getProperties = function () {
    self.propertyList.list = []
    // set a variable to get the current uyear
    let thisYear = new Date()
    thisYear = thisYear.getFullYear()

    $http.get(`/user-roles/properties/${thisYear}`).then((response) => {
      // sets propertyList to an array with the unique property names in the occupancy table
      for (let i = 0; i < response.data.length; i += 1) {
        self.propertyList.list.push(response.data[i].property)
      }
    })
  }

  // GET request for all users (username, active, and role status) from the users table
  self.getUsers = function () {
    $http({
      method: 'GET',
      url: '/user-roles',
    }).then((response) => {
      self.users.list = response.data
    })
  }

  // Authorize or Deauthorize a site manager for a property
  self.manageAuth = function (userId, property, route) {
    const authInfo = {
      id: userId,
      property
    }

    $http.put(`/user-roles/properties/${route}`, authInfo).then((_response) => {
      self.getUsers()
    }, (_response) => {
      $mdToast.show(
        $mdToast.simple()
          .textContent('ERROR - Property already authorized.')
          .hideDelay(2000)
      )
    })
  }

  // Update the users active status PUT request
  self.toggleActive = function (user) {
    $http({
      method: 'PUT',
      url: '/user-roles/active',
      data: user
    }).then((_response) => {
      self.getUsers()
    })
  }

  self.toggleHousehold = function (name, newValue) {
    $http({
      method: 'PUT',
      url: '/admin/updateHousehold',
      data: {
        name,
        value: newValue
      }
    }).then((_response) => {
      if (self.selectedEditProperty.list[0]) {
        self.getSelectedEditProperty(self.selectedEditProperty.list[0].property, self.selectedEditProperty.list[0].year)
      } else if (self.selectedSiteManagerProperty.list[0]) {
        self.getSelectedSiteProperty(self.selectedSiteManagerProperty.list[0].property, self.selectedSiteManagerProperty.list[0].year)
      }
    })
  }

  // PUT request to update the occupied status of a unit
  self.updateOccupied = function (property) {
    $http({
      method: 'PUT',
      url: '/admin/updateOccupied',
      data: property
    }).then((_response) => {
      if (self.selectedEditProperty.list[0]) {
        self.getSelectedEditProperty(self.selectedEditProperty.list[0].property, self.selectedEditProperty.list[0].year)
      } else if (self.selectedSiteManagerProperty.list[0]) {
        self.getSelectedSiteProperty(self.selectedSiteManagerProperty.list[0].property, self.selectedSiteManagerProperty.list[0].year)
      }
    })
  }

  // Updates a user role from the database
  self.updateUserRole = function (user) {
    $http({
      method: 'PUT',
      url: '/user-roles/role',
      data: {
        user,
        role: user.role
      }
    }).then((_response) => {
      self.getUsers() // get a fresh list of users with updated roles
    })
  }

  //--------------------------------------
  // -------------RUNTIME CODE-------------
  //--------------------------------------

  self.getProperties() // build propertyList immediately
  self.getSurveyStatus()
}])

// self.buildTestChart = function(){
//     self.chartData.list = [0,0,0,0,0];
//     for (var i = 0; i < self.gottenData.list.length; i += 1) {
//         switch(self.gottenData.list[i].answer1){
//             // 1,2,3,4,null
//             case 1:
//                 self.chartData.list[1] += 1;
//                 break;
//             case 2:
//                 self.chartData.list[2] += 1;
//                 break;
//             case 3:
//                 self.chartData.list[3] += 1;
//                 break;
//             case 4:
//                 self.chartData.list[4] += 1;
//                 break;
//             default:
//                 self.chartData.list[0] += 1;
//                 break;
//         }
//     }
//     console.log('AdminService.chartData.list', self.chartData.list);

// }
