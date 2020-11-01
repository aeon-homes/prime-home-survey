// eslint-disable-next-line no-undef
myApp.service('SurveyService', function ($http, $location, $mdDialog) {
  // --------------------------------------
  // -------------VARIABLES----------------
  // --------------------------------------

  const NUM_SURVEY_QUESTIONS = 34
  const EMAIL_NOT_FOUND = 'Email not found.'
  const EMAIL_ALREADY_SUBMITTED = 'Email already submitted for rewards.'
  const self = this

  const now = new Date()
  self.thisYear = now.getFullYear()

  self.surveyObject = {}
  self.surveyProperty = ''
  self.propertyUnits = { list: [] }
  self.surveyUnit = ''
  self.household = false
  self.email = { hideEmailSubmit: true }
  self.surveyAnswers = {
    list: [],
    // eslint-disable-next-line no-undef
    householdMembers: [new HouseholdMember({})]
  }

  self.surveyLanguage = {
    language: 'english'
  }

  self.surveyStatus = {
    open_residents: null,
    open_volunteers: null
  }

  // --------------------------------------
  // -------------FUNCTIONS----------------
  // --------------------------------------

  self.getSurveyStatus = async () => {
    try {
      const statusResponse = await $http({
        method: 'GET',
        url: '/survey/enabled',
      })
      self.surveyStatus.open_residents = statusResponse.data && statusResponse.data.open_residents
      self.surveyStatus.open_volunteers = statusResponse.data && statusResponse.data.open_volunteers
    } catch (error) {
      console.error(error)
    }
  }

  self.storeAnswer = (questionId, answer, freeform) => {
    // If question is #25 gender and answer is self-identify, include the input response in surveyAnswers
    if (questionId === 25 && answer === 3) {
      self.surveyAnswers.list[questionId - 1].answer = `${answer} (${freeform})`
    } else {
      self.surveyAnswers.list[questionId - 1].answer = answer
    }
  }

  self.submitEmail = (emailToSubmit, callback) => {
    $http.post('/rewards/email', { email: emailToSubmit })
      .then((_) => {
        self.email.hideEmailSubmit = true
        
        $mdDialog.show(
          $mdDialog.alert()
            .title('Successfully submitted email for rewards!')
            .ok('OK')
        )
        callback()
      })
      .catch((error) => {
        console.error(error)
        if (error.data.error === EMAIL_NOT_FOUND || error.data.error === EMAIL_ALREADY_SUBMITTED) {
          $mdDialog.show(
            $mdDialog.alert()
              .title('Error')
              .textContent(error.data.error)
              .ok('OK')
          )
        } else {
          $mdDialog.show(
            $mdDialog.alert()
              .title('Error')
              .textContent('Error submitting email for rewards. Please try again, and contact your site manager if the error persists.')
              .ok('OK')
          )
        }
      })
  }

  // checks that the property and unit are eligible to fill out survey
  // displays error dialogs on error states
  // if unit & property are ok, stores those values, wipes the answers array, and sends the user to the survey
  self.beginSurvey = function (property, unit) {
    // is the property/unit combo legit?
    $http.get('/survey/begin', {
      params: {
        year: self.thisYear,
        property,
        unit
      }
    }).then((response) => {
      if (response.data === 'authorized') {
        // legit: clear the survey object and go to /survey-q1
        self.wipeSurveyClean()
        self.surveyProperty = property
        self.surveyUnit = unit
        $location.path('/survey-intro')
      } else if (response.data === 'responded') {
        // not legit: pop a toast
        $mdDialog.show(
          $mdDialog.alert()
            .clickOutsideToClose(true)
            .title('Already Responded')
            .textContent('This unit has already responded. Please try again.')
            .ariaLabel('Survey Begin Error Alert')
            .ok('OK')
        )
      } else if (response.data === 'unit not found') {
        // not legit: pop a toast
        $mdDialog.show(
          $mdDialog.alert()
            .clickOutsideToClose(true)
            .title('Unit Not Found')
            .textContent('This is not a valid unit. Please try again.')
            .ariaLabel('Error Unit Not Found')
            .ok('OK')
        )
      }
    })
  }

  // builds the surveyObject with translated answers in the user-selected language.
  self.getSurvey = function (language) {
    self.surveyLanguage.language = language

    return $http.get('/survey/language', {
      params: {
        language
      }
    }).then((response) => {
      for (let i = 0; i < response.data.questions.length; i += 1) {
        self.surveyObject[response.data.questions[i].question_number] = response.data.questions[i][language]
      }
      for (let i = 0; i < response.data.translations.length; i += 1) {
        self.surveyObject[response.data.translations[i].type] = response.data.translations[i][language]
      }
    })
  }

  self.getHousehold = function (property) {
    return $http.get('/survey/household', {
      params: { property }
    }).then((response) => {
      self.household = response.data
    })
  }

  // sends the user's language, property, unit, and survey answers to the db to be stored
  // displays error dialogs if a unit has already responded or a server error happens, or takes the user to the thanks page if successful
  self.submitSurvey = () => $http.post('/survey', self.surveyAnswers, {
    params: {
      language: self.surveyLanguage.language,
      property: self.surveyProperty,
      unit: self.surveyUnit,
      year: self.thisYear
    }
  })

  // clears out all responses and rebuilds the answers array with null objects
  self.wipeSurveyClean = function () {
    self.surveyAnswers.list = []
    for (let i = 0; i < NUM_SURVEY_QUESTIONS; i += 1) {
      self.surveyAnswers.list.push({})
    }
    // eslint-disable-next-line no-undef
    self.surveyAnswers.householdMembers = [new HouseholdMember({})]
  }

  self.getPropertyUnits = (property) => {
    $http.get('/properties/units', {
      params: {
        property,
        year: self.thisYear
      }
    }).then((response) => {
      self.propertyUnits.list = response.data.units
    })
  }

  // --------------------------------------
  // -------------RUNTIME CODE-------------
  // --------------------------------------

  self.wipeSurveyClean() // start out with a fresh survey
  self.getSurveyStatus()
})
