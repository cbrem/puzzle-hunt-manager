$(document).ready(function () {

  // JOIN button
  $("#join").click(function () {
    var huntName = $("#hunt-name").val();
    var urlHuntName = encodeName(huntName, "Enter a hunt name.");
    if (urlHuntName === undefined) return;

    $.ajax({
      type: "get",
      url: "/info/" + urlHuntName,
      success: function (data) {
        if (data.exists)
          window.location = "./hunts/" + urlHuntName;
        else
          alert("Hunt '" +
                huntName + "' does not exist.\nYou should create it!");
      }
    });
  });

  // ADMINISTER button
  $("#administer").click(function (e) {
    var newHuntName = $("#hunt-name").val();
    var urlHuntName = encodeName(newHuntName, "Enter a hunt name.");
    if (urlHuntName === undefined) return;
 
    $.ajax({
      type: "get",
      url: "/info/" + urlHuntName,
      success: function(data) {
        if (data.exists) {
          promptEdit(data, "admin", urlHuntName);
        } else {
          promptCreate(data, newHuntName, urlHuntName);
        }
      }
    });
  });

  // SIGNIN button
  $("#signin").click(function (e) {
    var newTeamName = $("#team-name").val();
    var urlTeamName = encodeName(newTeamName, "Enter a team name.");
    if (urlTeamName === undefined) return;

    var url = window.location.pathname;
    var urlHuntName = url.slice("/hunts/".length);
 
    $.ajax({
      type: "get",
      url: "/info/" + urlHuntName,
      success: function(data) {
        if (data.exists && (urlTeamName in data.hunt.users)) {
          promptEdit(data, urlTeamName, urlHuntName);
        } else {
          promptCreate(data, "dummy", urlHuntName);
        }
      }
    });
  });

});

//given a  name or password (possibly with spaces), returns a url-safe
//  version. if no name/unencodable name is given, returns undefined.
//  alerts user if bad name is given.
var encodeName = function (name, def) {
    // check that there is a name/it's not the default
    if (name === null || name === "" || name === def) {
      //alert("Please enter your text!");
      return undefined;
    }
    var urlName = name.replace(/\s/g, "");
    // if it isn't url-safe, ask for a new name
    if (encodeURI(urlName) !== urlName) {
      alert("Please only use letters and spaces!");
      return undefined;
    }
    return urlName;
};

//prompt the user to put in the password required to view an existing
//  team/admin page. on success, take them to that page
var promptEdit = function (data, user, urlHuntName) {
    var givenKey =
      prompt("That name already exists. Enter your key.");
    var urlKey = encodeName(givenKey, "");
    if (urlKey === undefined) return;

    var expectedKey = (user === "admin") ? data.hunt.admin.key :
                                           data.hunt.users[user].key;
    console.log("data", data);
    if (urlKey === expectedKey) {
      //navigate to the edit page
      window.location = "/hunts/" + urlHuntName + "/" + user + "/" + urlKey;
    } else {
      console.log("Wrong key given. Expected " 
                  + expectedKey + ", given " + givenKey);
    }
};

//prompt the user to create a password for admining a new hunt/ a new team
//  for an existing hunt. then, take them to the relevant page
var promptCreate = function (data, newHuntName, urlHuntName) {
    var keyGiven =
      prompt("That name doesn't exist yet! Enter a key to make it!");
    var urlKey = encodeName(keyGiven, "");
    if (urlKey === undefined) return;

    //TODO: since hunt creation and user creation share this function,
    //      add option to add user to existing hunt
    if (newHuntName === "dummy") {
      alert("Team creation not yet implemented. Enter team data manually.")
      return;
    }

    $.ajax({
      type: "post",
      url: "/hunts/" + urlHuntName,
      data: {"newHuntName": newHuntName, "key": urlKey},
      success: function(data) {
        if (!data.error) {
          // navigate to the new admin webpage
          console.log("Successfuly created new hunt");
          window.location = "/hunts/" + urlHuntName + "/admin/" + urlKey;
        }
        else {
          console.log("There was an error creating the page.", data);
        }
      }
    });
};
