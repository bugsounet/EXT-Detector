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
    console.log("[PORCUPINE] MMM-Porcupine Version:", require('./package.json').version)
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
    if (!this.config.debug) log = () => { /* do nothing */ }
    this.config.detectors.forEach(detector => {
      const values = {}
      if (detector.Model) {
        values.Model= detector.Model
        values.Sensitivity= detector.Sensitivity ? detector.Sensitivity: 0.6
        this.porcupineConfig.push(values)
      }
    })
    if (this.porcupineConfig.length == 0) return console.log("[PORCUPINE] No Model set!")
    this.porcupine = new Porcupine(this.porcupineConfig, this.config.micConfig, detect => this.onDetected(detect), this.config.debug)
    console.log("[PORCUPINE] MMM-Porcupine is now initialized!")
    if (this.config.autoStart) this.activate()
  },
  
  activate: async function() {
    this.porcupine.init()
    this.startListening()
    this.running = true
  },

  onDetected: function (detected) {
    this.deactivate()
    this.sendSocketNotification("DETECTED", detected)
  },

  deactivate: function() {
    this.stopListening()
    this.running = false
  },

  startListening: function() {
    this.porcupine.start()
  },

  stopListening: function () {
    this.porcupine.stop()
  }
})
