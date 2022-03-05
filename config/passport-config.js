var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var Usuario = require('../model/Usuario');
var bcrypt = require('bcrypt')

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  Usuario.findById(id, function (err, user) {
    done(err, user);
  });
});

passport.use(new LocalStrategy({
  usernameField: 'txtEmail',
  passwordField: 'txtSenha',
  passReqToCallback: true
},
  function (req, username, password, done) {
    Usuario.findOne({ email: username }, function (err, user) {
      if (err) throw err;
      if (!user) {
        return done(null, false, req.flash('msg', 'Usuário não encontrado.'));
      }
      bcrypt.compare(password, user.senha, function (err, isMatch) {
        if (err) return done(err);
        if (isMatch) {
          return done(null, user);
        } else {
          return done(null, false, req.flash('msg', 'Senha inválida.'));
        }
      });
    });
  }));

module.exports = passport

