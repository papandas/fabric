
var extend = require('extend');
var fs = require('fs');
var path = require('path');
//var textPath = "../text/";
//var languageFile = "languages.json";
//var locationsFile = "text-locations.json";
//var promptFile = "prompts.json";
var languages = require('./text/languages.json');
var locations = require('./text/text-locations.json');

exports.languages = function(req, res) {res.send(languages);}

exports.prompts = function(req, res){
    res.send(fs.readFileSync(path.resolve(__dirname)+languages[req.body.language].data)); 
}

exports.locations = function(req, res){res.send(locations);}