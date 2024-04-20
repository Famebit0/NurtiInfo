// Max van Leeuwen
// twitter: @maksvanleeuwen
// ig: @max.van.leeuwen
//
// Popups
// A setup to quickly show dialog boxes, like when talking to NPCs in a game.



// --- How to use:



// -> When using Behavior Scripts
//
//	The Behavior setup is:
//		Response: "Call Object API"
//		Component: this Script
//		Function name: 'showDialog' or 'hideDialog'
//		Argument 1: String (your text here!)
//		Argument 2: Texture (optional - your avatar here!)
//
//	In the Inspector, you will find some settings to tweak.
//
//	The most important setting is the Text Component - this will be used as the template to place the dialog under. All visual settings (like font, color, etc) will be copied from here!
//	This Text Component must be Orthographic.
//
//
//	Tip: if you put \n in a text string (like the argument in the Behavior), it will create a new line!



// -> When using API (recommended when many dialogs are needed)
//
// API usage, call from any other script:
//  var dialog = new Dialog(textComponent, dialogText, avatarTexture)
//		Arguments:
//			textComponent 			Component.Text to take all visual settings and Screen Transform from
//			dialogText	 			String text to write in the dialog
//			avatarTexture			(optional) Asset.Texture to show next to the dialog
//
//	popup.textWriteDuration		property: text writing duration, default: 1
//	popup.scaleOutDuration		property: popup scaling out duration, default: 0.5
//	popup.dialogSize			property: extra bounds to make text fit inside the dialog, default: vec2(1.5, 1.5)
//	popup.avatarSize			property: size of avatar texture (if used), default: 1
//	popup.avatarPosition		property: string, position of avatar texture (if used), default: "left" (alternative is "right")
//	popup.tickSound				property: (optional) Asset.AudioTrackAsset to play on a loop while typing text (see 'Tick Sound.mp3' asset! this is used if none is given)
//	popup.getDialogText()		returns the dialog text as a string
//
//  popup.show()				call to show the dialog
//  popup.hide()				call to animate-out dialog arg 0: destroy on end (bool)
//
//
//	Tip: if you put \n in a text string (like the dialogText argument), it will create a new line!









// access
global.Dialog = Dialog;

// Behavior
script.show = showNewDialog;
script.hide = hideDialog;



//@ui {"widget":"label"}
//@ui {"widget":"label", "label":"Popups 💬"}
//@ui {"widget":"label", "label":"Automated & animated dialog boxes! :)"}
//@ui {"widget":"label"}
//@ui {"widget":"label", "label":"Can be used with API, or with Behavior."}
//@ui {"widget":"label", "label":"Read the top of this script for more info."}
//@ui {"widget":"label"}
//@ui {"widget":"separator"}
//@ui {"widget":"label"}

//@ui {"widget":"group_start", "label":"Behavior Settings - only applied when using Behavior"}
//@ui {"widget":"label"}
//@ui {"widget":"label", "label":"Behavior setup:"}
//@ui {"widget":"label", "label":"    Behavior response: 'Call Object API'"}
//@ui {"widget":"label", "label":"    Component: this Script"}
//@ui {"widget":"label", "label":"    Function Name: 'show' or 'hide'"}
//@ui {"widget":"label", "label":"    Argument 1: String (your text here!)"}
//@ui {"widget":"label", "label":"    Argument 2: Texture (optional - your avatar here!)"}
//@ui {"widget":"label"}
//@input Component.Text textComponent {"label":"2D Text Component"}
//@input float textWriteDuration = 1
//@input float scaleOutDuration = 0.5
//@input vec2 dialogSize = {1.5, 1.5}
//@input float avatarSize = 1 {"label":"(opt.) Avatar Size"}
//@input string avatarPosition = "left" {"widget":"combobox", "values":[{"label":"left", "value":"left"}, {"label":"right", "value":"right"}]}
//@ui {"widget":"group_end"}
//@ui {"widget":"label"}
//@ui {"widget":"separator"}
//@ui {"widget":"label"}

