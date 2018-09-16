const http = require("http");



const express = require("express");
const bodyParser = require("body-parser");
var spawn  = require("child_process");
const fs = require("fs");
const request = require("request");
const app = express();



app.use(bodyParser.text());




app.post("/code", async function(req, res) {
  var file = JSON.parse(req.body);
  console.log(file.code)
  var options = { flag : 'w' };
  if (file.lang === "Python") {
    fs.writeFile('code.py', file.code, options, function (err) {
      if (err) console.log("error");
      console.log("saved.");
      spawn.exec("open code.py");
      spawn.exec("node targetListener.js");
    });
  }
  else  {
     fs.writeFile('code.c', file.code, options, function (err) {
      if (err) console.log("error");
      console.log("saved.");
      spawn.exec("open code.c");
      spawn.exec("node targetListener.js");
  });
  }
});


var server = app.listen(8080);
