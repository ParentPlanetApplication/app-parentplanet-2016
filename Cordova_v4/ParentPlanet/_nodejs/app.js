//barebones express webserver for P2
//module dependencies
var express = require('express');
var http = require('http');
var path = require('path');
var morgan  = require('morgan');
var app = express();

// all environments, listen on port 3000
app.set('port', process.env.PORT || 3001);

//minimal log output
//app.use(morgan({format:'dev'}));
app.use(morgan({ 
		format: 'dev', 
		skip: function(req, res){ 
			return res.statusCode === 304; 
		}
	})
);

//process.argv
//process.argv[2] = public + which_version
/*
process.argv.forEach(function (val, index, array) {
  console.log(index + ': ' + val);
});
*/

//var _public = (process.argv[2] ? 'public' + process.argv[2] : 'public');
var _public = '../platforms/ios/www/'
//put everything in public for serving
app.use(express.static(path.join(__dirname, _public)));

//create the server and startup
http.createServer(app).listen(app.get('port'), function(){
  console.log('P2 server listening on port ' + app.get('port'));
});



//The 404 Route (ALWAYS Keep this as the last route)

app.get('*', function(req, res){
  res.redirect('/');
});