//@ui {"widget":"group_start", "label":"General Settings"}
//@ui {"widget":"label"}
//@input Asset.Texture dialogTexture
//@input Asset.AudioTrackAsset tickSound {"label":"(opt.) Tick Sound"}
//@input float borderWidth = 0.12 {"widget":"slider", "min":0.0, "max":1.0, "step":0.01}
//@input vec4 bgColor {"widget":"color"}
//@ui {"widget":"label"}
//@input bool advanced
//@input Asset.Material popupMat {"showIf":"advanced"}
//@input Asset.Material avatarMat {"showIf":"advanced"}
//@ui {"widget":"group_end"}
//@ui {"widget":"label"}
//@ui {"widget":"separator"}
//@ui {"widget":"label"}

//@ui {"widget":"group_start", "label":"API Information"}
//@ui {"widget":"label"}
//@ui {"widget":"label", "label":"Create a Dialog instance from any script, using"}
//@ui {"widget":"label", "label":"    var dialog = new Dialog( [arguments] )"}
//@ui {"widget":"label"}
//@ui {"widget":"label", "label":"    Arguments"}
//@ui {"widget":"label", "label":"        textComponent: text visuals copied from here"}
//@ui {"widget":"label", "label":"        dialogText: string to show"}
//@ui {"widget":"label", "label":"        avatarTexture: (opt.) picture to show"}
//@ui {"widget":"label"}
//@ui {"widget":"label", "label":"    Properties"}
//@ui {"widget":"label", "label":"        dialog.textWriteDuration = 1"}
//@ui {"widget":"label", "label":"        dialog.scaleOutDuration = 0.5"}
//@ui {"widget":"label", "label":"        dialog.dialogSize = (1.5, 1.5)"}
//@ui {"widget":"label", "label":"        dialog.avatarSize = 1"}
//@ui {"widget":"label"}
//@ui {"widget":"label", "label":"    Functions"}
//@ui {"widget":"label", "label":"        dialog.show()"}
//@ui {"widget":"label", "label":"        dialog.hide(bool: destroyOnEnd)"}
//@ui {"widget":"label"}
//@ui {"widget":"label", "label":"by Max van Leeuwen"}
//@ui {"widget":"group_end"}
//@ui {"widget":"label"}
//@ui {"widget":"separator"}



var audioComp;
function init(){
	// material initialize
	script.popupMat.mainPass.borderWidth = script.borderWidth;
	script.avatarMat.mainPass.borderWidth = script.borderWidth;

	// create audio component in case of tick sound being used
	audioComp = script.getSceneObject().createComponent("Component.AudioComponent");
}
init();



