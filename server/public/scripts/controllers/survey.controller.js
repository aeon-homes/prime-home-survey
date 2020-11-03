// eslint-disable-next-line no-undef
myApp.controller('SurveyController', function (AdminService, SurveyService, UserService, $location, $mdDialog, $scope) {
  //--------------------------------------
  // -------------VARIABLES----------------
  //--------------------------------------

  const self = this
  self.UserService = UserService

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

  self.propertyChosen = self.queryParams.property ? self.queryParams.property : ''
  self.unitChosen = self.queryParams.unit ? self.queryParams.unit : ''

  self.propertyList = AdminService.propertyList
  self.propertyUnits = SurveyService.propertyUnits
  self.surveyAnswers = SurveyService.surveyAnswers
  self.surveyLanguage = SurveyService.surveyLanguage
  self.surveyObject = SurveyService.surveyObject
  self.household = SurveyService.household
  self.email = SurveyService.email

  const now = new Date()
  self.thisYear = now.getFullYear()

  self.giftCardAddress = {}

  self.giftCardType = null

  // eslint-disable-next-line no-undef
  if (angular.equals(self.surveyObject, {})) {
    SurveyService.getSurvey('english').then(
      (_response) => {
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

  self.setGiftCardType = (type) => {
    self.giftCardType = type
  }

  self.submitVolunteerGiftCard = async () => {
    try {
      await SurveyService.submitVolunteerGiftCard({ type: self.giftCardType, addressDto: self.giftCardAddress })
    } catch (error) {
      $mdDialog.show(
        $mdDialog.alert()
          .title('Error submitting gift card address')
          .ok('OK')
      )
    }
    $mdDialog.show(
      $mdDialog.alert()
        .clickOutsideToClose(false)
        .title('Gift Card Submitted')
        .textContent('Gift Card successfully submitted. Click OK to go to language selection.')
        .ariaLabel('Gift Card Submit Success Alert')
        .ok('OK')
    ).then(() => { $location.path('/survey-language') })
  }

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
  self.respond = (questionId, answer, freeform) => {
    SurveyService.storeAnswer(questionId, answer, freeform)
  }

  // displays a confirmation dialog, and if confirmed invokes the service's submitSurvey function to store responses in the db
  self.submitSurvey = async () => {
    const confirm = $mdDialog.confirm()
      .textContent(self.surveyObject.suresubmit)
      .ariaLabel('confirm survey dialog')
      .targetEvent(event)
      .ok(self.surveyObject.continue)
      .cancel(self.surveyObject.cancel)

    $mdDialog.show(confirm).then(async () => {
      try {
        const response = await SurveyService.submitSurvey()

        if (response.status === 201) {
          if (UserService.userObject.role === 'Resident') {
            self.email.hideEmailSubmit = false
            $location.path('/survey-thanks')
            $scope.$apply()
          } else if (UserService.userObject.role === 'Volunteer') {
            $mdDialog.show(
              $mdDialog.alert()
                .clickOutsideToClose(false)
                .title('Survey Submitted')
                .textContent('Survey successfully submitted. Click OK to go to gift card selection.')
                .ariaLabel('Survey Submit Success Alert')
                .ok('OK')
            ).then(() => { $location.path('/survey-volunteer-reward') })
          }
        } else if (response.data === 'responded') {
          $mdDialog.show(
            $mdDialog.alert()
              .clickOutsideToClose(true)
              .title('Already Responded')
              .textContent('This unit has already responded. Please try again.')
              .ariaLabel('Survey Begin Error Alert')
              .ok('OK')
          ).then(() => { $location.path('/survey-language') })
        } else {
          $mdDialog.show(
            $mdDialog.alert()
              .clickOutsideToClose(true)
              .title('Survey Error')
              .textContent('There was an error submitting the survey. Please ask your Aeon staff member for assistance.')
              .ariaLabel('Survey Submit Error Alert')
              .ok('OK')
          )
        }
      } catch (error) {
        console.error(error)
        $mdDialog.show(
          $mdDialog.alert()
            .clickOutsideToClose(true)
            .title('Survey Error')
            .textContent('There was an error submitting the survey. Please ask your Aeon staff member for assistance.')
            .ariaLabel('Survey Submit Error Alert')
            .ok('OK')
        )
      }
    })
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

  // handle the window unload event
  function unloadWarning(event) {
    // eslint-disable-next-line no-param-reassign
    event.returnValue = 'Reloading will erase all your answers. Are you sure?'
  }

  window.addEventListener('beforeunload', unloadWarning)

  $scope.$on('$destroy', () => {
    window.removeEventListener('beforeunload', unloadWarning)
  })

  setTimeout(() => {
    if (UserService.userObject.surveyEligible === false) {
      $location.path('/survey-closed')
    }
  }, 0)
})
