// dis is loading up the admin view for a hunt
$(document).ready(function(){
  // todo: make ajax call to app.js to get the admin data for the given hunt,
  // then populate the interface with the data entries
  var currentUrl = window.location.pathname;
  var urlList = currentUrl.split("/");
  assert(urlList[1] === "hunts");
  var urlHuntName = urlList[2];
  var userName = urlList[3];

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
  	var clues = huntData["clues"];
  	var numClues = clues.length;
  	var clueTable = $("#clues");
  	for (var i = 0; i < numClues; i++) {
  		var clue = clues[i];
  		var newClueRow = $("<tr>").attr("class", "clue-row");
  		var clueNum = $("<td>").attr("class", "clue-num").html(i);
  		var clueDesc = $("<td>").attr("class", "clue-desc").html(clue["desc"]);
  		var clueAns = $("<td>").attr("class", "clue-ans").html(clue["ans"]);
  		newClueRow.append(clueNum).append(clueDesc).append(clueAns);
  		clueTable.append(newClueRow);
  	};
  }

  function fillScoreboard(huntData) {
  	// todo
  }

  $.ajax({
    type: "get",
    url: "/info/" + urlHuntName,
    success: function(data) {
      if (data.exists) {
      	// for admin!
      	if (userName === "admin") {
	        loadAdminPage(data.hunt);
	        //fillScoreboard(data.hunt);
	        loadClues(data.hunt);
	      }
	      // for all other users
	      else {

	      }
      } else {
        console.log("Something's real messed up with getting data to load this.")
      }
    }
  });

});