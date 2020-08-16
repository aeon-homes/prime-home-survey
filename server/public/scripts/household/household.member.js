class HouseholdMember {
  constructor(props) {
    this.name = props.name || ''
    this.dateOfBirth = props.dateOfBirth || ''
    this.gender = props.gender || ''
    this.race = props.race || {
      white: false,
      black: false,
      islander: false,
      asian: false,
      native: false,
      selfIdentify: ''
    }
    this.hispanic = props.hispanic || ''
    this.disabled = props.disabled || ''
  }
}
