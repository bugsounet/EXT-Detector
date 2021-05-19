/** MMM-Porcupine helper **/

"use strict"
const Porcupine = require("@bugsounet/porcupine")
var NodeHelper = require("node_helper")

let log = function() {
  var context = "[PORCUPINE]"
  return Function.prototype.bind.call(console.log, console, context)
}()

module.exports = NodeHelper.create({
  start: function () {
    console.log("[PORCUPINE] MMM-Porcupine Version:", require('./package.json').version , "rev:", require('./package.json').rev)
    this.config = {}
    this.porcupine = null
    this.porcupineConfig = []
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
    this.config.detectors.forEach(detector => {
      const values = {}
      if (detector.Model) {
        values.Model= detector.Model
        values.Sensitivity= detector.Sensitivity ? detector.Sensitivity: 0.6
        this.porcupineConfig.push(values)
      }
    })

    this.porcupine = await new Porcupine(this.porcupineConfig, this.config.micConfig, detect => this.onDetected(detect), this.config.debug)
    if (this.config.autoStart) this.activate()
  },
  
  activate: async function() {
    if (!this.porcupine) return
    this.porcupine.init()
    this.porcupine.start()
    this.running = true
    this.sendSocketNotification("LISTENING")
  },

  onDetected: function (detected) {
    this.deactivate()
    this.sendSocketNotification("DETECTED", detected )
  },

  deactivate: function() {
    if (!this.porcupine) return
    this.porcupine.stop()
    this.running = false
    this.sendSocketNotification("DISABLED")
  }
})
