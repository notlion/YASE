#!/usr/bin/env node

var express = require("express"),
    mysql   = require('mysql');

var db = mysql.createConnection(process.env.MYSQL_URI);
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


app.get("/", function (req, res) {
  res.render("index", { env: app.settings.env, layout: false });
});

app.get("/get", function (req, res) {
  var offset = req.query["offset"] ? parseInt(req.query["offset"]) : 0;
  var limit  = req.query["limit"] ? parseInt(req.query["limit"])  : 25;
  var slice = offset + ", " + limit;
  db.query("SELECT * FROM shaders ORDER BY date LIMIT " + slice,
    function(err, rows) {
      if (rows) {
        var result = [];
        for(var i = 0; i < rows.length; i++) {
          result[i] = rows[i];
          result[i].r = rows[i].r.split(",");
        }
        res.json({
          status : "OK",
          shader : result
        });
      }
      else {
        res.json({
          status : "NOT OK"
        });
      }
    }
  );
});

app.get("/get/:short_id",function(req, res){
  db.query("SELECT * FROM shaders WHERE short_id = ?", req.params.short_id,
    function(err, results) {
      if (err) {
        res.send("Error finding shader with short_id: " + req.params.short_id);
      } else {
        var result = results[0];
        if (result) {
          result.r = result.r.split(",");
          res.json({
            status : "OK",
            shader : result
          });
        } else {
          res.json({
            status : "NOT FOUND"
          });
        }
      }
  });
});


app.get("/count", function(req, res){
  db.query("SELECT COUNT(*) as count FROM shaders",
    function(err, result) {
      res.json({
        status : "OK",
        count : result[0].count
      });
  });
});


app.post("/save", function(req, res) {

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
    var short_id = generateID(iteration);
    db.query('INSERT INTO shaders SET ?',
        { short_id: short_id,
          r: req.body.r.join(","),
          d: req.body.d,
          z: req.body.z },
      function(err, result) {
        if (err && err.code === "ER_DUP_ENTRY") {
          console.log("Duplicate id; Generating another...");
          saveShader(iteration += 1, callback);
        }
        else {
          callback(short_id);
        }
    });
  };

  saveShader(1, function(result, short_id) {
    res.json({
      short_id : short_id
    });
  });
});


var port = process.env.PORT || 3000;

app.listen(port, function () {
  console.log("Listening on " + port);
});
