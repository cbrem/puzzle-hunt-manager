function fillEach(selector, textContent){
    $(selector).each(function(i, elem){
        $(elem).text(textContent);
    });
}

// dis is loading up the admin view for a hunt
$(document).ready(function(){
  // todo: make ajax call to app.js to get the admin data for the given hunt,
  // then populate the interface with the data entries
  var currentUrl = window.location.pathname;
  var urlList = currentUrl.split("/");
  assert(urlList[1] === "hunts");
  var huntBaseIndex = urlList.indexOf("hunts");
  assert(huntBaseIndex !== -1);
  var urlHuntName = urlList[huntBaseIndex+1];
  var urlUserName = undefined;
  
  if(urlList.length > huntBaseIndex+2){
      urlUserName = urlList[huntBaseIndex+2];
  }

  // this loads the information from the specific hunt's data to the page
  function loadPageInfo(huntData) {
  	// title <- raw hunt name
    fillEach(".hunt-name", huntData.rawname);
    
  	// _ total clues <- number of clues
  	var numClues = huntData.clues.length;
    fillEach(".num-total-clues", numClues);
    
  	// _ total users <- number of users
  	var numUsers = getObjectSize(huntData.users);
    fillEach(".num-total-teams", numUsers);
    
    /* load user data, if present */
    if(urlUserName !== undefined && urlUserName in huntData.users){
        var userData = huntData.users[urlUserName];
        var userName = userData.username;
        
        fillEach(".team-name", userName);
        
        var numSolvedClues = userData.progress.length;
        fillEach(".num-solved-clues", numSolvedClues);
        
        if(numSolvedClues < numClues){
            var currentClueNum = numSolvedClues+1;
            fillEach(".curr-clue-num", currentClueNum);
        }
        
        // if there is a canvas available on the page
        if($("#map-canvas").length !== 0 && 
           $("#canvas-wrapper").length !== 0 &&
           loadCanvasMap !== undefined)
        {
            loadCanvasMap(numSolvedClues, numClues);
        }
    }
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
    url: "/info/" + encodeURIComponent(urlHuntName),
    success: function(data) {
      if (data.exists) {
      	// for admin!
      	if (urlUserName === "admin") {
	        loadAdminPage(data.hunt);
	        loadClues(data.hunt);
	      }
	      // for all other users
	      else if (urlUserName !=== undefined) {
        	loadPageInfo(data.hunt);
	      }
	      // for all users
        //fillScoreboard(data.hunt);
      } else {
        console.log("Something's real messed up with getting data to load this.")
      }
    }
  });

});