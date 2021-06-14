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
    micConfig: {
      recorder: "auto",
      device: "default",
      // only for snowboy:
      audioGain: 2.0,
      applyFrontend: true // When you use only `snowboy` and `smart_mirror`, `false` is better. But with other models, `true` is better.
    },
    types: {
      default: "default.png"
    },
    detectors: [
      {
        detector: "Snowboy",
        Model: "jarvis",
        Sensitivity: null,
        Type: "google",
        autoRestart: false,
        onDetected: {
          notification: "GA_ACTIVATE"
        }
      },
      {
        detector: "Snowboy",
        Model: "alexa",
        Sensitivity: null,
        Type: "alexa",
        autoRestart: false,
        onDetected: {
          notification: "ALEXA_ACTIVATE"
        }
      },
      {
        detector: "Porcupine",
        Model: "ok google",
        Sensitivity: null,
        Type: "google",
        autoRestart: false,
        onDetected: {
          notification: "GA_ACTIVATE"
        }
      },
      {
        detector: "Porcupine",
        Model: "hey google",
        Sensitivity: null,
        Type: "google",
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
    this.displayType= []
    this.listening = false
    this.types= {
      google: this.file("resources/google.png"),
      alexa: this.file("resources/alexa.png"),
      siri: this.file("resources/siri.png"),
      default: this.file("resources/default.png")
    }
    if (Object.keys(this.config.types).length > 0) {
      for (let [type, logo] of Object.entries(this.config.types)) {
        this.config.types[type] = this.file("resources/" + logo)
      }
    }
    this.types = configMerge({}, this.types, this.config.types)
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
    this.displayType = this.typesList()
    var wrapper = document.createElement('div')
    wrapper.id = "DETECTOR-WRAPPER"

    if (this.config.useLogos) {
      this.displayType.forEach(type => {
        var icon = document.createElement('div')
        icon.id= "ICON"
        icon.className = type
        icon.style.backgroundImage = "url("+this.types[type]+")"
        icon.classList.add("busy")
        if (this.config.useLogos) {
          icon.onclick = (event)=> {
            event.stopPropagation()
            this.clickCheck(type)
          }
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

  refreshLogo: function(wantedType, discover) {
    if (!this.config.useLogos) return
    if (discover) this.listening = false
    else this.listening = true
    this.displayType.forEach(type => {
      var icon = document.getElementsByClassName(type)[0]
      if (discover) {
        if (type != wantedType) icon.classList.add("busy")
        else {
          icon.classList.remove("busy")
          icon.classList.add("flash")
        }
      }
      if (!discover) {
        icon.classList.remove("busy")
        icon.classList.remove("flash")
      }
    })
  },

  disabled: function() {
    if (!this.config.useLogos) return
    this.listening = false
    this.displayType.forEach(type => {
      var icon = document.getElementsByClassName(type)[0]
      icon.classList.add("busy")
      icon.classList.remove("flash")
    })
  },

  /** Tools **/

  /** return icons to display and remove duplicate **/
  typesList: function() {
    let Type = []
    this.config.detectors.forEach(detector => {
      if (detector.Type) Type.push(detector.Type)
      else Type.push("default")
    })
    let uniqueType = [...new Set(Type)]
    return uniqueType
  },

  clickCheck: function(type) {
    if (!type || !this.listening) return
    let Activate = []
    Activate = this.config.detectors.filter(detector => detector.Type == type)
    if (Activate.length) {
      this.clickActivate(Activate[0],type)
      return console.log("[DETECTOR] ~Touch~ " + Activate[0].detector + " found:", Activate[0].onDetected)
    }
  },

  clickActivate: function (params, type) {
    this.sendSocketNotification('STOP')
    this.refreshLogo(type, true)
    this.sendNotification(params.onDetected.notification, params.onDetected.params)
    if (params.autoRestart) setTimeout(() => { this.sendSocketNotification('START') }, 500)
  },

  activateWord: function (detector) {
    if (detector.Type) this.refreshLogo(detector.Type, true)
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
