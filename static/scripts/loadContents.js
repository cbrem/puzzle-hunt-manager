function fillEach(selector, textContent){
    $(selector).each(function(i, elem){
        $(elem).text(textContent);
    });
}

// dis is loading up the admin view for a hunt
$(document).ready(function(){
  // make ajax call to app.js to get the admin data for the given hunt,
  // then populate the interface with the data entries
  var currentUrl = window.location.pathname;
  var urlList = currentUrl.split("/");
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
  	
  }

  function fillScoreboard(huntData) {
  	// todo
  }

  $.ajax({
    type: "get",
    url: "/info/" + encodeURIComponent(urlHuntName),
    success: function(data) {
      if (data.exists) {
        loadPageInfo(data.hunt);
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