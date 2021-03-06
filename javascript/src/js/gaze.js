var gaze_x, gaze_y, webgazer, task, tasktrial;
var MediaDevice = '-1'; //name of webcam //if behavioral, set equal to -1
var webgazer_stream;
/*create task events*/
var experiment = [];
var debug = false;
var webgazer_idle = true; //check if webgazer is in idle mode

/*task*/
var first_task = true; //first practice trial
var	task_trial_value = 0; //setting practice trial counter to zero
var	task_iter = 0; //setting practice iteration counter to zero
var trialNumTask = 0; //first task trial
var task_array; //list of trials

/*practice*/
var	first_practice = true; //first practice trial
var	iteration_finished = false; //have all trials finished before next loop
var	prac_trial_value = 0; //setting practice trial counter to zero
var	prac_iter = 0; //setting practice iteration counter to zero

/*camera_check syntax*/
var camera_check = {
	type: 'camera-coordinates'
};

/*camera_instructions syntax*/
var camera_instructions = {
	type: "instructions",
	pages: [
		"<div id=instructions>" +
		"<p>Please position yourself approximately 18 inches from the screen. Your eyes should be roughly center to the screen as well.</p>" +
		"</div>",

		"<div id=instructions>" +
		"<p>After the instructions, you will see an object on the screen which will be following your movements." +
		"<p>This object will react to your distance from the screen. " +
		"<p>If you are too far back, the object will appear transparent.</p>" +
		"<img id='img_ok' src='dist/img/calibrate/g.png' width='" + 200*scaleImage + "px';'>"+
		"<img id='img_t' src='dist/img/calibrate/g_t.png' width='" + 200*scaleImage + "px';'>" +
		"</div>",

		"<div id=instructions>" +
		"<p>This object will also react to your position from the screen. " +
		"<p>If you are too far away from the center of the screen, the object will appear red.</p>" +
		"<p>The object will also match your position.</p>" +
		"<img id='img_rl' src='dist/img/calibrate/r_l.png' width='" + 200*scaleImage + "px';'>" +
		"<img id='img_ru' src='dist/img/calibrate/r_u.png' width='" + 200*scaleImage + "px';'>" +
		"<img id='img_rr' src='dist/img/calibrate/r_r.png' width='" + 200*scaleImage + "px';'>" +
		"</div>",
		
		"<div id=instructions>" +
		"<p>If the object does not appear to be reacting to your movements, press the <code>SPACE</code> button.</p>" +
		"<p>This will allow the camera to reset.</p>" +
		"</div>",

		"<div>" +
		"<p>Once the webcam is ready, the task will continue automatically.</p>" +
		"<p>If you need to review these instructions, press the PREVIOUS button. " +
		"<p>No recording will occur at any point in this experiment." +
		"<br>" +
		"<p>Press NEXT when you're ready to begin.</p>" +
		"</div>"
	],
	show_clickable_nav: true,
	allow_backward: true,
};

/*camera_finished syntax*/
var camera_finished = {
	type: "instructions",
	pages: [
		"<div id=instructions>" +
		"<p>Your camera is prepared.</p>" +
		"<p>Next, we will have to train your web camera to be used in the experiment.<br>" +
		"<p>Following these instructions, a progress bar will appear. Please click on it repeatedly using your mouse until the progress bar fills. Also during this time be sure to keep your eyes on the progress bar." +
		"<p>This bar will appear a few times until training is complete." +
		"<br>" +
		"<p>Press NEXT when you're ready to begin.</p>" +
		"</div>"
  ],
	show_clickable_nav: true,
	allow_backward: false
};

/*practice_instructions syntax*/
var practice_instructions = {
	type: "instructions",
	pages: [
		"<div id=instructions>" +
		"<p>Welcome to the training session." +
		"<br>" +
		"<p>At the beginning of each trial you will see a cross (+) in the middle of the screen. Please look at the cross when it is on the screen.</p>" +
		"</div>",

		"<div id=instructions>" +
		"<p>The cross will then disappear and two pictures will then appear on the screen. After these pictures disappear, one dot (*) or two dots (**) will appear on either side of the screen.</p>" +
		"</div>",

		"<div id=instructions>" +
		"<p>Press the <code>8</code> key if one dot appears and press the <code>9</code> key if two dots appear. After your response, the next trial will begin. Please look at the cross at the beginning of each trial." +
		"<br>" +
		"<p>Press Next to begin the practice session.</p>" +
		"</div>",
	],
	show_clickable_nav: true,
	allow_backward: true
};

/*task instructions syntax*/
var instructions = {
	type: "instructions",
	pages: [
		"<p>That was the end of the practice trials.</p>" +
		"<p>You are about to continue with the actual experiment.</p>" +
		"<p>Remember to keep your eyes fixated on the cross.</p>" +
		"<p>Also remember: <code>8</code>=(*), <code>9</code>=(**). " +
		"<br>" +
		"<p>Press Next button when you're ready to begin.</p>"
  ],
	show_clickable_nav: true,
	allow_backward: false
};

