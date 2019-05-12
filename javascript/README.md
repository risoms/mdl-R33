-------------------------------------------------------------------------------------------------

<div class="row">
	<a href="https://liberalarts.utexas.edu/imhr/">
		<img src="https://risoms.github.io/mdl/docs/source/_static/img/imhr-header.png" height="auto" width="100%" max-width="400px">
	</a>
<div>

-----------------------------------------------------------------------------------------------

This package was created at [the Institute for Mental Health Research](http://mdl.psy.utexas.edu/), at [the University of Texas at Austin](http://www.utexas.edu/) by [Semeon Risom](https://semeon.io), and was developed in part from funding of NIMH grant [5R33MH109600-03](https://projectreporter.nih.gov/project_info_details.cfm?aid=9659376).

	Hsu, K. J., Caffey, K., Pisner, D., Shumake, J., Risom, S., Ray, K. L., . . . Beevers, C. G. (2018). 
	    Attentional bias modification treatment for depression: Study protocol for a randomized controlled trial. 
	    Contemporary Clinical Trials, 75, 59-66. doi:https://doi.org/10.1016/j.cct.2018.10.014.

Tasks
-----

Eyetracking (JavaScript)
------------------------
* dotprobe-js: Dotprobe (JavaScript)

dotprobe-js
-----------
#### stim
* IAPS - International Affective Picture System (Lang, Bradley, & Cuthbert, 2008) 
* POFA - Pictures of Facial Affect (Ekman & Friesen, 1976)

#### trial
* fixation: 0-1500ms (1500)
* facestim: 1500-4500ms (3000)
* dotloc: 4250-14250ms (10000)
* delay: 14250-14500ms (250)

#### task
* nine blocks of 196 trials
* two conditions (subject does same version each time): 
	* active training:
		-- probe [target] 80% neutral stim location
		-- probe [target] 20% dysphoric [sad] stim location
	* placebo:
		-- probe [target] 50% neutral stim location
		-- probe [target] 50% dysphoric [sad] stim location

#### structure
* 196-trials (total), 9-blocks, 22-trials [12 - pofa; 10*9 - iaps]
* minimal duration: 17 minutes + 4 minute break + 5 minute practice
	** (12 pofa_trials * 9 blocks * (4.5 second stim) +
	** (10 iaps_trials * 9 blocks * (6 second trial))
* maxinum duration: 50 minutes [include max response time]: 17 minutes + 4 minute break + 5 minute practice
	** (12 pofa_trials * 9 blocks * (4.5 second stim + 10 second response) + 
	** (10 iaps_trials * 9 blocks * (6 second trial + 10 second response))

```
dotprobe-js task
├── Practice
│	├── IAPS
│	│	├── Fixation: 1500msec
│	│	├── Stimulus: 4500msec
│	│	├── Probe: User defined 
│	├── POFA
│	│	├── Fixation: 1500msec
│	│	├── Stimulus: 3000msec
│	│	├── Probe: User defined
├── Task
│	├── Block 1: 20 trials
│	│	├── POFA: 12 trials
│	│	├── IAPS: 10 trials
│	├── Block 2
│	├── Block 3
│	├── Break: 2 minutes
│	├── Block 4 
│	├── Block 5
│	├── Block 6
│	├── Break: 2 minutes
│	├── Block 7
│	├── Block 8
│	├── Block 9
```

#### directory
```
task
├──dotprobe-js 
│	├── data - viewing participant data
│	│	├── a - view all participant data
│	│	├── u - user only
│	├── dist - required files
│	├── docs - notes related to task
│	├── src - program to run task
│	├── tools - files to edit task
│
Google
├──console developers - allow access to google calendar

Cron
├──https://mail.google.com/mail/u/0/#inbox/15debfaf3abec6b9
├──https://www.codeofaninja.com/2012/08/cron-job-example-with-putty.html
├── Fn + enter
├── crontab -e
├── 00 9 * * * /home/utw10625/public_html/app/dotprobe-js/data/notify/notify.php
├── press ESC.
├── type ":wq" and press enter.

```
### comments
* condition is permanent within subjects
* subjects must do the task only once per 24 hours

