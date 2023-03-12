/** Load sensible library without black screen **/
var log = (...args) => { /* do nothing */ }

function libraries(that) {
  if (that.config.debug) log = (...args) => { console.log("[DETECTOR] [LIB]", ...args) }
  let libraries= [
    // { "library to load" : "store library name" }
    { "fs": "fs" },
    { "os": "os" },
    { "../components/platform": "platform" },
    { "../components/rules": "rules" },
    { "../components/porcupine": "Porcupine" },
    { "@bugsounet/snowboy": "Snowboy" }
  ]
  let errors = 0
  return new Promise(resolve => {
    libraries.forEach(library => {
      for (const [name, configValues] of Object.entries(library)) {
        let libraryToLoad = name
        let libraryName = configValues

        try {
          if (!that.lib[libraryName]) {
            if ((libraryName == "Snowboy" && !that.Snowboy.length) || (libraryName == "Porcupine" && !that.Porcupine.length)) {
              log("Ignored:", libraryToLoad)
            } else {
              that.lib[libraryName] = require(libraryToLoad)
              log("Loaded:", libraryToLoad, "->", "this.lib."+libraryName)
            }
          }
        } catch (e) {
          console.error("[DETECTOR] [LIB]", libraryToLoad, "Loading error!" , e.toString())
          that.sendSocketNotification("WARNING" , {library: libraryToLoad })
          errors++
          that.lib.error = errors
        }
      }
    })
    resolve(errors)
    console.log("[DETECTOR] [LIB] All libraries loaded!")
  })
}

exports.libraries = libraries
