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

// the directory where all hunt-data files are located, relative to app.js
var huntDataDir = path.join("data", "hunts");

// The global datastore of hunt information, 
// essentially a dictionary of HuntData objects
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

/** send404

uses the given response object to send a 404-not-found page
**/
function send404(response){
    response.status(404).sendfile(path.join("static", "404.html"));
}

/** sendErrorJson 

uses the given response object to send an error json object

params:
response                the Express response object to send on
errorMsg                (optional) the message to send with the data
**/
function sendErrorJson(response, errorMsg){
    response.send({
        error: true,
        errorMsg: errorMsg
    });
}

/** given a dictionary, a key, and a default value, returns the key's entry in 
    the dictionary, if it exists. Otherwise return defaultVal.
    
    params:
    data                the dictionary to grab a vlue from
    key                 the key to get the value for
    defaultVal          (optional) the default value to return if nothing is 
                        found, defaults to undefined if not passed as parameter
**/
function getWithDefault(data, key, defaultVal){
    if(!(data instanceof Object)){
        console.log("warning: called getWithDefault on non-object", data);
    }
    return (key in data) ? data[key] : defaultVal;
}

// OBJECTS
/** an object representing the data carried by a single user/team in a hunt 

can either initialize a blank object by passing in an empty dictionary or
initialize with existing data by passing in a dictionary with keys already set
for keys defined in the init function
**/
function UserData(data){
    this._init = function(data){
        this._typename = "UserData";
        
        this.username = getWithDefault(data, "username")
        this.key = getWithDefault(data, "key");
        this.progress = getWithDefault(data, "progress", []);
    };
    
    this.changeUserKey = function(newKey){
        this.key = newKey;
    };
    
    this.isCorrectKey = function(userKey){
        return userKey === this.key;
    };
    
    this._init(data);
}

/** an object representing a specific clue's data in some hunt 

can either initialize a blank object by passing in an empty dictionary or
initialize with existing data by passing in a dictionary with keys already set
for keys defined in the init function
**/
function ClueData(data){
    this._init = function(data){
        this._typename = "ClueData";
        this.desc = getWithDefault(data, "desc", "no description set");
        this.ans = getWithDefault(data, "ans");
    };
    
    this.isCorrectAnswer = function(inputAns){
        return inputAns === this.ans;
    };
    
    this._init(data);
}


/** HuntData

the object that holds information about a given hunt
it is up to the caller to save this to the global datastore after creation

can either initialize a blank object by passing in an empty dictionary or
initialize with existing data by passing in a dictionary with keys already set
for keys defined in the init function
**/
function HuntData(data){
    this._init = function(data){
        this._typename = "HuntData";
        this.safename = getWithDefault(data, "safename");
        this.rawname = getWithDefault(data, "rawname");
        this.starttime = getWithDefault(data, "starttime");
        this.endtime = getWithDefault(data, "endtime");
        this.admin = getWithDefault(data, "admin", {
            "key": "noPasswordSet",
            "progress": -1 // -1 just signifies that this is irrelevant
        });
        this.users = getWithDefault(data, "users", {});
        this.clues = getWithDefault(data, "clues", []);
        
        this._initUserData();
        this._initClueData();
    };
    
    this.changeAdminKey = function(newKey){
        this.admin.key = newKey;
    };
    
    /** takes the stored dictionary of user data and replaces them with 
        initializations of their respective UserData objects
    **/
    this._initUserData = function(){
        for(var userName in this.users){
            var userData = this.users[userName];
            
            // dont initialize user objects that already exist
            if (userData instanceof UserData){
                continue;
            }
            // otherwise, replace with an actual UserData object
            else{
                this.users[userName] = new UserData(userData);
            }
        }
    };
    
    /** takes the stored list of clue data and replaces them with 
        initializations of their respective ClueData objects
    **/
    this._initClueData = function(){
        for(var i=0; i < this.clues.length; i++){
            var clueData = this.clues[i];
            
            // dont initialize clue objects that already exist
            if (clueData instanceof ClueData){
                continue;
            }
            // otherwise, replace with an actual ClueData object
            else{
                this.clues[i] = new ClueData(clueData);
            }
        }
    };
    
    this.isValidUser = function(username, userkey){
        return (username in this.users && 
                this.users[username].isCorrectKey(userkey));
    };
 
    this.addUser = function(username, key){
        if(username in this.users){
            console.log("user already registered for", this);
            return;
        }
        
        var newUser = new UserData({
            "username": username,
            "key": key
        });
        this.users[username] = newUser;
    }
    
    this._init(data);
}