/*practice crtieria*/
var practice = {
	timeline: [{
		type: 'dotprobe-practice',
		block_order: "Prac",
		coordinates: [500, 500],
		timing_response: 7500,
		choices: ['8', '9', '33', '38', '104', '105'],
		response_ends_trial: true,
	}],
	loop_function: function () {
		//if practice block has finished and accuracy is > 80%
		if (iteration_finished == true && prac_avg > 80) {
			return false; //break loop
			//if practice block has finished but accuracy is < 79.9%
		} else if ((iteration_finished == true) && (prac_avg < 79.9)) {
			return true; //continue practice
			//if practice block is not finished
		} else {
			return true; //continue practice
		}
	}
}

// add generated experiment settings to saved data
jsPsych.data.addProperties({
	participant_id: participant_id
});

//prevent following labels to be included in outputted data
jsPsych.data.ignore(['trial_index', 'time_elapsed', 'participant_id']);

/*checking browser*/
setTimeout(checkBrowser(), 99999999);

/*call getdatabase and check if its ready before begining task*/
console.log('%c1.starting experiment','color: green');
/**
 * Top level control module
 * @alias module:webgazer
 * @exports webgazer
 * @param {string} title - The title of the book.
 * @param {string} author - The author of the book.
 */
$.when(getDatabase()).done(function () {
	console.log('%c6.getDatabase() resolved','color: green');
	//set number of blocks (lab:8 [excl: session 0],home:2)
	if ((pid.location == 'home')||(pid.session == 0)){
		settings.blocks=2;
		pid.subsession='abc';
	} else {
		settings.blocks=8;
		pid.subsession='a';
	};
	// the code here will be executed when ajax request resolves
	if (start_task == true) {
		if (condition == "wait"){
			postDatabase();
		} else {
			task_array = all_task_trials();
			console.log('%c7.starting eyetracker()','color: green');
			eyetracker()
		};
	};
}).catch(function() {
	console.log('catch');
});

/*prepare eyetracker*/
var WebcamMessage; //message to store webcam results //NotAllowedError (blocked by browser), PreviousFail (browser not working last session, Success (allowed to stream)

/**
 * prepare eyetracker
 * @param {gazeListener} listener - callback to handle a gaze prediction event
 * @param {function} startWebgazer - initialize webgazer
 */
function eyetracker() {
	function startWebgazer() {
		console.log('%c8.starting webgazer','color: green');
		//start eyetracking
		webgazer.setRegression('ridge')
			.setTracker('clmtrackr')
			.setGazeListener(function (data, clock) {
				if (data) {
					//console.log(data)
					gaze_x = data.x;
					gaze_y = data.y;
					data.time = clock;
					delete data.all;
				};
			});
		webgazer.begin();
		webgazer.showPredictionPoints(false);
		setTimeout(checkWebgazer, 100);
	};
	startWebgazer();
	
	/**
	 * prepare eyetracker
	 * @callback gazeListener
	 * @param {element} video - video element
	 * @return {webgazer} this
	*/
	function setup(){
		console.log('%c9-1.webgazerVideoFeed created','color: green');
		//video feed parameters
		var video = document.getElementById('webgazerVideoFeed');
		video.style.display = 'block';
		video.style.margin = '0px';
		video.style.position = 'absolute';
		video.style.top = '0%';
		video.style.left = '0%';
		video.style.visibility = 'hidden';
		//reinitialize width and height
		webgazer.params.imgWidth = $("#webgazerVideoFeed").width();
    	webgazer.params.imgHeight = $("#webgazerVideoFeed").height();
		//webgazer pause and start task
		webgazer.pause();
		start();
	};

	//webgazer timeout
	function checkWebgazer() {
		if (webgazer.isReady()) {
			console.log('%c9.webgazer ready','color: green');
			setup();
		} else {
			if (subject.webcam_used!= false){
				setTimeout(checkWebgazer, 100)
			} else {
				console.log('%c9.webgazer unavailable','color: red')
				console.log('subject.webcam_used: '+subject.webcam_used)
				start()
			}
		}
	};
};

