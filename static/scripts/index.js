// managing the home page

$(document).ready(function () {

  // JOIN button
  $("#join").click(function () {
    var hunt = $("#hunt-name").val();
    $.ajax({
      type: "get",
      url: "/hunts/" + hunt,
      success: function (data) {
        if (data.exists)
          window.location = "./hunts/" + hunt;
        else
          alert("Hunt '" + hunt + "' does not exist.\nYou should create it!");
      }
    });
  });

  // CREATE button
  $("#create").click(function (e) {
    // this variable is WITH SPACES
    var newHuntName = $("#hunt-name").val();
    // check that there is a name
    if (newHuntName === "" || newHuntName === "Enter a hunt name.") {
      //alert("No name specified for your hunt!");
      console.log("no name");
      return;
    }
    // the urlHuntName is WITHOUT SPACES
    var urlHuntName = newHuntName.replace(" ", "")
    // if it isn't url-safe, ask for a new name
    if (encodeURI(urlHuntName) !== urlHuntName) {
      alert("Please only use letters and spaces in your name!");
      return;
    }
    
    $.ajax({
      type: "get",
      url: "/hunts/" + urlHuntName,
      success: function(data) {
        if (data.exists) {
          promptEdit(data, newHuntName, urlHuntName);
        } else {
          promptCreate(data, newHuntName, urlHuntName);
        }
      }
    });
  });
});

var promptEdit = function (data, newHuntName, urlHuntName) {
    console.log(data);
    var keyGiven =
      prompt("This hunt already exists. Enter your key to edit it.");
    if (keyGiven === data.hunt.admin.key) {
      //navigate to the edit page
      window.location = "./hunts/" + urlHuntName + "/admin/" + data.key;
    } else {
      console.log("Wrong key given. Expected " 
                  + data.hunt.users.admin.key + ", given " + keyGiven);
    }
};

var promptCreate = function (data, newHuntName, urlHuntName) {
    var keyGiven =
      prompt("This hunt hasn't been created yet! Enter a key to make it!");

    $.ajax({
      type: "post",
      url: "/hunts/" + urlHuntName,
      data: {"newHuntName": newHuntName, "key": keyGiven},
      success: function(data) {
        if (!data.error) {
          // navigate to the new admin webpage
          console.log("Successfuly created new hunt");
          window.location = "./hunts/" + urlHuntName + "/admin/" + keyGiven;
        }
        else {
          console.log("There was an error creating the page.", data);
        }
      }
    });
};
