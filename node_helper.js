/** MMM-Porcupine helper **/

"use strict"
const Porcupine = require("@bugsounet/porcupine")
const Snowboy = require("@bugsounet/snowboy").SnowboyV2
var NodeHelper = require("node_helper")

let log = function() {
  var context = "[DETECTOR]"
  return Function.prototype.bind.call(console.log, console, context)
}()

module.exports = NodeHelper.create({
  start: function () {
    console.log("[DETECTOR] MMM-Detector Version:", require('./package.json').version , "rev:", require('./package.json').rev)
    this.config = {}
    this.porcupine = null
    this.porcupineConfig = []
    this.snowboyConfig = {}
    this.snowboy = null
    this.detector = false
  },

  socketNotificationReceived: function (notification, payload) {
    switch(notification) {
      case "INIT":
        this.config = payload
        this.initialize()
        break
      case "START":
        if (!this.running) this.activate()
        break
      case "STOP":
        if (this.running) this.deactivate()
        break
    }
  },

  initialize: async function() {
    var debug = (this.config.debug) ? this.config.debug : false
    log("Config:", this.config)
    if (!this.config.debug) log = () => { /* do nothing */ }

    if (this.config.Porcupine.usePorcupine) {
      /* Porcupine init */
      this.config.Porcupine.detectors.forEach(detector => {
        const values = {}
        if (detector.Model) {
          values.Model= detector.Model
          values.Sensitivity= detector.Sensitivity ? detector.Sensitivity: 0.6
          this.porcupineConfig.push(values)
        }
      })
      this.porcupine = await new Porcupine(this.porcupineConfig, this.config.micConfig, detect => this.onDetected("porcupine", detect), this.config.debug)
    }

    if (this.config.Snowboy.useSnowboy) {
      /* Snowboy init */
      this.snowboyConfig = this.config.Snowboy.detectors
      log("Snowboy DetectorConfig:", this.snowboyConfig)
      this.snowboy = new Snowboy(this.snowboyConfig, this.config.micConfig, detect => this.onDetected("snowboy", detect), this.config.debug)
      this.snowboy.init()
      log("[DETECTOR] Snowboy is initialized with", this.snowboy.modelsNumber(), "Models")
    }

    if (this.config.autoStart) this.activate()
  },
  
  activate: async function() {
    if (this.porcupine) {
      this.porcupine.init()
      this.porcupine.start()
      this.detector = true
    }
    if (this.snowboy) {
      this.snowboy.start()
      this.detector = true
    }
    if (this.detector) {
      this.running = true
      this.sendSocketNotification("LISTENING")
    }
    else console.error("[DETECTOR] No detector initialized!")
  },

  onDetected: function (from, detected) {
    this.deactivate()
    this.sendSocketNotification("DETECTED", { from: from, key: detected } )
  },

  deactivate: function() {
    if (this.porcupine) {
      this.porcupine.stop()
      this.detector = false
    }
    if (this.snowboy) {
      this.snowboy.stop()
      this.detector= false
    }
    if (!this.detecor) {
      this.running = false
      this.sendSocketNotification("DISABLED")
    }
  }
})
