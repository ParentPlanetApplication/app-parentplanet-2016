//barebones express webserver for P2
//module dependencies
var fs = require('fs');
var express = require('express');
var helmet = require('helmet');
var express_enforces_ssl = require('express-enforces-ssl');
var hsts = require('hsts');
var ninetyDaysInMilliseconds = 7776000000;
var http = require('http');
var https = require('https');
var path = require('path');
var morgan  = require('morgan');
var app = express();
var options = { //path to self signed certificate
  key: fs.readFileSync('/home/p2app/certs/example.com.key'),
  cert: fs.readFileSync('/home/p2app/certs/example.com.crt')
}; //eo options
var options2 = { //change to path of real certificate
  key: fs.readFileSync('/home/p2app/certs/p2app.com.key'),
  cert: fs.readFileSync('/home/p2app/certs/app_parentplanet_com.crt')
}; //eo option2
var httpPort = 80;
var httpsPort = 443;

// all environments, listen on port 3000
//process.env.PORT = 443;
//app.set('port', process.env.PORT);
app.enable('trust proxy');
//minimal log output
//app.use(morgan({format:'dev'}));
app.use(morgan({ 
		format: 'dev', 
		skip: function(req, res){ 
			return res.statusCode === 304; 
		}
	})
);

app.use(hsts({ maxAge: ninetyDaysInMilliseconds }));

app.use(express_enforces_ssl());

//process.argv
//process.argv[2] = public + which_version
/*
process.argv.forEach(function (val, index, array) {
  console.log(index + ': ' + val);
});
*/

//var _public = (process.argv[2] ? 'public' + process.argv[2] : 'public');
//This script must in _nodejs/,and _nodejs/ must at the same level as platforms/
var _public = '../platforms/ios/www/'
//put everything in public for serving
app.use(express.static(path.join(__dirname, _public)));

//create the server and startup
https.createServer(options2, app).listen(httpsPort, function(){
  console.log('P2 server listening on port ' + httpsPort);
});

http.createServer(app).listen(httpPort, function(){
  console.log('P2 server listening on port ' + httpPort);
});

//The 404 Route (ALWAYS Keep this as the last route)

app.get('*', function(req, res){
  res.redirect('/');
});