// API
function Dialog(textComponent, dialogText, avatarTexture){
	var self = this;

	// params
	this.textWriteDuration = 1;
	this.scaleOutDuration = 0.5;
	this.dialogSize = new vec2(1.5, 1.5);
	this.avatarSize = 1;
	this.avatarPosition = "left";
	this.tickSound = null;


	// placeholders
	var isDestroyed = false;
	var isCreated = false;
	var objTxt;
	var notScaledYet;
	var extentsHaveMoved;
	var scaleOutAnim;
	var avatarAnim;
	var textAnim;



	function create(){
		// render layer for all popup visuals
		var renderLayer = textComponent.getSceneObject().getRenderLayer();

		// create child object for text
		objTxt = global.scene.createSceneObject("text");
		objTxt.setRenderLayer(renderLayer); // use same render layer
		objTxt.setParent(textComponent.getSceneObject());
		var txt = objTxt.copyComponent(textComponent); // copy text component to use same settings
		txt.setRenderOrder(txt.getRenderOrder() + 1); // render above image component
		txt.colorMask = new vec4b(false, false, false, false); // make invisible on start (extents are weird on first frame)
		txt.verticalOverflow = VerticalOverflow.Shrink; // text always shrinks
		txt.horizontalOverflow = HorizontalOverflow.Shrink;
		var txtScrTrf = objTxt.createComponent("Component.ScreenTransform"); // create screen transform


		// create 2nd child object under Text as Extents
		var objExtents = global.scene.createSceneObject("extents");
		objExtents.setRenderLayer(renderLayer);
		objExtents.setParent(objTxt);
		var extentsScrTrf = objExtents.createComponent("Component.ScreenTransform"); // create screen transform
		txt.extentsTarget = extentsScrTrf; // set extents target on text to these bounds
		if(dialogText.split('\n').length == 1) extentsScrTrf.scale = new vec3(extentsScrTrf.scale.x, extentsScrTrf.scale.y * 2, extentsScrTrf.scale.z); // scale in y if one-liner text


		// create 3rd child object under Extents as Image
		var objImg = global.scene.createSceneObject("img");
		objImg.setRenderLayer(renderLayer);
		objImg.setParent(objExtents);
		var imgScrTrf = objImg.createComponent("Component.ScreenTransform"); // create screen transform
		imgScrTrf.anchors.setSize(self.dialogSize.uniformScale(2));

		// create image
		var img = objImg.createComponent("Component.Image");
		img.clearMaterials();
		var mat = script.popupMat.clone();
		mat.mainPass.dialogTex = script.dialogTexture;
		mat.mainPass.bgColor = script.bgColor;
		img.addMaterial(mat);
		img.stretchMode = StretchMode.Stretch;
		img.enabled = false;


		// if avatar image given
		if(avatarTexture){
			// create child object, next to Image, for avatar image
			var objAvatar = global.scene.createSceneObject("avatar");
			objAvatar.setRenderLayer(renderLayer);
			objAvatar.setParent(objTxt);
		
			// create screen transform
			var avatarScrTrf = objAvatar.createComponent("Component.ScreenTransform");
			avatarScrTrf.anchors = Rect.create(-self.avatarSize, self.avatarSize, -self.avatarSize, self.avatarSize);
			
			// create image
			var avatarImg = objAvatar.createComponent("Component.Image");
			avatarImg.clearMaterials();
			var avatarMat = script.avatarMat.clone();
			avatarMat.mainPass.dialogTex = script.dialogTexture;
			avatarMat.mainPass.avatarTex = avatarTexture;
			avatarImg.addMaterial(avatarMat);
			avatarImg.stretchMode = StretchMode.Fit;

			// move the whole dialog a bit to the right to make it centered
			var horizontalOffset = (.5 * self.avatarSize/4) * (self.avatarPosition == "left" ? 1 : -1); // half of one avatar width, in the direction of avatar position
			txtScrTrf.anchors.left += horizontalOffset;
			txtScrTrf.anchors.right += horizontalOffset;

			// avatar scale-in animation
			var avatarStartSize = avatarScrTrf.anchors.getSize();
			avatarAnim = new Animate();
			avatarAnim.updateFunction = function(v){
				avatarScrTrf.anchors.setSize(avatarStartSize.uniformScale(Math.pow(v, 7))); // arbitrary pow for stronger falloff
			}
			avatarAnim.easeFunction = EaseFunctions.Cubic.Out;
			avatarAnim.duration = .4; // arbitrary
		}


		// create popup animation
		scaleOutAnim = new Animate();
		scaleOutAnim.updateFunction = function(v){
			v = Math.max(1-v, 0.1); // inverse, and never 0 (that makes text go weird)
			txtScrTrf.anchors.setSize(vec2.one().uniformScale(v));
		}
		scaleOutAnim.easeFunction = EaseFunctions.Cubic.In;
		scaleOutAnim.reverseEaseFunction = EaseFunctions.Cubic.Out;
		scaleOutAnim.duration = self.scaleOutDuration;
		scaleOutAnim.pulse(1);


		// create text animation
		textAnim = new Typewriter();
		notScaledYet = true;
		extentsHaveMoved = false;
		textAnim.callback = function(t){
			if(t.length > 0 && notScaledYet){
				notScaledYet = false;
				scaleOutAnim.pulse(0); // scale to full size once the first character has been written, this is to patch a bug with extents targets doing a flash on their first frame
				img.enabled = true;
			}

			var rect = extentsScrTrf.anchors;
			if(rect.left != rect.right && !extentsHaveMoved){
				extentsHaveMoved = true;
				txt.colorMask = new vec4b(true, true, true, true); // make visible on first frame of extents
			}

			txt.text = t;

			// set avatar texture (if any)
			if(avatarTexture){
				if(self.avatarPosition == "left"){
					avatarScrTrf.anchors.setCenter(new vec2(rect.left * self.dialogSize.x - self.avatarSize/4, rect.top - (rect.top-rect.bottom)/2));
				}else if(self.avatarPosition == "right"){
					avatarScrTrf.anchors.setCenter(new vec2(rect.right * self.dialogSize.x + self.avatarSize/4, rect.top - (rect.top-rect.bottom)/2));
				}
			}
		}
		textAnim.duration = self.textWriteDuration; // arbitrary

		// don't show anything yet
		objTxt.enabled = false;

		isCreated = true;
	}



    this.show = function(){
		if(isDestroyed) return;
		if(!isCreated) create();

		objTxt.enabled = true;

		// typewriter
		notScaledYet = true;
		extentsHaveMoved = false;
		textAnim.start(dialogText);

		// avatar picture
		if(avatarAnim) avatarAnim.start();

		// start audio
		var tickSoundAsset = self.tickSound ? self.tickSound : script.tickSound;
		if(tickSoundAsset){
			audioComp.audioTrack = tickSoundAsset;
			audioComp.play(-1);
		}

		// stop audio on end
		textAnim.onEnd = function(){
			if(tickSoundAsset) audioComp.stop(false);
			textAnim.onEnd = function(){};
		}
    }


	
    this.hide = function(destroyOnEnd){
		var tickSoundAsset = self.tickSound ? self.tickSound : script.tickSound;
		if(tickSoundAsset) audioComp.stop(false); // in case of playing, stop

		if(isDestroyed) return; // this dialog is about to be destroyed
		textAnim.stop();
		scaleOutAnim.stop();
		if(avatarAnim) avatarAnim.stop();

		// out anim
		if(destroyOnEnd){
			isDestroyed = true;
			scaleOutAnim.endFunction = function(){
				objTxt.destroy();
			};
		}else{
			scaleOutAnim.endFunction = function(){
				objTxt.enabled = false;
			};
		}
		scaleOutAnim.start();
    }



	this.getDialogText = function(){
		return dialogText;
	}
}



