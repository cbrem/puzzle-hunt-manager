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
          window.location = "./" + hunt;
        else
          alert("Hunt '" + hunt + "' does not exist.\nYou should create it!");
      }
    });
  });

  // CREATE button
  $("#create").click(function () {
    // this variable is WITH SPACES
    var newHuntName = $("#hunt-name").val();
    // check that there is a name
    if (newHuntName === "") {
      alert("No name specified for your hunt!");
      return;
    };
    // the urlHuntName is WITHOUT SPACES
    var urlHuntName = newHuntName.replace(" ", "");
    // if it isn't url-safe, ask for a new name
    if (encodeURI(urlHuntName) !== urlHuntName) {
      alert("Please only use letters and spaces in your name!");
      return;
    };
    // now create the new webpage for the hunt, and the data object on server
    $.ajax({
      type: "post",
      url: "/" + urlHuntName,
      data: {"newHuntName": newHuntName},
      success: function(data) {

      }
    });
    // navigate to the new admin webpage
    window.location = "./" + urlHuntName + "/admin";
  });

});
