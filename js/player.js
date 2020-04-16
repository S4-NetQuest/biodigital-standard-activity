/*
 * @license Copyright 2020 S4 NetQuest, LTD.
 * @preserve version	1.0.3
 * @preserve date	04.15.2020
 *
 * Recursive function to find Storyline Player in up to 7 nested parent windows
 *
 * REVISIONS
 * 20180604 SHS -
 * 20180718 JPK - add polyfillCustomEventConstructor function to polyfill the player window if needed (for IE)
 * 20181228 SHS - Try removing event listener before adding it, and only add/remove events listeners on the final call of tryGetPlayer (after the while loop of findAPI() is done).
 */

(function (window) {
  Player.prototype.CLASS_NAME = "Player";

  function Player() {
    this._findAPITries = 0;
    this._storyEventHandler = function(e) {
      //console.log('storyEvent fired:',e.detail);
      storyEvent(e.detail);
    }
  }

    Player.prototype.init = function() {
      //console.log("Player.js");

      var self = this;

      function tryGetPlayer(win,final) {
        //console.log("tryGetPlayer");
        try {
          win.GetPlayer();
        } catch (e) {
          //console.log("returning null");
          return null;
        }

        polyfillCustomEventConstructor(win);

        if(final) {
          try{
            win.removeEventListener('storyEvent', self._storyEventHandler);
            win.storyEventListener = false;
            //console.log("removeEventListener storyEvent");
          } catch(e) {
            console.log(e);
          }
          win.addEventListener('storyEvent', self._storyEventHandler);
          //console.log("addEventListener storyEvent");
          win.storyEventListener = true;
        }

        return win.GetPlayer();
      }

      function findAPI(win) {
        //console.log("findAPI");
        // Check to see if the window (win) contains the API if the window (win) does
        // not contain the API and the window (win) has a parent window and the parent
        // window is not the same as the window (win)
        while ((tryGetPlayer(win) == null) && (win.parent != null) && (win.parent != win)) {
          // increment the number of this._findAPITries
          this._findAPITries++;

          // Note: 7 is an arbitrary number, but should be more than sufficient
          if (this._findAPITries > 7) {
            console.log("Error finding API -- too deeply nested.");
            return null;
          }

          // set the variable that represents the window being being searched to be the
          // parent of the current window then search for the API again
          win = win.parent;
        }
        return tryGetPlayer(win,true);
      }

      function getAPI() {
        //console.log("getAPI");
        // start by looking for the API in the current window
        var theAPI = findAPI(window);

        // if the API is null (could not be found in the current window) and the current
        // window has an opener window
        if ((theAPI == null) && (window.opener != null) && (typeof(window.opener) != "undefined")) {
          // try to find the API in the current window’s opener
          theAPI = findAPI(window.opener);
        }
        // if the API has not been found
        if (theAPI == null) {
          // Alert the user that the API Adapter could not be found
          console.log("Unable to find an API adapter");
        }
        return theAPI;
      }

      function polyfillCustomEventConstructor(win) {
        // IE doesn't support CustomEvent constructor so polyfill CustomEvent on
        // the player level window if needed

        try {
          var ce = new win.CustomEvent('test', { cancelable: true });
          ce.preventDefault();
          if (ce.defaultPrevented !== true) {
            // IE has problems with .preventDefault() on custom events
            // http://stackoverflow.com/questions/23349191
            throw new Error('Could not prevent default');
          }
        } catch (e) {
          var CustomEvent = function(event, params) {
            var evt, origPrevent;
            params = params || {};
            params.bubbles = !!params.bubbles;
            params.cancelable = !!params.cancelable;

            evt = document.createEvent('CustomEvent');
            evt.initCustomEvent(
              event,
              params.bubbles,
              params.cancelable,
              params.detail
            );
            origPrevent = evt.preventDefault;
            evt.preventDefault = function() {
              origPrevent.call(this);
              try {
                Object.defineProperty(this, 'defaultPrevented', {
                  get: function() {
                    return true;
                  }
                });
              } catch (e) {
                this.defaultPrevented = true;
              }
            };
            return evt;
          };

          CustomEvent.prototype = win.Event.prototype;
          win.CustomEvent = CustomEvent; // expose definition to window
        }
      }

      return getAPI();
    }

    window.Player = Player;
}(window));