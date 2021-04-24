//
// Module : MMM-Porcupine
// @bugsounet
//

Module.register("MMM-Porcupine", {
  defaults: {
    debug: false,
    autoStart: true,
    micConfig: {
      recorder: "auto",
      device: "plughw:0"
    },
    detectors: [
      {
        Model: "alexa",
        Sensitivity: 0.7,
        onDetected: {
          notification: "ALEXA_ACTIVATE",
          parameters: null
        }
      },
      {
        Model: "ok google",
        Sensitivity: 0.7,
        onDetected: {
          notification: "GA_ACTIVATE",
          parameters: null
        }
      },
      {
        Model: "hey google",
        Sensitivity: 0.7,
        onDetected: {
          notification: "GA_ACTIVATE",
          parameters: null
        }
      },
      {
        Model: "jarvis",
        Sensitivity: 0.7,
        onDetected: {
          notification: "GA_ACTIVATE",
          parameters: null
        }
      }
    ]
  },

  start: function() {
    this.sendSocketNotification('INIT', this.config)
  },

  notificationReceived: function(notification, payload) {
    switch (notification) {
      case "DETECTOR_START":
      case "SNOWBOY_START":
        this.sendSocketNotification('START')
        break
      case "DETECTOR_STOP":
        this.sendSocketNotification('STOP')
        break
    }
  },

  socketNotificationReceived: function(notification, payload) {
    switch (notification) {
      case "DETECTED":
      console.log("detected:", payload)
        this.config.detectors.forEach(detector => {
          if (detector.Model === payload) {
            this.sendNotification(detector.onDetected.notification, detector.onDetected.parameters)
          }
        })
        break
    }
  }
})
