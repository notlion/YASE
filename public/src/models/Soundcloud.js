define(function (require) {

  "use strict";

  var Backbone = require("backbone")
    , _        = require("underscore")
    , SC       = require("soundcloud");


  var Soundcloud = Backbone.Model.extend({

    defaults: function () {
      var num_bands = 256;
      return {
        time_begin: 0,
        time: 0,
        progress: 0,
        num_bands: num_bands,
        eq_left: new Uint8Array(num_bands),
        eq_right: new Uint8Array(num_bands),
        eq_mix: 0.25
      };
    },

    initialize: function () {
      var SM = this.SM = window.soundManager = new SoundManager()
        , self = this;

      function whileSoundPlaying () {
        var eq_left = self.get("eq_left")
          , eq_right = self.get("eq_right")
          , eq_mix = self.get("eq_mix")
          , num_bands = self.get("num_bands")
          , i, amp_l, amp_r, zero = true;

        // Flash inexplicably sets eqData to all zeros intermittently, so we
        // check and ignore those frames.
        for(i = 0; i < num_bands; ++i) {
          if(this.eqData.left[i] + this.eqData.right[i] > 0) {
            zero = false; break;
          }
        }
        if(zero)
          return;

        for(i = 0; i < num_bands; ++i) {
          amp_l = this.eqData.left[i] * 255;
          amp_r = this.eqData.right[i] * 255;
          eq_left[i] += (amp_l - eq_left[i]) * eq_mix;
          eq_right[i] += (amp_r - eq_right[i]) * eq_mix;
        }
        self.change({
          changes: { eq_left: eq_left, eq_right: eq_right }
        });
        self.set("progress", this.position / this.durationEstimate);
      }

      function onSoundFinish () {
        self.trigger("finish", self);
        self.unset("playing_sound");
      }

      this.sm_options = {
        useEQData: true,
        autoPlay: false,
        multiShot: false,
        whileplaying: whileSoundPlaying,
        onfinish: onSoundFinish
      };

      SM.url = "/lib/soundmanager/";
      SM.flashVersion = 9;
      SM.debugMode = SM.debugFlash = false;
      SM.preferFlash = true;
      SM.useHTML5Audio = false;
      SM.useHighPerformance = true;
      SM.flashPollingInterval = 1000 / 60;
      SM.beginDelayedInit();
      SC.initialize({ client_id: "0edc2b5846f860f3aa21148493e30a8f" });
    },

    loadTrackData: function (url) {
      if(url == this.last_track_url_loaded)
        return;

      this.last_track_url_loaded = url;

      var self = this;

      SC.post("/resolve.json", { url: url }, function(res, err){
        if(err)
          console.error("Could not find track: %s", err.message);
        else if(url == self.last_track_url_loaded)
          self.queueTrack(res, url);
      });
    },

    queueTrack: function (track, url) {
      var self = this;
      if(track.kind == "track") {
        SC.stream(track.uri, this.sm_options, function (sound) {
          self.set("queued_sound", sound);
        });
      }
    },

    playQueued: function () {
      var sound = this.get("queued_sound");
      if(sound) {
        sound.play(this.sm_options);
        this.unset("queued_sound");
        this.set("playing_sound", sound);
      }
    }

  });

  return Soundcloud;

});
