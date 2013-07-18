var campaigns = [];
var i = 0;
var upNextI = 1;

//flip variables
var dayLength = 135000;
var rotatePause = 9000;
var flipInterval, smallFlipInterval;
var firstRotation = true;

$(document).ready(function() {// begin jQuery

  //loading screen
  var loadH = $(window).height();
  $("body").append("<div id='locust-load' style='width: 100%; height: " + loadH + "px; text-align: center; position: absolute; z-index: 99; top: 0px; left: 0px; background-color: rgba(0,0,0,1); padding-top: 100px'><img src='/public/locust.gif'/></div>");

	var socket = io.connect(window.location.hostname);
  var spIndex = 3;

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

    for (var x = usersYest; x <= usersNow; x++) {
      var s = "" + x;
      if(s.length < 7){
        var difference = 7-s.length;
        for(var y = 0; y < difference; y++){
          s = "0" + s;
        }
      }
      campaigns[campaigns.length -  1].messages.push(s);
    }

    if(campaigns.length == 1){// fill in the featured panel
      $('#flightboard').flightboard({
        maxLength: 7,
        repeat: false,
        sequential: false,
        messages: campaigns[0].messages
      });

      
      campaigns[0].flipPause = (dayLength  - (campaigns[0].messages.length * 500)) / campaigns[0].messages.length;
      flipInterval = setInterval(flip, campaigns[0].flipPause);

      $('#featured').find('.title').text(campaigns[0].name);
      $('#featured').find('.days-remaining').text(campaigns[0].daysLeft);
      $('#featured').find('.logo').find('img').attr("src", campaigns[0].bigPic);
    }else if(campaigns.length == 2){// fill in the up next panel
      $('#up-next-flightboard').flightboard({
        lettersImage: "/public/img/flightBoardSmall.png",
        lettersSize: [14,18],
        maxLength: 7,
        repeat: false,
        sequential: false,
        messages: campaigns[1].messages
      });

      campaigns[1].flipPause = (dayLength  - (campaigns[1].messages.length * 500)) / campaigns[1].messages.length;
      smallFlipInterval = setInterval(smallFlip, campaigns[1].flipPause);

      $('#up-next').find('.title').text(campaigns[1].name);
      $('#up-next').find('.days-remaining').text(campaigns[1].daysLeft);
      $('#up-next').find('.logo').find('img').attr("src", campaigns[1].pic);
    }else{// fill in the small panels
      campaigns[campaigns.length - 1].flipPause = (dayLength  - (campaigns[campaigns.length - 1].messages.length * 500)) / campaigns[campaigns.length - 1].messages.length;
      
      $('.' + "sp".concat(spIndex)).find('.with-margin').find("h3").text(campaigns[campaigns.length - 1].name);
      $('.' + "sp".concat(spIndex)).find('.with-margin').find(".small-days-remaining").text(campaigns[campaigns.length - 1].daysLeft);
      if(campaigns[campaigns.length - 1].teaser.length > 145){
        $('.' + "sp".concat(spIndex)).find('.with-margin').find(".small-teaser").text(campaigns[campaigns.length - 1].teaser.substring(0, 142).concat("..."));  
      }else{
        $('.' + "sp".concat(spIndex)).find('.with-margin').find(".small-teaser").text(campaigns[campaigns.length - 1].teaser);
      }
      spIndex--;
      if(spIndex == -1){
        // remove the loading screen
        $("#locust-load").remove();
      }
    }
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

function smallFlip() {
  //if we've reached our max value, stop flipping
  if($("#up-next-flightboard").flightboard("current") == campaigns[upNextI].messages[campaigns[upNextI].messages.length - 1]){
    clearInterval(smallFlipInterval);
    return;
  }
  campaigns[upNextI].flipCount++;
  $('#up-next-flightboard').flightboard('flip');
}

var rotateFeatured = setInterval(function() {
  i++;
  if (i >= campaigns.length) {
    i = 0;
  }
  if((i + 1) >= campaigns.length){
    upNextI = 0;
  }else{
    upNextI = i + 1;
  }
  
  //must save a copy of i for global use reset at end of this function
  var saveI = i;
  $('#flightboard').flightboard('destroy');

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
  clearInterval(flipInterval);
  flipInterval = setInterval(flip, campaigns[i].flipPause);

  // fill in the featured panel
  $('#featured').find('.title').text(campaigns[i].name);
  $('#featured').find('.days-remaining').text(campaigns[i].daysLeft);
  $('#featured').find('.logo').find('img').attr("src", campaigns[i].bigPic);
  i++;
  if (i >= campaigns.length) {
    i = 0;
  }

  //small flightboard
  $('#up-next-flightboard').flightboard('destroy');

  // how many flips should I have completed?
  if(firstRotation){
    if(upNextI == 0){
      firstRotation = false;
      campaigns[upNextI].flipCount += Math.floor((rotatePause * (campaigns.length - 2)) / campaigns[upNextI].flipPause);  
    }else{
      campaigns[upNextI].flipCount += Math.floor((rotatePause * (upNextI - 1)) / campaigns[upNextI].flipPause);    
    }
  }else{
    campaigns[upNextI].flipCount += Math.floor((rotatePause * (campaigns.length - 2)) / campaigns[upNextI].flipPause);  
  }
  

  //splice the messages array to get rid of values that should have already shown
  if(!(campaigns[upNextI].flipCount >= campaigns[upNextI].messages.length)){
    campaigns[upNextI].messages.splice(0, campaigns[upNextI].flipCount);
  }else{
    var s = "" + campaigns[upNextI].usersNow;
    if(s.length < 7){
      var difference = 7-s.length;
      for(var y = 0; y < difference; y++){
        s = "0" + s;
      }
    }
    campaigns[upNextI].messages = [s];
  }

  // reset the flip count
  campaigns[upNextI].flipCount = 0;

  $('#up-next-flightboard').flightboard({
    lettersImage: "/public/img/flightBoardSmall.png",
    lettersSize: [14,18],
    maxLength: 7,
    repeat: false,
    sequential: false,
    messages: campaigns[upNextI].messages
  });
  clearInterval(smallFlipInterval);
  smallFlipInterval = setInterval(smallFlip, campaigns[upNextI].flipPause);

  // fill in the up next panel
  $('#up-next').find('.title').text(campaigns[i].name);
  $('#up-next').find('.days-remaining').text(campaigns[i].daysLeft);
  $('#up-next').find('.logo').find('img').attr("src", campaigns[i].pic);
  i++;
  if (i >= campaigns.length) {
    i = 0;
  }

  // fill in the small panels
  for (var x = 3; x >= 0; x--) {
    $('.' + "sp".concat(x)).find('.with-margin').find("h3").text(campaigns[i].name);
    $('.' + "sp".concat(x)).find('.with-margin').find(".small-days-remaining").text(campaigns[i].daysLeft);
    if(campaigns[i].teaser.length > 145){
      $('.' + "sp".concat(x)).find('.with-margin').find(".small-teaser").text(campaigns[i].teaser.substring(0, 142).concat("..."));  
    }else{
      $('.' + "sp".concat(x)).find('.with-margin').find(".small-teaser").text(campaigns[i].teaser);
    }
    i++;
    if (i >= campaigns.length) {
      i = 0;
    }
  }
  i = saveI;
}, rotatePause);