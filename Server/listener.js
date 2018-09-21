require("dotenv").config();

const http = require("http");
const port = 3000;

const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const request = require("request");
const vision = require("@google-cloud/vision");
const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const lang = require('language-classifier');

//if this is put on a different computer, you must set options (they are in local variables on mine)
const client = new vision.ImageAnnotatorClient();
const app = express();

app.use(bodyParser.json({limit: "50mb", extended: true}));
app.use(bodyParser.text({limit:"50mb", extended:true}));

const average = arr => arr.reduce( ( p, c ) => p + c, 0 ) / arr.length;

//contacts google vision API and gets results of document text detection
async function parseVision(img) {
  var request = {
    "image": {
      "content": img
    }
  };

  var results = await client.documentTextDetection(request);
  return results;
}

//encodes image as base 64
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


//levenshtein algorithm (from wikipedia)
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


function getSpaceSize(words, xDiffs){
  let spaceDiffs = [];
  for (var i = 0; i < words.length; i++) {
    if (xDiffs[i].length > 1) {
      averageXDiff = average(xDiffs[i]);
      for (var j = 0; j < xDiffs[i].length; j++) {
        if (xDiffs[i][j] >= averageXDiff) {
          spaceDiffs.push(xDiffs[i][j]);
        }
      }
    }
  }
  return average(spaceDiffs);
}

function getLineTabGroups(lineStarts, threshold){


  if (lineStarts.length == 1) {
    return [lineStarts];
  }
  console.log("Line starts: " + lineStarts);

  let avgStart = average(lineStarts.map(x => {return x[0]}));

  let midIndex = lineStarts.findIndex(function(number) {
    return number[0] > avgStart;
  }) - 1;

  let lowerList = lineStarts.slice(0, midIndex + 1);
  let upperList = lineStarts.slice(midIndex + 1, lineStarts.length + 1);


  let lowerAvg = average(lowerList.map(x => {return x[0]}));
  let upperAvg = average(upperList.map(x => {return x[0]}));



  if (upperAvg - lowerAvg > threshold) {
    return getLineTabGroups(lowerList, threshold).concat(getLineTabGroups(upperList, threshold))
  }
  else {
    // base case
    return [lineStarts];
  }
}


//fixes camel case and tabbing in vision results
function fixCamelCase(visionResults) {
  //words is a 2d array - rows are lines, each there are words in each line
  //start words with the first word in the first line
  var words = [[visionResults[0].textAnnotations[1].description]];
  var wordsIndex = 0;
  var xDiffs = [[]];
  //the beginning of each line
  var lineStarts = [visionResults[0].textAnnotations[1].boundingPoly.vertices[0].x];
  //
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

  let lineTabGroups = getLineTabGroups(lineStarts.map((element, index) => {return [element, index]}).sort((a, b) => { return a[0] - b[0]}), 1.5*getSpaceSize(words, xDiffs));
  let lineTabs = new Array(lineStarts.length);
  for (var i = 0; i < lineTabGroups.length; i++){
    for (var j = 0; j < lineTabGroups[i].length; j++){
      lineTabs[lineTabGroups[i][j][1]] = i;
    }
  }


  var wordStrings = [];

  // loop through each line of text
  for (var i = 0; i < words.length; i++) {

    var wordString = "";
    // attach necessary number of tabs
    for (var t = 0; t < lineTabs[i]; t++){
      wordString += "\t";
    }
    // check if there's more than 2 words left in the line
    if (xDiffs[i].length > 1) {
      wordString += words[i][0];
      averageXDiff = average(xDiffs[i]);
      for (var j = 0; j < xDiffs[i].length; j++) {
        if (xDiffs[i][j] < averageXDiff) {
          wordString += words[i][j+1];
        } else {
          wordString += " " + words[i][j+1];
        }
      }


      wordStrings.push(wordString);
    } else {
      wordStrings.push(wordString + words[i].join(" "));
    }
  }
  console.log(wordStrings.join("\n"));
  return wordStrings.join("\n");
}



// fs.readFile("results.json", "utf8", function readFileCallback(err, data) {
//   if(err) {
//     console.log(err);
//   } else {
//     var visionResults = JSON.parse(data);
//     outputString = fixCamelCase(visionResults);
//     console.log(outputString);
//     console.log(lang(outputString));
//
//   }
// });

function sendCode(codeString, codeLang, targetAddress) {
  var options = {
    hostname: targetAddress,
    port: 8080,
    path: "/code",
    method: "POST",
    // headers: {
    //     "Content-Disposition": "attachment; filename=code.txt",
    //     "Content-Type": "text/plain"
    // }
    headers: {
      "Content-Type": "text/plain"
    }
  };

  var req = http.request(options, function(res) {
    //console.log(res);
  });

  req.write(JSON.stringify({code: codeString, lang: codeLang}));
  req.end();
}

//sendCode("thing", "192.168.43.54");

app.post("/image", async function(req, res) {
  var imgObject = JSON.parse(req.body);

  var encodedImage = imgObject.img;
  var targetAddress = imgObject.ip;

  // console.log(encodedImage);
  // console.log(targetAddress);

  var visionAPIResults = await parseVision(encodedImage);
  var codeString = fixCamelCase(visionAPIResults);
  var codeLang = "";
  if( codeString.indexOf("{") > -1 ) {
    codeLang = "C";
  } else {
    codeLang = "Python";
  }
  console.log(codeLang);
  sendCode(codeString, codeLang, targetAddress);
});


app.listen(8080);
