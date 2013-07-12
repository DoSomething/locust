var http = require('http');
var express = require('express');
var app = express();
var server = http.createServer(app);
var anyDB = require('any-db');
var engines = require('consolidate');
var request = require('request');

var io = require('socket.io').listen(server);
io.set('log level', 1); 

app.use(express.bodyParser());
app.engine('html', engines.hogan);
app.set('views', __dirname + '/templates');
app.use('/public', express.static(__dirname + '/public'));

io.sockets.on('connection', function(socket){
	request('http://www.dosomething.org/rest/view/current_campaign_nids.json', function (error, response, body) {
	  if (!error && response.statusCode == 200) {
	  	var activeCampaigns = JSON.parse(body);
	  	request('http://www.dosomething.org/rest/node/' + activeCampaigns[0]['nid'] + '.json', function (error, response, body) {
	  		socket.emit("ping", body);
	  	});
	  }
	});
});

app.get('/', function(req, res) {
	res.render('index.html');	
});


server.listen(8080);