var extend = require('extend');
var fs = require('fs');
var path = require('path');
var APIFile = require("./resources/hfcCapabilities.json");
var languages = require('./text/languages.json');
var locations = require('./text/text-locations.json');

exports.getDocs = function(req, res) {res.send(APIFile);}

exports.getEducation = function(req, res)
{ }