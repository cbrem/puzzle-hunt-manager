function onEnterKeypress($elem, callbackFn){
    $elem.keypress(function(e){
    if(e.which === 13){ // enter key
        callbackFn(e);
        return false;
    }
  });
};

$(document).ready(function () {
  var _adminDropdown = "none"; // state of admin dropdown menu
  var _startDropdown = "none"; //state of team dropdown menu.
  var _continueDropdown = "none";
                          //possible values are 'none', 'start', 'continue'

  $("form").each(function(i, elem){
    $(elem).submit(function(e){
        e.preventDefault(); // prevent page refresh when hitting enter,
                            // override this in page-specific functions to 
                            // re-enable
    });
  });

  // SEARCH button
  $("#search").click(function () {
    var huntName = $("#hunt-name").val();
    var urlHuntName = encodeName(huntName);
    if (urlHuntName === undefined){
        createAlert("Please enter the name of the hunt you want to join.");
        return;
    }

    $.ajax({
      type: "get",
      url: "/info/" + urlHuntName,
      success: function (data) {
        if (data.exists){
          window.location = "./hunts/" + urlHuntName;
        }
        else{
          createAlert("We couldn't find a hunt named " +
                huntName + ". Are you sure you spelled that correctly?");
        }
      }
    });
  });

  // CREATE button
  $("#create").click(function () {
    $("#create-box").slideToggle("slow");
  });

  // GO button on home page (only shows after CREATE is pushed)
  $("#create-go").click(function () {
    var newHuntName = $("#hunt-name").val();
    var newHuntPass = $("#hunt-pass").val();
    var urlHuntName = encodeName(newHuntName);
    var urlHuntPass= encodeName(newHuntPass);
    if (urlHuntName === undefined || urlHuntPass === undefined){
        createAlert("Please enter a valid name/password!");
        return;
    }
    var path = "/hunts/" + urlHuntName + "/admin/" + urlHuntPass;
 
    $.ajax({
      type: "get",
      url: "/info/" + urlHuntName,
      success: function(data) {
        if (data.exists) {
          createAlert("That hunt already exists!");
        } else {
          createTeamOrHunt(path, newHuntName);
        }
      }
    });
  });

  // START button
  $("#start").click(function () {
    $("#start-box").slideToggle("slow");
    if (_startDropdown === "start") {
      _startDropdown = "none";
    } else {
      _startDropdown = "start";
    }
  });
  
  // new team creation
  $("#start-go").click(function (e) {
    var teamName = $("#new-team-name").val();
    var pass = $("#new-team-pass").val();
    var urlTeamName = encodeName(teamName);
    var urlPass = encodeName(pass);
    console.log(urlTeamName, urlPass);
    if (urlTeamName === undefined || urlPass === undefined) return;

    var url = window.location.pathname;
    var urlHuntName = url.slice("/hunts/".length);
    var path = urlHuntName + "/" + urlTeamName + "/" + urlPass;
 
    $.ajax({
      type: "get",
      url: "/info/" + urlHuntName,
      success: function(data) {
        console.log(data);
        if (urlTeamName in data.hunt.users) {
          createAlert("Sorry, but this team name already exists.  Perhaps you mean to continue?");
        } else {
          createTeamOrHunt(path, teamName);
        }
      }
    });
  });

  // CONTINUE button
  $("#continue").click(function () {
    $("#continue-box").slideToggle("slow");
    if (_continueDropdown === "continue") {
      _continueDropdown = "none";
    } else {
      _continueDropdown = "continue";
    }
  });
  
  // team log in
  $("#continue-go").click(function (e) {
    var teamName = $("#team-name").val();
    var pass = $("#team-pass").val();
    var urlTeamName = encodeName(teamName);
    var urlPass = encodeName(pass);
    if (urlTeamName === undefined || urlPass === undefined) return;

    var url = window.location.pathname;
    var urlHuntName = url.slice("/hunts/".length);
    var path = urlHuntName + "/" + urlTeamName + "/" + urlPass;
 
    $.ajax({
      type: "get",
      url: "/info/" + urlHuntName,
      success: function(data) {
        console.log(data);
        if (urlTeamName in data.hunt.users) {
          var expectedKey = data.hunt.users[urlTeamName].key;
          if (urlPass === expectedKey) {
            window.location = "/hunts/" + path;
          } else {
            createAlert("Sorry, that password is incorrect!");
          }
        } else {
          createAlert("This team does not exist!\nPerhaps you mean to start a new team?");
        }
      }
    });
  });

  // MANAGE button
  $("#manage").click(function () {
    $("#manage-box").slideToggle("slow");
    if (_adminDropdown === "manage") {
      _teamDropdown = "none";
    } else {
      _teamDropdown = "manage";
    }
  });

  // admin log-in
  $("#manage-go").click(function (e) {
    var pass = $("#manage-pass").val();
    var urlPass = encodeName(pass);
    if (urlPass === undefined) return;

    var url = window.location.pathname;
    var urlHuntName = url.slice("/hunts/".length);

    $.ajax({
      type: "get",
      url: "/info/" + urlHuntName,
      success: function(data) {
        var expectedKey = data.hunt.users["admin"].key;
        var path = "/hunts/" + urlHuntName + "/admin/" + urlPass;
        if(expectedKey === urlPass) {
          //navigate to the edit page
          window.location = path;
        } else {
          createAlert("Sorry, that password is incorrect!");
        }
      }
    });
  });

  // search for event form
  onEnterKeypress($("#hunt-name"), function(e){
    // if password box is available, do create
    if($("#hunt-pass").is(":visible")){
        $("#create-go").click();
    }
    // otherwise do search
    else{
        $("#search").click();
    }
  });
  
  // create new event form
  onEnterKeypress($("#hunt-pass"), function(e){
    $("#create-go").click();
  });
  
  // new team form
  onEnterKeypress($("#new-team-name, #new-team-pass"), function(e){
    $("#start-go").click();
  });
  
  // continue team form
  onEnterKeypress($("#team-name, #team-pass"), function(e){
    $("#continue-go").click();
  });
  
  // admin manage from event view form
  onEnterKeypress($("#manage-pass"), function(e){
    $("#manage-go").click();
  });
  
});

