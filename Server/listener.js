const http = require("http");
const port = 3000;



var FileAPI = require("file-api"), File = FileAPI.File, FileReader = FileAPI.FileReader;
const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const request = require("request");
const vision = require("@google-cloud/vision");
//if this is put on a different computer, you must set options (they are in local variables on mine)
const client = new vision.ImageAnnotatorClient();
const app = express();

app.use(bodyParser.json());

const average = arr => arr.reduce( ( p, c ) => p + c, 0 ) / arr.length;

async function parseVision(img) {
  var request = {
    "image": {
      "content": img
    }
  };

  var results = await client.documentTextDetection(request);
  return results;
}

function encodeImage(filePath) {
  var bitmap = fs.readFileSync(filePath);
  var encoded = new Buffer(bitmap).toString("base64");
  return encoded;
}

async function getVisionResults(img) {
  var visionResults = await parseVision(encodedImage);
  console.log("got vision results");
  jsonString = JSON.stringify(visionResults);
  fs.writeFile("results.json", jsonString, "utf8");
}

function fixCamelCase(visionResults) {
  var words = [[visionResults[0].textAnnotations[1].description]];
  var wordsIndex = 0;
  var xDiffs = [[]];
  for (var i = 1; i < visionResults[0].textAnnotations.length-1; i++) {
    var thisAnnotation = visionResults[0].textAnnotations[i];
    var nextAnnotation = visionResults[0].textAnnotations[i+1];
    xDifference = nextAnnotation.boundingPoly.vertices[0].x - thisAnnotation.boundingPoly.vertices[1].x;
    yDifference = nextAnnotation.boundingPoly.vertices[0].y - thisAnnotation.boundingPoly.vertices[0].y;
    if (xDifference < 0 && yDifference > 0) {
      wordsIndex++;
      words.push([]);
      xDiffs.push([]);
    } else {
      xDiffs[wordsIndex].push(xDifference);
    }
    words[wordsIndex].push(nextAnnotation.description);
  }

  var wordStrings = [];
  for (var i = 0; i < words.length; i++) {
    if (xDiffs[i].length > 1) {
      averageXDiff = average(xDiffs[i]);
      var wordString = words[i][0];
      for (var j = 0; j < xDiffs[i].length; j++) {
        if (xDiffs[i][j] < averageXDiff) {
          wordString += words[i][j+1];
        } else {
          wordString += " " + words[i][j+1];
        }
      }
      wordStrings.push(wordString);
    } else {
      wordStrings.push(words[i].join(" "));
    }
  }

  return wordStrings.join("\n");
}


fs.readFile("results.json", "utf8", function readFileCallback(err, data) {
  if(err) {
    console.log(err);
  } else {
    var visionResults = JSON.parse(data);
    console.log(fixCamelCase(visionResults));
  }
});

function sendCode(codeString, targetAddress) {
  var post_options = {
    host: targetAddress + ":3000";
  }

}

app.post("/image", async function(req, res) {
  var encodedImage = req.body.img;
  var targetAddress = req.body.ip;

  var visionAPIResults = parseVision(encodedImage);
  var codeString = fixCamelCase(visionAPIResults);

  sendCode(codeString, targetAddress);
});


app.listen(8080);
