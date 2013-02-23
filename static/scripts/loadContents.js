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
  var huntData = undefined;
  
  if(urlList.length > huntBaseIndex+2){
      urlUserName = urlList[huntBaseIndex+2];
  }
  if(urlList.length > huntBaseIndex+3){
      urlUserKey = urlList[huntBaseIndex+3];
  }

  // this loads the information from the specific hunt's data to the page
  function loadPageInfo() {
  	if (huntData === undefined) {
  		console.log("huntData is not defined!");
  		return;
  	}
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
        
        if(numSolvedClues+1 < numClues){
            var currentClueNum = numSolvedClues+1;
            fillEach(".curr-clue-num", currentClueNum);
            
            var currentClueDesc = huntData.clues[currentClueNum].desc;
            fillEach(".curr-clue-desc", currentClueDesc);
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

  function loadClues() {
  	if (huntData === undefined) {
  		console.log("huntData is not defined!");
  		return;
  	}
  	console.log("loading clues!");
  	var clues = huntData["clues"];
  	var numClues = clues.length;
  	var clueTable = $("#clues");
  	for (var i = 0; i < numClues; i++) {
  		var clue = clues[i];
  		var newClueRow = $("<tr>").attr("class", "clue-row");
  		var clueNum = $("<td>").attr("class", "clue-num").html(i+1);
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
      	huntData = data.hunt;
      	// admin-specific
      	if (urlUserName === "admin") {
	        loadClues();
	      }
	      // hunter-specific
	      else if (urlUserName !== undefined) {
	      }
	      // info for all users
	      loadPageInfo();
        //fillScoreboard(data.hunt);

      } else {
        console.log("Something's real messed up with getting data to load this.")
      }
    }
  });

  $("#add-clue-button").click(function () {
		// update client with added clue
		var clueText = $("#write-clue-desc").val();
		var ansText = $("#write-clue-ans").val();
		var clueObj = {"desc": clueText, "ans": ansText};
		huntData["clues"].push(clueObj);

		// update server
		$.ajax({
			type: "put",
			url: "/edit/clues",
			data: {
				"huntName": urlHuntName,
				"adminKey": urlUserKey,
				"clueList": huntData["clues"]
			},
			success: function(data) {
				if (data.success) {
					huntData = data.huntData;
					loadClues();
				}
				else {
					console.log("Error adding clue!");
				}
			}
		});
	});

});