// behavior
var behaviorDialog;
function showNewDialog(textToWrite, avatarTexture){
	// do checks
	if(typeof textToWrite != "string" || !textToWrite) throw("[Popup] The argument for 'showDialog' is not a string! Please enter a text to show on the dialog window in the Behavior script.");
	if(!script.textComponent) throw("[Popup] No Text Component was given in the Popup script! Please select one in the Inspector. This needs to be an Orthographic Text.");
	if(!script.textComponent.getSceneObject().getComponent("Component.ScreenTransform")) throw("[Popup] The given Text Component is not an Orthographic Text. Please select a 2D Text Component in the Inspector!");

	// hide old dialog
	if(behaviorDialog){
		behaviorDialog.hide(true);
		behaviorDialog = null;
	}

	// parse newlines
	textToWrite = parseNewLines(textToWrite);
	
	// create new dialog with settings
	behaviorDialog = new Dialog(script.textComponent, textToWrite, avatarTexture);
	behaviorDialog.textWriteDuration = script.textWriteDuration;
	behaviorDialog.scaleOutDuration = script.scaleOutDuration;
	behaviorDialog.dialogSize = script.dialogSize;
	behaviorDialog.avatarSize = script.avatarSize;
	behaviorDialog.avatarPosition = script.avatarPosition;
	behaviorDialog.show();
}

function hideDialog(){
	if(behaviorDialog){
		behaviorDialog.hide(true);
		behaviorDialog = null;
	}
}






// --- HELPER FUNCTIONS






