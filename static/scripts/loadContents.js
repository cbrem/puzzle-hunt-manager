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
  var urlUserKey = undefined;
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
    if("admin" in huntData.users){
        numUsers--;
    }
    fillEach(".num-total-teams", numUsers);
    
    /* load user data, if present */
    if(urlUserName !== undefined && urlUserName in huntData.users){
        var userData = huntData.users[urlUserName];
        var userName = userData.username;
        
        fillEach(".team-name", userName);
        
        var numSolvedClues = userData.progress.length;
        fillEach(".num-solved-clues", numSolvedClues);
        
        if(numSolvedClues+1 <= numClues){
            var currentClueNum = numSolvedClues+1;
            fillEach(".curr-clue-label", "Clue #"+currentClueNum);
            
            // minus one to do this in zero-indexing
            var currentClueDesc = huntData.clues[currentClueNum-1].desc;
            fillEach(".curr-clue-desc", currentClueDesc);
        }
        else{
            fillEach(".curr-clue-label", "No clues left");
            fillEach(".curr-clue-desc", "You've completed the \""+huntData.rawname+"\" puzzle hunt!");
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

  // loading clue table for admin page
  function loadClues() {
  	if (huntData === undefined) {
  		console.log("huntData is not defined!");
  		return;
  	}
  	// delete any clues already there
  	$(".clue-row").each(function(i, elem){
  		$(elem).remove();
  	})
  	// add current clue list to html
  	var clueTable = $("#clues");
  	var clues = huntData["clues"];
  	var numClues = clues.length;
  	for (var i = 0; i < numClues; i++) {
  		var clue = clues[i];
      console.log(clue);
  		var newClueRow = $("<tr>").attr("class", "clue-row");
  		var num = $("<td>").attr("class", "clue-num").html(i+1);
  		var desc = $("<td>").attr("class", "clue-desc").html(clue["desc"]);
  		var ans = $("<td>").attr("class", "clue-ans").html(clue["ans"]);

      var identifier = clue["createTime"]; //unique identifier for deletion
  		var del = $("<td>").attr("class", "clue-del");
      var delButton = $("<span>").attr("class", "clue-del-button")
                                 .attr("id", identifier);
      del.append(delButton);
  		newClueRow.append(num).append(desc).append(ans).append(del);
  		clueTable.append(newClueRow);
  	};

    //bind newly created buttons to clue deletion
    $(".clue-del-button").click(function () {
      var identifier = $(this).attr("id");
      createAlert("Are you sure you want to delete this clue?",
                  {"Yes": function () {deleteClue(identifier);},
                   "No": undefined});
    });
  }

  // adding clues on admin page
  $("#add-clue-button").click(function () {
		// update client with added clue
		var clueText = $("#write-clue-desc").val();
		var ansText = $("#write-clue-ans").val();
    var time = (new Date).getTime();
		var clueObj = {"desc": clueText, "ans": ansText, "createTime": time};
		huntData["clues"].push(clueObj);
		// update server with new clues
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
					// update page
					huntData = data.huntData;
                    loadPageInfo();
					loadClues();
					// clear fields
					$("#write-clue-desc").val("");
					$("#write-clue-ans").val("");
				}
				else {
					console.log("Error adding clue!");
				}
			}
		});
	});

  // fill in the scoreboard for any page with the right classes set up
  function fillScoreboard() {
  	rankedUserList = [ ];
  	for (var user in huntData.users) {
  		if (user === "admin") {
  			continue
  		}
  		// grab user data
  		var userObj = huntData.users[user];
  		var username = userObj.username;
  		var progressNum = userObj.progress.length;
  		var userRank = 1;
  		// find rank of user
  		for (var otherUser in huntData.users) {
  			if (otherUser === "admin" || otherUser === user) {
  			  continue
  			}
  			var otherProgressNum = huntData.users[otherUser].progress.length;
  			if (otherProgressNum > progressNum) {
  				userRank++;
  			}
  		}
  		// format last login date string
  		var loginDate = new Date(userObj.lastlogin);
  		var timeStr = loginDate.toLocaleTimeString();
  		var dateStr = loginDate.toLocaleDateString();
  		var loginStr = timeStr + " " + dateStr;
  		// make html element
  		var newRow = $("<tr>").attr("class","score-board-entry");
  		var rank = $("<td>").attr("class","entry-ranking").html(userRank);
  		var teamName = $("<td>").attr("class","entry-name").html(username);
  		var progress=$("<td>").attr("class","entry-progress").html(progressNum);
  		var checkIn = $("<td>").attr("class","entry-time").html(loginStr);
  		newRow.append(rank).append(teamName).append(progress).append(checkIn);
  		// add team's row to a list to be sorted by rank
  		var rankedUserObj = {"rank": userRank, "htmlRow": newRow};
  		rankedUserList.push(rankedUserObj);
  	}
  	// returns true if 'first' should be first according to object's rank
  	var rankOrder = function(first,second) {
  		if (first.rank > second.rank) return true;
  		else return false;
  	}
  	// append rows in order of rank
  	rankedUserList.sort(rankOrder);
  	var scoreBoard = $("#score-board");
  	var numUsers = rankedUserList.length;
  	for (var i = 0; i < numUsers; i++) {
  		scoreBoard.append(rankedUserList[i].htmlRow);
  	}
  }

  $.ajax({
    type: "get",
    url: "/info/" + encodeURIComponent(urlHuntName),
    success: function(data) {
      if (data.exists) {
      	huntData = data.hunt;
        
        // info for all users
        loadPageInfo();
        fillScoreboard();
        
      	// admin-specific
      	if (urlUserName === "admin") {
	        loadClues();
	    }
        // hunter-specific
        else if (urlUserName !== undefined && initTeamView !== undefined) {
            initTeamView(huntData, urlUserName, urlUserKey);
        }
        
      } else {
        console.log("Something's real messed up with getting data to load this.")
      }
    }
  });

});

//delete a clue from the server. a clue is identified by an identifier, which
//  is the time at which it was created
function deleteClue (identifier) {
  console.log("Deleting " + identifier);
}
