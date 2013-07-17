var http = require('http');
var express = require('express');
var app = express();
var server = http.createServer(app);
var anyDB = require('any-db');
var conn = anyDB.createConnection('sqlite3://campaigns.db');
var engines = require('consolidate');
var request = require('request');
var jsdom = require('jsdom');
require('date-utils');

var io = require('socket.io').listen(server);
io.set('log level', 1); 

app.use(express.bodyParser());
app.engine('html', engines.hogan);
app.set('views', __dirname + '/templates');
app.use('/public', express.static(__dirname + '/public'));

conn.query('CREATE TABLE IF NOT EXISTS campaigns (id INTEGER PRIMARY KEY AUTOINCREMENT, nid TEXT, title TEXT, logo TEXT, teaser TEXT, startDate TEXT, endDate TEXT, usersYest INTEGER, usersNow INTEGER)')
	.on('end', function(){
		console.log('Made campaigns table.');
	});

io.sockets.on('connection', function(socket){

	function run() {
		request('http://www.dosomething.org/rest/view/current_campaign_nids.json', function (error, response, body) {
			  if (!error && response.statusCode == 200) {
			  	var activeCampaigns = JSON.parse(body);
			  	var teaserElements;
			  	var teasers = new Array();
			  	jsdom.env(
			  	  "http://www.dosomething.org/campaigns",
			  	  ["http://code.jquery.com/jquery.js"],
			  	  function (errors, window) {
			  	  	teaserElements = window.$(".campaign-teaser");
			  	  	window.$.each(teaserElements, function() {
			  	  		teasers[window.$(this).parent().parent().find(".apps-image").find("a").attr("href")] = window.$(this).text();
			  	  	});
			  	  	
			  	  	activeCampaigns.forEach(function(c) {
			  	  		request('http://www.dosomething.org/rest/node/' + c['nid'] + '.json', function (error, response, body) {
			  	  			var campaign = JSON.parse(body);
			  	  			var teaser = teasers[campaign["path"]];
			  	  			if(teaser == null){
			  	  				teaser = "";
			  	  			}

			  	  			var pic;
			  	  			if (campaign['field_campaign_main_image']['und'] == undefined) {
			  	  				pic = 'http://www.dosomething.org/files/styles/campaigns_image/public/mm-logo.png'
			  	  			} else {
			  	  				pic = campaign['field_campaign_main_image']['und'][0]['uri'];
			  	  				pic = pic.replace("public://", "");
			  	  				pic = "http://www.dosomething.org/files/styles/campaigns_image/public/".concat(pic);
			  	  			}

			  	  			conn.query('SELECT * FROM campaigns WHERE nid=$1', campaign['nid'], function(error, result) {
			  	  			  if(result.rowCount != 0){
			  	  			    var oldUsersNow = result.rows[0].usersNow;
			  	  			    conn.query('UPDATE campaigns SET title=$1, teaser=$2, startDate=$3, endDate=$4, usersYest=$5, usersNow=$6, logo=$7 WHERE nid=$8', [campaign['title'], teaser, campaign['field_campain_date']['und'][0]['value'], campaign['field_campain_date']['und'][0]['value2'], oldUsersNow, 99, pic, campaign['nid']]);
			  	  			  }else{
			  	  			    conn.query('INSERT INTO campaigns (nid, title, teaser, startDate, endDate, usersNow, logo) VALUES ($1, $2, $3, $4, $5, $6, $7)', 
			  	  			      [campaign['nid'], campaign['title'], teaser, campaign['field_campain_date']['und'][0]['value'], campaign['field_campain_date']['und'][0]['value2'], 55, pic]);
			  	  			  }
			  	  			});

			  	  			conn.query('SELECT title, logo, teaser, endDate, usersYest, usersNow FROM campaigns WHERE nid=$1', [campaign['nid']], function(error, result) {
			  	  				//send back to client list of past messages from the chatroom
			  	  				var info = JSON.stringify(result);
			  	  				socket.emit('setCampaign', info);
			  	  			});
			  	  		});
			  	  	});
			  	  }
			  	);
			  }
		});
		setInterval(run, 86400000);
	}
	run();
});

app.get('/', function(req, res) {
	res.render('index.html');	
});


server.listen(8080);