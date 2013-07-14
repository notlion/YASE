#!/usr/bin/env plask

'use strict';

var express = require('express')
  , fs      = require('fs')
  , path    = require('path')
  , ToyView = require('./renderer/ToyView')


// Open Render Window.

var view = ToyView.create({
  width: 1024,
  height: 768,
  fullscreen: true,
  position: { x: 1440, y: -0 }
})
view.start()


// Create Server.

var app = express()

app.configure(function () {
  app.use(express.static(__dirname + '/public'))
  app.use(express.bodyParser())
  app.use(express.logger())
  app.set('view engine', 'ejs')
  app.set('views', __dirname + '/views')
})
app.configure('development', function () {
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }))
})
app.configure('production', function () {
  app.use(express.errorHandler())
})


// Setup Routes.

app.get('/', function (req, res) {
  res.render('index', { env: app.settings.env, layout: false })
})

app.post('/shader/:id', function (req, res) {
  var filename = path.join(__dirname, 'shaders', req.params.id + '.fsh')
  if(req.body.src) {
    fs.writeFile(filename, req.body.src, function (err) {
      if(err)
        res.send(500)
      else
        res.send(200)
    })
  }
  else {
    res.send(500)
  }
})
app.get('/shader/:id', function (req, res) {
  var filename = path.join(__dirname, 'shaders', req.params.id + '.fsh')
  res.sendfile(filename)
})


// Start Server.

var port = process.env.PORT || 3000

app.listen(port, function () {
  console.log('Listening on ' + port)
})
