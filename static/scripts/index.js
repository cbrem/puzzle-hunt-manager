$(document).ready(function () {
  $("#join").click(function () {
    var hunt = $("#hunt-name").val();
    $.ajax({
      url: "/hunts/" + hunt,
      type: "get",
      success: function (data) {
        if (data.exists)
          window.location = "./" + hunt;
        else
          alert("Hunt '" + hunt + "' does not exist.\nYou should create it!");
      }
    });
  });
  $("#create").click(function () {
    console.log("created!");
  });
});
