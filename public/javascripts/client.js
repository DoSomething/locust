var campaigns = [];
var i = 0;

$(document).ready(function() {

  //loading screen
  var loadH = $(window).height();
  $("body").append("<div id='locust-load' style='width: 100%; height: " + loadH + "px; text-align: center; position: absolute; z-index: 99; top: 0px; left: 0px; background-color: rgba(0,0,0,1); padding-top: 100px'><img src='/public/locust.gif'/></div>");

	var socket = io.connect(window.location.hostname);
  var spIndex = 3;

	socket.on("setCampaign", function (info) {
    var data = JSON.parse(info);
    var logo = data.rows[0].logo;
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
                    'daysLeft': remaining,
                    'teaser': teaser,
                    'usersYest': usersYest,
                    'usersNow': usersNow,
                    'messages': []
                  });

    for (var x = usersYest; x <= usersNow; x++) {
      campaigns[campaigns.length -  1].messages.push("" + x);
    }
    


    if(campaigns.length == 1){// fill in the featured panel
      $('#flightboard').flightboard({
        maxLength: 7,
        repeat: false,
        sequential: false,
        messages: campaigns[campaigns.length -  1].messages
      });

      console.log(campaigns[0].messages);
      flipPause = (dayLength  - (campaigns[campaigns.length -  1].messages.length * 500)) / campaigns[campaigns.length -  1].messages.length;
      console.log("flip pause " + flipPause);
      setInterval(flip, flipPause);

      $('#featured').find('.title').text(campaigns[0].name);
      $('#featured').find('.days-remaining').text(campaigns[0].daysLeft);
      $('#featured').find('#featured-logo').find('img').attr("src", campaigns[0].pic);
    }else if(campaigns.length == 2){// fill in the up next panel
      $('#up-next').find('#name').text(campaigns[1].name);
      $('#up-next').find('p').text(campaigns[1].daysLeft);
      $('#up-next').find('img').attr("src", campaigns[1].pic);
    }else{// fill in the small panels
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
  
  $('#up-next-flightboard').flightboard({
    maxLength: 14,
    lettersImage: "/public/img/flightBoardSmall.png",
    lettersSize: [14,18],
    messages: ['SMALL MESSAGE', 'SECOND MESSAGE', 'THIRD MESSAGE']
  });

});

var dayLength = 360000;
var flipPause;  
var flipInterval;

function flip() {
  console.log("flip please!");
  $('#flightboard').flightboard('flip');
  //campaigns[i].messages.splice(0, 1);
}

// var rotateFeatured = setInterval(function() {
//   //must save a copy of i for global use reset at end of this function
//   i++;
//   var saveI = i;
//   flipPause = (dayLength  - (campaigns[i].messages.length * 500)) / campaigns[i].messages.length;
//   $('#flightboard').flightboard('destroy');

//   $('#flightboard').flightboard({
//     maxLength: 7,
//     repeat: false,
//     sequential: true,
//     messages: campaigns[i].messages
//   });
//   clearInterval(flipInterval);
//   setInterval(flip, flipPause);

//   // fill in the featured panel
//   $('#featured').find('.title').text(campaigns[i].name);
//   $('#featured').find('.days-remaining').text(campaigns[i].daysLeft);
//   $('#featured').find('#featured-logo').find('img').attr("src", campaigns[i].pic);
//   i++;
//   if (i >= campaigns.length) {
//     i = 0;
//   }

//   // fill in the up next panel
//   $('#up-next').find('#name').text(campaigns[i].name);
//   $('#up-next').find('p').text(campaigns[i].daysLeft);
//   $('#up-next').find('img').attr("src", campaigns[i].pic);
//   i++;
//   if (i >= campaigns.length) {
//     i = 0;
//   }

//   // fill in the small panels
//   for (var x = 3; x >= 0; x--) {
//     $('.' + "sp".concat(x)).find('.with-margin').find("h3").text(campaigns[i].name);
//     $('.' + "sp".concat(x)).find('.with-margin').find(".small-days-remaining").text(campaigns[i].daysLeft);
//     if(campaigns[i].teaser.length > 145){
//       $('.' + "sp".concat(x)).find('.with-margin').find(".small-teaser").text(campaigns[i].teaser.substring(0, 142).concat("..."));  
//     }else{
//       $('.' + "sp".concat(x)).find('.with-margin').find(".small-teaser").text(campaigns[i].teaser);
//     }
//     i++;
//     if (i >= campaigns.length) {
//       i = 0;
//     }
//   }
//   i = saveI;
//   if (i >= campaigns.length) {
//     i = 0;
//   }
// }, 60000);