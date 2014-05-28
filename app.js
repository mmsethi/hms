var express = require('express');
var http = require('http');
var app = express();
//var routes = require('routes');
var moment = require('moment');
app.configure(function(){
	app.set('port', 8080);
	app.set('views', __dirname + '/views');
	app.set('view engine', 'jade');
	app.locals.pretty = true;
//	app.use(express.favicon());
//	app.use(express.logger('dev'));
	app.use(express.bodyParser());
	app.use(express.cookieParser());
	app.use(express.session({ secret: 'super-duper-secret-secret' }));
	app.use(express.methodOverride());
	app.use(require('stylus').middleware({ src: __dirname + '/public' }));
	app.use(express.static(__dirname + '/public'));
	//Etag
});
//app.disable('etag');

app.configure('development', function(){
	app.use(express.errorHandler());
});

require('./router.js')(app);


http.createServer(app).listen(app.get('port'), function(){
	console.log("Express server listening on port " + app.get('port'));
})