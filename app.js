#!/usr/bin/env node

var express = require("express");

var app = express.createServer(express.logger());
app.configure(function () {
  app.use(express.static(__dirname + "/public"));
  app.use(express.bodyParser());
  app.use(express.logger());
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

var port = process.env.PORT || 3000;

app.listen(port, function () {
  console.log("Listening on " + port);
});