//given a  name or password (possibly with spaces), returns a url-safe
//  version. if no name/unencodable name is given, returns undefined.
//  alerts user if bad name is given.
var encodeName = function (name) {
    // check that there is a name/it's not the default
    if (name === null || name === "") {
      //alert("Please enter your text!");
      return undefined;
    }
    var urlName = name.replace(/\s/g, "");
    // if it isn't url-safe, ask for a new name
    if (encodeURI(urlName) !== urlName) {
      createAlert("Please only use letters and spaces!");
      return undefined;
    }
    return urlName;
};

var createTeamOrHunt = function (path, rawName) {
  $.ajax({
    type: "post",
    url: path,
    data: {"rawName": rawName},
    success: function(data) {
      if (!data.error) {
        // navigate to the new admin webpage
        window.location = path;
        console.log("Successfully created new hunt: ", rawName);
      }
      else {
        console.log("There was an error creating the page.", data);
      }
    }
  });
};

//custom alert box. takes a message and an object mapping button names to
//  callbacks which should be called when those buttons are clicked.
var createAlert = function (message, buttons) {
  var overlay = $(".overlay");
  var al = $(".alert").empty();

  //grey out page
  overlay.css({"display": "block"});

  //add message to alert box
  var mess = $("<h2>").html(message);
  al.append(mess);

  //add default "Ok" button if none are given
  if (buttons === undefined) {
    buttons = {"Okay": undefined};
  }

  //add all given buttons
  for (button in buttons) {
    var newButton = $("<span>");
    newButton.html(button);
    newButton.addClass("button");

    //bind callback from buttons[button] to new button
    (function (callback) {
      newButton.click(function (e) {
        if (callback !== undefined) callback(e);
        al.html("");
        overlay.css({"display": "none"});
      });
    }) (buttons[button]);

    al.append(newButton);
  }
};
