$(document).ready(function() {
	var socket = io.connect(window.location.hostname);
<<<<<<< HEAD
	socket.on("ping", function (body) {
		//console.log(body);
	});
=======
	socket.on("ping", function (date, name) {
		var endDate = Date.parse(date);
		var diff = Date.today().getDaysBetween(endDate);
		console.log(diff + " Days Left of " + name);
	})
>>>>>>> 8647e251ab42756a444e462c10a771f1baca8e79
});