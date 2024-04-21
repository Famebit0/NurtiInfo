/*
    Detector assumes that if using front camera, palms are somewhat facing camera, 
    and if using back camera, palms mostly are facing away from camera
    
    Once the detector detects left or right, it will not reset until 
    hand tracking is lost or LRHandDetector.reset() is called
*/

// Input parameter for the object to toggle
//@input SceneObject toggleObject

var LRHandDetector = script.getSceneObject().getParent().getComponent("Component.ScriptComponent").api.LRHandDetector;
var textField = script.getSceneObject().getChildrenCount() > 0 ? script.getSceneObject().getChild(0).getComponent("Component.Text") : undefined;

//set to a number between 0 and 1 -- 0 is instant determination but has a small chance of error
LRHandDetector.minConfidence = 0.0;

// Add a debounce mechanism
var debounceTimeout = 500; // Adjust this value as needed
var lastToggleTime = 0;

script.createEvent("UpdateEvent").bind(function() { 
    var currentTime = getTime();
    var text = "No Hands Detected";
    var rightHandDetected = LRHandDetector.rightHandDetected();

    if (LRHandDetector.leftHandDetected()) {
        text = "Left Hand Detected";
    } else if (rightHandDetected && script.toggleObject && currentTime - lastToggleTime > debounceTimeout) {
        text = "Right Hand Detected";
        // Toggle the object visibility
        script.toggleObject.enabled = !script.toggleObject.enabled;
        lastToggleTime = currentTime;
    }

    if (textField != undefined) {
        textField.text = text;
    }
});

function getTime() {
    return new Date().getTime();
}
