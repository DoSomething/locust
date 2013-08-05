var http = require('http');
var express = require('express');
var app = express();
var server = http.createServer(app);
var anyDB = require('any-db');
var conn = anyDB.createConnection('sqlite3://campaigns.db');
var engines = require('consolidate');
var request = require('request');
var client = require('scp2');
var fs = require('fs');
require('date-utils');

// credentials for scp request
var credentials = require('./credentials.json');

// json of campaign stats
var campaignStats;
var remove = true;

var io = require('socket.io').listen(server);
io.set('log level', 1); 

app.use(express.bodyParser());
app.engine('html', engines.hogan);
app.set('views', __dirname + '/templates');
app.use('/public', express.static(__dirname + '/public'));

conn.query('CREATE TABLE IF NOT EXISTS campaigns (id INTEGER PRIMARY KEY AUTOINCREMENT, nid TEXT, title TEXT, logo TEXT, teaser TEXT, startDate TEXT, endDate TEXT)')
  .on('end', function(){
    console.log('Made campaigns table.');
  });

conn.query('CREATE TABLE IF NOT EXISTS userData (nid TEXT, totalSignups INTEGER, date DATE, totalNewMembers INTEGER, mobileSignups INTEGER, webSignups INTEGER)')
  .on('end', function(){
    console.log('Made user data table.');
  });

io.sockets.on('connection', function(socket){
  run();
  setInterval(run, 86400000);

  function run() {
    client.scp({
        host: credentials.host,
        username: credentials.username,
        password: credentials.password,
        path: credentials.path
    }, './', function(err) {
      if(err != null){
        console.log(err);
      }else{
        console.log("SUCCESS: Copied campaign_stats_final.json to local machine.");
        fs.readFile("./campaign_stats_final.json", "utf8", function (err,data) {
          if (err) {
            return console.log(err);
          }else{
            campaignStats = JSON.parse(data);
            remove = true;
            request('http://www.dosomething.org/rest/view/current_campaign_nids.json', function (error, response, body) {
              if (!error && response.statusCode == 200) {
                  var activeCampaigns = JSON.parse(body);

                  conn.query('SELECT endDate, nid FROM campaigns', function(error, result) {
                    result.rows.forEach(function(d) {
                      if (Date.today().isAfter(Date.parse(d.endDate))) {
                        conn.query('DELETE FROM campaigns WHERE endDate=$1', d.endDate);
                        conn.query('DELETE FROM userData WHERE nid=$1', d.nid);
                      }
                    });
                  });
                      
                    activeCampaigns.forEach(function(c) {
                      request('http://www.dosomething.org/rest/node/' + c['nid'] + '.json', function (error, response, body) {

                        var campaign = JSON.parse(body);
                        var usersNow = 0;
                        var mobileSignups = 0;
                        var webSignups = 0;
                        var newMembers = 0;

                        var pic;
                        if (campaign['field_campaign_main_image']['und'] == undefined) {
                          pic = '/public/ds-logo.png';
                        } else {
                          pic = campaign['field_campaign_main_image']['und'][0]['uri'];
                          pic = pic.replace("public://", "");
                          pic = "http://www.dosomething.org/files/styles/campaigns_image/public/".concat(pic);

                        }
              
                        conn.query('SELECT * FROM userData WHERE nid=$1 AND date=$2', [campaign['nid'], campaignStats.campaigns_pull.date], function(error, result) {
                          if (result.rowCount == 0) {

                            for (var i = 0; i < campaignStats.campaigns_pull.campaigns.length; i++) {
                              if (JSON.stringify(campaignStats.campaigns_pull.campaigns[i].name).indexOf(campaign['title']) !== -1) {
                                usersNow = campaignStats.campaigns_pull.campaigns[i].total_sign_ups_all;
                                mobileSignups = campaignStats.campaigns_pull.campaigns[i].mobile_sign_ups_all;
                                webSignups = campaignStats.campaigns_pull.campaigns[i].web_sign_ups_all;
                                newMembers = campaignStats.campaigns_pull.campaigns[i].total_new_members_all;
                              } else {
                                if(campaign['title'] == "25,000 Women" && campaignStats.campaigns_pull.campaigns[i].name == "25k Women"){
                                  usersNow = campaignStats.campaigns_pull.campaigns[i].total_sign_ups_all;
                                  mobileSignups = campaignStats.campaigns_pull.campaigns[i].mobile_sign_ups_all;
                                  webSignups = campaignStats.campaigns_pull.campaigns[i].web_sign_ups_all;
                                  newMembers = campaignStats.campaigns_pull.campaigns[i].total_new_members_all;

                                }
                                if(campaign['title'] == "Thumb Wars" && campaignStats.campaigns_pull.campaigns[i].name == "Thumb_wars"){
                                  usersNow = campaignStats.campaigns_pull.campaigns[i].total_sign_ups_all;
                                  mobileSignups = campaignStats.campaigns_pull.campaigns[i].mobile_sign_ups_all;
                                  webSignups = campaignStats.campaigns_pull.campaigns[i].web_sign_ups_all;
                                  newMembers = campaignStats.campaigns_pull.campaigns[i].total_new_members_all;

                                }
                              }
                            }
                            conn.query('INSERT INTO userData (nid, totalSignups, date, totalNewMembers, mobileSignups, webSignups) VALUES ($1, $2, $3, $4, $5, $6)', [campaign['nid'], usersNow, campaignStats.campaigns_pull.date, newMembers, mobileSignups, webSignups]);
                          }
                        });

                        conn.query('SELECT * FROM campaigns WHERE nid=$1', campaign['nid'], function(error, result) {
                          if(result.rowCount != 0){
                            conn.query('UPDATE campaigns SET title=$1, teaser=$2, startDate=$3, endDate=$4, logo=$5 WHERE nid=$6', [campaign['title'], campaign['field_campaign_teaser']['und'][0]['value'], campaign['field_campain_date']['und'][0]['value'], campaign['field_campain_date']['und'][0]['value2'], pic, campaign['nid']]);
                          }else{
                            usersNow = 56; // REMOVE for production
                            conn.query('INSERT INTO campaigns (nid, title, teaser, startDate, endDate, logo) VALUES ($1, $2, $3, $4, $5, $6)', 
                              [campaign['nid'], campaign['title'], campaign['field_campaign_teaser']['und'][0]['value'], campaign['field_campain_date']['und'][0]['value'], campaign['field_campain_date']['und'][0]['value2'], pic]);
                          }
                        });
                        
                    conn.query('SELECT title, logo, teaser, endDate FROM campaigns WHERE nid=$1', campaign['nid'], function(error, result) {
                      send(JSON.stringify(result), true);
                    });

                        conn.query('SELECT totalSignups, date, totalNewMembers, mobileSignups, webSignups FROM userData WHERE nid=$1', campaign['nid'], function(error, result) {
                          send(JSON.stringify(result), false);

                        });
                        var info = 0;
                        var users = 0;
                        function send(stuff, first) {
                          if (first) {
                            info = stuff;
                          } else {
                            users = stuff
                            socket.emit('setCampaign', info, users, remove);
                            remove = false;
                          }
                        }
                      });
                    });
              }
            });
          }
        });
      }
    });
  }
});

app.get('/', function(req, res) {
	res.render('index.html');	
});


server.listen(8080);