/**
 * Created by Frederik Brudy (fbrudy.net)
 */
'use strict';
var video1 = document.getElementById('video_1');
var video2 = document.getElementById('video_2');
var canvas1 = document.getElementById('canvas_1');
var ctx1 = canvas1.getContext('2d');
var canvas2 = document.getElementById('canvas_2');
var ctx2 = canvas2.getContext('2d');
var videoWidth, videoHeight;

var seeker = document.getElementById('seeker');
// Return seconds as MM:SS
var formatTime = function(seconds) {
    seconds = Math.round(seconds);
    var minutes = Math.floor(seconds / 60);
    minutes = (minutes >= 10) ? minutes : "0" + minutes;
    seconds = Math.floor(seconds % 60);
    seconds = (seconds >= 10) ? seconds : "0" + seconds;
    return minutes + ":" + seconds;
};
var progressControl = document.getElementById("progress");
var progressHolder = document.getElementById("progress_box");
var playProgressBar = document.getElementById("play_progress");
var currentTimeDisplay = document.getElementById("current_time_display");
var durationDisplay = document.getElementById("duration_display");
var playProgressInterval;

var playPause = function() {
    // toggle all video playing
    if (video1.paused) {
        video1.play();
        video2.play();
    }
    else {
        pauseAll();
    }
};

var pauseAll = function(){
    // pause all videos
    if(!video1.paused)
        video1.pause();
    if(!video2.paused)
        video2.pause();

    stopTrackingPlayProgress();

};

var sync = function(){
    // keep the time in sync. video1 is used as ground truth
    // and thus, manually manipulating video2's timer won't have any effect
    if (video1.paused || video1.ended)
        return;

    if (video2.readyState >= 4) {
        video2.currentTime = video1.currentTime;
    }
};


video1.addEventListener('play', function() {
    var ratio = video1.videoWidth / canvas1.width;
    videoWidth = video1.videoWidth / ratio;
    videoHeight = video1.videoHeight / ratio;
    video2.play();
    seeker.max = video1.duration;
    trackPlayProgress();
}, false);

video1.addEventListener('playing', function() {
    //trigger playback of video2 when video2 started
    video2.play();
}, false);
video1.addEventListener('pause', function() {
    pauseAll();
}, false);
video2.addEventListener('pause', function() {
    pauseAll();
}, false);

video1.addEventListener('seeked', function(){
    // when using the time seeker on video1
    sync();
}, false);


var manipulateImage = function() {
    // this demonstrates how the video data can be manipulated,
    // e.g. to draw images on top or do other video processing
    if (video1.paused || video1.ended) {
        return;
    }
    ctx1.drawImage(video1, 0, 0, videoWidth, videoHeight);
    var frame = ctx1.getImageData(0, 0, videoWidth, videoHeight);
    var l = frame.data.length / 4;


    //here the current frame is painted on a separate canvas element.
    // Other elements can be drawn on top of this here

    //greenscreen filter. Manipulates the alpha channel.
    // for (var i = 0; i < l; i++) {
    //     var r = frame.data[i * 4 + 0];
    //     var g = frame.data[i * 4 + 1];
    //     var b = frame.data[i * 4 + 2];
    //     var alpha = frame.data[i * 4 + 3];
    //     if (g > 100 && r > 100 && b < 43)
    //         frame.data[i * 4 + 3] = 0;
    //     //frame.data[i * 4 + 0] = 255; //sets red channel to full.
    // }

    //emboss filter
    for(var i = 0; i < frame.data.length; i++) {
        if( i%4 === 3 )//skip alpha channel
            continue;
        frame.data[i] = 127 + 2*frame.data[i] - frame.data[i + 4] - frame.data[i + frame.width*4];
    }
    ctx2.putImageData(frame, 0, 0);
};

var onAnimationFrame = function() {
    sync();
    manipulateImage();
    requestAnimationFrame(onAnimationFrame);
};
onAnimationFrame();





/* video seeker */


video1.ontimeupdate = function(){
    seeker.value = video1.currentTime;
};

var videoWasPlaying;
progressHolder.addEventListener("mousedown", function(){
    stopTrackingPlayProgress();

    if (video1.paused) {
        videoWasPlaying = false;
    } else {
        videoWasPlaying = true;
        video1.pause();
    }

    blockTextSelection();
    document.onmousemove = function(e) {
        setPlayProgress(e.pageX);
    };

    document.onmouseup = function() {
        unblockTextSelection();
        document.onmousemove = null;
        document.onmouseup = null;
        if (videoWasPlaying) {
            video1.play();
            trackPlayProgress();
        }
    }
}, true);

function blockTextSelection(){
    document.body.focus();
    document.onselectstart = function () { return false; };
}

function unblockTextSelection(){
    document.onselectstart = function () { return true; };
}

function findPosX(obj) {
    var curleft = obj.offsetLeft;
    while(obj = obj.offsetParent) {
        curleft += obj.offsetLeft;
    }
    return curleft;
}

progressHolder.addEventListener("mouseup", function(e){
    setPlayProgress(e.pageX);
}, true);

function sizeProgressBar(){
    progressControl.style.width = (controls.offsetWidth - 125) + "px";
    progressHolder.style.width = (progressControl.offsetWidth - 80) + "px";
    updatePlayProgress();
}

function trackPlayProgress(){
    playProgressInterval = setInterval(updatePlayProgress, 33);
}

function stopTrackingPlayProgress(){
    clearInterval(playProgressInterval);
}

function updatePlayProgress(){
    playProgressBar.style.width = ((video1.currentTime / video1.duration) * (progressHolder.offsetWidth - 2)) + "px";
    updateTimeDisplay();
}

function setPlayProgress(clickX) {
    var newPercent = Math.max(0, Math.min(1, (clickX - findPosX(progressHolder)) / progressHolder.offsetWidth));
    video1.currentTime = newPercent * video1.duration;
    playProgressBar.style.width = newPercent * (progressHolder.offsetWidth - 2)  + "px";
    updateTimeDisplay();
}

function updateTimeDisplay(){
    currentTimeDisplay.innerHTML = formatTime(video1.currentTime);
    if (video1.duration) durationDisplay.innerHTML = formatTime(video1.duration);
}
/* end video seeker*/