/*prepare task*/
function start(){
	console.log('%c10.start()','color: green')
	/*calibrate*/
	calibration_coordinates = _.shuffle(calibration_coordinates);
	function calibrate_f () { //function to create the block
		var calibrate_var_array = [];
		var calibrate_array = [];
		for (var i = 0; i <= (calibration_coordinates.length - 1); ++i) {
			calibrate_var_array[i] = jQuery.extend(true, {}, settings);
			calibrate_var_array[i].trialNum = i;
			/*stimuli*/
			var calibrate_event = {
				type: 'camera-calibration',
				trialNum: i,
				coordinates: calibration_coordinates,
				//number of clicks required to run next iteration
				clickNum: 20,
				image_size: [200, 200],
				timing_response: -1
			};
			calibrate_array.push(calibrate_event);
		}
		return calibrate_array;
	};
	calibrate = calibrate_f();
	
	/*task*/
	function createTrials() {
		//loop var turns off progress div - this prevents interferance to other divs
		loop = 1;
		var block_var_array = [];
		var block_array = [];
		var trialNum_all = 0;
		var iapsDotLoc;
		var pofaDotLoc;
		//total trials
		var block_order = ["p0", "p1","p2","p3","p4","p5","p6","p7","p8","p9","p10","p11","i0", "i1","i2","i3","i4","i5","i6","i7","i8","i9"];
		//if condition is active
		if (condition == 'active'){
			//80% likelihood neutral
			iapsDotLoc = Array(10).fill('Neutral').concat(Array(2).fill('Sad'));
			pofaDotLoc = Array(8).fill('Neutral').concat(Array(2).fill('Sad'));
		} else {
			//50% likelihood neutral
			iapsDotLoc = Array(6).fill('Neutral').concat(Array(6).fill('Sad'));
			pofaDotLoc = Array(5).fill('Neutral').concat(Array(5).fill('Sad'));
		}
		/*block level*/
		for (var j = 0; j <= (settings.blocks); ++j) {
			//shuffle order of trials (pofa or iaps)
			blockID = _.shuffle(_.clone(block_order))
			//shuffle order of DotLoc
			iapsDotLocID = _.shuffle(_.clone(iapsDotLoc))
			pofaDotLocID = _.shuffle(_.clone(pofaDotLoc))
			/*trial level*/
			for (var i = 0; i <= settings.trials; ++i) {
				//pop array for each additional trial
				///if iaps event
				if (blockID[i].charAt(0) == 'i'){
					DotLocID = iapsDotLocID.splice(0, 1)[0];
				} else {
				///else pofa event
					DotLocID = pofaDotLocID.splice(0, 1)[0];
				};
				/*stimuli level*/
				var trial_event = {
					type: 'dotprobe-task',
					trialNum: i,
					blockNum: j,
					block_order: 'Task',
					coordinates: [500, 500],
					timing_response: 7500,
					choices: ['56', '57', '104', '105'],
					trialID: blockID[i],
					DotLoc: DotLocID,
					response_ends_trial: true
				};
				block_array.push(trial_event);
			};
		};
		return block_array
	};
	
	//creating task array
	task = createTrials();
	
	function EventList() {
		if (debug) {
			//if eyetracking is successful
			if (subject.webcam_used == true) {
				subject.webcam_size = [webgazerVideoFeed.videoWidth+"x"+webgazerVideoFeed.videoHeight];
				createEvent(); //prepare worker
				experiment = experiment.concat(camera_instructions, camera_check, camera_finished, calibrate, practice_instructions, practice, instructions, task);
					//else run behavioral version
			} else if (subject.webcam_used == false) {
				experiment = experiment.concat(practice_instructions, practice, instructions, task);
			};
		} else {
			//if eyetracking is successful
			if (subject.webcam_used == true) {
				subject.webcam_size = [webgazerVideoFeed.videoWidth+"x"+webgazerVideoFeed.videoHeight];
				createEvent(); //prepare worker
				experiment = experiment.concat(camera_instructions, camera_check, camera_finished, calibrate, practice_instructions, practice, instructions, task);
				//else run behavioral version
			} else if (subject.webcam_used == false){
				experiment = experiment.concat(practice_instructions, practice, instructions, task);
			};
		}
	};

	/*preload screen optimized with preloading images*/
	function updateLoadedCount(nLoaded) {
		var percentcomplete = nLoaded / image_array.length;
		loading.animate(percentcomplete);
	}

	//preload images
	function preload(){
		jsPsych.pluginAPI.preloadImages(
			image_array,
			function () {
				console.log('%c11.preload finished. starting task','color: green')
				startExperiment()
			},
			function (nLoaded) {
				updateLoadedCount(nLoaded)
			}
		);
	}
	preload();
	
	/*start experiment*/
	function startExperiment() {
		EventList(),
			loading.destroy(),
			d3.selectAll("#progress").remove(),
			//get gpu
			getGPU()
			jsPsych.init({
				display_element: $('#jspsych-target'),
				timeline: experiment,
				fullscreen: true,
				on_finish: function () {
					pid.subsession = "abc";
					if (subject.webcam_used == true) {
						//terminate worker
						my_worker.terminate();
						$(document).ready(function () {
							saveData(participant_id + "_" + pid.session + pid.subsession + ".csv", jsPsych.data.forServer());
						})
					} else {
						$(document).ready(function () {
							saveData(participant_id + "_" + pid.session + pid.subsession + ".csv", jsPsych.data.dataAsCSV());
						})
					}
				}
			});
	};
};