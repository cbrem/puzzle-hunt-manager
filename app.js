var express = require("express"); // imports express
var app = express();        // create a new instance of express

// imports the fs module (reading and writing to a text file)
var fs = require("fs");
var path = require('path');

// the bodyParser middleware allows us to parse the
// body of a request
app.use(express.bodyParser());

/** allows us to serve all files from the static directory
 * in other words, we can access our server at http://localhost:8889/index.html
 * instead of http://localhost:8889/static/index.html
 * See here for more details: https://piazza.com/class#spring2013/15237/168
**/
app.use(express.static(path.join(__dirname, 'static')));

// The global datastore of hunt information
var globalHuntData;

// Asynchronously read file contents, then call callbackFn
function readFile(filename, defaultData, callbackFn) {
  fs.readFile(filename, function(err, data) {
    if (err) {
      console.log("Error reading file: ", filename);
      data = defaultData;
    } else {
      console.log("Success reading file: ", filename);
    }
    if (callbackFn) callbackFn(err, data);
  });
}

// Asynchronously write file contents, then call callbackFn
function writeFile(filename, data, callbackFn) {
  fs.writeFile(filename, data, function(err) {
    if (err) {
      console.log("Error writing file: ", filename);
    } else {
      console.log("Success writing file: ", filename);
    }
    if (callbackFn) callbackFn(err);
  });
}

app.get("/foo", function(request, response){
    response.sendfile("static/index.html");
});

// for JOIN request to hunts, tell client if hunt exists
app.get("/hunts/:hunt", function (request, response) {
  var hunt = request.params.hunt;
  var exists;
  if (hunt in globalHuntData) exists = true;
  else exists = false;
  response.send({
    "exists": exists
  });
});

// for CREATE request, create an empty hunt object in datastore
app.post("/:hunt", function (request, response) {
  var hunt = request.params.hunt;
  // create new empty hunt object with the creator's inputted hunt name
  huntObj = {};
  huntObj.safename = request.body.newHuntName;
  huntObj.rawname = hunt;
  huntObj.users = {"admin": {
    "key": "noPasswordSet", // signifies that key needs to be set
    "progress": -1 // -1 just signifies that this is irrelevant
  }};
  huntObj.clues = [];
  hunts[hunt] = huntObj;
  writeFile(filename, JSON.stringify(hunts[hunt]));
});

function launchApp(err){
    if(err !== undefined){
        console.log("error", err);
    }
    
    var port = 8889;
    console.log("starting app on port", port);
    console.log("globalHuntData:", JSON.stringify(globalHuntData));
    app.listen(port);
}

// initialize server
function initServer() {
    function _attemptLaunch(numLoaded, totalToLoad, err){
        if(numLoaded >= totalToLoad){
            launchApp(err);
        }   
    }

    globalHuntData = {};

    fs.readdir("data/hunts", function(err, files){
        if(err){
            launchApp(err);
            return;
        }
        var totalFiles = files.length;
        // dont bother attempting loads if nothing is in the huntdata folder
        if(totalFiles === 0){
            console.log("no files, empty hunt data");
            launchApp();
            return;
        }
        
        var loadedFiles = 0;
        files.forEach(function(fileName){
            var filePath = path.join("data/hunts", fileName);
            
            // check stats of file
            fs.stat(filePath, function(err, stats){
                // if invalid file
                if(err || !(stats.isFile())){
                    if(!(stats.isFile())){
                        err = "not a file";
                    }
                    console.log("did not load", filePath,":", err);
                    loadedFiles += 1;
                    _attemptLaunch(loadedFiles, totalFiles, err);
                    return;
                }
                
                // if the file is valid, read and parse it
                readFile(filePath, "{}", function(err, data){
                    if(err){
                        loadedFiles += 1;
                        _attemptLaunch(loadedFiles, totalFiles, err);
                        return;
                    }
                    
                    data = JSON.parse(data);
                    // get the urlsafe version of the name to act as this
                    // data's key in the global datastore
                    if("safename" in data){
                        var safename = data.safename;
                        if(safename in globalHuntData){
                            console.log("warning: overwriting", safename, 
                                        "data with data from", filePath);
                        }
                        globalHuntData[safename] = data;
                    }
                    // if no name is in the file's data, don't save the data
                    else{
                        console.log("no name set for ", filePath);
                    }
                    
                    loadedFiles += 1;
                    _attemptLaunch(loadedFiles, totalFiles);
                });
            });
        });
    });
}

initServer();