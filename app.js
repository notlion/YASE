#!/usr/bin/env node

var express  = require("express"),
    mongoose = require("mongoose")

require("./datamodel").configureSchema(mongoose.Schema, mongoose);
var Shader = mongoose.model("Shader");

var app = express.createServer(express.logger());
app.db = mongoose.connect(process.env.MONGO_URI);
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


app.get("/", function (req, res) {
  res.render("index", { env: app.settings.env, layout: false });
});


app.get("/get", function(req, res){
  Shader.find()
    .skip(req.query["skip"])
    .limit(req.query["limit"])
    .sort("date", -1)
    .exec(function (err, shaders) {
      if (err) {
        res.send("Error fetching shaders.");
      } else {
        res.json({
          status : "OK",
          shaders : shaders
        });
      }
    });
});


app.get("/count", function(req, res){
  Shader.find().count().exec(function (err, count) {
    if (err) {
      res.send("Error counting shaders.");
    } else {
      res.json({
        status : "OK",
        count : count
      });
    }
  });
});


app.get("/s/:short_id",function(req, res){
  Shader.findOne({ short_id : req.params.short_id }, function(err, shader){
    if (err) {
      res.send("Error finding shader with short_id: " + req.params.short_id);
    } else {
      res.json({
        status : "OK",
        shader : shader
      });
    }
  });
});


app.post("/save", function(req, res){

  console.log("Receiving new shader to store...");
  console.log(req.body);

  var generateID = function(length) {
    var id = "";
    var chars = "qwrtypsdfghjklzxcvbnm0123456789";
    while(id.length < length) {
      var pos = Math.floor(Math.random() * chars.length - 1);
      id += chars.substring(pos, pos + 1);
    }
    return id;
  }

  var saveShader = function(iteration, callback) {
    var newShader = new Shader({
      short_id : generateID(iteration),
      r : req.body.r,
      d : req.body.d,
      z : req.body.z
    });
    newShader.save(function (err) {
      if (err !== null && err.code === 11000) {
        console.log("Duplicate short_id; Generating another...");
        saveShader(iteration += 1, callback);
      }
      else {
        callback(this.emitted.complete[0]);
      }
    });
  };

  saveShader(1, function(savedShader) {
    console.log("Saving Success!", savedShader);
    res.json({
      status : "OK",
      shader : savedShader
    });
  });
});


var port = process.env.PORT || 3000;

app.listen(port, function () {
  console.log("Listening on " + port);
});
