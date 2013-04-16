var hoodie  = new Hoodie()

var formContainer = $('#default-popup')

hoodie.account.authenticate().then(function(){}, isLoggedOut)

function authError(e) {
  console.log('auth err', e)
}

hoodie.account.on('authenticated', isLoggedIn)
hoodie.account.on('signout', isLoggedOut)
hoodie.on('account:error:unauthenticated remote:error:unauthenticated', authError)

function openDialog() {
  Avgrund.show( "#default-popup" )
}

function closeDialog() {
  Avgrund.hide()
}

function isLoggedIn(user) {
  $('.greeting').text('Hello ' + user)
  formContainer.html($('.welcome').html())
}

function isLoggedOut() {
  $('.greeting').text('Log in or sign up')
  formContainer.html($('.form-container').html())
  formContainer.find('.form').html($('.login-form').html())
}

function showSignup() {
  formContainer.find('.form').html($('.signup-form').html())
}

function showLogin() {
  formContainer.find('.form').html($('.login-form').html())
}

function formField(form, field) {
  return form.find('input[name="' + field + '"]')
}

function fieldParent(form, field) {
  var parent = formField(form, field).parents()[0]
  return $(parent)
}

function logout() {
  hoodie.account.signOut()
}

function missing(form, field) {
  var data = getLoginFormData(form)
  var thisField = fieldParent(form, field)
  if (!data[field] || data[field] === "") {
    thisField.addClass('error')
    return true
  } else {
    thisField.removeClass('error')
    return false
  }
}

function validate(form) {
  var data = getLoginFormData(form)
  var missingUser = missing(form, 'username')
  var missingEmail = missing(form, 'email')
  var missingPass = missing(form, 'password')
  var missingConfirm = missing(form, 'password_confirmation')
  if (missingUser || missingPass) return false
  if (data.action !== "signUp") return true
  var pass = formField(form, 'password').val()
  var confirm = formField(form, 'password_confirmation').val()
  if (missingEmail) return
  if (pass !== confirm) {
    fieldParent(form, 'password').addClass('error')
    fieldParent(form, 'password_confirmation').addClass('error')
    return false
  } else {
    fieldParent(form, 'password').removeClass('error')
    fieldParent(form, 'password_confirmation').removeClass('error')
    return true
  }
  return true
}

function getLoginFormData(form) {
  var action = form.find('input[type="submit"]').attr('data-action')
  var username = form.find('input[name="username"]').val()
  var email = form.find('input[name="email"]').val()
  var password = form.find('input[name="password"]').val()
  var password_confirmation = form.find('input[name="password_confirmation"]').val()
  return {
    action: action,
    username: username,
    email: email,
    password: password,
    password_confirmation: password_confirmation
  }
}

function submitLoginForm(e) {
  e.preventDefault()
  var form = $(e.target)
  form.find('.messages').html('')
  var data = getLoginFormData(form)
  if (!validate(form)) return
  var icon = $('.login-screen .login-icon > img')
  icon.addClass('rotating')
  hoodie.store.add('email', data.email)
  hoodie.account[data.action](data.username, data.password)
    .done(function(user) {
      icon.removeClass('rotating')
      isLoggedIn(user)
    })
    .fail(function(err) {
      icon.removeClass('rotating')
      var msg = err.reason
      if (err.error && err.error === "conflict") msg = "Username already exists."
      form.find('.messages').html('<p>' + msg + '</p>')
    })
}

$(document)
  .on('click', '.open-menu', openDialog)
  .on('click', '.show-signup', showSignup)
  .on('click', '.show-login', showLogin)
  .on('click', '.logout', logout)
  .on('submit', '.login-screen .form', submitLoginForm)