'use strict';

var Backbone  = require('backbone')
  , DeepModel = require('./lib/deep-model')
  , osc       = require('./lib/omgosc')


module.exports = DeepModel.extend({

  defaults: {
    port: 7777
  }

, initialize: function() {
    var self = this

    var receiver = new osc.UdpReceiver(this.get('port'));

    receiver.on('', function (e) {
      var path = e.path.replace(/\//g, '.')
      if(path[0] == '.')
        path = path.slice(1)
      var value = e.params.length === 1 ? e.params[0] : e.params
      self.set(path, value)
    })
  }

})