// GETs

// TEST
app.get("/foo", function(request, response){
    response.sendfile("static/index.html");
});

//for entry into hunt home pages.
//  accessible through home "JOIN" button or directly by URL

// TODO: don't serve up the user or admin keys here
app.get("/hunts/:hunt", function (request, response) {
  var huntName = request.params.hunt;
  var exists = (huntName in globalHuntData);
  var hunt;
  if (exists) hunt = globalHuntData[huntName];
  else hunt = undefined;
  response.send({
    "exists": exists,
    "hunt": hunt
  });
});

//for entry into admin page for a hunt.
//  
app.get("/hunts/:hunt/admin/:key", function (request, response) {
  var hunt = request.params.hunt;
  // if the hunt doesn't exist, redirect them to the homepage
  if (!(hunt in globalHuntData)) {
    //TODO: is this still necessary?
    console.log("going to ADMIN page");
    //response.redirect('/index.html');
    return;
  }
  response.sendfile(path.join("static", "adminview.html"));
});

/** displays the team-specific progress html page for a specific hunt 
    (ie: the page with the canvas map)
**/
app.get("/hunts/:hunt/user/:user/:key", function(request, response){
    var hunt = request.params.hunt;
    var user = request.params.user;
    var key = request.params.key;
    if (!(hunt in globalHuntData)){
        send404(response);
    }
    else if(!(globalHuntData[hunt].isValidUser(user, key))){
        send404(response);
    }
    else{
        response.sendfile(path.join("static", "teamview.html"));
    }
});

/** request json data for a particular user/team's progress data in the given 
    hunt

success response format:
{
    "progress": the user's list of progress points 
                (ie: the timestamps for already solved clues),
    "curClue": the text description of the currently unsolved clue, 
               undefined if all clues are already solved,
    "totalClues": the number of clues in the entire event
}

**/
app.get("/hunts/:hunt/user/:user/:key/getProgress", function(request, response){
    var hunt = request.params.hunt;
    var user = request.params.user;
    var key = request.params.key;
    if (!(hunt in globalHuntData)){
        sendErrorJson(response, "invalid hunt");
    }
    else if(!(globalHuntData[hunt].isValidUser(user, key))){
        sendErrorJson(response, "invalid user/key combination for hunt");
    }
    else{
        var huntData = globalHuntData[hunt];
        var userData = huntData.users[user];
        var clueDataList = huntData.clues;
        var progressList = userData.progress;
        var curClue;
        if (progressList.length < clueDataList.length){
            curClue = clueDataList[progressList.length].desc;
        }
        else{
            curClue = undefined;
        }
        
        response.send({
            progress: progressList,
            curClue: curClue,
            totalClues: clueDataList.length
        });
    }
});

// POSTs

// for CREATE request, create an empty hunt object in datastore
app.post("/hunts/:hunt", function (request, response) {
  console.log("POSTING new hunt!");
  console.log(request.body.newHuntName, request.body.key);
  var hunt = request.params.hunt;

  //check if hunt already exists
  if (hunt in globalHuntData) response.send({
    "error" : false,
    "alreadyExists": true
  });

  // ** may change this later to create object AFTER first save **
  // create new empty hunt object with the creator's inputted hunt name
  huntObj = new HuntData({
    "safename": hunt, 
    "rawname": request.body.newHuntName
  });
  huntObj.changeAdminKey(request.body.key);
  
  // DEBUG - add a dummy user
  huntObj.addUser("testuser", "opensesame");
  
  
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
                        // initialize and save the HuntData object into the
                        // global datastore from the raw parsed data
                        globalHuntData[safename] = new HuntData(data);
                    }
                    // if no name is in the file's data, don't save the data
                    else{
                        console.log("no safename set for ", filePath);
                    }
                    
                    loadedFiles += 1;
                    _attemptLaunch(loadedFiles, totalFiles);
                });
            });
        });
    });
}

initServer();
