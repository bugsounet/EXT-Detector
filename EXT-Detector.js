//
// Module : EXT-Detector v2
// Snowboy and Porcupine keywords listener for GA
// @bugsounet
//

Module.register("EXT-Detector", {
  requiresVersion: "2.22.0",
  defaults: {
    debug: false,
    useIcon: true,
    touchOnly: false,
    porcupineAccessKey: null,
    porcupineCustomModel: null,
    snowboyMicConfig: {
      audioGain: 2.0,
      applyFrontend: true // When you use only `snowboy` and `smart_mirror`, `false` is better. But with other models, `true` is better.
    },
    detectors: [
      {
        detector: "Snowboy",
        Model: "jarvis",
        Sensitivity: null
      },
      {
        detector: "Porcupine",
        Model: "ok google",
        Sensitivity: null
      },
      {
        detector: "Porcupine",
        Model: "hey google",
        Sensitivity: null
      }
    ]
  },

  start: function() {
    this.ready = false
    this.config.mic= {
      recorder: "auto",
      device: "default"
    }
    this.config.snowboyMicConfig= configMerge({}, this.config.mic, this.config.snowboyMicConfig)
    if (this.config.touchOnly) this.config.useIcon = true
    this.visual = new DetectorVisual(this)
  },

  notificationReceived: function(notification, payload, sender) {
    switch (notification) {
      case "EXT_DETECTOR-START":
        if (this.ready) this.sendSocketNotification("START")
        break
      case "EXT_DETECTOR-STOP":
        if (this.ready) this.sendSocketNotification("STOP")
        break
      case "GW_READY":
        if (sender.name == "Gateway") this.sendSocketNotification("INIT", this.config)
        break
    }
  },

  socketNotificationReceived: function(notification, payload) {
    switch (notification) {
      case "INITIALIZED":
        this.sendNotification("EXT_HELLO", this.name)
        this.ready = true
        break
      case "NOT_INITIALIZED":
        this.sendNotification("EXT_ALERT", {
          message: "Error: No detectors found, please review your configuration",
          type: "error"
        })
        break
      case "WARNING":
      case "ERROR":
        this.sendNotification("EXT_ALERT", {
          message: "Error when loading " + payload.library + " library. Try `npm run rebuild` in EXT-Detector directory",
          type: "error"
        })
        break
      case "ACCESSKEY":
        this.sendNotification("EXT_ALERT", {
          message: "Error: No porcupineAccessKey provided in config",
          type: "error"
        })
        break
      case "PORCUPINENOTINIT":
        this.sendNotification("EXT_ALERT", {
          message: "Error: Can't start Porcupine detector",
          type: "error"
        })
      case "LISTENING":
        this.visual.DetectorRefreshLogo(this,false)
        break
      case "DETECTED":
        this.visual.DetectorActivateWord(this)
        break
      case "DISABLED":
        this.visual.DetectorDisabled(this)
        break
    }
  },

  getStyles: function(){
    return [ this.file("EXT-Detector.css") ]
  },

  getScripts: function() {
    return [ "/modules/EXT-Detector/components/visual.js" ]
  },

  getDom: function() {
    return this.visual.DetectorDom(this)
  }
})
