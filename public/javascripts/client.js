$(document).ready(function() {
	var socket = io.connect(window.location.hostname);
	socket.on("ping", function (body) {
		console.log(body);
	})
});