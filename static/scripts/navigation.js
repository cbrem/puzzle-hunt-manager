$(document).ready(function () {
  var _teamDropdown = "none";//state of team dropdown menu.
                             //possible values are 'none', 'start', 'continue'

  $("form").each(function(i, elem){
    $(elem).submit(function(e){
        e.preventDefault(); // prevent page refresh when hitting enter
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
        if (data.exists)
          window.location = "./hunts/" + urlHuntName;
        else
          createAlert("We couldn't find a hunt named " +
                huntName + ". Are you sure you spelled that correctly?");
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

  //MANAGE hunt button (for existing hunts)
  $("#manage").click(function (e) {
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

  // START button
  $("#start").click(function () {
    $("#team-box").slideToggle("slow");
    if (_teamDropdown === "start" || _teamDropdown === "continue") {
      _teamDropdown = "none";
    } else {
      _teamDropdown = "start";
    }
  });
  
  // CONTINUE button
  $("#continue").click(function () {
    $("#team-box").slideToggle("slow");
    if (_teamDropdown === "start" || _teamDropdown === "continue") {
      _teamDropdown = "none";
    } else {
      _teamDropdown = "continue";
    }
  });
  
  // team log in
  $("#team-go").click(function (e) {
    var teamName = $("#team-name").val();
    var pass = $("#team-pass").val();
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
          var expectedKey = data.hunt.users[urlTeamName].key;
          if (urlPass === expectedKey) {
            window.location = "/hunts/" + path;
          } else {
            createAlert("Sorry, that password is incorrect!");
          }
        } else {
          createTeamOrHunt(path, teamName);
        }
      }
    });
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
          console.log("Successfully created new hunt");
          window.location = path;
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
  var al = $(".alert");

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

    //add callback to a button
    var callback = buttons[button];
    newButton.click(function (e) {
      if (callback !== undefined) callback(e);
      al.html("");
      overlay.css({"display": "none"});
    });
    al.append(newButton);
  }
};
