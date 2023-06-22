/** Snowboy library v2 **/
/** multi-keyword listener (V2)
/** @bugsounet  **/
/** 2021-07-22  **/

const path = require("path")
const fs = require("fs")
const Detector = require("./lib/node/index.js").Detector
const Models = require("./lib/node/index.js").Models
const Recorder = require("@bugsounet/node-lpcm16")

var snowboyDict = {
  "smart_mirror": {
    hotwords: "smart_mirror",
    file: "smart_mirror.umdl",
    sensitivity: "0.5",
  },
  "computer": {
    hotwords: "computer",
    file: "computer.umdl",
    sensitivity: "0.6",
  },
  "snowboy": {
    hotwords: "snowboy",
    file: "snowboy.umdl",
    sensitivity: "0.5",
  },
  "jarvis": {
    hotwords: ["jarvis", "jarvis"],
    file: "jarvis.umdl",
    sensitivity: "0.7,0.7",
  },
  "subex": {
    hotwords: "subex",
    file: "subex.umdl",
    sensitivity: "0.6",
  },
  "neo_ya": {
    hotwords: ["neo_ya", "neo_ya"],
    file: "neoya.umdl",
    sensitivity: "0.7,0.7",
  },
  "hey_extreme": {
    hotwords: "hey_extreme",
    file: "hey_extreme.umdl",
    sensitivity: "0.6",
  },
  "view_glass": {
    hotwords: "view_glass",
    file: "view_glass.umdl",
    sensitivity: "0.7",
  }
}

let log = function() {
    var context = "[SNOWBOY]"
    return Function.prototype.bind.call(console.log, console, context)
}()

class Snowboy {
  constructor(config, mic, callback = ()=>{}, debug) {
    this.micConfig = mic
    this.config = config
    this.callback = callback
    this.model = []
    this.models = []
    this.mic = null
    this.detector = null
    this.debug = debug
    if (!this.debug) log = function() { /* do nothing */ }
    this.defaultConfig = {
      usePMDL: false,
      PMDLPath: "./",
      Model: "jarvis",
      Sensitivity: null
    }
    this.defaultMicOption = {
      audioGain: 2.0,
      applyFrontend: true,
      recorder: "arecord",
      device: "plughw:1",
      sampleRate: 16000,
      channels: 1,
      threshold: 0.5,
      thresholdStart: null,
      thresholdEnd: null,
      silence: '1.0',
      verbose: false,
      debug: this.debug
    }
    this.recorderOptions = Object.assign({}, this.defaultMicOption, this.micConfig)
  }

  init () {
    var modelPath = path.resolve(__dirname, "./resources/models")
    this.models = new Models()
    log("Checking models")
    this.config.forEach((config,nb) => {
      config = Object.assign(this.defaultConfig, config)
      let found = 0
      if (!config.usePMDL) {
        if (config.Model) {
          for (let [item, value] of Object.entries(snowboyDict)) {
            if (config.Model == item) {
              log("Model selected:", item)
              if (config.Sensitivity) {
                  if ((isNaN(config.Sensitivity)) || (Math.ceil(config.Sensitivity) > 1)) {
                    console.error("[SNOWBOY] Wrong Sensitivity value in", config.Model)
                  } else {
                    if (item == ("jarvis" || "neo_ya")) {
                      value.sensitivity =config.Sensitivity + "," + config.Sensitivity
                  }
                  else value.sensitivity = config.Sensitivity
                }
              }
              log("Sensitivity set:", value.sensitivity)
              this.model[nb] = value
              found = 1
            }
          }
        }
        if (this.model.length == 0 || !found) return console.error("[SNOWBOY] Error: model not found:", config.Model)
        this.model.forEach((model)=>{
          this.model[nb].file = path.resolve(modelPath, config.Model + ".umdl")
          this.models.add(this.model[nb])
        })
      } else if (config.Model && config.usePMDL) {
        var PMDLPath = path.resolve(__dirname, config.PMDLPath)
        if (!fs.existsSync(PMDLPath + "/" + config.Model + ".pmdl")) {
          return console.error("[SNOWBOY] "+ PMDLPath + "/" + config.Model + ".pmdl file not found !")
        } else log("Personal Model selected:", config.Model + ".pmdl")
        var pmdl = {
          hotwords: config.Model,
          file: PMDLPath + "/" + config.Model + ".pmdl",
          sensitivity: "0.5"
        }
        if (config.Sensitivity) {
          if ((isNaN(config.Sensitivity)) || (Math.ceil(config.Sensitivity) > 1)) {
            console.error("[SNOWBOY] Wrong Sensitivity value in", config.Model)
          } else {
            pmdl.sensitivity = config.Sensitivity
          }
        }
        log("Sensitivity set:", pmdl.sensitivity)
        this.model[nb] = pmdl
        this.models.add(this.model[nb])
      }
    })
    if (!this.model.length) console.error("[SNOWBOY] No models found!")
  }

  start () {
    if (!this.models.models.length) return console.error("[SNOWBOY] Constructor Error: No Model is set... I can't start Listening!")
    this.detector = new Detector({
      resource: path.resolve(__dirname, "./resources/common.res"),
      models: this.models,
      audioGain: this.recorderOptions.audioGain,
      applyFrontend: this.recorderOptions.applyFrontend
    })

    this.detector
      .on("error", (err)=>{
        this.error(err)
        return
      })
      .on("hotword", (index, hotword, buffer)=>{
        log("Detected:", hotword)
        this.stopListening()
        this.callback(hotword)
        return
      })

    this.startListening()
  }

  stop () {
    this.stopListening()
  }
  
  modelsNumber() {
    return this.model.length
  }

  modelsNames() {
    let keywordsName= []
    this.model.forEach( value => {
      keywordsName.push(value.hotwords[0])
    })
    return keywordsName.toString()
  }

  error (err,code) {
    if (err || (code == "1")) {
     if (err) console.error("[SNOWBOY][ERROR] " + err)
     this.stop()
     log("Retry restarting...")
     setTimeout(() => { this.start() },2000)
     return
    }
    if (code == "255") {
      this.stop()
      log("Timeout waiting restarting !")
      setTimeout(() => { this.start() }, 1000)
      return
    }
  }

  startListening () {
    if (this.mic) return
    this.mic = null
    this.mic = new Recorder(this.recorderOptions, this.detector, (err,code)=>{this.error(err,code)})
    log("Starts listening.")
    this.mic.start()
  }

  stopListening () {
    if (!this.mic) return
    this.mic.stop()
    this.mic = null
    log("Stops listening.")
  }
}

module.exports = require('./lib/node/index.js')
module.exports.Snowboy = Snowboy
