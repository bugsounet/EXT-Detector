/** parse data from MagicMirror **/
var _load = require("../components/loadLibraries.js")
var log = (...args) => { /* do nothing */ }

async function init(that) {
  that.config = {}
  that.porcupine = null
  that.porcupineConfig = []
  that.snowboyConfig = {}
  that.snowboy = null
  that.Snowboy = []
  that.Porcupine = []
  that.porcupineCanRestart = false
  that.detector = false
  that.running = false
  that.lib = {}
  that.detectorModel = 0
}

async function parse(that) {
  if (that.config.debug) log = (...args) => { console.log("[DETECTOR] [DATA]", ...args) }
  await detectorFilter(that)
  let bugsounet = await _load.libraries(that)
  if (bugsounet) {
    console.error("[DETECTOR] [DATA] Warning:", bugsounet, "needed library not loaded !")
    console.error("[DETECTOR] [DATA] Try to solve it with: npm run rebuild")
    return
  }
  if (that.config.touchOnly) {
    console.log("[DETECTOR] [DATA] Ready with Touch Screen Feature only")
    that.sendSocketNotification("INITIALIZED")
    return
  }

  that.config.mic.recorder= "arecord"
  that.config.snowboyMicConfig.recorder= "arecord"

  if (that.Porcupine.length) {
    /* Porcupine init */
    that.porcupineConfig.accessKey = that.config.porcupineAccessKey || null
    that.porcupineConfig.customModel = that.config.porcupineCustomModel ? __dirname + "/" + that.config.porcupineCustomModel : null
    that.porcupineConfig.detectors = []

    if (!that.porcupineConfig.accessKey) {
      that.sendSocketNotification("ACCESSKEY")
    }
    that.Porcupine.forEach(detector => {
      const values = {}
      if (detector.Model) {
        values.Model= detector.Model
        values.Sensitivity= detector.Sensitivity ? detector.Sensitivity: 0.7
        that.porcupineConfig.detectors.push(values)
      }
    })
    log("Porcupine DetectorConfig:", that.porcupineConfig)
    that.porcupine = await new that.lib.Porcupine(that.porcupineConfig, that.config.mic, detect => that.lib.rules.onDetected(that,"Porcupine", detect), that.config.debug)
    that.porcupine.init()
    if (!that.porcupine.initialized) {
      that.sendSocketNotification("PORCUPINENOTINIT")
    } else {
      if (that.porcupine.keywordNames && that.porcupine.keywordNames.length) {
        console.log("[DETECTOR] [DATA] Porcupine is initialized with", that.porcupine.keywordNames.length, "Models:", that.porcupine.keywordNames.toString())
        that.detectorModel += that.porcupine.keywordNames.length
      }
    }
  }

  if (that.Snowboy.length) {
    /* Snowboy init */
    that.snowboyConfig = that.Snowboy
    log("Snowboy DetectorConfig:", that.snowboyConfig)
    that.snowboy = await new that.lib.Snowboy.Snowboy(that.snowboyConfig, that.config.snowboyMicConfig, detect => that.lib.rules.onDetected(that,"Snowboy", detect), that.config.debug)
    that.snowboy.init()
    if (that.snowboy.modelsNumber()) {
      console.log("[DETECTOR] [DATA] Snowboy is initialized with", that.snowboy.modelsNumber(), "Models:", that.snowboy.modelsNames())
      that.detectorModel += that.snowboy.modelsNumber()
    }
  }

  if (that.detectorModel) {
    that.sendSocketNotification("INITIALIZED")
    console.log("[DETECTOR] [DATA] Initialized")
  } else {
    that.sendSocketNotification("NOT_INITIALIZED")
    console.error("[DETECTOR] [DATA] No detector initialized!")
  }
}

function detectorFilter(that) {
  return new Promise(resolve => {
    that.Snowboy= that.config.detectors.filter(detector => detector.detector == "Snowboy")
    that.Porcupine= that.config.detectors.filter(detector => detector.detector == "Porcupine")
    resolve()
  })
}

exports.init = init
exports.parse = parse
