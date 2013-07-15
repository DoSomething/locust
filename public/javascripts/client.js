$(document).ready(function() {
	var socket = io.connect(window.location.hostname);
	socket.on("ping", function (body) {
		//console.log(body);
	});
	socket.on("ping", function (date, name) {
		var endDate = Date.parse(date);
		var diff = Date.today().getDaysBetween(endDate);
		console.log(diff + " Days Left of " + name);
	})
});