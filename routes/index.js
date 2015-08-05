var express = require('express');
var router = express.Router();
var Promise = require("bluebird");
var request = Promise.promisify(require("request"));
var _ = require('lodash');
var hbs = require('hbs');
var moment = require('moment');
var tz = require('moment-timezone');

var leaderboard = function(url) {

  function isInt(n) {
     return n % 1 === 0;
  }

  return new Promise(function(resolve, reject) {
    request(url, function callback(error, response, body) {
      if(!error && response.statusCode === 200){
        var leaderboard = JSON.parse(body);
        var rows = leaderboard.length/3;
        var data = [];
        var counter = 0;

        // add one extra row if needd
        if (!isInt(rows))
          rows = Math.floor(rows) + 1;

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
        resolve(data);
      }else{
        reject(error)
      }
    });
  });
};

function date_Sort(recordA,recordB){
  var diff =  new Date(recordA._source.sortDate).getTime() - new  Date(recordB._source.sortDate).getTime();  
  return diff *  -1;
} 

var challenges = function(req, res, next) {

  var type = req.url.split('/')[1];
  var endpoint = process.env.DESIGN_CHALLENGES_ENDPOINT;
  if (type === 'development')
    endpoint = process.env.DEVELOPMENT_CHALLENGES_ENDPOINT;
  //console.log(endpoint);
  request(endpoint, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var challenges = JSON.parse(body);
      _.forEach(challenges, function(c, key){
        console.log(c._source.currentStatus);
        c._source.platforms = c._source.platforms.join(', ');
        c._source.technologies = c._source.technologies.join(', ');
        c._source.sortDate = c._source.submissionEndDate; //date used for sorting the records
        c._source.submissionEndDate = moment.utc(c._source.submissionEndDate).tz('America/New_York').format('MMMM Do YYYY, h:mm:ss a');
        c._source.totalPrize = _.reduce(c._source.prize, function(sum, el) {
          return sum + el
        }, 0)
        c._source.isComplete =  c._source.currentStatus === 'Completed' ? true : false;
      });
      challenges.sort(date_Sort);
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

router.get('/design/leaderboard', function (req, res) {
  var allLeaderboards = [];
  Promise.join(
    leaderboard('http://tc-leaderboard.herokuapp.com/sibm-design-june'),
    leaderboard('http://tc-leaderboard.herokuapp.com/sibm-design-july'),
    leaderboard('http://tc-leaderboard.herokuapp.com/sibm-design-august')
  ).then(function(data) {
    allLeaderboards = data;
  }).catch(function(e) {
    console.log(e);
  }).finally(function(){
    // would have like to pass a single array but hbs was choking
    res.render('design-leaderboard', {
      month1: allLeaderboards[0],
      month2: allLeaderboards[1],
      month3: allLeaderboards[2]
    });
  });
});

router.get('/development/leaderboard', function (req, res) {
  var allLeaderboards = [];
  Promise.join(
    leaderboard('http://tc-leaderboard.herokuapp.com/sibm-development-june'),
    leaderboard('http://tc-leaderboard.herokuapp.com/sibm-development-july'),
    leaderboard('http://tc-leaderboard.herokuapp.com/sibm-development-august')
  ).then(function(data) {
    allLeaderboards = data;
  }).catch(function(e) {
    console.log(e);
  }).finally(function(){
    // would have like to pass a single array but hbs was choking
    res.render('development-leaderboard', {
      month1: allLeaderboards[0],
      month2: allLeaderboards[1],
      month3: allLeaderboards[2]
    });
  });
});

router.get('/challenges/fun', function (req, res) {
  res.render('challenges-fun.hbs',
					{
						funChallengeId: process.env.FUN_CHALLENGE_ID,
						registerChallengeId: process.env.REGISTER_CHALLENGE_ID
					});
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
