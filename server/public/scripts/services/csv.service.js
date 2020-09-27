// eslint-disable-next-line no-undef
myApp.service('CsvService', function ($http, $location, $mdToast) {
  //--------------------------------------
  // -------------VARIABLES----------------
  //--------------------------------------

  const self = this

  self.questions = {}

  //--------------------------------------
  // -------------FUNCTIONS----------------
  //--------------------------------------

  // exports all responses to a csv file and tells the browser to download it
  self.exportAllResponses = function (year) {
    $http.get(`/csv/export/${year}`).then((response) => {
      const link = document.createElement('a')
      link.download = `home-survey-responses-${year}.csv`
      link.href = `data:text/csv;charset=utf-8,${response.data}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    })
  }

  self.exportHouseholdResponses = function (year) {
    $http.get(`/csv/household/${year}`).then((response) => {
      const link = document.createElement('a')
      link.download = `home-survey-households-${year}.csv`
      link.href = `data:text/csv;charset=utf-8,${response.data}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    })
  }

  // gets all languages of questions from the db (for the updateQuestions view)
  self.getQuestions = function () {
    $http.get('/survey/questions').then((response) => {
      self.questions.list = response.data
      // Create array to store themes without repeating values. Generates drop down selector in Admin page
      self.questions.theme = []
      for (let i = 0; i < response.data.length; i += 1) {
        const { theme } = response.data[i]
        const arr = self.questions.theme
        if (themeExists(arr, theme) === false) {
          self.questions.theme.push(theme)
        }
      }

      function themeExists(arr, theme) {
        return arr.some((arrVal) => theme === arrVal)
      }
    })
  }

  // updates all four languages of the selected question in the db
  self.updateQuestion = function (question) {
    $http.post('/survey/questions', question).then((_response) => {
      self.getQuestions()
    })
  }
  // ----------------------------------- //
  // ------------ IMPORTANT ------------ //
  // ----------------------------------- //

  /* The following assumptions about the incoming file must be true for this to work:
    a. There is a single header row (adjust in csv.router.js const `OCCUPANCY_IGNORE_ROWS`)

    b. The columns are as follows:
      1. Property Name
      2. Occupancy (keyed off whether the string 'Occupied' appears in that element)
      3. Unit Number (trims all characters except alphanumeric, -, and _)

    c. There are exactly 3 columns
  */

  // called ultimately by the [UPLOAD] button on admin.html. Parses the imported file and sends it up to the server.
  self.uploadCsv = function (file, year) {
    // eslint-disable-next-line no-undef
    const parsed = Papa.parse(file, {
      skipEmptyLines: true,
    })

    for (let i = 0; i < parsed.data.length; i += 1) {
      // scrub the data
      for (let j = 0; j < parsed.data[i].length; j += 1) {
        // search the 'occupied' field for whether it contains the text 'occupied' or not, and set it to true/false based on that
        if (j === 1) {
          if (parsed.data[i][j].search('Occupied') >= 0) {
            parsed.data[i][j] = true
          } else {
            parsed.data[i][j] = false
          }
        } else {
          parsed.data[i][j] = parsed.data[i][j].replace(/(?!\w|\s|-)./g, '') // remove all non-alphanumeric characters except whitespace, -, and _
            .replace(/\s+/g, ' ') // replace all multiple-whitespace patterns with a single space
            .replace(/^(\s*)([\W\w]*)(\b\s*$)/g, '$2') // remove all trailing and leading whitespace
        }
      }
    }

    $http.post(`/csv/upload/${year}`, parsed).then((_response) => {
      $mdToast.show(
        $mdToast.simple()
          .textContent('CSV uploaded!')
          .hideDelay(2000)
      )
      $location.path('/admin')
    })
  }

  self.uploadEmailCsv = function (file, year) {
    // eslint-disable-next-line no-undef
    const parsed = Papa.parse(file, {
      skipEmptyLines: true,
    })

    $http.post(`/csv/email/${year}`, parsed).then((_response) => {
      $mdToast.show(
        $mdToast.simple()
          .textContent('Email CSV uploaded!')
          .hideDelay(2000)
      )
      $location.path('/admin')
    }).catch((response) => {
      console.error('email csv upload failure', response.body)
      $mdToast.show(
        $mdToast.simple()
          .highlightClass('md-warn')
          .textContent('Email CSV upload error!')
          .hideDelay(2000)
      )
    })
  }

  //--------------------------------------
  // -------------RUNTIME CODE-------------
  //--------------------------------------

  // none
})
