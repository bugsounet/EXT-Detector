/** Visual Class of EXT-Detector V2 **/
/** 23-02-20 **/

/** this: this class
 ** that: MagicMirror core
 **/

class DetectorVisual {
  constructor(that) {
    this.listening = false
    this.logoGoogle= that.file("resources/google.png")
    console.log("[EXT-Detector] Visual Loaded")
  }

  DetectorDisabled(that) {
    if (!that.config.useIcon) return
    this.listening = false
    var icon = document.getElementById("EXT_DETECTOR-ICON")
    icon.classList.add("busy")
    icon.classList.remove("flash")
  }

  DetectorClickCheck(that) {
    if (!this.listening) return
    this.DetectorClickActivate(that)
  }

  DetectorClickActivate(that) {
    that.sendSocketNotification("STOP", false) // stop and don't send DISABLED callback
    this.listening = false
    this.DetectorActivateWord(that)
  }

  DetectorActivateWord(that) {
    this.DetectorRefreshLogo(that,true)
    that.sendNotification("GA_ACTIVATE")
  }

  DetectorRefreshLogo(that,disabled) {
    if (!that.config.useIcon) return
    var icon = document.getElementById("EXT_DETECTOR-ICON")
    if (disabled) {
      this.listening = false
      icon.classList.remove("busy")
      icon.classList.add("flash")
    } else {
      this.listening = true
      icon.classList.remove("busy","flash")
    }
  }

  DetectorDom(that) {
    let wrapper = document.createElement('div')
    wrapper.id = "EXT_DETECTOR"

    if (that.config.useIcon) {
      var icon = document.createElement('div')
      icon.id= "EXT_DETECTOR-ICON"
      icon.style.backgroundImage = "url("+this.logoGoogle+")"
      icon.classList.add("busy")
      icon.onclick = (event)=> {
        event.stopPropagation()
        this.DetectorClickCheck(that)
      }
      wrapper.appendChild(icon)
    }
    else wrapper.className = "hidden"
    return wrapper
  }
}

