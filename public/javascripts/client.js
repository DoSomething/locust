var campaigns = [];
$(document).ready(function() {

  //loading screen
  var loadH = $(window).height();
  console.log(loadH);
  $("body").append("<div id='locust-load' style='width: 100%; height: " + loadH + "px; text-align: center; position: absolute; z-index: 99; top: 0px; left: 0px; background-color: rgba(0,0,0,1); padding-top: 100px'><img src='/public/locust.gif'/></div>");

	var socket = io.connect(window.location.hostname);

	socket.on("setCampaign", function (info) {
    var data = JSON.parse(info);
    var logo = data.rows[0].logo;
    var name = data.rows[0].title;
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
                    'daysLeft': remaining });
	});
  

  $('#flightboard').flightboard({
    maxLength: 14,
    messages: ['FIRST MESSAGE', 'SECOND MESSAGE', 'THIRD MESSAGE']
  });
  
  $('#small-flightboard').flightboard({
    maxLength: 14,
    lettersImage: "/public/img/flightBoardSmall.png",
    lettersSize: [14,18],
    messages: ['SMALL MESSAGE', 'SECOND MESSAGE', 'THIRD MESSAGE']
  });

});

var i = 0;

setInterval(function() {
  $("#locust-load").remove();
  for (var x = 0; x <= 3; x++) {
    $('.' + "sp".concat(x)).find('.with-margin').html("<h3>" + campaigns[i].name + "</h3>" + campaigns[i].daysLeft);
    i++;
    if (i >= campaigns.length) {
      i = 0;
    }
  }

  $('#up-next').find('#name').text(campaigns[i].name);
  $('#up-next').find('p').text(campaigns[i].daysLeft);
  $('#up-next').find('img').attr("src", campaigns[i].pic);

  i++;
  if (i >= campaigns.length) {
    i = 0;
  }

  $('#featured').find('.title').text(campaigns[i].name);
  $('#featured').find('.days-remaining').text(campaigns[i].daysLeft);
  $('#featured').find('#featured-logo').find('img').attr("src", campaigns[i].pic);

  i++;
  if (i >= campaigns.length) {
    i = 0;
  }
}, 5000);


