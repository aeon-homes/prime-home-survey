const validateAuthorization = (req, roles) => req.isAuthenticated() && roles.includes(req.user.role)

module.exports = {
  validateAuthorization
}
