/*
 * @license Copyright 2020 S4 NetQuest, LTD.
 * @preserve version	1.0.1
 * @preserve date	04.20.2020
 *
 * Interaction with biodigital human API
 *
 * REVISIONS
 * 20200416 SHS - Initial commit
 * 20200420 SHS - Removed leftover code, dev key assigned to window in index.html
 */

//Storyline
var player = new Player().init();
var chapters = [];

if (player != null) {
  document.getElementById("myWidget").setAttribute("src", player.GetVar("biodigitalPath") + '&dk=' + window.biodigitalDevKey + '&lang=' + player.GetVar("lang"));
}

var version = "1.0.1";
console.log("main.js version:",version);

var human = new HumanAPI("myWidget");

player.custom = function (data) {
  console.log('custom:', data);
  //Any custom code here
}

player.config = function (data) {
  var aOptions = [];
  console.log('config:', data);
  aOptions = Object.entries(data);
  for (var i = 0; i < aOptions.length; i++) {
    console.log('config:', aOptions[i][0], aOptions[i][1]);
    try {
      human.send(aOptions[i][0], aOptions[i][1]);
    } catch (e) {
      console.log(e);
    }
  }
}

/* call BDH API methods on the human object:
bookmark.set goes to a chapter in a tour and plays that chapter
*/
player.humanSend = function (data) {
  var aOptions = [];
  console.log('humanSend:', data);
  aOptions = Object.entries(data);
  for (var i = 0; i < aOptions.length; i++) {
    console.log('call humanSend:', aOptions[i][0], aOptions[i][1]);
    try {
      switch (aOptions[i][0]) {
        case "bookmark.set":
          var index = aOptions[i][1].index;
          var chId = chapters[index];
          human.send("timeline.play", {
            chapterId: chId, // target chapter ID
            loop: false, // do not loop
            numChapters: 1 // only play though 1 chapter
          });
          break;
        default:
          human.send(aOptions[i][0], aOptions[i][1]);
      }

    } catch (e) {
      console.log(e);
    }
  }
}

//Events dispatched from Storyline via custom javascript triggers. Event listeners added in recursive function in Player-1.0.0.js since that's where it finds the iframe's parent window which contains the storyline player.
function storyEvent(detail) {
  var eventData = typeof (detail.data) == 'object' ? detail.data : {};

  switch (detail.eventName) {
    case 'custom':
      player.custom(eventData);
      break;
    case 'config':
      player.config(eventData);
      break;
    case 'humanSend':
      player.humanSend(eventData);
      break;
  }

}

human.once("human.ready", function () {
  console.log("***human.ready***");
  player.SetVar("humanReady", Math.random().toString().slice(2, 11));

  human.send("timeline.info", function (data) {
    console.log("data.chapters: ", data.chapters);
    chapters = data.chapters;
  });

  human.on("timeline.chapterTransition", function (e) {
    console.log("chapterTransition", e.currentChapter)
    player.SetVar("woSceneChanged", e.currentChapter.toString());
  });

});


