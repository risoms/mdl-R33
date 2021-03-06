/**
 * Collect trial-level data.
 * @module dotprobe-task
 */
var end_trial_data; //custom event for WebWorker
//-------collect values for database
var ltask_acc = []; //accuracy array for each trial
var lrt = []; //resp for each trial
var lslow = []; //slow resp for each trial
var ltask_cong = []; //congruency for each trial
jsPsych.plugins["dotprobe-task"] = (function () {
	var plugin = {};
	jsPsych.pluginAPI.registerPreload('dotprobe-task', 'stimulus', 'image', function (t) {
		return !t.is_html || t.is_html == 'undefined'
	});
	plugin.info = {
		name: 'dotprobe-task',
		description: '',
		parameters: {
			stimulus: {
				type: [jsPsych.plugins.parameterType.STRING],
				default: undefined,
				no_function: false,
				description: ''
			},
			is_html: {
				type: [jsPsych.plugins.parameterType.BOOL],
				default: false,
				no_function: false,
				description: ''
			},
			choices: {
				type: [jsPsych.plugins.parameterType.KEYCODE],
				array: true,
				default: jsPsych.ALL_KEYS,
				no_function: false,
				description: ''
			},
			prompt: {
				type: [jsPsych.plugins.parameterType.STRING],
				default: '',
				no_function: false,
				description: ''
			},
			timing_stim: {
				type: [jsPsych.plugins.parameterType.INT],
				default: -1,
				no_function: false,
				description: ''
			},
			timing_response: {
				type: [jsPsych.plugins.parameterType.INT],
				default: -1,
				no_function: false,
				description: ''
			},
			response_ends_trial: {
				type: [jsPsych.plugins.parameterType.BOOL],
				default: true,
				no_function: false,
				description: ''
			},

		}
	}

	plugin.trial = function (display_element, trial) {
		// if any trial variables are functions
		// this evaluates the function and replaces
		// it with the output of the function
		trial = jsPsych.pluginAPI.evaluateFunctionParameters(trial);

		// set default values for the parameters
		trial.choices = trial.choices || jsPsych.ALL_KEYS;
		trial.response_ends_trial = (typeof trial.response_ends_trial == 'undefined') ? true : trial.response_ends_trial;
		trial.timing_stim = trial.timing_stim || -1;
		trial.timing_response = trial.timing_response || -1;
		trial.is_html = (typeof trial.is_html == 'undefined') ? false : trial.is_html;
		trial.prompt = trial.prompt || "";
		
		//getting trialNum
		var trialvalue = jsPsych.currentTrial().trialNum;
		
		//getting blockNum
		var blockvalue = jsPsych.currentTrial().blockNum
		if (debug){console.log("trial: " + trialvalue + " block: " + blockvalue)};
		
		//getting trialStim
		var currentTrial = task_array[blockvalue][trial.trialID];
		if (debug){console.log("current trial: ", currentTrial)};
		
		//timeout to allow svg to finish (msec)
		var delay = (function () {
			var timer = 0;
			return function (callback, ms) {
				clearTimeout(timer);
				timer = setTimeout(callback, ms);
			};
		})();

		// store response
		var response = {
			rt: -1,
			key: -1,
			resp: -1
		};

		//if first trial in experiment
		//draw canvas once
		if (first_task == true) {
			//if eyetracking
			if (subject.webcam_used == true) {
				webgazer.resume();
			};
			//close event
			first_task = false;
			//hide mouse
			$('body').css('cursor', 'none');
			//draw canvas
			var svg = d3.select("#jspsych-content").append("svg")
				.attr('id', 'jspsych-stim-canvas')
				.attr('display', 'block')
				.attr('vertical-align', 'middle')
				.attr('margin', 'auto')
				.attr("width", settings.canvas_width * scaleImage)
				.attr("height", settings.canvas_height * scaleImage);
			//draw fixation
			left_right = ['left', 'right']
			var img = svg.append("svg:image")
				.attr('id', 'jspsych-fixation-image')
				.attr("xlink:href", ("src/img/fixation.png"))
				.attr("x", fix_xy[0] * scaleImage)
				.attr("y", fix_xy[1] * scaleImage)
				.attr("width", fix_w * scaleImage)
				.attr("height", fix_h * scaleImage);

			//draw stim
			for (var i = 0; i < display_locs.length; i++) {
				var img2 = d3.select("#jspsych-stim-canvas").append("svg:image")
					.attr('id', 'jspsych-image-' + left_right[i])
					.attr("xlink:href", (settings.element_directory + settings.mask_image))
					.attr("x", (display_locs[i][0] * scaleImage))
					.attr("y", (display_locs[i][1] * scaleImage))
					.attr("width", (stimw * scaleImage))
					.attr("height", (stimh * scaleImage))
			}

			//checking display window size
			subject.display_window = [window.innerWidth + "x" + window.innerHeight];

		} else {
			//update canvas to replace cue
			$("#jspsych-stim-canvas").removeClass('responded')
				.attr("width", settings.canvas_width * scaleImage)
				.attr("height", settings.canvas_height * scaleImage);
			$("#jspsych-fixation-image")
				.attr("x", fix_xy[0] * scaleImage)
				.attr("y", fix_xy[1] * scaleImage)
				.attr("width", fix_w * scaleImage)
				.attr("height", fix_h * scaleImage);
			var img = d3.select("#jspsych-image-" + cue_index)
				.attr("xlink:href", (settings.element_directory + settings.mask_image))
		}
		
		//defining subsession
		if ((blockvalue == 3) && (trialvalue == 0)){
			pid.subsession = 'ab'
		} else if ((blockvalue == 6) && (trialvalue == 0)) {
			pid.subsession = 'abc'
		};
		
		//trial onset time
		start_time = performance.now();
		trial.start_t = start_time;
		
		///----------for eyetracking----------///
		//start webworker data collection
		end_trial_data = false;
		//define variable for sampling array
		sample_trial = trial.trial_all;
		//dispatch event to collect webworker time
		if (trialvalue ==0 && blockvalue==0 && subject.webcam_used == true){
			if (debug){console.log('%csampling for WebWorker starting.','color: blue')};
			document.dispatchEvent(sampling_listener);
		};
		
		//preparing list of left and right stim for call
		var emotion_shuffle = _.shuffle(["Neutral","Sad"]);
		if (debug){console.log('emotion_shuffle:',emotion_shuffle)};
		
		////////////////////////////1.show fixation
		show_fixation();
		function show_fixation() {
			task_event = 'Fixation'; ////for sample_array debugging (know what events occured when gaze sample was collected)
			//show fixation
			$("#jspsych-fixation-image")[0].href.baseVal = "src/img/fixation.png"
			// duration
			setTimeout(function () {
				//clear fixation
				$("#jspsych-fixation-image")[0].href.baseVal = ""
				show_image();
			}, settings.stimulus_onset);
		}

		////////////////////////////2.show Stim
		function show_image() {
			task_event = 'Stim'; ////for sample_array debugging (know what events occured when gaze sample was collected)
			//get trial info (pofa or iaps)
			//if iaps trial
			if (currentTrial.Type=='iaps'){
				settings.stimulus_offset = settings.iaps_offset
				trial_images = [currentTrial[emotion_shuffle[0]],currentTrial[emotion_shuffle[1]]]
				if (debug){console.log(trial_images)};
				//if left image is Neutral
				if (emotion_shuffle[0] == "Neutral"){
					currentTrial.LDescription = currentTrial["Neutral"+"Description"]
					currentTrial.LEmotion = "Neutral"
					currentTrial.LStim = currentTrial["Neutral"]
					currentTrial.RDescription = currentTrial["Sad"+"Description"]
					currentTrial.REmotion = "Sad"
					currentTrial.RStim = currentTrial["Sad"]
				} else {
					currentTrial.LDescription = currentTrial["Sad"+"Description"]
					currentTrial.LEmotion = "Sad"
					currentTrial.LStim = currentTrial["Sad"]
					currentTrial.RDescription = currentTrial["Neutral"+"Description"]
					currentTrial.REmotion = "Neutral"
					currentTrial.RStim = currentTrial["Neutral"]					
				}
			//if pofa trial
			} else {
				settings.stimulus_offset = settings.pofa_offset
				trial_images = [currentTrial[emotion_shuffle[0]],currentTrial[emotion_shuffle[1]]]
				//if left image is Neutral
				if (emotion_shuffle[0] == "Neutral"){
					currentTrial.LDescription = currentTrial["Neutral"+"ID"]
					currentTrial.LEmotion = "Neutral"
					currentTrial.LStim = currentTrial["Neutral"]
					currentTrial.RDescription = currentTrial["Sad"+"ID"]
					currentTrial.REmotion = "Sad"
					currentTrial.RStim = currentTrial["Sad"]
				} else {
					currentTrial.LDescription = currentTrial["Sad"+"ID"]
					currentTrial.LEmotion = "Sad"
					currentTrial.LStim = currentTrial["Sad"]
					currentTrial.RDescription = currentTrial["Neutral"+"ID"]
					currentTrial.REmotion = "Neutral"
					currentTrial.RStim = currentTrial["Neutral"]					
				}
			};
			
			//start time
			var current_time = performance.now();
			trial.stim_onset = current_time - trial.start_t;
			if (debug){console.log('%ctrial_type: %s','color: blue',currentTrial.Type)
			console.log('%cstimulus onset: %smsec','color: green',trial.stim_onset)};
			
			//draw stim
			for (var i = 0; i < display_locs.length; i++) {
				var img = d3.select("#jspsych-image-" + left_right[i])
				.attr('id', 'jspsych-image-' + left_right[i])
				.attr("xlink:href", (currentTrial[emotion_shuffle[i]+"Directory"]))
				.attr("x", (display_locs[i][0]*scaleImage))
				.attr("y", (display_locs[i][1]*scaleImage))
				.attr("width", (stimw*scaleImage))
				.attr("height", (stimh*scaleImage));
			};

			// duration
			setTimeout(function () {
				//end time
				show_cue();
			}, settings.stimulus_offset);
		}

		////////////////////////////3.show DotLoc
		function show_cue() {
			task_event = 'DotLoc'; ////for sample_array debugging (know what events occured when gaze sample was collected)
			//preparing target type: * or **
			var cue_list = jsPsych.randomization.shuffle(['cue_1.jpg', 'cue_2.jpg']);
			cue_img = cue_list[0];
			
			//preparing target location
			///if dotloc matches left stim type, place dotloc left
			if (emotion_shuffle[0] == trial.DotLoc){
				DotLoc_images = [cue_img,settings.mask_image];
			} else {
			///else place dotloc right
				DotLoc_images = [settings.mask_image,cue_img];		
			};
			if (debug){console.log('%cDotLoc images: ','color: green',DotLoc_images)};
			
			//start time
			var current_time = performance.now();
			trial.cue_onset = current_time - trial.start_t;
			if (debug){console.log('%cDotLoc onset: %smsec','color: green',trial.cue_onset)};
			
			//draw stim
			for (var i = 0; i < display_locs.length; i++) {
				var img = d3.select("#jspsych-image-" + left_right[i])
				.attr("xlink:href", (settings.element_directory + DotLoc_images[i]))
				.attr("x", (display_locs[i][0]*scaleImage))
				.attr("y", (display_locs[i][1]*scaleImage))
				.attr("width", (stimw*scaleImage))
				.attr("height", (stimh*scaleImage));
			};

			// function to handle responses by the subject
			var after_response = function (info) {
				// after a valid response, the stimulus will have the CSS class 'responded'
				$("#jspsych-content").addClass('responded');
				// only record the first response
				if (response.key == -1) {
					response = info
				}
				//create string from keycode
				if (response.key == 56 || response.key == 104) {
					response.resp = '8';
				} else if (response.key == 57 || response.key == 105) {
					response.resp = '9';
				} else {
					response.resp = -1;
				}
				
				//end trial early
				if (trial.response_ends_trial) {
					//end time
					var current_time = performance.now();
					//trial offset
					trial.end_t = current_time - trial.start_t;
					if (debug){console.log('%cend trial (early): %smsec','color: green',trial.end_t)};
					end_trial(response);
				}
			};
			
			// start the response listener
			keyboardListener = jsPsych.pluginAPI.getKeyboardResponse({
				callback_function: after_response,
				valid_responses: [56, 57, 104, 105],
				rt_method: 'date',
				persist: false,
				allow_held_key: false
			});

			//end trial if time limit is set
			if (trial.timing_response > 0) {
				timeout_on = setTimeout(function () {
					//end time
					var current_time = performance.now();
					//trial offset
					trial.end_t = current_time - trial.start_t;
					if (debug){console.log('%cend trial (normal): %smsec','color: green',trial.end_t)};
					var response = {
						rt: -1,
						key: -1,
						resp: -1
					}
					end_trial();
				}, settings.cue_offset);
			};
		};

		// function to end trial when it is time
		var end_trial = function () {
			//clearing the screen
			$("#jspsych-image-left")[0].href.baseVal = ""
			$("#jspsych-image-right")[0].href.baseVal = ""
			end_trial_data = true;
			//check if tab is focused
			var visible = vis();
			// kill keyboard listeners
			jsPsych.pluginAPI.cancelKeyboardResponse(keyboardListener);
			//kill timeout
			window.clearTimeout(timeout_on);

			// gather the data to store for the trial
			//.exp = expected, .real = real, .rt = resp time, .resp = resp key
			/**
			 * Collect trial-level data.
			 * @callback dotprobe-task
    		 * @param {string} participant - participant number
    		 * @param {string} isWebcamUsed - was webcam used in task
    		 * @param {string} WebcamDevice - webcam vender information
    		 * @param {string} x - the x screen coordinate predicted
    		 * @param {string} y - the y screen coordinate predicted
			 */
			var trial_data = {
				//participant
				'participant': participant_id,
				'session': pid.session,
				'subsession': pid.subsession,
				'condition': cndt_code[condition],
				'code': pid.code,
				'expName': settings.expName,
				'date': settings.date,
				'os': subject.os,
				'gpu': gpu,
				//browser
				'heap.used': heap_used,
				'heap.limit': heap_limit,
				'browser': subject.browser,
				//webcam
				'isWebcamUsed': subject.webcam_used,
				'WebcamMessage': WebcamMessage,
				'WebcamDevice': MediaDevice,
				'webcamSize.px': subject.webcam_size,
				'lum': subject.lum,
				'isWindowSuccess': isWindowSuccess, //whether or not participants xyz coordinates were successful
				//screen
				'monitorSize.px': subject.display_monitor,
				'windowSize.px': subject.display_window,
				'diagonalSize.in': diagonal_inches,
				'devicePixelRatio': subject.devicePixelRatio,
				'isPageVisible': visible,
				'isFullscreen': '',
				'scaling': scaleImage,
				//eyetracking
				'sampleNum': -1,
				'sample_time': -1,
				'x': -1,
				'y': -1,
				//time
				'duration.t': Math.round(trial.end_t),
				'Stim_onset.t': Math.round(trial.stim_onset),
				'DotLoc_onset.t': Math.round(trial.cue_onset),
				//blocking
				'blockNum': blockvalue,
				'trialNum': trialvalue,
				'trialNumTask': trialNumTask,
				'trialID': trial.trialID,
				//resp
				'Key_Resp.rt': response.rt,
				'Key_Resp.resp': response.resp,
				'Key_Resp.cresp': '',
				'Key_Resp.acc': '',
				//trial
				'baseline': idc.rtco,
				'DotLoc': currentTrial.DotLoc,
				'LEmotion': currentTrial.LEmotion,
				'LStim': currentTrial.LStim,
				'LDescription': currentTrial.LDescription,
				'REmotion': currentTrial.REmotion,
				'RStim': currentTrial.RStim,
				'RDescription': currentTrial.RDescription,
				'trialType': currentTrial.Type,
				'isCongruent': ""
			};
			//-------collect event
			if (!subject.webcam_used){
				trial_data['event'] = 'Task'
			};
			
			//-------collect cresp and accuracy
			//collect cresp
			if (cue_img == "cue_2.jpg") {
				trial_data['Key_Resp.cresp'] = 9; //adding to csv
				cue_index = DotLoc_images.indexOf("cue_2.jpg");
				//which side of screen cue is on
				if (cue_index==0){//left side of screen
					trial_data['DotLoc'] = 'LeftD'
				} else {//right-side of screen
					trial_data['DotLoc'] = 'RightD';
				};
			} else {
				trial_data['Key_Resp.cresp'] = 8 //adding to csv
				cue_index = DotLoc_images.indexOf("cue_1.jpg");
				//which side of screen cue is on
				if (cue_index==0){//left side of screen
					trial_data['DotLoc'] = 'LeftS'
				} else {//right-side of screen
					trial_data['DotLoc'] = 'RightS';
				};
			}
			
			//-------collect acc for database
			//if no or incorrect response
			if (response.resp == -1 || trial_data['Key_Resp.cresp'] != response.resp){
				trial_data['Key_Resp.acc'] = 0 //adding to csv
				ltask_acc.push(trial_data['Key_Resp.acc'])
			} else {
				trial_data['Key_Resp.acc'] = 1 //adding to csv
				ltask_acc.push(trial_data['Key_Resp.acc'])
			}
			
			//-------collect slow and/or no response for database
			if(response.resp == -1 || (response.rt > 900)){
			   lslow.push(trialNumTask);
				if (debug){console.log('%ctoo slow, rt:%s','color: red',response.rt)};
			}	

			//-------collect congruency
			//if congruent or incongruent stimuli and dotloc
			//if dotloc and sad image are both on left-side of screen -or- if dotloc and sad image are both on right-side of screen
			if (((cue_index == 0) && (emotion_shuffle[0]=="Sad"))||((cue_index == 1) && (emotion_shuffle[1]=="Sad"))){
				trial_data['isCongruent'] = true //adding to csv
				ltask_cong.push(trial_data['isCongruent'])
			} else {
				trial_data['isCongruent'] = false //adding to csv
				ltask_cong.push(trial_data['isCongruent'])
			}
			
			//-------and collect rt for calculating mean lacc / lrt
			if(response.resp != -1){
				lrt.push(trial.end_t);
				if (debug){console.log('%crt: %s','color: red',response.rt)};
			} else {
				lrt.push(settings.cue_offset);
				if (debug){console.log('%c no response - rt: %s','color: red',settings.cue_offset)};
			};
			
			//console
			if (debug){
				//if admin computer
				if(db_compare[0]["isAdmin"]){
					heatmap(sample_array)
				}
				console.log('%ctrial end;\n'+
						'cue type: %s;\n'+
						'isCongruent: %s;\n'+
						'trial: %s;\n'+
						'block: %s;\n'+
						'subsession: %s;\n'+
						'trialID: %s;\n'+
						'iteration: %s;\n'+
						'resp: %s;\n'+
						'cresp: %s;\n'+
						'trial acc: %s;\n'+
						'ltask acc: %O\n'+
						'lacc: %O\n',
						'color: orange',
						trial_data['DotLoc'],
						trial_data['isCongruent'],
						task_trial_value,
						trial.block_order,
						pid.subsession,
						trial.trialID,
						task_iter,
						response.resp,
						trial_data['Key_Resp.cresp'],
						trial_data['Key_Resp.acc'],
						ltask_acc,
						lrt)
			}
			
			//response reset
			response = {
				rt: -1,
				key: -1,
				resp: -1
			};
			
			//-------check if fullscreen 
			//isFullscreen updated within checkfullscreen function
			checkfullscreen();
			trial_data['isFullscreen'] = isFullscreen;
			trial_data['windowSize.px'] = [window.innerWidth+"x"+window.innerHeight];
			
			//-------run break before begining block 4 and block 6
			//run only if location is lab
			if ((pid.location == 'lab') && (pid.session != 0)){
				if (((blockvalue == 2) || (blockvalue == 5)) && (trialvalue == 21)){
					isBreak();
				};
			};
			
			//-------move on to the next trial
			trialNumTask = trialNumTask + 1;
			if (debug){console.log('trialNumTask:',trialNumTask)};
			jsPsych.finishTrial(trial_data);
		}
	};
	return plugin;
})();