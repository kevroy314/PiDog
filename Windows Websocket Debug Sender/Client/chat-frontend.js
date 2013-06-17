var connection;
$(function () {
    "use strict";

    // for better performance - to avoid searching in DOM
    var content = $('#content');
    var input = $('#input');
    var status = $('#status');

    // my color assigned by the server
    var myColor = false;
    // my name sent to the server
    var myName = false;

    // if user is running mozilla then use it's built-in WebSocket
    window.WebSocket = window.WebSocket || window.MozWebSocket;

    // if browser doesn't support WebSocket, just show some notification and exit
    if (!window.WebSocket) {
        content.html($('<p>', { text: 'Sorry, but your browser doesn\'t '
                                    + 'support WebSockets.'} ));
        input.hide();
        $('span').hide();
        return;
    }

    // open connection
    connection = new WebSocket('ws://127.0.0.1:1337');

    connection.onopen = function () {
        // first we want users to enter their names
        input.removeAttr('disabled');
        status.text('Enter Message:');
    };

    connection.onerror = function (error) {
        // just in there were some problems with conenction...
        content.html($('<p>', { text: 'Sorry, but there\'s some problem with your '
                                    + 'connection or the server is down.' } ));
    };

    // most important part - incoming messages
    connection.onmessage = function (message) {
        // try to parse JSON message. Because we know that the server always returns
        // JSON this should work without any problem but we should make sure that
        // the massage is not chunked or otherwise damaged.
        try {
            var json = JSON.parse(message.data);
        } catch (e) {
            console.log('This doesn\'t look like a valid JSON: ', message.data);
            return;
        }

        if (json.type === 'message') { // it's a single message
            input.removeAttr('disabled'); // let the user write another message
            content[0].innerHTML+=json.data.hr+", "+json.data.rr+", "+json.data.gpsx+", "+json.data.gpsy+"<br\>";
        } else {
            console.log('Hmm..., I\'ve never seen JSON like this: ', json);
        }
    };

    /**
     * Send mesage when user presses Enter key
     */
    input.keydown(function(e) {
        if (e.keyCode === 13) {
            var msg = $(this).val();
            if (!msg) {
                return;
            }
			var split_msg = msg.split(' ');
			var json_msg = {"hr": split_msg[0], 
							"rr": split_msg[1], 
							"gpsx": split_msg[2], 
							"gpsy": split_msg[3]};
            // send the message as an ordinary text
            connection.send(JSON.stringify(json_msg));
            $(this).val('');

            // we know that the first message sent from a user their name
            if (myName === false) {
                myName = msg;
            }
        }
    });

    /**
     * This method is optional. If the server wasn't able to respond to the
     * in 3 seconds then show some error message to notify the user that
     * something is wrong.
     */
    setInterval(function() {
        if (connection.readyState !== 1) {
            status.text('Error');
            input.attr('disabled', 'disabled').val('Unable to comminucate '
                                                 + 'with the WebSocket server.');
        }
    }, 3000);

});

//GPS Update Example Code
var flightPath, flightPlanCoordinates, map;
var x = -27.46758, y = 153.027892;
function initialize() {
  var mapOptions = {
	zoom: 3,
	center: new google.maps.LatLng(-27.46758, 153.027892),
	disableDefaultUI: true,
	mapTypeId: google.maps.MapTypeId.TERRAIN
  };

  map = new google.maps.Map(document.getElementById("map-canvas"),
	  mapOptions);
  flightPlanCoordinates = [
	new google.maps.LatLng(37.772323, -122.214897),
	new google.maps.LatLng(21.291982, -157.821856),
	new google.maps.LatLng(-18.142599, 178.431),
	new google.maps.LatLng(-27.46758, 153.027892)
  ];
  flightPath = new google.maps.Polyline({
	path: flightPlanCoordinates,
	strokeColor: "#FF0000",
	strokeOpacity: 1.0,
	strokeWeight: 2
  });
  flightPath.setMap(map);
  google.maps.event.addListener(map, 'click', click);
  setTimeout(makeMapTagsInvisible,1000);
}
function makeMapTagsInvisible(){
	var mapcanvas = document.getElementById("map-canvas");
	for(var i = 0; i < mapcanvas.childNodes[0].childNodes.length;i++)
		if(mapcanvas.childNodes[0].childNodes[i].className=="gmnoprint")
			mapcanvas.childNodes[0].childNodes[i].hidden=true;
}
function click(e){
	var marker = new google.maps.Marker({
		position: e.latLng,
		map: map
	});
	map.setCenter(e.latLng);
	var lat = e.latLng.jb;
	var lon = e.latLng.kb;
	content.innerHTML+='Map Point Click: ' + lat + " " + lon+"<br\>";
	if(document.getElementById("sendOnClick").checked == true)
	{
		var json_msg = {"hr": +document.getElementById("hrNum").value, 
						"rr": +document.getElementById("rrNum").value, 
						"gpsx": lat, 
						"gpsy": lon};
         // send the message as an ordinary text
         connection.send(JSON.stringify(json_msg));
	}
}
google.maps.event.addDomListener(window, 'load', initialize);