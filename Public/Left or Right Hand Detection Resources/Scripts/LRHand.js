// -----JS CODE-----
//@input Component.Camera camera
//@input Component.ObjectTracking Arm3
//@input Component.ObjectTracking Index2
//@input Component.ObjectTracking Pinky3

function LRHand() {
      
    this.wasTrackingHand = false    
    
    this.minConfidence = 0.0
    
    this.currentConfidence = 0.00
    
    this.confidences = []
    
    
    this.determinedHand = this.NONE
    
    this.aspectRatio = new vec2(1,1)
    
     
    this.i2 = script.Index2
    this.p3 = script.Pinky3
    this.a3 = script.Arm3
    
    if (this.i2 == undefined) {
        print("ERROR: Could not find hand joint 'index 2'.  Make sure script inputs are correct.")
        return
    }
    
    if (this.a3 == undefined) {
        print("ERROR: Could not find hand joint 'arm 3'.  Make sure script inputs are correct.")
        return
    }
    
    if (this.p3 == undefined) {
        print("ERROR: Could not find hand joint 'pinky 3'.  Make sure script inputs are correct.")
        return
    }
    
    if (script.camera == undefined) {
        print("ERROR: Please setup camera in script inputs")
        return
    }
   
    this.reset()
    this.init()
}

LRHand.prototype.NONE = 0
LRHand.prototype.LEFT = 1
LRHand.prototype.RIGHT = 2

LRHand.prototype.leftHandDetected = function() {
    
    return this.determinedHand == this.LEFT && this.currentConfidence >= this.minConfidence
}

LRHand.prototype.rightHandDetected = function() {
    return this.determinedHand == this.RIGHT && this.currentConfidence >= this.minConfidence
}

LRHand.prototype.handTracking = null
LRHand.prototype.jointDict = {}

LRHand.prototype.init = function() {
    var self = this
    
    script.createEvent("TurnOnEvent").bind(function (eventData) {
      
        var asp = script.camera.aspect
        self.aspectRatio = new vec2(asp / (asp + 1), 1 / (asp + 1))
        
    });
       
    script.createEvent("UpdateEvent").bind(function() {
        
        var isTracking = self.i2.isTracking()
       
        if (!isTracking) {
            if (self.wasTrackingHand) {
                self.reset()
            }                
            
            
            return
        } 
        
        
        
        self.wasTrackingHand = true
        
        self.updateHandDetection()
        
    });   
}

LRHand.prototype.reset = function() {
    this.confidences = [0, 0, 0, 0, 0, 0, 0, 0]
    this.determinedHand = this.NONE
    this.currentConfidence = 0
    this.wasTrackingHand = false
}

LRHand.prototype.denormalize = function(pt) {
    return pt.getSceneObject().getComponent("Component.ScreenTransform").anchors.getCenter().mult(this.aspectRatio)
}

LRHand.prototype.rotatePoint = function(c, pt, radians) {
    var cos = Math.cos(radians),
        sin = Math.sin(radians),
        nx = (cos * (pt.x - c.x)) + (sin * (pt.y - c.y)) + c.x,
        ny = (cos * (pt.y - c.y)) - (sin * (pt.x - c.x)) + c.y;
    return new vec2(nx, ny);
}

LRHand.prototype.updateHandDetection = function() {
    var arm = this.denormalize(this.a3)
    var index = this.denormalize(this.i2)
    var pinky = this.denormalize(this.p3)
    var diff = arm.sub(pinky) 
    
    var angle = Math.atan2(diff.y, diff.x) + Math.PI / 2
    
    index = this.rotatePoint(arm, index, angle);
       
    //print(angle * 180/Math.PI)
    
    var val = (index.x - arm.x) > 0 ? 1 : -1;    
   
    
    this.confidences.shift()
    this.confidences.push(val)
    
    var avg = 0;
    var zeroCount = 0
    for (var i=0; i<this.confidences.length; i++) {
        avg += this.confidences[i]
        if (this.confidences[i] == 0) zeroCount += 1;
    }
    avg /= this.confidences.length
    
   
    if (!this.determinedHand) {
        
        this.currentConfidence = Math.abs(avg)
        
        if (Math.abs(avg) >= this.minConfidence) {
            this.determinedHand = avg > 0 ? this.LEFT : this.RIGHT
        } 
        
    } 
}


script.api.LRHandDetector = new LRHand()