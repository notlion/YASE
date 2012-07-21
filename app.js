#!/usr/bin/env node

var express = require("express");
var build = require("./build");

var app = express.createServer(express.logger());
app.configure(function () {
  app.use(express.static(__dirname + "/public"));
  app.use(express.bodyParser());
  app.use(express.logger());
  app.set("view engine", "ejs");
  app.set("views", __dirname + "/views");
});

app.configure("development", function () {
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure("production", function () {
  app.use(express.errorHandler());
});


var compiled = false;

function renderIndex (res) {
  res.render("index", { env: app.settings.env, layout: false });
}

app.get("/", function (req, res) {
  if(!compiled && app.settings.env == "production") {
    build.go(function () {
      renderIndex(res);
      compiled = true;
    });
  }
  else {
    renderIndex(res);
  }
});


var port = process.env.PORT || 3000;

app.listen(port, function () {
  console.log("Listening on " + port);
});
