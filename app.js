var http = require('http');
var express = require('express');
var app = express();
var server = http.createServer(app);
var anyDB = require('any-db');
var conn = anyDB.createConnection('sqlite3://campaigns.db');
var engines = require('consolidate');
var request = require('request');
var client = require('scp2');
require('date-utils');

// credentials for scp request
var credentials = require('./credentials.json');

client.scp({
    host: credentials.host,
    username: credentials.username,
    password: credentials.password,
    path: credentials.path
}, './', function(err) {
	if(err != null){
		console.log(err);
	}else{
		console.log("SUCCESS: Copied campaign_stats.json to local machine.");
	}
});

var io = require('socket.io').listen(server);
io.set('log level', 1); 

app.use(express.bodyParser());
app.engine('html', engines.hogan);
app.set('views', __dirname + '/templates');
app.use('/public', express.static(__dirname + '/public'));

conn.query('CREATE TABLE IF NOT EXISTS campaigns (id INTEGER PRIMARY KEY AUTOINCREMENT, nid TEXT, title TEXT, logo TEXT, bigPic TEXT, teaser TEXT, startDate TEXT, endDate TEXT, usersYest INTEGER, usersNow INTEGER)')
	.on('end', function(){
		console.log('Made campaigns table.');
	});

conn.query('CREATE TABLE IF NOT EXISTS userData (nid TEXT, numUsers INTEGER, date TIMESTAMP)')
	.on('end', function(){
		console.log('Made user data table.');
	});

io.sockets.on('connection', function(socket){
	run();
	setInterval(run, 86400000);

	function run() {
		request('http://www.dosomething.org/rest/view/current_campaign_nids.json', function (error, response, body) {
			if (!error && response.statusCode == 200) {
			  	var activeCampaigns = JSON.parse(body);
			  	  	
		  	  	activeCampaigns.forEach(function(c) {
		  	  		request('http://www.dosomething.org/rest/node/' + c['nid'] + '.json', function (error, response, body) {

		  	  			var campaign = JSON.parse(body);
		  	  			//console.log(campaign);

		  	  			var bigPic;
		  	  			if (campaign['field_campaign_promo_image']['und'] == undefined) {
		  	  				bigPic = '/public/ds-logo.png';
		  	  			} else {
		  	  				bigPic = campaign['field_campaign_promo_image']['und'][0]['uri'];
		  	  				bigPic = bigPic.replace("public://", "");
		  	  				bigPic = "http://www.dosomething.org/files/".concat(bigPic);
		  	  				//console.log(bigPic);
		  	  			}

		  	  			var endDate = Date.parse(campaign['field_campain_date']['und'][0]['value2']);

		  	  			if (Date.equals(endDate, Date.yesterday())) { //if campaign has ended
		  	  				console.log("ended yesterday");
		  	  				conn.query('DELETE FROM campaigns WHERE nid=$1', campaign['nid']);
		  	  				conn.query('DELETE FROM userData WHERE nid=$1', campaign['nid']);
		  	  			} else {
			  	  			var usersNow = 100; // fill this in with reallllll data!

			  	  			var pic;
			  	  			if (campaign['field_campaign_main_image']['und'] == undefined) {
			  	  				pic = '/public/ds-logo.png';
			  	  			} else {
			  	  				pic = campaign['field_campaign_main_image']['und'][0]['uri'];
			  	  				pic = pic.replace("public://", "");
			  	  				pic = "http://www.dosomething.org/files/styles/campaigns_image/public/".concat(pic);

			  	  			}
			  
			  	  			conn.query('SELECT * FROM userData WHERE nid=$1 AND date=$2', [campaign['nid'], Date.today()], function(error, result) {
			  	  				if (result.rowCount == 0) {
			  	  					conn.query('INSERT INTO userData (nid, numUsers, date) VALUES ($1, $2, $3)', [campaign['nid'], 55, Date.yesterday()]);
			  	  					conn.query('INSERT INTO userData (nid, numUsers, date) VALUES ($1, $2, $3)', [campaign['nid'], usersNow, Date.today()]);
			  	  				}
			  	  			});

			  	  			conn.query('SELECT * FROM campaigns WHERE nid=$1', campaign['nid'], function(error, result) {
			  	  			  if(result.rowCount != 0){
			  	  			    var usersYest = result.rows[0].usersNow;
			  	  			    if(usersYest == usersNow){
			  	  			    	usersYest = result.rows[0].usersYest;
			  	  			    }
			  	  			    // WARNING oldUsersNow must be placed into the update statment below
			  	  			    conn.query('UPDATE campaigns SET title=$1, teaser=$2, startDate=$3, endDate=$4, usersYest=$5, usersNow=$6, logo=$7, bigPic=$8  WHERE nid=$9', [campaign['title'], campaign['field_campaign_teaser']['und'][0]['value'], campaign['field_campain_date']['und'][0]['value'], campaign['field_campain_date']['und'][0]['value2'], usersYest, usersNow, pic, bigPic, campaign['nid']]);
			  	  			  }else{
			  	  			  	usersNow = 56; // REMOVE for production
			  	  			    conn.query('INSERT INTO campaigns (nid, title, teaser, startDate, endDate, usersNow, logo, bigPic) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)', 
			  	  			      [campaign['nid'], campaign['title'], campaign['field_campaign_teaser']['und'][0]['value'], campaign['field_campain_date']['und'][0]['value'], campaign['field_campain_date']['und'][0]['value2'], usersNow, pic, bigPic]);
			  	  			  }
			  	  			});
							
							conn.query('SELECT title, logo, bigPic, teaser, endDate, usersYest, usersNow FROM campaigns WHERE nid=$1', campaign['nid'], function(error, result) {
								send(JSON.stringify(result), true);
							});

		  	  				conn.query('SELECT numUsers, date FROM userData WHERE nid=$1', campaign['nid'], function(error, result) {
		  	  					send(JSON.stringify(result), false);

		  	  				});
		  	  				var info = 0;
		  	  				var users = 0;
		  	  				function send(stuff, first) {
		  	  					if (first) {
		  	  						info = stuff;
		  	  					} else {
		  	  						users = stuff
		  	  						socket.emit('setCampaign', info, users);
		  	  					}
		  	  				}
		  	  			}
		  	  		});
		  	  	});
			}
		});
	}
});

app.get('/', function(req, res) {
	res.render('index.html');	
});


server.listen(8080);