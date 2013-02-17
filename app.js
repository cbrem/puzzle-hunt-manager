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

var huntDataDir = path.join("data", "hunts");
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

/** updateFile

asynchronously update the text file for the given data store key, 
   then call callbackFn
   
params:
huntDataKey                 the urlsafe name of the hunt to update a file for
                            (note that this is the hunt's key in the global
                             data store)
callbackFn                  (optional) a callback function to call once file is
                            written, takes an error parameter
                            
**/
function updateFile(huntDataKey, callbackFn){
    if(!(huntDataKey in globalHuntData)){
        var err = huntDataKey + " not in datastore, unable to write to file";
        if (callbackFn) callbackFn(err);
    }
    
    var filePath = path.join(huntDataDir, huntDataKey+".txt");
    writeFile(filePath, JSON.stringify(globalHuntData[huntDataKey]), 
              callbackFn);
}

// GETs

// TEST
app.get("/foo", function(request, response){
    response.sendfile("static/index.html");
});

// for JOIN request to hunts, tell client if hunt exists
app.get("/hunts/:hunt", function (request, response) {
  var hunt = request.params.hunt;
  var exists = (hunt in globalHuntData);
  var key;
  if (exists) key = globalHuntData[hunt].key;
  else key = undefined;
  response.send({
    "exists": exists,
    "key": key
  });
});

// for ADMIN page on a hunt
app.get("/:hunt/admin/:key", function (request, response) {
  var hunt = request.params.hunt;
  // if the hunt doesn't exist, redirect them to the homepage
  if (!(hunt in globalHuntData)) {
    //TODO: is this still necessary?
    console.log("going to ADMIN page");
    //response.redirect('/index.html');
    return;
  }
  response.sendfile("static/adminview.html");  
});

// POSTs

// for CREATE request, create an empty hunt object in datastore
app.post("/:hunt", function (request, response) {
  console.log("POSTING new hunt!");
  var hunt = request.params.hunt;

  //check if hunt already exists
  if (hunt in globalHuntData) response.send({
    "error" : false,
    "alreadyExists": true
  });

  // ** may change this later to create object AFTER first save **
  // create new empty hunt object with the creator's inputted hunt name
  huntObj = {};
  huntObj.safename = request.body.newHuntName;
  huntObj.rawname = hunt;
  huntObj.users = {"admin": {
    "key": request.body.key,
    "progress": -1 // -1 just signifies that this is irrelevant
  }};
  huntObj.clues = [];
  // update server hunt object
  globalHuntData[hunt] = huntObj;
  // create file for this hunt
  updateFile(hunt, function(err, data) {
    if (err) {
      console.log("Error thrown: " + err);
      response.send({
        "error": true,
        "alreadyExists": false
      })
    }
    else {
      response.send({
        "error": false,
        "alreadyExists": false
      });
    }
  });
});

// PUTs



// DELETEs



// SETUP

/** launchApp 

when called, will log data to console, then actually start the application

params:
err         (optional) Will print given error/warning message before starting
**/
function launchApp(err){
    if(err !== undefined){
        console.log("error", err);
    }
    
    var port = 8889;
    console.log("starting app on port", port);
    console.log("globalHuntData:", JSON.stringify(globalHuntData));
    app.listen(port);
}

/** initServer

when called, initializes server by reading data files and compiling the server's
datastore

will essentially take each of the hunt data files, take the urlsafe name and
use it as a key in the global datastore mapped to the file's data

calls launchApp when initialization is complete
**/
function initServer() {
    /** _attemptLaunch
    
    helper function to check if the given number of loaded items should allow us
    to launch the application by checking against a total number of items
    
    params:
    numLoaded               the number of items loaded so far
    totalToLoad             the target total of items to load
    err                     (optional) the error/warning to pass into launchApp
    **/
    function _attemptLaunch(numLoaded, totalToLoad, err){
        if(numLoaded >= totalToLoad){
            launchApp(err);
        }   
    }

    // default to initializing the datastore as empty
    globalHuntData = {};

    // get the list of files in the hunt data directory
    fs.readdir(huntDataDir, function(err, files){
        if(err){
            launchApp(err);
            return;
        }
        var totalFiles = files.length;
        // dont bother attempting loads if nothing is in the hunt data folder
        if(totalFiles === 0){
            console.log("no files, empty hunt data");
            launchApp();
            return;
        }
        
        var loadedFiles = 0;
        files.forEach(function(fileName){
            var filePath = path.join(huntDataDir, fileName);
            
            // check stats of file
            fs.stat(filePath, function(err, stats){
                // if invalid file or not even a file, skip readFile call
                if(err || !(stats.isFile())){
                    if(!(stats.isFile())){
                        err = "not a file";
                    }
                    console.log("did not load", filePath,":", err);
                    loadedFiles += 1;
                    _attemptLaunch(loadedFiles, totalFiles, err);
                    return;
                }
                
                // if the file is valid, readFile it
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