// Typewriter
// by Max van Leeuwen
//
// To use, make new instance using
// 	var tw = new Typewriter()
//
// Set callback function using
//	tw.callback = function(text){ print(text) }
//
// Set end-function using (optional)
//	tw.onEnd = function(){ print("done!") }
//
// Set total animation length using
// 	tw.duration = 1
//
// Start
//	tw.start( "YOUR STRING HERE" )
//
// Stop
//	tw.stop()


function Typewriter(){
	var self = this;

	/**
	 * @type {Function}
	 * @description Function to send string to on update. */
	this.callback = function( animatedText ){};

	/**
	 * @type {Function}
	 * @description Function to call on end. */
	this.onEnd = function(){};

	/**
	 * @type {Number}
	 * @description Animation length. Default is 1. */
	this.duration = 1;

	/**
	 * @type {Function}
	 * @description Starts animation! */
	this.start = function(text){
		if(typeof text != "string") throw("Text argument needs to be string!");

		// clear previous animation, if any
		clearEvents();

		// set start
		var characterIndex = 0;

		// per-character animation length
		var perCharacterDuration = self.duration/text.length;

		// update function
		function changeText(){
			// new typewriter string
			var newText = text.substring(0, Math.floor(characterIndex));

			// increase value for next iteration
			characterIndex += getDeltaTime()/perCharacterDuration;

			// when animation done
			if(characterIndex > text.length + 1){
				// send final string
				self.callback(text);

				// stop
				clearEvents();

				// run optional user-defined end function
				self.onEnd();
			}else{
				// send to callback if changed
				if(newText != prvText) self.callback(newText);
			}

			// update prvText to compare on next frame
			prvText = newText;
		}
		changeTextEvent = script.createEvent("UpdateEvent");
		changeTextEvent.bind(changeText);
	}


	/**
	 * @type {Function}
	 * @description Starts animation! */
	this.stop = function(){
		clearEvents();
	}


	// private
	var changeTextEvent;
	var prvText;

	function clearEvents(){
		if(changeTextEvent){
			script.removeEvent(changeTextEvent);
			changeTextEvent = null;
		}
	}
}






// Animate - Simplified 'AnimateProperty' from LSQuickScripts https://github.com/max-van-leeuwen/SnapLensStudio-CodeSnippets/tree/main/LSQuickScripts. Not global, in case an updated LSQuickScripts is imported in this project as well.
//
// Animate() : Animate object
// 	Creates an easy-to-use animation 'class' instance. Can be used to easily animate any property in just a couple lines of code!
//
//		Example, showing all properties:
//			var anim = new Animate();										// create a new animation instance called 'anim'.
//			anim.startFunction = function(){};								// function to call on animation start.
//			anim.updateFunction = function(v, vLinear){};					// function to call on each animation frame, with animation value (0-1) as its first argument. The second argument is the linear animation value. These ranges are exclusive for the first step, and inclusive for the last step of the animation (so when playing in reverse, the range becomes (1, 0]).
//			anim.endFunction = function(){};								// function to call on animation end.
//			anim.duration = 1;												// duration in seconds. Default is 1.
//			anim.reverseDuration = 1;										// duration in seconds when reversed. If no value assigned, default is equal to duration.
//			anim.easeFunction = EaseFunctions.Cubic.In;						// determines curve. Default is Cubic.InOut. All EaseFunctions can be used, or use a custom function.
//			anim.reverseEaseFunction = EaseFunctions.Cubic.Out;				// determines curve on reverse playing. Uses anim.easeFunction if none is given.
//			anim.pulse(newTimeRatio);										// updates the animation once, stops the currently running animation. Sets the time value to newTimeRatio (linear 0-1).
//			anim.getTimeRatio();											// the current linear, normalized animation time (0-1).
//			anim.setReversed(reverse);										// if reversed, the animation plays backwards. 'Reverse' arg should be of type Bool.
//			anim.getReversed();												// returns true if the animation is currently reversed.
//			anim.isPlaying();												// returns true if the animation is currently playing.
//			anim.start(newTimeRatio); 										// starts the animation (resumes where last play ended, starts from beginning if last play was finished). Optional 'atTime' argument starts at normalized linear 0-1 time ratio.
//			anim.stop(callEndFunction);										// stop the animation at its current time. With an optional argument to call the endFunction (argument should be of type bool).


