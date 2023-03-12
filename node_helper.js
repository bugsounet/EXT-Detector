/** EXT-Detector helper **/

"use strict"
var parseData = require("./components/parseData")
var NodeHelper = require("node_helper")

module.exports = NodeHelper.create({
  start: function () {
    parseData.init(this)
  },

  socketNotificationReceived: function (notification, payload) {
    switch(notification) {
      case "INIT":
        this.config = payload
        this.initialize()
        break
      case "START":
        if (!this.running) this.lib.rules.activate(this)
        break
      case "STOP":
        if (this.running) this.lib.rules.deactivate(this,payload)
        break
    }
  },

  initialize: async function() {
    console.log("[DETECTOR] EXT-Detector Version:", require('./package.json').version , "rev:", require('./package.json').rev)
    await parseData.parse(this)
  }
})
