var log = (...args) => { /* do nothing */ }

function activate(that) {
  if (that.config.debug) log = (...args) => { console.log("[DETECTOR] [RULES]", ...args) }
  if (that.config.touchOnly) return that.sendSocketNotification("LISTENING")
  if (that.porcupine && that.porcupine.initialized && (that.porcupine.keywordNames.length || that.porcupineCanRestart)) {
    that.porcupine.start()
    that.porcupineCanRestart = true
    that.detector = true
  }
  if (that.snowboy && that.snowboy.modelsNumber()) {
    that.snowboy.start()
    that.detector = true
  }
  if (that.detector) {
    that.running = true
    that.sendSocketNotification("LISTENING")
    console.log("[DETECTOR] [RULES] Start listening.", that.detectorModel, "Models")
  }
  else {
    that.sendSocketNotification("NOT_INITIALIZED")
    console.error("[DETECTOR] [RULES] No detector initialized!")
  }
}

function onDetected(that, from, detected) {
  this.deactivate(that)
  console.log("[DETECTOR] [RULES] Detected:", detected, "from:", from)
  that.sendSocketNotification("DETECTED")
}

function deactivate(that, withNoti = true) {
  if (that.config.touchOnly) return
  if (that.porcupine) {
    that.porcupine.stop()
    that.detector = false
  }
  if (that.snowboy) {
    that.snowboy.stop()
    that.detector= false
  }
  if (!that.detector) {
    that.running = false
    if (withNoti) that.sendSocketNotification("DISABLED")
    console.log("[DETECTOR] [RULES] Stop listening.")
  }
}

exports.activate = activate
exports.deactivate = deactivate
exports.onDetected = onDetected
