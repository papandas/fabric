

var express = require('express');
var http = require('http');
var https = require('https');
var path = require('path');
var fs = require('fs');
var mime = require('mime');
var bodyParser = require('body-parser');
var cfenv = require('cfenv');

var cookieParser = require('cookie-parser');
var session = require('express-session');

var vcapServices = require('vcap_services');
var uuid = require('uuid');
var env = require('./controller/envV2.json');
var sessionSecret = env.sessionSecret;
var appEnv = cfenv.getAppEnv();
var app = express();
var busboy = require('connect-busboy');
app.use(busboy());



app.use(cookieParser(sessionSecret));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.set('appName', 'z2b-chapter05');
app.set('port', appEnv.port);

app.set('views', path.join(__dirname + '/HTML'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/HTML'));
app.use(bodyParser.json());

// Define your own router file in controller folder, export the router, add it into the index.js.
// app.use('/', require("./controller/yourOwnRouter"));

app.use('/', require("./controller/restapi/router"));

if (cfenv.getAppEnv().isLocal == true)
  { var server = app.listen(app.get('port'), function() {console.log('Listening locally on port %d', server.address().port);}); }
  else
  { var server = app.listen(app.get('port'), function() {console.log('Listening remotely on port %d', server.address().port);}); }
  

function loadSelectedFile(req, res) {
    var uri = req.originalUrl;
    var filename = __dirname + "/HTML" + uri;
    console.log("filename", filename);
    fs.readFile(filename,
        function(err, data) {
            if (err) {
                console.log('Error loading ' + filename + ' error: ' + err);
                return res.status(500).send('Error loading ' + filename);
            }
            var type = mime.lookup(filename);
           res.setHeader('content-type', type);
            res.writeHead(200);
            res.end(data);
        });
}



function displayObjectValues (_string, _object)
{
  for (prop in _object){
      console.log(_string+prop+": "+(((typeof(_object[prop]) == 'object') || (typeof(_object[prop]) == 'function'))  ? typeof(_object[prop]) : _object[prop]));}
}
