$(document).ready(function() {
	var socket = io.connect(window.location.hostname);
	socket.on("ping", function (date, name) {
		var endDate = Date.parse(date);
		var diff = Date.today().getDaysBetween(endDate);
		console.log(diff + " Days Left of " + name);
	})

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