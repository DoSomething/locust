var campaigns = [];
var i = 0;
var upNextI = 1;
var numSmallPanels = 0;

//flip variables
var dayLength = 135000;
var rotatePause = 9000;
var flipInterval, smallFlipInterval;
var firstLoop = true;

$(document).ready(function() {// begin jQuery

  //loading screen
  var loadH = $(window).height();
  $("body").append("<div id='locust-load' style='width: 100%; height: " + loadH + "px; text-align: center; position: absolute; z-index: 99; top: 0px; left: 0px; background-color: rgba(0,0,0,1); padding-top: 100px'><img src='/public/locust.gif'/></div>");

	var socket = io.connect(window.location.hostname);

	socket.on("setCampaign", function (info) {
    var data = JSON.parse(info);
    var logo = data.rows[0].logo;
    var bigLogo = data.rows[0].bigPic
    var name = data.rows[0].title;
    var teaser = data.rows[0].teaser;
    var usersYest = data.rows[0].usersYest;
    var usersNow = data.rows[0].usersNow;
		var end = Date.parse(data.rows[0].endDate);
		var remaining = Date.today().getDaysBetween(end);
    if (remaining < 1) {
      remaining = "Ends Today";
    } else if (remaining == 1) {
      remaining = "Ends Tomorrow";
    } else {
      remaining = remaining + " Days Remaining";
    }

    campaigns.push({'name': name,
                    'pic': logo,
                    'bigPic': bigLogo,
                    'daysLeft': remaining,
                    'teaser': teaser,
                    'usersYest': usersYest,
                    'usersNow': usersNow,
                    'messages': [],
                    'flipCount': 0,
                    'flipPause': 0
                  });
    var cIndex = campaigns.length - 1;

    for (var x = usersYest; x <= usersNow; x++) {
      var s = "" + x;
      if(s.length < 7){
        var difference = 7-s.length;
        for(var y = 0; y < difference; y++){
          s = "0" + s;
        }
      }
      campaigns[cIndex].messages.push(s);
    }

    if(cIndex == 0){// fill in the featured panel
      $('#flightboard').flightboard({
        maxLength: 7,
        repeat: false,
        sequential: false,
        messages: campaigns[cIndex].messages
      });

      
      campaigns[cIndex].flipPause = (dayLength  - (campaigns[cIndex].messages.length * 500)) / campaigns[cIndex].messages.length;
      flipInterval = setInterval(flip, campaigns[cIndex].flipPause);

      $('#featured').find('.title').text(campaigns[cIndex].name);
      $('#featured').find('.days-remaining').text(campaigns[cIndex].daysLeft);
      $('#featured').find('.logo').find('img').attr("src", campaigns[cIndex].bigPic);
      if(campaigns[cIndex].teaser.length > 145){
        $('#featured').find(".big-teaser").text(campaigns[cIndex].teaser.substring(0, 142).concat("..."));  
      }else{
        $('#featured').find(".big-teaser").text(campaigns[cIndex].teaser);
      }
    }
    // fill out a small panel for all campaigns   
    campaigns[cIndex].flipPause = (dayLength  - (campaigns[cIndex].messages.length * 500)) / campaigns[cIndex].messages.length;
    numSmallPanels++;
    var panel = "<div id='" + cIndex + "' class='small-panel'>" +
                  campaigns[cIndex].name +
                "</div>";
    $("#sidebar").append(panel);
    if(cIndex == 0){
      $("#0").addClass("highlight");
    }
    
    // WARNING: this should only occur after they are all loaded
    // remove the loading screen
    $("#locust-load").remove();
	});

}); // end jQuery scope

function flip() {
  //if we've reached our max value, stop flipping
  if($("#flightboard").flightboard("current") == campaigns[i].messages[campaigns[i].messages.length - 1]){
    clearInterval(flipInterval);
    return;
  }
  campaigns[i].flipCount++;
  $('#flightboard').flightboard('flip');
}

var rotateFeatured = setInterval(function() {
  $("#" + i).removeClass("highlight");
  i++;
  if (i >= campaigns.length) {
    i = 0;
  }
  
  //must save a copy of i for global use reset at end of this function
  var saveI = i;
  $('#flightboard').flightboard('destroy');

  // how many flips should I have completed?
  if(firstLoop){
    if(i == campaigns.length - 1){ // off by 3!!!!!
      firstLoop = false;
    }
    campaigns[i].flipCount += Math.floor((rotatePause * (i)) / campaigns[i].flipPause);  
  }else{
    campaigns[i].flipCount += Math.floor((rotatePause * (campaigns.length - 1)) / campaigns[i].flipPause);  
  }

  //splice the messages array to get rid of values that should have already shown
  if(!(campaigns[i].flipCount >= campaigns[i].messages.length)){
    campaigns[i].messages.splice(0, campaigns[i].flipCount);
  }else{
    var s = "" + campaigns[i].usersNow;
    if(s.length < 7){
      var difference = 7-s.length;
      for(var y = 0; y < difference; y++){
        s = "0" + s;
      }
    }
    campaigns[i].messages = [s];
  }

  // reset the flip count
  campaigns[i].flipCount = 0;

  $('#flightboard').flightboard({
    maxLength: 7,
    repeat: false,
    sequential: false,
    messages: campaigns[i].messages
  });
  $("#" + i).addClass("highlight");
  clearInterval(flipInterval);
  flipInterval = setInterval(flip, campaigns[i].flipPause);

  // fill in the featured panel
  $('#featured').find('.title').text(campaigns[i].name);
  $('#featured').find('.days-remaining').text(campaigns[i].daysLeft);
  $('#featured').find('.logo').find('img').attr("src", campaigns[i].bigPic);
  if(campaigns[i].teaser.length > 145){
    $('#featured').find(".big-teaser").text(campaigns[i].teaser.substring(0, 142).concat("..."));  
  }else{
    $('#featured').find(".big-teaser").text(campaigns[i].teaser);
  }
  i++;
  if (i >= campaigns.length) {
    i = 0;
  }
  
  i = saveI;
}, rotatePause);