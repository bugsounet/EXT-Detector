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
      device: "default"
    },
    types: {
      default: "default.png"
    },
    Snowboy: {
      useSnowboy: true,
      audioGain: 2.0,
      applyFrontend: true, // When you use only `snowboy` and `smart_mirror`, `false` is better. But with other models, `true` is better.
      detectors: [
        {
          Model: "jarvis",
          Sensitivity: null,
          Type: "google",
          autoRestart: false,
          onDetected: {
            notification: "GA_ACTIVATE",
            parameters: null
          }
        },
        {
          Model: "alexa",
          Sensitivity: null,
          Type: "alexa",
          autoRestart: false,
          onDetected: {
            notification: "ALEXA_ACTIVATE",
            parameters: null
          }
        }
      ]
    },
    Porcupine: {
      usePorcupine: true,
      detectors: [
        {
          Model: "ok google",
          Sensitivity: 0.8,
          Type: "google",
          autoRestart: false,
          onDetected: {
            notification: "GA_ACTIVATE"
          }
        },
        {
          Model: "hey google",
          Sensitivity: 0.9,
          Type: "google",
          autoRestart: false,
          onDetected: {
            notification: "GA_ACTIVATE"
          }
        },
        {
          Model: "jarvis",
          Sensitivity: 0.7,
          Type: "google",
          autoRestart: false,
          onDetected: {
            notification: "GA_ACTIVATE"
          }
        },
        {
          Model: "alexa",
          Sensitivity: 0.8,
          Type: "alexa",
          autoRestart: false,
          onDetected: {
            notification: "ALEXA_ACTIVATE"
          }
        },
        {
          Model: "hey siri",
          Sensitivity: 0.9,
          Type: "siri",
          autoRestart: true,
          onDetected: {
            notification: "SHOW_ALERT",
            parameters: {
              type: "notification" ,
              message: "Detected: hey siri",
              title: "MMM-Porcupine",
              timer: 5*1000
            }
          }
        }
      ]
    }
  },

  start: function() {
    this.displayType= []
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
        console.log("[DETECTOR] Detected:", payload.key, "From:", payload.from)
        if (payload.from == "Porcupine") {
          this.config.Porcupine.detectors.forEach(detector => {
            if (detector.Model === payload.key) {
              if (detector.Type) this.refreshLogo(detector.Type, true)
              else this.refreshLogo("default", true)
              this.sendNotification(detector.onDetected.notification, detector.onDetected.parameters)
              if (detector.autoRestart) setTimeout(() => { this.sendSocketNotification('START') }, 500)
            }
          })
        }
        if (payload.from == "Snowboy") {
          this.config.Snowboy.detectors.forEach(detector => {
            if (detector.Model === payload.key) {
              if (detector.Type) this.refreshLogo(detector.Type, true)
              else this.refreshLogo("default", true)
              this.sendNotification(detector.onDetected.notification, detector.onDetected.parameters)
              if (detector.autoRestart) setTimeout(() => { this.sendSocketNotification('START') }, 500)
            }
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
    if (this.config.Porcupine.usePorcupine) {
      this.config.Porcupine.detectors.forEach(detector => {
        if (detector.Type) Type.push(detector.Type)
        else Type.push("default")
      })
    }
    if (this.config.Snowboy.useSnowboy) {
      this.config.Snowboy.detectors.forEach(detector => {
        if (detector.Type) Type.push(detector.Type)
        else Type.push("default")
      })
    }
    let uniqueType = [...new Set(Type)]
    return uniqueType
  }
})
