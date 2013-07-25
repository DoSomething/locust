var campaigns = [];
var i = 0;
var numSmallPanels = 0;
var ticker;

//flip variables
var dayLength = 13000;
var rotatePause = 9000;
var firstLoop = true;

$(document).ready(function() {// begin jQuery

  //loading screen
  var loadH = $(window).height();
  $("body").append("<div id='locust-load' style='width: 100%; height: " + loadH + "px; text-align: center; position: absolute; z-index: 99; top: 0px; left: 0px; background-color: rgba(0,0,0,1); padding-top: 100px'><img src='/public/locust.gif'/></div>");

	var socket = io.connect(window.location.hostname);

	socket.on("setCampaign", function (info, users) {
    var data = JSON.parse(info);
    var users = JSON.parse(users);
    var logo = data.rows[0].logo;
    var name = data.rows[0].title;
    var teaser = data.rows[0].teaser;

    var usersYest = users.rows[users.rows.length - 2].numUsers;
    var usersNow = users.rows[users.rows.length - 1].numUsers;

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
                    'daysLeft': remaining,
                    'teaser': teaser,
                    'usersYest': usersYest,
                    'usersNow': usersNow,
                    'flipCount': 0,
                    'flipPause': 0,
                    'userData': users,
                    'allDone': false
                  });
    var cIndex = campaigns.length - 1;

    if(cIndex == 0){// fill in the featured panel
      campaigns[0].flipPause = (dayLength  - ((campaigns[0].usersNow - campaigns[0].usersYest) )) / (campaigns[0].usersNow - campaigns[0].usersYest);
      $(".tick").text(campaigns[0].usersYest);

      ticker = $(".tick").ticker({
        incremental: 1,
        delay: campaigns[0].flipPause,
        separators: true
      });

      $('#featured').find('.info').find('.title').text(campaigns[0].name);
      $('#featured').find('.days-remaining').text(campaigns[0].daysLeft);
      $('#featured').find('.logo').find('img').attr("src", campaigns[0].pic);
      if(campaigns[0].teaser.length > 145){
        $('#featured').find(".teaser").text(campaigns[0].teaser.substring(0, 142).concat("..."));  
      }else{
        $('#featured').find(".teaser").text(campaigns[0].teaser);
      }
    }else{// add flip pause to all the small panel campaigns
      campaigns[cIndex].flipPause = (dayLength  - ((campaigns[cIndex].usersNow - campaigns[cIndex].usersYest) )) / (campaigns[cIndex].usersNow - campaigns[cIndex].usersYest);
    }

    // fill out a small panel for all campaigns   
    numSmallPanels++;
    var panel = "<div id='" + cIndex + "' class='small-panel small-font'>" +
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

  var rotateFeatured = setInterval(function() {
    $("#" + i).removeClass("highlight");
    i++;
    if (i >= campaigns.length) {
      i = 0;
    }
    
    //must save a copy of i for global use reset at end of this function
    var saveI = i;

    // how many flips should I have completed?
    if(firstLoop){
      if(i == campaigns.length - 1){ // off by 3!!!!!
        firstLoop = false;
      }
      campaigns[i].flipCount += Math.floor((rotatePause * (i)) / campaigns[i].flipPause);  
    }else{
      campaigns[i].flipCount += Math.floor((rotatePause * (campaigns.length)) / campaigns[i].flipPause);  
    }

    // set a ticker as all done before even loading it
    if((campaigns[i].flipCount + campaigns[i].usersYest) >= campaigns[i].usersNow){
      campaigns[i].allDone = true;
    }

    // if all done then set flip count to maximum flips (effectively rendering value as usersNow)
    if(campaigns[i].allDone){
      campaigns[i].flipCount = campaigns[i].usersNow - campaigns[i].usersYest;
    }

    $(".tick").remove();
    $(".numbers").append("<p class='tick tick-flip'>" + (campaigns[i].usersYest + campaigns[i].flipCount) + "</p>");

    $(".tick").on("DOMSubtreeModified", function() {
      console.log(ticker[0].value >= campaigns[i].usersNow);
      if(ticker != null && ticker[0].value >= campaigns[i].usersNow){
        ticker[0].stop();
        campaigns[i].allDone = true;
      }
    });

    ticker = $(".tick").ticker({
      incremental: 1,
      delay: campaigns[i].flipPause,
      separators: true
    });

    // don't do any flips at all
    if(campaigns[i].allDone){
      ticker[0].stop();
    }

    $("#" + i).addClass("highlight");

    // fill in the featured panel
    $('#featured').find('.info').find('.title').text(campaigns[i].name);
    $('#featured').find('.days-remaining').text(campaigns[i].daysLeft);
    $('#featured').find('.logo').find('img').attr("src", campaigns[i].pic);
    if(campaigns[i].teaser.length > 145){
      $('#featured').find(".teaser").text(campaigns[i].teaser.substring(0, 142).concat("..."));  
    }else{
      $('#featured').find(".teaser").text(campaigns[i].teaser);
    }
    i++;
    if (i >= campaigns.length) {
      i = 0;
    }
    
    i = saveI;
  }, rotatePause);

}); // end jQuery scope