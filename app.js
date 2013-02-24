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
    /** UserData valid input mappings:

    "username"              the username for this instance's user
    "key"                   the userkey for this instance's user
    "progress"              the progress list for this instance's user
                            (ie: a list of data about a solved clue, such as 
                             a timestamp of solve date)
    **/
    this._init = function(data){
        this._typename = "UserData";
        
        this.username = getWithDefault(data, "username")
        this.key = getWithDefault(data, "key");
        this.progress = getWithDefault(data, "progress", []);
    };
    
    /** <UserData>.changeUserKey
    
    changes the key stored for this UserData instance
    
    params:
    newKey              the new key to use
    **/
    this.changeUserKey = function(newKey){
        this.key = newKey;
    };
    
    /** <UserData>.isCorrectKey
    
    checks the input key against the stored key in this UserData instance
    
    params:
    inputKey             the input key to check
    **/
    this.isCorrectKey = function(inputKey){
        return inputKey === this.key;
    };
    
    /** <UserData>.incrementProgress
    
    adds a new entry to the progress list of a given user, based on the 
    given ClueData object representing the just-solved clue
    
    only call this once per clue
    **/
    this.incrementProgress = function(solvedClueData){
        this.progress.push({
            timestamp: (new Date()).getTime(),
            desc: solvedClueData.desc,
            ans: solvedClueData.ans
        });
    }
    
    this._init(data);
}

