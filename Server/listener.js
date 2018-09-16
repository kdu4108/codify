const http = require("http");
const port = 3000;



var FileAPI = require("file-api"), File = FileAPI.File, FileReader = FileAPI.FileReader;
const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const request = require("request");
const vision = require("@google-cloud/vision");
const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
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

function lev(a, b, i, j) {
  if (Math.min(i, j) == 0) {
    return Math.max(i, j);
  } else {
    var arg1 = lev(a, b, i-1, j) + 1;
    var arg2 = lev(a, b, i, j-1) + 1;
    var arg3 = lev(a, b, i-1, j-1) + (a[i] != b[j]);
    return Math.min(arg1, arg2, arg3);
  }
}


function levenshteinDistance (s, t) {
    if (!s.length) return t.length;
    if (!t.length) return s.length;

    return Math.min(
        levenshteinDistance(s.substr(1), t) + 1,
        levenshteinDistance(t.substr(1), s) + 1,
        levenshteinDistance(s.substr(1), t.substr(1)) + (s[0] !== t[0] ? 1 : 0)
    ) + 1;
}

function stringdist(a, b) {
  return lev(a, b, a.length, b.length);
}


function fixCamelCase(visionResults) {
  var words = [[visionResults[0].textAnnotations[1].description]];
  var wordsIndex = 0;
  var xDiffs = [[]];
  var lineStarts = [visionResults[0].textAnnotations[1].boundingPoly.vertices[0].x];
  for (var i = 1; i < visionResults[0].textAnnotations.length-1; i++) {
    var thisAnnotation = visionResults[0].textAnnotations[i];
    var nextAnnotation = visionResults[0].textAnnotations[i+1];
    xDifference = nextAnnotation.boundingPoly.vertices[0].x - thisAnnotation.boundingPoly.vertices[1].x;
    yDifference = nextAnnotation.boundingPoly.vertices[0].y - thisAnnotation.boundingPoly.vertices[0].y;
    if (xDifference < 0 && yDifference > 0) {
      wordsIndex++;
      words.push([]);
      xDiffs.push([]);
      lineStarts.push(nextAnnotation.boundingPoly.vertices[0].x);
    } else {
      xDiffs[wordsIndex].push(xDifference);
    }
    words[wordsIndex].push(nextAnnotation.description);
  }

  first = Math.min(lineStarts);
  lineStarts = lineStarts.map(x => x - first);
  console.log(lineStarts);


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


  var options = {
    hostname: targetAddress,
    port: 8080,
    path: "/code",
    method: "POST",
    headers: {
        "Content-Disposition": "attachment; filename=code.txt",
        "Content-Type": "text/plain"
    }
  };

  var req = http.request(options, function(res) {
    console.log(res);
  });

  req.write(codeString);
  req.end();
}

sendCode("completely different message", "192.168.43.54");

app.post("/image", async function(req, res) {
  console.log(req.body);
  var encodedImage = req.body.img;
  var targetAddress = req.body.ip;

  console.log(encodedImage);
  console.log(targetAddress);

  var visionAPIResults = parseVision(encodedImage);
  var codeString = fixCamelCase(visionAPIResults);

  sendCode(codeString, targetAddress);
});


app.listen(8080);
