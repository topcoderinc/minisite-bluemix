var express = require('express');
var router = express.Router();
var request = require('request');
var _ = require('lodash');
var hbs = require('hbs');
var moment = require('moment');

// fetches a leaderboard as json and exposes it to hbs
var leaderboard = function(req, res, next) {

  function isInt(n) {
     return n % 1 === 0;
  }

  var type = req.url.split('/')[1];
  var endpoint = process.env.DESIGN_LEADERBOARD_ENDPOINT;
  if (type === 'development')
    endpoint = process.env.DEVELOPMENT_LEADERBOARD_ENDPOINT;

  request(endpoint, function (error, response, body) {

    if (!error && response.statusCode == 200) {
      var leaderboard = JSON.parse(body);
      var rows = leaderboard.length/3;
      // add one extra row if needd
      if (!isInt(rows))
        rows = Math.floor(rows) + 1;

      var data = [];
      var counter = 0;

      for (var i=0;i<rows;i++) {
        var row = [];
        if (leaderboard[counter]) row.push(leaderboard[counter]);
        counter++;
        if (leaderboard[counter]) row.push(leaderboard[counter]);
        counter++;
        if (leaderboard[counter]) row.push(leaderboard[counter]);
        counter++;
        data.push(row)
      }

      req.leaderboard = data;
    } else {
      req.leaderboard = [];
    }
    return next();
  });
}

var challenges = function(req, res, next) {

  var type = req.url.split('/')[1];
  console.log(type);
  var endpoint = process.env.DESIGN_CHALLENGES_ENDPOINT;
  if (type === 'development')
    endpoint = process.env.DEVELOPMENT_CHALLENGES_ENDPOINT;

  request(endpoint, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var challenges = JSON.parse(body);
      console.log(challenges.length);
      _.forEach(challenges, function(c, key){
        c._source.platforms = c._source.platforms.join(', ');
        c._source.technologies = c._source.technologies.join(', ')
        c._source.submissionEndDate = moment.utc(c._source.submissionEndDate).format('MMMM Do YYYY, h:mm:ss a');
        c._source.totalPrize = _.reduce(c._source.prize, function(sum, el) {
          return sum + el
        }, 0)
        c._source.isComplete =  c._source.currentStatus === 'Completed' ? true : false;
      });
      req.challenges = challenges;
    } else {
      req.challenges = [];
    }
    return next();
  });
}

router.get('/welcome', function (req, res) {
  res.render('welcome');
});

router.get('/signup', function (req, res) {
  res.render('signup');
});

router.get('/faqs', function (req, res) {
  res.render('faqs');
});

router.get('/sponsors', function (req, res) {
  res.render('sponsors');
});

router.get('/design/leaderboard', leaderboard, function (req, res) {
  res.render('design-leaderboard', {
    leaders: req.leaderboard
  });
});

router.get('/development/leaderboard', leaderboard, function (req, res) {
  res.render('development-leaderboard', {
    leaders: req.leaderboard
  });
});

router.get('/challenges/fun', function (req, res) {
  res.render('challenges-fun.hbs', { funChallengeId: process.env.FUN_CHALLENGE_ID});
});

router.get('/codeblitz', function (req, res) {
  res.render('codeblitz.hbs');
});

router.get('/design/challenges', challenges, function (req, res) {
  res.render('design-challenges.hbs', {
    challenges: req.challenges
  });
});

router.get('/development/challenges', challenges, function (req, res) {
  res.render('development-challenges.hbs', {
    challenges: req.challenges
  });
});

router.get('/', function (req, res) {
  res.render('index');
});

module.exports = router;