function Animate(){
	var self = this;

	/**
	 * @type {Function} 
	 * @description Function to call on animation start. */
	this.startFunction = function(){};

	/**
	 * @type {Function}
	 * @description Function to call on each animation frame, with animation value (0-1) as its first argument. The second argument is the linear animation value. These ranges are exclusive for the first step, and inclusive for the last step of the animation (so when playing in reverse, the range becomes (1, 0]). */
	this.updateFunction = function(v, vLinear){};

	/**
	 * @type {Function} 
	 * @description Function to call on animation end. */
	this.endFunction = function(){};

	/**
	 * @type {Number}
	 * @description Duration in seconds. Default is 1. */
	this.duration = 1;

	/**
	 * @type {Number}
	 * @description Reverse duration in seconds. Default is equal to duration. */
	this.reverseDuration;

    /**
	 * @type {Function}
	 * @description Determines curve. Default is EaseFunctions.Cubic.InOut. */
	this.easeFunction = EaseFunctions.Cubic.InOut;

	/**
	 * @type {Function}
	 * @description Determines curve on reverse. If none is given, it uses the same as easeFunction. */
	this.reverseEaseFunction;

	/**
	 * @type {Function} 
	 * @argument {Number} newTimeRatio
	 * @description Updates the animation once, stops the currently running animation. Sets the time value to newTimeRatio (linear 0-1). */
	this.pulse = function(newTimeRatio){
		if(reversed) newTimeRatio = 1-newTimeRatio;
		stopAnimEvent();
		timeRatio = newTimeRatio; // reset animation time
		setValue( getInterpolated() );
	}

	/**
	 * @type {Number} 
	 * @description The current linear normalized animation time, 0-1. */
	this.getTimeRatio = function(){
		var reversedTimeRatio = reversed ? 1-timeRatio : timeRatio;
		return clamp(reversedTimeRatio);
	}

	/**
	 * @type {Function} 
	 * @description If reversed, the animation plays backwards. 'Reverse' arg should be of type Bool. */
	this.setReversed = function(reverse){
		if(typeof reverse === 'undefined'){ // toggle reverse if no argument given
			reversed = !reversed;
		}else{
			reversed = reverse;
		}
	}

	/**
	 * @type {Function} 
	 * @description Returns true if the animation is currently reversed. */
	this.getReversed = function(){
		return reversed;
	}

	/**
	 * @type {Boolean} 
	 * @description Returns true if the animation is currently playing. */
	this.isPlaying = function(){
		return isPlaying;
	}

	/**
	 * @type {Function} 
	 * @argument {Number} atTime
	 * @description Starts the animation. Resumes where last play ended, starts from beginning if last play was finished. Optional 'atTime' argument starts at linear 0-1 time ratio. */
	this.start = function(newTimeRatio){
		function begin(){
			if(newTimeRatio != null){ // custom time ratio given
				self.pulse(newTimeRatio);
			}else{
				if(self.getTimeRatio() === 1) self.pulse(0);
			}
			updateDuration();
			animation();
			startAnimEvent();
			if(self.startFunction) self.startFunction();
		}

		begin();

		// force isPlaying to true, as it otherwise takes until the delay is over (delayed animation also counts as playing)
		isPlaying = true;
	}
	
	/**
	 * @type {Function} 
	 * @description Stop the animation at its current time. With an optional argument to call the endFunction (argument should be of type bool). */
	this.stop = function(callEndFunction){
		stopAnimEvent();
		var atAnimationEnd = (timeRatio === 0 && reversed) || (timeRatio === 1 && !reversed);
		if(callEndFunction || atAnimationEnd) self.endFunction(); // only call endFunction if an animation was stopped at end
	}


	// private

	var animEvent;
	var reversed = false;
	var isPlaying = false;
	var duration;
	var timeRatio = 0;

	function setValue(v, lastFrame){
		self.updateFunction(v, lastFrame ? v : timeRatio); // on last frame, take animation end value
	}

	function updateDuration(){
		duration = reversed ? (typeof self.reverseDuration === 'number' ? self.reverseDuration : self.duration) : self.duration; // set duration, checks if reversed is unique otherwise uses forward duration
	}
	
	function animation(){
		if(duration === 0){ // if instant
			timeRatio = reversed ? 0 : 1; // set to limit of allowed range to make the animation stop right away (1 tick of update function will be sent)
		}else{
			var dir = reversed ? -1 : 1;
			timeRatio += (getDeltaTime() / duration) * dir;
		}
		if(reversed ? (timeRatio <= 0) : (timeRatio >= 1)){ // on last step
			setValue(reversed ? 0 : 1, true);
			self.stop(true);
		}else{ // on animation step
			var v = getInterpolated();
			setValue(v);
		}
	}

	function getInterpolated(){
		var easeFunction = self.easeFunction;
		if(reversed && self.reverseEaseFunction) easeFunction = self.reverseEaseFunction; // if reverse, use custom ease function (if any)
		return interp(0, 1, timeRatio, easeFunction);
	}
	
	function startAnimEvent(){
		stopAnimEvent(); // stop currently playing (if any)
		animEvent = script.createEvent("UpdateEvent");
		animEvent.bind(animation);
		isPlaying = true;
	}
	
	function stopAnimEvent(){
		if(animEvent){
			script.removeEvent(animEvent);
			animEvent = null;
		}
		isPlaying = false;
	}
}



