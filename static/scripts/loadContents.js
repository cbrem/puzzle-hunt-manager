// dis is loading up the admin view for a hunt
$(document).ready(function(){
  // make ajax call to app.js to get the admin data for the given hunt,
  // then populate the interface with the data entries
  var currentUrl = window.location.pathname;
  var urlList = currentUrl.split("/");
  assert(urlList[1] === "hunts");
  var urlHuntName = urlList[2];

  // this loads the information from the specific hunt's data to the page
  function loadAdminPage(huntData) {
  	// title <- raw hunt name
  	$("#hunt-name").html(huntData["rawname"]);
  	// _ total clues <- number of clues
  	var numClues = huntData["clues"].length;
  	$("#num-total-clues").html(numClues);
  	// _ total users <- number of users
  	var numUsers = getObjectSize(huntData["users"]);
  	$("#num-total-teams").html(numUsers);
  }

  function loadClues(huntData) {
  	
  }

  function fillScoreboard(huntData) {
  	// todo
  }

  $.ajax({
    type: "get",
    url: "/info/" + urlHuntName,
    success: function(data) {
      if (data.exists) {
        loadAdminPage(data.hunt);
        //fillScoreboard(data.hunt);
      } else {
        console.log("Something's real messed up with getting data to load this.")
      }
    },
    error: function(data){
        console.log("error", data);
    }
  });

});