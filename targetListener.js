const http = require("http");



const express = require("express");
const bodyParser = require("body-parser");
var spawn  = require("child_process");
const fs = require("fs");
const request = require("request");
const app = express();



app.use(bodyParser.text());




app.post("/code", async function(req, res) {
  console.log(req.body);
  fs.writeFile('code.txt', req.body , function (err) {
    if (err) console.log("error");
    console.log("saved.");
    spawn.exec("open code.txt");
  });
});


var server = app.listen(8080)

function closeServer() {
  server.close(function() { console.log('Doh :('); });
};