/** ClueData

an object representing a specific clue's data in some hunt 

can either initialize a blank object by passing in an empty dictionary or
initialize with existing data by passing in a dictionary with keys already set
for keys defined in the init function
**/
function ClueData(data){
    /** ClueData valid input mappings:

    "desc"              the question/human-readable description for this 
                        instance's clue
    "ans"               the answer for this instance's clue
    "createTime"        the time at which an admin client created the clue
    **/
    this._init = function(data){
        this._typename = "ClueData";
        this.desc = getWithDefault(data, "desc", "no description set");
        this.ans = getWithDefault(data, "ans");
        this.createTime = getWithDefault(data, "createTime", "0");
    };
    
    /** <ClueData>.isCorrectAnswer
    
    checks the input answer against the stored answer in this ClueData instance
    
    params:
    inputAns             the input answer to check
    **/
    this.isCorrectAnswer = function(inputAns){
        return inputAns.trim().toLowerCase() === this.ans.trim().toLowerCase();
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
    /** HuntData valid input mappings:

    "safename"              the url-safe name to use as this hunt's datastore 
                            key
    "rawname"               the human-readable name/labek for this hunt
    "starttime"             the start time of this hunt, stored as the number of
                            milliseconds since the epoch
    "endtime"               the end time of this hunt, stored as the number of
                            milliseconds since the epoch
    "users"                 a dictionary of usernames mapped to their respective
                            UserData objects
    "clues"                 a list of ClueData objects, in the order the hunt
                            should progress through them
    **/
    this._init = function(data){
        this._typename = "HuntData";
        this.safename = getWithDefault(data, "safename");
        this.rawname = getWithDefault(data, "rawname");
        this.starttime = getWithDefault(data, "starttime");
        this.endtime = getWithDefault(data, "endtime");
        this.users = getWithDefault(data, "users", {
            "admin": new UserData({
                        "username": "admin",
                        "key": undefined
                     })
        });
        this.clues = getWithDefault(data, "clues", []);
        
        this._initUserData();
        this._initClueData();
    };
    
    this.validateAdminKey = function(inputKey){
        if("admin" in this.users){
            return this.users.admin.isCorrectKey(inputKey)
        }
        else{
            return false;
        }
    }
    
    /** <HuntData>.changeAdminKey
    
    changes the stored key for the admin of this hunt data
    
    params:
    newKey                  the new key to change to
    **/
    this.changeAdminKey = function(newKey){
        if("admin" in this.users){
            this.users.admin.changeUserKey(newKey);
        }
    };
    
    /** <HuntData>._initUserData
    
        takes the stored dictionary of raw user data and replaces them with 
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
    
    /** <HuntData>._initClueData
    
        takes the stored list of raw clue data and replaces them with 
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
    
    /** <HuntData>.isValidUser
    
    checks the stored user dictionary to see if the given user credentials are 
    valid
    
    params:
    username            the input username to check
    userkey             the input userkey to check
    **/
    this.isValidUser = function(username, userkey){
        return (username in this.users && 
                this.users[username].isCorrectKey(userkey));
    };
 
    this.hasUser = function(username){
        return (username in this.users);
    }
 
    /** <HuntData>.addUser
    
    adds a new user with the given credentials to this HuntData instance's
    user dictionary
    
    params:
    username            the new user's name
    key                 the new user's key
    **/
    this.addUser = function(username, key){
        var newUser = new UserData({
            "username": username,
            "key": key
        });
        this.users[username] = newUser;
    }
    
    this.clearClues = function(){
        this.clues = [];
    }
    
    this.addClue = function(desc, ans, time){
        var newClue = new ClueData({
            "desc":desc,
            "ans":ans,
            "createTime": time
        });
        this.clues.push(newClue);
    }
    
    this.popClue = function(index){
        var removedClue = undefined;
        if (0 <= index && index < this.clues.length){
            var removedClue = this.clues[index];
            this.clues.splice(index, 1);
        }
        return removedClue;
    }
    
    this._init(data);
}

// GETs

//for info about hunt. used before/after navigation in response to
//  JOIN or ADMINISTER buttons. Provides info about hunt,
//  but does not load page.
app.get("/info/:hunt", function (request, response) {
  var hunt = request.params.hunt;
  if (hunt in globalHuntData) {
    response.send({
      "exists": true,
      "hunt": globalHuntData[hunt]
    });
  } else {
    response.send({"exists": false});
  }
});

//for entry into general hunt page for a hunt. provides static
//  html page. can be reached from JOIN button or directly by URL
app.get("/hunts/:hunt", function (request, response) {
  var hunt = request.params.hunt;
  if (hunt in globalHuntData){
    response.sendfile(path.join("static", "huntview.html"));
  }
  else{
    send404(response);
  }
});

//for entry into a team's/admin's page for a hunt. provides static
//  html page. can be reached from signin button (for teams),
//  organize button (for admins), or directly by URL
app.get("/hunts/:hunt/:user/:key", function (request, response) {
  var hunt = request.params.hunt;
  var user = request.params.user;
  var key = request.params.key;
  var view = (user === "admin") ? "adminview.html" : "teamview.html";
  var huntData;
  if (hunt in globalHuntData){
    huntData = globalHuntData[hunt];
  }
  else{
    send404(response);
    return;
  }
  
  if(huntData.isValidUser(user, key)){
    response.sendfile(path.join("static", view));
  }
  else{
    send404(response);
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
    
    // error checking for malformed input
    if (!(hunt in globalHuntData)){
        sendErrorJson(response, "invalid hunt");
    }
    else if(!(globalHuntData[hunt].isValidUser(user, key))){
        sendErrorJson(response, "invalid user/key combination for hunt");
    }
    // actually creating the return data
    else{
        var huntData = globalHuntData[hunt];
        var userData = huntData.users[user];
        var clueDataList = huntData.clues;
        var progressList = userData.progress;
        
        // get description of currently unsolved clue
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

// add team from SIGN IN button
app.post("/hunts/:hunt/:user/:key", function (request, response) {
  var hunt = request.params.hunt;
  var user = request.params.user;
  var key = request.params.key;
  
  if (user === "admin") {
    //create new hunt, which adds admin
    // ** may change this later to create object AFTER first save **
    // create new empty hunt object with the creator's inputted hunt name
    var huntObj = new HuntData({
      "safename": hunt, 
      "rawname": request.body.newHuntName
    });
    huntObj.changeAdminKey(key);
    
    // update server hunt object
    globalHuntData[hunt] = huntObj;  
  } else {
    //add user to hunt
    if (!(hunt in globalHuntData)) {
      console.log("Adding user to non-existant hunt.");
      response.send({"error": true});
    }
    globalHuntData[hunt].addUser(user, key);
  }

  //update datastore
  updateFile(hunt, function(err, data) {
    if (err) {
      console.log("Error thrown: " + err);
      response.send({"error": true});
    }
    else {
      response.send({"error": false});
    }
  });
});

/**
function to take in a guessed answer for a certain user and either send back a 
failure message if its incorrect or update the user's progress and send back the
description for the next clue

response format:
correct         whether or not the correct answer was given
completed       whether or not the user has completed all clues in the hunt
nextClue        the next clue's description and number
                (description will be undefined if no more clues left)
error           will be true if any errors occurred
errorMsg        will be set if any errors occurred
**/
app.post("/verifyAnswer", function(request, response){
    var hunt = request.body.hunt;
    var user = request.body.user;
    var userKey = request.body.key;
    var userAnswer = request.body.answer;
    
    // first check that credentials are valid
    if(!(hunt in globalHuntData && 
         globalHuntData[hunt].isValidUser(user, userKey)))
    {
        sendErrorJson(response, "invalid credentials");
        return;
    }
    
    var huntData = globalHuntData[hunt];
    var userData = huntData.users[user];
    var allClues = huntData.clues;
    var userProgress = userData.progress;
    // check that there is actually a clue to answer
    if(userProgress.length >= allClues.length){
        sendErrorJson(response, "no clue to answer");
        return;
    }
    
    var currClueData = allClues[userProgress.length];
    var nextClueDesc = undefined;
    var complete = false;
    // either get the next clue or signal that the hunt is complete
    if(userProgress.length + 1 < allClues.length){
        nextClueDesc = allClues[userProgress.length+1].desc;
    }
    else{
        complete = true;
    }
                            
    if(currClueData.isCorrectAnswer(userAnswer)){
        // add an entry to the user's progress list
        userData.incrementProgress(currClueData);
        
        // don't forget to save the file
        updateFile(hunt, function(err){
            if(err){
                sendErrorJson(response, err);
            }
            else{
                response.send({
                    correct: true,
                    complete: complete,
                    nextClue: {
                        desc: nextClueDesc,
                        num: userData.progress.length+1
                    }
                });
            }
        });
    }
    else{
        response.send({
            correct: false
        });
    }
});

// PUTs

/** call this api function to update the stored clues list for a given hunt 

PUT params:
huntName              the url-safe/data-key name for the hunt to modify
adminKey              the keycode for the admin of the given hunt
clueList              a list of clue dictionaries to store as the new clues data
                      of the given hunt, requires values for the 
                      "desc" and "ans" fields
**/
app.put("/edit/clues", function(request, response){
    var safeHuntName = request.body.huntName;
    var adminKey = request.body.adminKey;
    var inputClues = request.body.clueList;
    
    if(safeHuntName in globalHuntData &&
       globalHuntData[safeHuntName].validateAdminKey(adminKey) &&
       typeof(inputClues) === typeof([])){
       
        var huntData = globalHuntData[safeHuntName];
        
        // clear clues before adding in new ones
        huntData.clearClues();
        
        // iterate through input clue data and only add the one with
        // fields of "desc" and "ans"
        for(var i=0; i < inputClues.length; i++){
            var clue = inputClues[i];
            if("desc" in clue && "ans" in clue && "createTime" in clue) {
                huntData.addClue(clue.desc, clue.ans, clue.createTime);
            }
        }
        
        // set up callbacks for after file has been written
        updateFile(safeHuntName, function(err){
            if(err){
                console.log("error in clue update for", safeHuntName);
                sendErrorJson(response, "unable to update "+safeHuntName+" clues");
            }
            else{
                response.send({
                    success: true,
                    huntData: huntData
                });
            }
        });
    }
    else{
        sendErrorJson(response, "invalid input data");
    }
});

app.put("/edit/user", function(request, response){
    // TODO: based on the input data, update the user information in a given hunt
});


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
