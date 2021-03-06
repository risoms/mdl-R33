/**
 * Align subject to experiment screen.
 * @module camera-coordinates
 */
var parallax, headtracker; //parallax, headtrackr functions
var headtrackr_iteration = 0; //iteration counter//if headtrackr fails 10 times, continue with behavioral version of task
var isDistance = false; //z access not yet met
var isCoordinates = false; //xy access not yet met
var FirstEvent = true; //get luminance once before running coordinate check
var isFirstSample = true; //first sample of  coordinate check
var isWindow = false; //window not started
var isWindowSuccess = false; //is window ultimately successful
var countdown_end; //timer for countdown
var window_duration = 10000; //set window duration for 10 seconds
var countdown_duration = 60000; //set countdown duration for 1 minute
var reset_headtrackr = false; //set whether headtrakr should recalculate
var clientX, clientY, clientZ, window_remaining, window_now, window_end;
var x_score, y_score, z_score;
var face,head;
var event_type;
var event;
var throttled_head, throttled_face;
jsPsych.plugins["camera-coordinates"] = (function () {
	var plugin = {};
	jsPsych.pluginAPI.registerPreload('camera', 'stimulus', 'image', function (t) {
		return !t.is_html || t.is_html == 'undefined'
	});
	plugin.info = {
		name: 'camera-coordinates',
		description: '',
		parameters: {
			trialNum: {
				type: [jsPsych.plugins.parameterType.STRING],
				default: undefined,
				no_function: false,
				description: ''
			}
		}
	}

	plugin.trial = function (display_element, trial) {
		trial = jsPsych.pluginAPI.evaluateFunctionParameters(trial);
		
		//pause webgazer
		var pause_webgazer = webgazer.pause();
		
		//image directory
		var image_directory = "src/img/parallax/"
		var win_width = window.innerWidth;
		var win_height = window.innerHeight;
		var event_face = {};
		var image_coordinates, image_visisble;
		var canvas_area = webgazerVideoFeed.width * webgazerVideoFeed.height;
		
		//create div
		var ul = d3.select("#jspsych-content").append("div")
			.attr('id', 'parallax')
			.attr('class', 'parallax');

		var ul = d3.select("#parallax").append("ul")
			.attr('id', 'scene')
			.attr('class', 'scene');
		var depth_lst = [2.0, 1.6, 1.2, 0.8, 0.4, 0.2];
		for (var i = 0; i < 6; i++) {
			ul.append('li')
				.attr('id', 'lst' + i)
				.attr('class', 'layer')
				.attr('data-depth', depth_lst[i])
				.attr('style', 'display: "block"; padding: "0"; margin: "0"')
				.append('img').attr('id', "img" + i).attr('src', "src/img/parallax/green" + i + ".png");
		};

		//preparing variables
		//parallax input
		var scene = document.getElementById('scene');

		//generate parallax function
		parallax = new Parallax(scene, {})

		//generate headtrackr function
		//var videoInput = $('#inputVideo')[0];
		//var canvasInput = $('#inputCanvas')[0];
		headtracker = new headtrackr.Tracker({
			ui: true,//whether to create messageoverlay with messages like "found face"
			headPosition: true//whether to calculate headposition
		});
		headtracker.init(webgazerVideoFeed, webgazerVideoCanvas);
		headtracker.start();

		
		//testing start...............................................................................................
		//............................................................................................................
		//............................................................................................................
		//............................................................................................................
		// function to handle responses by the subject
		var after_response = function (info) {
			reset_headtrackr = true;
			isWindow = true; //rest window
			isFirstSample = true //resets sample count
			isCoordinates = false //reset xy coordinates success
			$('#headtrackerMessage').text('Resetting camera. Please wait while camera is detecting your face...') //updates message
			console.log('space button pressed');
		};
		
		// start the response listener
		keyboardListener = jsPsych.pluginAPI.getKeyboardResponse({
			callback_function: after_response,
			valid_responses: [32],
			persist: true,
			allow_held_key: false
		});
		
		//----prepare countdown---//
		countdown_end = (new Date(Date.now()+countdown_duration));
		
		//----draw messages to table--------------------------------------------------------------//
		//create table //if debug and local ip
		if (debug && isAdmin){
			$("#jspsych-content").append(
								"<table style='left: "+700*.95*scaleImage+"px; top: "+500*.75*scaleImage+"px; position: absolute'>"+
									"<tr>"+
										"<td>axis</td>"+
										"<td>score</td>"+
										"<td></td>"+
									"</tr>"+
									"<tr id='x-result'>"+
										"<td id='x-label'>x:</td>"+
										"<td id='x-score'>555</td>"+
									"</tr>"+
									"<tr id='y-result'>"+
										"<td id='y-label'>y:</td>"+
										"<td id='y-score'>555</td>"+
									"</tr>"+
									"<tr id='z-result'>"+
										"<td id='z-label'>z:</td>"+
										"<td id='z-score'>555</td>"+
									"</tr>"+
									"<tr id='lum'>"+
										"<td id='lum-label'>lum:</td>"+
										"<td id='lum-score'>555</td>"+
									"</tr>"+
									"<tr id='window-start'>"+
										"<td id='window-start-label'>window:</td>"+
										"<td id='window-start-score'>555</td>"+
									"</tr>"+
									"<tr id='window-remaining'>"+
										"<td id='window-remaining-label'>window timer:</td>"+
										"<td id='window-remaining-score'>555</td>"+
									"</tr>"+
									"<tr id='countdown-remaining'>"+
										"<td id='countdown-remaining-label'>behavioral:</td>"+
										"<td id='countdown-remaining-score'>555</td>"+
									"</tr>"+
									"<tr id='attempt-number'>"+
										"<td id='attempt-number-label'>attempt:</td>"+
										"<td id='attempt-number-score'>555</td>"+
									"</tr>"+	
							"</div>");
		};
		
		//update table
		function updateTable(){
			//color (green-success, red-failure)
			$('#x-result').css("background-color",x_color);
			$('#y-result').css("background-color",y_color);
			$('#z-result').css("background-color",z_color);
			
			//score (green-success, red-failure)
			$('#x-score').text(x_score);
			$('#y-score').text(y_score);
			$('#z-score').text(_.round(z_score, 3));
			$('#lum-score').text(_.round((subject.lum*255), 3));
			$('#window-start-score').text(isWindow);
			$('#window-remaining-score').text(window_remaining);
			$('#countdown-remaining-score').text(countdown_end - (new Date(Date.now())));
			$('#attempt-number-score').text(headtrackr_iteration);
		};
		
		//set table color
		function setTableColor(){
			//set x-color - green: success, red: failure
			if((clientX >= (.25 * win_width)) && (clientX <= (.75 * win_width))){
				x_color = 'green'
				x_score = Math.round(clientX);
			} else {
				x_color = 'red'
				x_score = Math.round(clientX);
			};
			//set y-color - green: success, red: failure
			if((clientY >= (.34 * win_height)) && (clientY <= (.67 * win_height))){
				y_color = 'green'
				y_score = Math.round(clientY);
			} else {
				y_color = 'red'
				y_score = Math.round(clientY);
			};
			//set z-color - green: success, red: failure
			if((clientZ > 30) && (clientZ < 90)){
				z_color = 'green'
				z_score = Math.round(clientZ);
			} else {
				z_color = 'red'
				z_score = Math.round(clientZ);
			};
		};
		
		//............................................................................................................
		// Throttle the calling of the handler for head movement events to once every 20ms
		throttled_face = _.throttle(function(){handleFaceMovement(face)}, 20);
		throttled_head = _.throttle(function(){handleHeadMovement(head)}, 20);
		
		//----event listener----//
		//facetrackingEvent - position of the face on the canvas. //headtrackingEvent - position of the head relative to the camera
		//http://auduno.github.io/headtrackr/documentation/reference.html
		$(document).on('facetrackingEvent', function (event) {
			face = event.originalEvent;
			throttled_face();
		});
		
		$(document).on('headtrackingEvent', function (event) {
			head = event.originalEvent;
			throttled_head();
		});
		
		//timer using Worker
		var newWorker = function (funcObj) {
			// Build a worker from an anonymous function body
			var blobURL = URL.createObjectURL(new Blob(['(', funcObj.toString(),')()'], {
					type: 'application/javascript'
				})),
				worker = new Worker(blobURL);
			// Won't be needing this anymore
			URL.revokeObjectURL(blobURL);
			return worker;
		}
		//creating worker
		var cameraWorker = newWorker(function () {
			var i = 0;
			function timedCount() {
				i = i + 1;
				postMessage(i);
				setTimeout(timedCount, 1000);
			}
			timedCount();
		});
		cameraWorker.onmessage = function (event) {
			if (debug){
				console.log(event.data);
				console.log(countdown_end - (new Date(Date.now())));
			};
			if ((countdown_end - (new Date(Date.now()))) <= 0) {end_trial()};
		};
		
		//---define x,y coordinates----//
		function handleFaceMovement(face) {
			height_ = face.height, //height of face on canvas (pixels)
			width_ = face.width, //width of face on canvas (pixels)
			angle_ = face.angle.toFixed(2) + "deg", //angle of face on canvas (deg)
			x_ = face.x, //x-position of center of face on canvas (pixels)
			y_ = face.y, //y-position of center of face on canvas (pixels)
			confidence_ = face.confidence, //confidence in the detection
			time_ = face.time + "ms", //How much time it took to calculate this position
			area_ = (height_ * width_) / canvas_area //area covered by face
			event_face = {
				height: height_,
				width: width_,
				angle: angle_,
				x: x_,
				y: y_,
				confidence: confidence_,
				time: time_,
				area: area_,
			};
			handleParallax(event_face)
		};
		
		//----define z coordiantes-----//
		function handleHeadMovement(head) {
			clientZ = head.z
			handleParallax(event_face)
		};

		//-----update parallax-----//
		function handleParallax() {
			//using parallax event listener	
			// Cache eyetracking coordinates.
			clientX = (event_face.x / webgazerVideoCanvas.width) * win_width;
			clientY = (event_face.y / webgazerVideoCanvas.height) * win_height;

			// Calculate input relative to the element.
			parallax.ix = (clientX - parallax.ex - parallax.ecx) / parallax.erx;
			parallax.iy = (clientY - parallax.ey - parallax.ecy) / parallax.ery;
			
			//set timer to attempt calibration -  if timer reached, force behavioral;
			if ((countdown_end - (new Date(Date.now()))) > 0) {
				//check coordinates and update canvas
				change_image();
			} else {
				end_trial();
			};
			
			//update score table
			if (debug){
				updateTable();
			};
		};
		
		///////////////////////////////////////////////////////////////////////////////////////////////////////
		//-----calculating and updating display-----//
		function change_image() {
			var win_width = window.innerWidth;
			var win_height = window.innerHeight;
			///////////////////////////////////////////////////////////////////////////////////luminance
			if (FirstEvent) {
				snapshot()
				//getMediaDevices();
				FirstEvent = false;
				if (debug){
					console.log('%cluminence: %s','color: green',((subject.lum*255), 5));
				};
			};
			///////////////////////////////////////////////////////////////////////////////////opacity (z axis)
			/////success - if client head is between 20 to 90cm
			if ((clientZ > 10) && (clientZ < 90)) {
				//updating table color
				if (debug){
					console.log('%copacity (z-axis) success!','color: green');
					setTableColor();
				};
				//updating images
				for (var i = 0; i < 6; i++) {
					var testing_image = d3.select("#img" + i)
						.style("opacity", 1);
				}
				if (isFirstSample) {
					window_end = (new Date(Date.now()+window_duration)); //resets the end point
					isFirstSample = false; //no longer first sample
					isDistance = true; //z axis success
				};
				if (isDistance!=true) { //resetting isDistance tracker
					isDistance = true; //z axis success
				};
			/////failure
			} else {
				///updating table color
				if (debug){
					console.log('%copacity (z-axis) failed!','color: red');
					setTableColor();
				};
				//avoid rerunning if image is already opaque
				for (var i = 0; i < 6; i++) {
					var testing_image = d3.select("#img" + i)
						.style("opacity", .1);
				}
				isWindow = false; //window not begun
				window_end = (new Date(Date.now()+window_duration)); //resets the end point
				window_now = (new Date()).getTime(); //get current time
				isFirstSample = true //resets sample count
				isDistance = false //x,y axis failed
			};
			///////////////////////////////////////////////////////////////////////////////////color (x,y axis)
			//success
			if ((clientX >= (.25 * win_width) && clientX <= (.75 * win_width)) &&
				(clientY >= (.34 * win_height) && clientY <= (.67 * win_height))) {
				//updating table color
				if (debug){
					//console.log('%ccolor (xy-axis) success!','color: green');
					setTableColor();
				};
				//updating images
				for (var i = 0; i < 6; i++) {
					var testing_image = d3.select("#img" + i)
						.attr("src", (image_directory + "green" + i + ".png"));
				}
				if (isFirstSample) {
					window_end = (new Date(Date.now()+window_duration)); //resets the end point
					isFirstSample = false; //no longer first sample
					isCoordinates = true; //x,y axis success
				};
				if (isCoordinates!=true) { //resetting isCoordinates tracker
					isCoordinates = true; //x,y axis success
				};
			//failure
			} else {
				///updating table color
				if (debug){
					//console.log('%ccolor (xy-axis) failed!','color: red');
					setTableColor();
				};
				//updating images
				for (var i = 0; i < 6; i++) {
					var testing_image = d3.select("#img" + i)
						.attr("src", (image_directory + "red" + i + ".png"));
				}
				isWindow = false; //window not begun
				window_end = (new Date(Date.now()+window_duration)); //resets the end point
				window_now = (new Date()).getTime(); //get current time
				isFirstSample = true //resets sample count
				isCoordinates = false //x,y axis failed
			};

			//end trial if both xyz are met
			if (isCoordinates & isDistance) {
				isWindow = true; //window begun
				//get potential endpoint
				window_now = (new Date()).getTime(); //get current time
				//console.log('%cxy-axis success!','color: green');
				//time left
				window_remaining = window_end - window_now;
				//if timer met
				if (window_remaining <= 0) {
					isWindowSuccess = true;
					end_trial();
				};
			}
		};

		//end trial function
		var end_trial = function () {
			//kill worker
			cameraWorker.terminate();
			// kill keyboard listeners
			if (typeof keyboardListener !== 'undefined') {
				jsPsych.pluginAPI.cancelKeyboardResponse(keyboardListener);
			}
			//kill webcam
			headtracker.stop();
			//kill message_bar
			d3.selectAll("#headtrackerMessageDiv").remove()
			//kill parallax
			parallax.disable();
			// clear the display
			display_element.html('');
			//kill headtrackr events
			$(document).off('headtrackingEvent');
			$(document).off('facetrackingEvent');
			jsPsych.finishTrial();
		}
	};
	return plugin;
})();