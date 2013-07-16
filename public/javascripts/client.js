var campaigns = [];
$(document).ready(function() {
	var socket = io.connect(window.location.hostname);

	socket.on("setCampaign", function (info) {
    var data = JSON.parse(info);
    var logo = data.rows[0].logo;
    var name = data.rows[0].title;
		var end = Date.parse(data.rows[0].endDate);
		var remaining = Date.today().getDaysBetween(end);

    $('#featured').find('.title').text(name);
    $('#featured').find('.days-remaining').text(remaining + " Days Remaining");
    $('#featured').find('#featured-logo').find('img').attr("src", logo);

		console.log(remaining + " Days Left of " + name);
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
    messages: ['FIRST MESSAGE', 'SECOND MESSAGE', 'THIRD MESSAGE']
  });

});

var i = 0;

setInterval(function() {
  for (var x = 0; x <= 3; x++) {
    $('.' + "sp".concat(x)).find('.with-margin').html("<h3>" + campaigns[i].name + "</h3>" + campaigns[i].daysLeft + " Days Remaining");
    i++;
    if (i >= campaigns.length) {
      i = 0;
    }
  }

  $('#up-next').find('#name').text(campaigns[i].name);
  $('#up-next').find('p').text(campaigns[i].daysLeft + " Days Remaining");
  $('#up-next').find('img').attr("src", campaigns[i].pic);

  i++;
  if (i >= campaigns.length) {
    i = 0;
  }

  $('#featured').find('.title').text(campaigns[i].name);
  $('#featured').find('.days-remaining').text(campaigns[i].daysLeft + " Days Remaining");
  $('#featured').find('#featured-logo').find('img').attr("src", campaigns[i].pic);

  i++;
  if (i >= campaigns.length) {
    i = 0;
  }
}, 5000);


