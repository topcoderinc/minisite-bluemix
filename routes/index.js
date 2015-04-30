var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var passport = require('passport');
var _ = require('lodash');
var requiresLogin = require('../requiresLogin');
var Event = require('../models/Event');
var Team = require('../models/Team');
var TeamMember = require('../models/TeamMember');
var Promise = require("bluebird");
var join = Promise.join;
var request = Promise.promisify(require("request"));

var hbs = require('hbs');

router.get('/welcome', function (req, res) {
  res.render('welcome');
});

router.get('/signup', function (req, res) {
  res.render('signup');
});

router.get('/faqs', function (req, res) {
  res.render('faqs');
});

router.get('/challenges/fun', function (req, res) {
  res.render('challenges-fun.hbs');
});

router.get('/', function (req, res) {
  res.render('index');
});

router.get('/login', function (req, res) {
  res.render('login');
});

router.get('/logout', function (req, res) {
  var returnTo = process.env['AUTH0_CALLBACK_URL'].split('/callback')[0];
  res.redirect("https://" + process.env['AUTH0_DOMAIN'] + "/v2/logout?returnTo=" + returnTo);
});

// Auth0 callback handler
router.get('/callback',
  passport.authenticate('auth0', {
    failureRedirect: '/failure'
  }),
  function (req, res) {
    if (!req.user) {
      throw new Error('user null');
    }
    res.redirect("/");
  });

router.get('/failure', function (req, res) {
  res.render('failure');
});

router.get('/user', requiresLogin, function (req, res) {
  console.log(req.user);
  var returnTo = process.env['AUTH0_CALLBACK_URL'].split('/callback')[0];
  res.render('index', { registerReturnUrl: returnTo });
});

module.exports = router;
