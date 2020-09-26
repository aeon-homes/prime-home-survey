// eslint-disable-next-line no-undef
myApp.controller('SurveyController', function (AdminService, SurveyService, UserService, $location, $mdDialog, $scope) {
  //--------------------------------------
  // -------------VARIABLES----------------
  //--------------------------------------

  const self = this

  self.emailRegex = /.+@.+\..+/
  self.queryParams = $location.search()

  self.RACE = {
    WHITE: 'white',
    BLACK: 'black',
    ISLANDER: 'islander',
    ASIAN: 'asian',
    NATIVE: 'native',
    OTHER: 'other'
  }

  self.propertyChosen = self.queryParams.property ? self.queryParams.property : '' // the user-selected property
  self.unitChosen = self.queryParams.unit ? self.queryParams.unit : ''

  self.propertyList = AdminService.propertyList // holds the list of properties pulled from the database
  self.propertyUnits = SurveyService.propertyUnits
  self.surveyAnswers = SurveyService.surveyAnswers // holds the user's answers
  self.surveyLanguage = SurveyService.surveyLanguage // the user-selected language
  self.surveyObject = SurveyService.surveyObject // holds the translated questions for display
  self.household = SurveyService.household
  self.email = SurveyService.email

  // eslint-disable-next-line no-undef
  if (angular.equals(self.surveyObject, {})) { // Load english as language on load
    SurveyService.getSurvey('english').then(
      (_) => {
        self.surveyObject = SurveyService.surveyObject
      },
      (err) => {
        console.error(err)
      }
    )
  }

  //--------------------------------------
  // -------------FUNCTIONS----------------
  //--------------------------------------

  self.submitEmail = () => {
    if (!self.emailToSubmit) {
      $mdDialog.show(
        $mdDialog.alert()
          .title('Please enter your email.')
          .ok('OK')
      )

      return
    }

    if (!self.emailRegex.test(self.emailToSubmit)) {
      $mdDialog.show(
        $mdDialog.alert()
          .title('Please enter a valid email.')
          .ok('OK')
      )

      return
    }

    SurveyService.submitEmail(self.emailToSubmit, () => { window.removeEventListener('beforeunload', unloadWarning) })
  }

  // displays a confirmation dialog for the user, and if confirmed clears the surveyAnswers object and sends the user back to the language-select page
  self.cancelSurvey = function (showAlert = true) {
    if (showAlert) {
      const confirm = $mdDialog.confirm()
        .textContent(self.surveyObject.surecancel)
        .ariaLabel('confirm cancel survey dialog')
        .targetEvent(event)
        .ok(self.surveyObject.cancel)
        .cancel(self.surveyObject.goback)

      $mdDialog.show(confirm).then(() => {
        SurveyService.wipeSurveyClean()
        self.go('/survey-language')
      }, () => {})
    } else {
      SurveyService.wipeSurveyClean()
      self.go('/survey-language')
    }
  }

  // passes the user-selected language to the service so that surveyObject can be built with the translated questions
  self.getSurvey = function (language, property) {
    SurveyService.getSurvey(language, property)
  }

  self.getPropertyUnits = (propertyName) => {
    SurveyService.getPropertyUnits(propertyName)
  }

  // called primarily from prev/next buttons on DOM, sends user to the passed address and resets their scroll to the top of the page
  self.go = function (hash) {
    $location.path(hash)
    window.setTimeout(() => {
      window.scrollTo(0, 0)
    }, 0)
  }

  // displays a dialog with translated help instructions for the user
  self.help = function () {
    const confirm = $mdDialog.confirm()
      .title(self.surveyObject.instructions)
      .textContent(self.surveyObject.directions1)
      .ariaLabel(self.surveyObject.instructions)
      .targetEvent(event)
      .ok(self.surveyObject.continue)

    $mdDialog.show(confirm).then(() => {
      // SurveyService.help();
    }, () => {})
  }

  // takes hard-coded question_id and answer values from the user/DOM and puts them in surveyAnswers.list
  self.respond = function (questionId, answer) {
    // If question is #25 gender and answer is self-identify, include the input response in surveyAnswers
    if (questionId === 25) {
      if (answer === 3) {
        SurveyService.surveyAnswers.list[questionId - 1].answer = `${answer} (${self.selfIdentify})`
      } else {
        self.selfIdentify = ''
        SurveyService.surveyAnswers.list[questionId - 1].answer = answer
      }
    } else {
      SurveyService.surveyAnswers.list[questionId - 1].answer = answer
    }
  }

  // displays a confirmation dialog, and if confirmed invokes the service's submitSurvey function to store responses in the db
  self.submitSurvey = function () {
    const confirm = $mdDialog.confirm()
      .textContent(self.surveyObject.suresubmit)
      .ariaLabel('confirm survey dialog')
      .targetEvent(event)
      .ok(self.surveyObject.continue)
      .cancel(self.surveyObject.cancel)

    $mdDialog.show(confirm).then(() => {
      SurveyService.submitSurvey()
    }, () => {})
  }

  self.addHouseholdMember = function () {
    // eslint-disable-next-line no-undef
    self.surveyAnswers.householdMembers.push(new HouseholdMember({}))
  }

  self.removeHouseholdMember = function (index) {
    self.surveyAnswers.householdMembers.splice(index, 1)
  }

  self.setHouseholdMemberGender = function (index, genderValue) {
    self.surveyAnswers.householdMembers[index].gender = genderValue
  }

  self.setHouseholdMemberRace = function (index, raceValue) {
    self.surveyAnswers.householdMembers[index].race[raceValue] = !self.surveyAnswers.householdMembers[index].race[raceValue]
  }

  self.setHouseholdMemberRaceSelfIdentify = function (index, selfIdentify) {
    self.surveyAnswers.householdMembers[index].race.selfIdentify = selfIdentify
  }

  //--------------------------------------
  // -------------RUNTIME CODE-------------
  //--------------------------------------

  self.beginSurvey = function (property, unit) {
    SurveyService.beginSurvey(property, unit)
    SurveyService.getHousehold(property).then(
      (_) => {
        self.household = SurveyService.household
      },
      (err) => {
        console.error(err)
      }
    )
  }

  self.UserService = UserService

  // handle the window unload event
  function unloadWarning(event) {
    // eslint-disable-next-line no-param-reassign
    event.returnValue = 'Reloading will erase all your answers. Are you sure?'
  }

  window.addEventListener('beforeunload', unloadWarning)

  $scope.$on('$destroy', () => {
    window.removeEventListener('beforeunload', unloadWarning)
  })
})
