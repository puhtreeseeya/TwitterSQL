'use strict';
var express = require('express');
var router = express.Router();
var tweetBank = require('../tweetBank');
var client = require('../db/index.js');

module.exports = function makeRouterWithSockets (io) {

  // a reusable function
  function respondWithAllTweets (req, res, next){
    client.query('SELECT users.name, tweets.id, tweets.content FROM tweets JOIN users ON tweets.user_id=users.id', function (err, result) {
      if (err){
        console.log(err); 
        return next(err); // pass errors to Express
      }
      var tweets = result.rows;
      res.render('index', { title: 'Twitter.js', tweets: tweets, showForm: true });
    });

  }

  // here we basically treet the root view and tweets view as identical
  router.get('/', respondWithAllTweets);
  router.get('/tweets', respondWithAllTweets);

  // single-user page
  router.get('/users/:username', function(req, res, next){
    client.query("SELECT tweets.content FROM users JOIN tweets ON users.id=tweets.user_id WHERE users.name=$1",[req.params.username], function (err, result) {
      if (err){
        console.log(err); 
        return next(err); // pass errors to Express
      }
      var tweets = result.rows;
      res.render('index', { title: 'Twitter.js', tweets: tweets, showForm: true });
    });
  });

  // single-tweet page
  router.get('/tweets/:id', function(req, res, next){
      client.query("SELECT id, content FROM tweets WHERE id=$1",[req.params.id], function (err, result) {
      if (err){
        console.log(err); 
        return next(err); // pass errors to Express
      }
      var tweets = result.rows;
      console.log(tweets); 
      res.render('index', { title: 'Twitter.js', tweets: tweets, showForm: true });
    });
  });

  // create a new tweet
  router.post('/tweets', function(req, res, next){
    var userID;
    client.query("SELECT users.id FROM users WHERE users.name=$1", [req.body.name], function(err, result) {
      // console.log('first result', result);
      // console.log('result id', result.rows[0].id);
      if(err) return next(err); 
      if(!result.rows.length) {
        client.query("INSERT INTO users(name) VALUES($1)", [req.body.name], function(err, result) {
          if(err) return next(err); 
          else {
            userID = result.rows[0].id; 
            console.log('are we here?',result);
          }
        }); 
      }
      else{
        userID = result.rows[0].id;
        console.log('how about here? ', result.rows[0].id);
      } 
      client.query("INSERT INTO tweets(user_id, content) VALUES($1,$2)",[userID, req.body.text], function (err, result) {
        if (err) return next(err);
        var tweets = result.rows;
        console.log(tweets); 
        res.redirect('/');    
      });
    })
 
  });

  // // replaced this hard-coded route with general static routing in app.js
  // router.get('/stylesheets/style.css', function(req, res, next){
  //   res.sendFile('/stylesheets/style.css', { root: __dirname + '/../public/' });
  // });

  return router;
}
