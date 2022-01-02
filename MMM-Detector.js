//
// Module : MMM-Detector
// Snowboy and Porcupine keywords listener
// @bugsounet
//

Module.register("MMM-Detector", {
  defaults: {
    debug: false,
    autoStart: true,
    useLogos: true,
    touchOnly: false,
    snowboyMicConfig: {
      audioGain: 2.0,
      applyFrontend: true // When you use only `snowboy` and `smart_mirror`, `false` is better. But with other models, `true` is better.
    },
    newLogos: {
      default: "default.png"
    },
    detectors: [
      {
        detector: "Snowboy",
        Model: "jarvis",
        Sensitivity: null,
        Logo: "google",
        autoRestart: false,
        onDetected: {
          notification: "GA_ACTIVATE"
        }
      },
      {
        detector: "Snowboy",
        Model: "alexa",
        Sensitivity: null,
        Logo: "alexa",
        autoRestart: false,
        onDetected: {
          notification: "ALEXA_ACTIVATE"
        }
      },
      {
        detector: "Porcupine",
        Model: "ok google",
        Sensitivity: null,
        Logo: "google",
        autoRestart: false,
        onDetected: {
          notification: "GA_ACTIVATE"
        }
      },
      {
        detector: "Porcupine",
        Model: "hey google",
        Sensitivity: null,
        Logo: "google",
        autoRestart: false,
        onDetected: {
          notification: "GA_ACTIVATE"
        }
      }
    ],
    NPMCheck: {
      useChecker: true,
      delay: 10 * 60 * 1000,
      useAlert: true
    }
  },

  start: function() {
    this.displayLogo= []
    this.listening = false
    this.logos= {
      google: this.file("resources/google.png"),
      alexa: this.file("resources/alexa.png"),
      siri: this.file("resources/siri.png"),
      snowboy: this.file("resources/snowboy.png"),
      listen: this.file("resources/listen.png"),
      default: this.file("resources/default.png")
    }
    if (Object.keys(this.config.newLogos).length > 0) {
      for (let [name, logo] of Object.entries(this.config.newLogos)) {
        this.config.newLogos[name] = this.file("resources/" + logo)
      }
    }
    this.logos = configMerge({}, this.logos, this.config.newLogos)
    this.micConfig= {
      recorder: "auto",
      device: "default"
    }
    this.config.mic= this.micConfig
    this.config.snowboyMicConfig= configMerge({}, this.config.mic, this.config.snowboyMicConfig)
    if (this.config.touchOnly) this.config.useLogos = true
    this.sendSocketNotification('INIT', this.config)
  },

  notificationReceived: function(notification, payload) {
    switch (notification) {
      case "DETECTOR_START":
        this.sendSocketNotification('START')
        break
      case "DETECTOR_STOP":
        this.sendSocketNotification('STOP')
        break
    }
  },

  socketNotificationReceived: function(notification, payload) {
    switch (notification) {
      case "LISTENING":
        this.refreshLogo(null, false)
        break
      case "DETECTED":
        let Detected = []
        console.log("[DETECTOR] Detected:", payload.key, "From:", payload.from)
        // magic filter from detectors config !
        Detected = this.config.detectors.filter(detector => (
         detector.detector == payload.from &&
         detector.Model === payload.key
        ))

        if (Detected.length) {
          console.log("[DETECTOR] Send:", Detected[0])
          this.activateWord(Detected[0])
        } else { // should never happen ...
          this.sendNotification("SHOW_ALERT", {
            message: "Error when Detected: " + payload.key + " From: " + payload.from,
            title: "MMM-Detector",
            timer: 5000
          })
        }
        break
      case "DISABLED":
        this.disabled()
        break
      case "ERROR":
        this.sendNotification("SHOW_ALERT", {
          message: "Error when loading " + payload + " library. Try `npm run rebuild` in MMM-Detector directory",
          title: "MMM-Detector",
          timer: 0
        })
        break
      case "NOT_INITIALIZED":
        this.sendNotification("SHOW_ALERT", {
          message: "Error: No detectors found, please review your configuration",
          title: "MMM-Detector",
          timer: 0
        })
        break
      case "NPM_UPDATE":
        if (payload && payload.length > 0) {
          if (this.config.NPMCheck.useAlert) {
            payload.forEach(npm => {
              this.sendNotification("SHOW_ALERT", {
                type: "notification" ,
                message: "[NPM] " + npm.library + " v" + npm.installed +" -> v" + npm.latest,
                title: this.translate("UPDATE_NOTIFICATION_MODULE", { MODULE_NAME: npm.module }),
                timer: this.config.NPMCheck.delay - 2000
              })
            })
          }
          this.sendNotification("NPM_UPDATE", payload)
        }
        break
    }
  },

  getDom: function() {
    this.displayLogo = this.logoList()
    var wrapper = document.createElement('div')
    wrapper.id = "DETECTOR-WRAPPER"

    if (this.config.useLogos) {
      this.displayLogo.forEach(name => {
        var icon = document.createElement('div')
        icon.id= "ICON"
        icon.className = name
        icon.style.backgroundImage = "url("+this.logos[name]+")"
        icon.classList.add("busy")
        icon.onclick = (event)=> {
          event.stopPropagation()
          this.clickCheck(name)
        }
        wrapper.appendChild(icon)
      })
    }
    else wrapper.className = "hidden"
    return wrapper
  },

  getStyles: function(){
    return [
      this.file('MMM-Detector.css')
    ]
  },

  refreshLogo: function(wantedLogo, disabled) {
    if (!this.config.useLogos) return
    if (disabled) this.listening = false
    else this.listening = true
    this.displayLogo.forEach(name => {
      var icon = document.getElementsByClassName(name)[0]
      if (disabled) {
        if (name != wantedLogo) icon.classList.add("busy")
        else {
          icon.classList.remove("busy")
          icon.classList.add("flash")
        }
      }
      if (!disabled) {
        icon.classList.remove("busy")
        icon.classList.remove("flash")
      }
    })
  },

  disabled: function() {
    if (!this.config.useLogos) return
    this.listening = false
    this.displayLogo.forEach(name => {
      var icon = document.getElementsByClassName(name)[0]
      icon.classList.add("busy")
      icon.classList.remove("flash")
    })
  },

  /** Tools **/

  /** return icons to display and remove duplicate **/
  logoList: function() {
    let Logo = []
    this.config.detectors.forEach(detector => {
      if (detector.Logo) Logo.push(detector.Logo)
      else Logo.push("default")
    })
    let uniqueLogo = [...new Set(Logo)]
    return uniqueLogo
  },

  clickCheck: function(Logo) {
    if (!Logo || !this.listening) return
    let Activate = []
    Activate = this.config.detectors.filter(detector => detector.Logo == Logo)
    if (Activate.length) {
      this.clickActivate(Activate[0])
      return console.log("[DETECTOR] ~Touch~ " + Activate[0].detector + " found:", Activate[0].onDetected)
    }
  },

  clickActivate: function (params) {
    this.sendSocketNotification('STOP', false) // stop and don't send DISABLED callback
    this.listening = false
    this.refreshLogo(params.Logo, true)
    this.sendNotification(params.onDetected.notification, params.onDetected.params)
    if (params.autoRestart) setTimeout(() => { this.sendSocketNotification('START') }, 500)
  },

  activateWord: function (detector) {
    if (detector.Logo) this.refreshLogo(detector.Logo, true)
    else this.refreshLogo("default", true)
    if (detector.onDetected && detector.onDetected.notification) {
      this.sendNotification(detector.onDetected.notification, detector.onDetected.params)
    } else { // should never happen ...
      this.sendNotification("SHOW_ALERT", {
        message: "onDetected Error: No notification to send for " + detector.Model + " (" + detector.detector + ")",
        title: "MMM-Detector",
        timer: 5000
      })
      return setTimeout(() => { this.sendSocketNotification('START') }, 500)
    }
    if (detector.autoRestart) setTimeout(() => { this.sendSocketNotification('START') }, 500)
  }
})
