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
  // this tells you what clue is being edited (if any)
  var editingClueNum = undefined;
  
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
    $(".hunt-name").text(huntData.rawname);
    
  	// _ total clues <- number of clues
  	var numClues = huntData.clues.length;
    $(".num-total-clues").text(numClues);
    
  	// _ total users <- number of users
  	var numUsers = getObjectSize(huntData.users);
    if("admin" in huntData.users){
        numUsers--;
    }
    $(".num-total-teams").text(numUsers);
    
    /* load user data, if present */
    if(urlUserName !== undefined && urlUserName in huntData.users){
        var userData = huntData.users[urlUserName];
        var userName = userData.username;
        var rawName = userData.rawName;
        
        $(".team-name").text(rawName);
        
        var numSolvedClues = userData.progress.length;
        $(".num-solved-clues").text(numSolvedClues);
        
        if(numSolvedClues+1 <= numClues){
            var currentClueNum = numSolvedClues+1;
            $(".curr-clue-label").text("Clue #"+currentClueNum);
            
            // minus one to do this in zero-indexing
            var currentClueDesc = huntData.clues[currentClueNum-1].desc;
            $(".curr-clue-desc").text(currentClueDesc);
        }
        else if(numClues === 0){
            $(".curr-clue-label").text("No clues yet");
            $(".curr-clue-desc").text("The \""+
                                      huntData.rawname+
                                      "\" puzzle hunt has no clues yet. "+
                                      "(Pester the person organizing this "+
                                      "to add some!)");
        }
        else{
            $(".curr-clue-label").text("No clues left");
            $(".curr-clue-desc").text("You've completed the \""+
                                      huntData.rawname+"\" puzzle hunt!");
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
  		var newClueRow = $("<tr>").attr("class", "clue-row");
  		var num = $("<td>").attr("class", "clue-num").html(i+1);
  		var desc = $("<td>").attr("class", "clue-desc").html(clue["desc"]);
  		var ans = $("<td>").attr("class", "clue-ans").html(clue["ans"]);

      var identifier = clue["createTime"]; //unique identifier for deletion
  		var del = $("<td>").attr("class", "clue-del");
      var delButton = $("<span>").attr("class", "clue-del-button")
                                 .attr("id", identifier)
                                 .attr("title", "Click to delete clue");
      del.append(delButton);
  		var edit = $("<td>").attr("class", "clue-edit");
  		var editButton = $("<span>").attr("class", "clue-edit-button")
                                    .attr("id", identifier)
                                    .attr("title", "Click to edit clue");
  		edit.append(editButton);
  		// here we append all the elements in a row to the row element
			newClueRow.append(num).append(desc).append(ans).append(edit).append(del);
  		clueTable.append(newClueRow);
  	};

    //bind newly created buttons to clue deletion
    $(".clue-del-button").click(function () {
      var identifier = $(this).attr("id");
      createAlert("Are you sure you want to delete this clue?",
                  {"Yes": function () {deleteClue(identifier);},
                   "No": undefined});
    });

    // fill text boxes with clue text to edit
    $(".clue-edit-button").click(function () {
      var identifier = $(this).attr("id");
      //find index of identified clue in huntData[urlHuntName]
	    var index;
	    var clues = huntData.clues;
	    for (var i = 0; i < clues.length; i++) {
	      if (clues[i].createTime === identifier) {
	        index = i;
	      }
	    }
	    if (index === undefined) {
	      console.log("The clue that you wanted to edit was not present!");
	      return;
	    }
      // populate the editing clue field with the clue clicked on
      $("#write-clue-desc").val(clues[index].desc);
			$("#write-clue-ans").val(clues[index].ans);
			// show/hide correct buttons
			$("#add-clue-button").css({"display": "none"});
			$("#update-clue-button").css({"display": "inline-block"});
			$("#cancel-edit-button").css({"display": "inline-block"});
			editingClueNum = index;
    });
  }

  // adding clues on admin page
  $("#add-clue-button").click(function() {
  	assert(editingClueNum === undefined);
  	updateClues();
  });

  // updating a clue on admin page
  $("#update-clue-button").click(function() {
  	assert(editingClueNum >= 0);
  	updateClues();
		$("#add-clue-button").css({"display": "inline-block"});
		$("#update-clue-button").css({"display": "none"});
		$("#cancel-edit-button").css({"display": "none"});
  });

  // cancel editing a clue
  $("#cancel-edit-button").click( function() {
  	// change buttons and text field back to adding clue mode
		$("#add-clue-button").css({"display": "inline-block"});
		$("#update-clue-button").css({"display": "none"});
		$("#cancel-edit-button").css({"display": "none"});
		$("#write-clue-desc").val("");
		$("#write-clue-ans").val("");
  });

  // fill in the scoreboard for any page with the right classes set up
  function fillScoreboard() {
  	rankedUserList = [ ];
  	for (var user in huntData.users) {
  		if (user === "admin") {
  			continue;
  		}
  		// grab user data
  		var userObj = huntData.users[user];
  		var rawusername = userObj.rawName;
  		console.log(userObj);
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
  		var teamName = $("<td>").attr("class","entry-name").html(rawusername);
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

  // the main GET request that loads the page and calls loader functions
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

  // ADD/UPDATE clues on client then server
  function updateClues() {
  	// update client with added clue
    var clueText = $("#write-clue-desc").val();
	var ansText = $("#write-clue-ans").val();
    // don't allow blank clues
    if($.trim(clueText) === ""){
        createAlert("Please enter a clue description!");
        return;
    }
    // don't allow blank answers
    else if($.trim(ansText) === ""){
        createAlert("Please enter a clue answer!");
        return;
    }
    
    var time = (new Date).getTime();
		var clueObj = {"desc": clueText, "ans": ansText, "createTime": time};
		// UPDATE clue
		if ((editingClueNum >= 0) && (editingClueNum < huntData.clues.length)) {
			huntData.clues[editingClueNum] = clueObj;
			// reset the editing clue num
			editingClueNum = undefined;
		}
		// ADD clue
		else {
			huntData.clues.push(clueObj);
		}
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
					console.log("Error adding/editing clue!");
				}
			}
		});
  }

  //delete the clue with timestamp equal to "identifier" from the server
  // and from the local clue list
  function deleteClue (identifier) {
    console.log("Deleting " + identifier);

    //delete on the server
    $.ajax({
      "url": "/edit/clues",
      "type": "delete",
      "data": {
				"huntName": urlHuntName,
				"adminKey": urlUserKey,
        "identifier": identifier
      },
      "success": function (data) {
        console.log(data);
				if (data.success) {
					// propagate changes to local
					huntData = data.huntData;
          loadPageInfo();
					loadClues();
				}
				else {
					console.log("Error deleting clue!");
       } 
      }
    });
  }

});