function clamp(value, low, high){
	if(!low && low !== 0) low = 0; // assume low, high to be 0, 1 if not given
	if(!high && high !== 0) high = 1;
	return Math.max(Math.min(value, Math.max(low, high)), Math.min(low, high));
}



var EaseFunctions = {
	Cubic: {
		In: function (k) {
			return k * k * k;
		},
		Out: function (k) {
			return --k * k * k + 1;
		},
		InOut: function (k) {
			if ((k *= 2) < 1) {
				return 0.5 * k * k * k;
			}
			return 0.5 * ((k -= 2) * k * k + 2);
		}
	}
};






// Interp - Simplified 'Interp' from LSQuickScripts https://github.com/max-van-leeuwen/SnapLensStudio-CodeSnippets/tree/main/LSQuickScripts. Not global, in case an updated LSQuickScripts is imported in this project as well.
//
// interp(startValue [Number], endValue [Number], t [Number], easing (optional) [Function], unclamped (optional) [bool]) : Number
// 	Returns the value of t interpolated using an Easing Function, remapped to start and end values.
//	Is identical to a linear lerp() when no Easing Function is given.
//	Use one of the Easing Functions in global.EaseFunctions, or use your own!
//
// 		Examples, [-5, 5] at position x:
// 			Cubic in/out	interp(-5, 5, x, EaseFunctions.Cubic.InOut);
// 			Linear (lerp)	interp(-5, 5, x);
//			Custom			interp(-5, 5, x, function(v){ return v });


function interp(startValue, endValue, t, easing, unclamped){
	// set defaults
	if(typeof easing === 'undefined'){ // if no easing, do simple linear remap (lerp)
		return clamp(t) * (endValue-startValue) + startValue;
	}else if(typeof easing !== 'function'){
		throw new Error('No valid Easing Function given for interp!');
	}

	// don't overshoot
	if(!unclamped) t = clamp(t);

	// ease and remap
	return easing(t) * (endValue-startValue) + startValue;
}






// parseNewLines - Simplified 'parseNewLines' from LSQuickScripts https://github.com/max-van-leeuwen/SnapLensStudio-CodeSnippets/tree/main/LSQuickScripts. Not global, in case an updated LSQuickScripts is imported in this project as well.
//
// Takes a string passed in through an input string field containing '\n', and returns the same string but with real newlines (for use in a Text Component, for example).


function parseNewLines(txt){
	var parsed = "";
	var txtSplits = txt.split('\\n');
	for(var i = 0; i < txtSplits.length; i++){
		parsed += txtSplits[i] + '\n';
	}
	return parsed;
}