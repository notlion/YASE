#!/usr/bin/env node

var express = require("express");
var mysql   = require("mysql");


var db = mysql.createConnection(process.env.MYSQL_URI);

var app = express();

app.configure(function() {
  app.use(express.static(__dirname + "/public"));
  app.use(express.bodyParser());
  app.use(express.logger());
  app.set("view engine", "ejs");
  app.set("views", __dirname + "/views");
});

app.configure("development", function() {
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure("production", function() {
  app.use(express.errorHandler());
});


app.get("/", function(req, res) {
  res.render("index", { env: app.settings.env, layout: false });
});


app.get("/get", function(req, res) {

  var offset = req.query["offset"] ? parseInt(req.query["offset"]) : 0;
  var limit  = req.query["limit"]  ? parseInt(req.query["limit"])  : 25;
  var slice = offset + ", " + limit;
  var query = "SELECT * FROM shaders ORDER BY date DESC LIMIT " + slice;

  db.query(query, function(err, rows) {
    if(rows) {
      var result = [];
      for(var i = 0; i < rows.length; i++) {
        result[i] = rows[i];
        // convert .r to array by splitting on commas
        if(result[i].r) result[i].r = result[i].r.split(",");
      }
      res.json(200, result);
    }
    else
      res.json(204);
  });

});


app.get("/gallery", function(req, res) {
  res.render("gallery", { env: app.settings.env, layout: false });
});


app.get("/get/:short_id", function(req, res) {

  var query = "SELECT * FROM shaders WHERE short_id = ?";

  db.query(query, req.params.short_id, function(err, results) {
    if(err) {
      res.send("Error finding shader with short_id: " + req.params.short_id);
      return;
    }
    var result = results[0];
    if(result) {
      // convert .r to array by splitting on commas
      if(result.r) result.r = result.r.split(",");
      res.json(200, result);
    }
    else
      res.send(204);
  });

});


app.get("/count", function(req, res){
  db.query("SELECT COUNT(*) as count FROM shaders", function(err, result) {
    res.json(200, { count: result[0].count });
  });
});


function generateId(length) {
  var id = "";
  var chars = "qwrtypsdfghjklzxcvbnm0123456789";
  while(id.length < length) {
    var pos = Math.floor(Math.random() * chars.length - 1);
    id += chars.substring(pos, pos + 1);
  }
  return id;
}

app.post("/save", function(req, res) {

  var params = {};

  // convert .r to string for DB storage by joining with commas
  if(req.body.r instanceof Array) params.r = req.body.r.join(",");
  if(!isNaN(req.body.d)) params.d = req.body.d;
  if(req.body.z) params.z = req.body.z;

  function saveShader(iteration, callback) {
    var id = params.short_id = generateId(iteration);
    db.query("INSERT INTO shaders SET ?", params, function(err, result) {
      if(err) {
        if(err.code === "ER_DUP_ENTRY") {
          console.error("Duplicate id; Generating another...");
          saveShader(iteration += 1, callback);
        }
        else {
          console.error(err);
        }
      }
      else {
        callback(result, id);
      }
    });
  };

  saveShader(1, function(result, short_id) {
    res.json({
      insert_id: result.insertId,
      short_id: short_id
    });
  });

});


var port = process.env.PORT || 3000;

app.listen(port, function () {
  console.log("Listening on " + port);
});
