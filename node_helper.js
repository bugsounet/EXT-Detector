/** MMM-Porcupine helper **/

"use strict"
const { getPlatform } = require("./platform.js")
var NodeHelper = require("node_helper")

let log = (...args) => { console.log("[DETECTOR]", ...args) }

module.exports = NodeHelper.create({
  start: function () {
    console.log("[DETECTOR] MMM-Detector Version:", require('./package.json').version , "rev:", require('./package.json').rev)
    this.config = {}
    this.porcupine = null
    this.porcupineConfig = []
    this.snowboyConfig = {}
    this.snowboy = null
    this.detector = false
    this.lib = {}
    this.PLATFORM_RECORDER = new Map()
    this.PLATFORM_RECORDER.set("linux", "arecord")
    this.PLATFORM_RECORDER.set("mac", "sox")
    this.PLATFORM_RECORDER.set("raspberry-pi", "arecord")
    this.PLATFORM_RECORDER.set("windows", "sox")
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
    log("Config:", this.config)

    /** Load @bugsounet libraries **/
    let bugsounet = await this.loadBugsounetLibrary()
    if (bugsounet) {
      console.error("[DETECTOR] Warning:", bugsounet, "@bugsounet library not loaded !")
      console.error("[DETECTOR] Try to solve it with `npm run rebuild` in MMM-Detector directory")
      return
    }
    else console.log("[DETECTOR] All needed @bugsounet library loaded !")

    if (this.config.NPMCheck.useChecker && this.lib.npmCheck) {
      var cfg = {
        dirName: __dirname,
        moduleName: this.name,
        timer: this.config.NPMCheck.delay,
        debug: this.config.debug
      }
      this.Checker= new this.lib.npmCheck(cfg, update => this.sendSocketNotification("NPM_UPDATE", update))
    }

    let platform
    try {
      platform = getPlatform()
    } catch (error) {
      console.error("[DETECTOR] The NodeJS binding does not support this platform. Supported platforms include macOS (x86_64), Windows (x86_64), Linux (x86_64), and Raspberry Pi (1-4)");
      return console.error(error)
    }

    if (this.config.micConfig.recorder == "auto") {
      let recorderType = this.PLATFORM_RECORDER.get(platform)
      console.log(`[DETECTOR] Platform: '${platform}'; attempting to use '${recorderType}' to access microphone ...`)
      this.config.micConfig.recorder= recorderType
    }

    if (this.config.Porcupine.usePorcupine) {
      /* Porcupine init */
      this.config.Porcupine.detectors.forEach(detector => {
        const values = {}
        if (detector.Model) {
          values.Model= detector.Model
          values.Sensitivity= detector.Sensitivity ? detector.Sensitivity: 0.7
          this.porcupineConfig.push(values)
        }
      })
      log("Porcupine DetectorConfig:", this.config.Porcupine.detectors)
      this.porcupine = await new this.lib.Porcupine(this.porcupineConfig, this.config.micConfig, detect => this.onDetected("Porcupine", detect), this.config.debug)
      this.porcupine = await new this.lib.Porcupine(this.porcupineConfig, this.config.micConfig, detect => this.onDetected("Porcupine", detect), this.config.debug)
      this.porcupine.init()
      if (this.porcupine.keywordNames.length) console.log("[DETECTOR] Porcupine is initialized with", this.porcupine.keywordNames.length, "Models:", this.porcupine.keywordNames.toString())
    }

    if (this.config.Snowboy.useSnowboy) {
      this.config.micConfig.audioGain = this.config.Snowboy.audioGain
      this.config.micConfig.applyFrontend = this.config.Snowboy.applyFrontend
      /* Snowboy init */
      this.snowboyConfig = this.config.Snowboy.detectors
      log("Snowboy DetectorConfig:", this.snowboyConfig)
      this.snowboy = await new this.lib.Snowboy(this.snowboyConfig, this.config.micConfig, detect => this.onDetected("Snowboy", detect), this.config.debug)
      this.snowboy.init()
      if (this.snowboy.modelsNumber()) console.log("[DETECTOR] Snowboy is initialized with", this.snowboy.modelsNumber(), "Models:", this.snowboy.modelsNames())
    }

    if (this.config.autoStart) this.activate()
  },
  
  activate: async function() {
    if (this.porcupine && this.porcupine.keywordNames.length) {
      this.porcupine.start()
      this.detector = true
    }
    if (this.snowboy && this.snowboy.modelsNumber()) {
      this.snowboy.start()
      this.detector = true
    }
    if (this.detector) {
      this.running = true
      this.sendSocketNotification("LISTENING")
      console.log("[DETECTOR] Starts listening.")
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
    if (!this.detector) {
      this.running = false
      this.sendSocketNotification("DISABLED")
      console.log("[DETECTOR] Stops listening.")
    }
  },

  /** Load require @busgounet library **/
  /** It will not crash MM (black screen) **/
  /** just inform user :) **/
  loadBugsounetLibrary: function() {
    let errors = 0
    return new Promise(resolve => {
      if (this.config.Porcupine.usePorcupine) {
        try {
          this.lib["Porcupine"] = require("@bugsounet/porcupine")
        } catch (e) {
          console.error("[DETECTOR] Porcupine library: Loading error!" , e)
          this.sendSocketNotification("ERROR" , "Porcupine")
          errors++
        }
      }
      if (this.config.Snowboy.useSnowboy) {
        try {
          this.lib["Snowboy"] = require("@bugsounet/snowboy").SnowboyV2
        } catch (e) {
          console.error("[DETECTOR] Snowboy library: Loading error!" , e)
          this.sendSocketNotification("ERROR" , "Snowboy")
          errors++
        }
      }
      if (this.config.NPMCheck.useChecker) {
        try  {
          this.lib["npmCheck"] = require("@bugsounet/npmcheck")
        } catch (e) {
          console.error("[DETECTOR] Snowboy library: Loading error!" , e)
          this.sendSocketNotification("ERROR" , "npmCheck")
          errors++
        }
      }
      resolve(errors)
    })
  }

})
