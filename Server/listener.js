const http = require("http");
const port = 3000;

const express = require("express");
const bodyParser = require("body-parser");

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


app.listen(8080);
