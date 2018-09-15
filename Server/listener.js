const http = require("http");
const port = 3000;

//const FileReader = require("filereader");
var FileAPI = require("file-api"), File = FileAPI.File, FileReader = FileAPI.FileReader;
const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");

const app = express();
const API_TOKEN = "1060304981152-si250lqq588r02461anohh8uj0g6207v.apps.googleusercontent.com"

//app.post("/")

function GetAPIResponse(img) {
  var post_data = JSON.stringify({
    "requests":  [
      {
        "image": {
          "content": img
        },
        "features": [
          {
            "type": "TEXT_DETECTION"
          }
        ]
      }
    ]
  });

  var post_options = {
    host: "https://vision.googleapis.com/v1/images:annotate",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + API_TOKEN
    }
  }

  var post_req = http.request(post_options, function(res) {
    console.log(res);
  });

  post_req.write(post_data);
  post_req.end();
}

function encodeImage(filePath) {
  // var file = new File(filePath);
  // console.log(file);
  // var reader = new FileReader();
  // console.log("got reader");
  // //reader.setNodeChunkEncoding(false);
  // reader.onloadend = function() {
  //   console.log("RESULT", reader.result);
  //   reader.readAsDataURL(file);
  // }
  var bitmap = fs.readFileSync(filePath);
  var encoded = new Buffer(bitmap).toString("base64");
  return encoded;
}

var encodedImage = encodeImage("/Users/georgiaeshay/Downloads/1_3wn7FLjhZ3aynRQyTdDD4Q.jpeg");
//GetAPIResponse(encodedImage);

app.listen(8080);
