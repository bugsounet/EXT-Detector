//
// Module : EXT-Detector
// Snowboy and Porcupine keywords listener for GAv4
// @bugsounet
//

Module.register("EXT-Detector", {
  defaults: {
    debug: false,
    useIcon: true,
    touchOnly: false,
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
    this.listening = false
    this.logoGoogle= this.file("resources/google.png")
    this.micConfig= {
      recorder: "auto",
      device: "default"
    }
    this.config.mic= this.micConfig
    this.config.snowboyMicConfig= configMerge({}, this.config.mic, this.config.snowboyMicConfig)
    if (this.config.touchOnly) this.config.useIcon = true
    this.sendSocketNotification("INIT", this.config)
  },

  notificationReceived: function(notification, payload) {
    switch (notification) {
      case "EXT_DETECTOR-START":
        if (this.ready) this.sendSocketNotification("START")
        break
      case "EXT_DETECTOR-STOP":
        if (this.ready) this.sendSocketNotification("STOP")
        break
      case "GAv4_READY": // auto activate with GAv4
        this.sendNotification("EXT_HELLO", this.name)
        this.ready = true
        break
    }
  },

  socketNotificationReceived: function(notification, payload) {
    switch (notification) {
      case "LISTENING":
        this.refreshLogo(false)
        break
      case "DETECTED":
        this.activateWord()
        break
      case "DISABLED":
        this.disabled()
        break
      case "ERROR":
        this.sendNotification("EXT_ALERT", {
          message: "Error when loading " + payload + " library. Try `npm run rebuild` in EXT-Detector directory",
          type: "error"
        })
        break
      case "NOT_INITIALIZED":
        this.sendNotification("EXT_ALERT", {
          message: "Error: No detectors found, please review your configuration",
          type: "error"
        })
        break
    }
  },

  getDom: function() {
    var wrapper = document.createElement('div')
    wrapper.id = "EXT_DETECTOR"

    if (this.config.useIcon) {
      var icon = document.createElement('div')
      icon.id= "EXT_DETECTOR-ICON"
      icon.style.backgroundImage = "url("+this.logoGoogle+")"
      icon.classList.add("busy")
      icon.onclick = (event)=> {
        event.stopPropagation()
        this.clickCheck()
      }
      wrapper.appendChild(icon)
    }
    else wrapper.className = "hidden"
    return wrapper
  },

  getStyles: function(){
    return [
      this.file("EXT-Detector.css")
    ]
  },

  refreshLogo: function(disabled) {
    if (!this.config.useIcon) return
    var icon = document.getElementById("EXT_DETECTOR-ICON")
    if (disabled) {
      this.listening = false
      icon.classList.remove("busy")
      icon.classList.add("flash")
    } else {
      this.listening = true
      icon.classList.remove("busy")
      icon.classList.remove("flash")
    }
  },

  disabled: function() {
    if (!this.config.useIcon) return
    this.listening = false
    var icon = document.getElementById("EXT_DETECTOR-ICON")
    icon.classList.add("busy")
    icon.classList.remove("flash")
  },

  clickCheck: function() {
    if (!this.listening) return
    console.log("[DETECTOR] ~Activate by Touch~")
    this.clickActivate()
  },

  clickActivate: function () {
    this.sendSocketNotification("STOP", false) // stop and don't send DISABLED callback
    this.listening = false
    this.activateWord()
  },

  activateWord: function () {
    this.refreshLogo(true)
    console.log("[DETECTOR] ~Activate GAv4~")
    this.sendNotification("GAv4_ACTIVATE")
  }
})
