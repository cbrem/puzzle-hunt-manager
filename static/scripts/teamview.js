function initTeamView(huntData, urlUserName, userKey){
    var userData = huntData.users[urlUserName];
    var totalClues = huntData.clues.length;
    var solvedClues = userData.progress.length;
    
    function _startClueViewLoader(callbackFn){
        // don't grade this slideDown usage, I guess, but loading looks 
        // seriously ugly and jumpy without it
        $("#clues-team-view").find(".loaded-content").slideUp("medium", function(){
            $("#clues-team-view").find(".loader-area").fadeIn("fast", callbackFn);
        });
    }
    
    function _stopClueViewLoader(callbackFn){
        $("#clues-team-view").find(".loader-area").fadeOut("fast", function(){
            $("#clues-team-view").find(".loaded-content")
                                 .slideDown("medium", callbackFn);
        });
    }
    
    function _updateTeamView(currUnsolvedClueNum, clueDesc){
        if(currUnsolvedClueNum-1 >= totalClues){
            fillEach(".curr-clue-label", "No clues left");
            fillEach(".curr-clue-desc", 
                "You've completed the \""+huntData.rawname+"\" puzzle hunt!");
            $("#answer-clue-form").remove();
        }
        else{
            fillEach(".curr-clue-label", "Clue #"+currUnsolvedClueNum);
            fillEach(".curr-clue-desc", clueDesc);
        }
        
        fillEach(".num-solved-clues", currUnsolvedClueNum-1);
        loadCanvasMap(currUnsolvedClueNum-1, totalClues);
    }
    
    function processAnswerVerification(e){
        e.preventDefault();
        e.stopPropagation();
        _startClueViewLoader(function(){
            var answer = $("#answer-clue-form .textInput").val();
            $("#answer-clue-form .textInput").val("");
            
            $.ajax({
                url: "/verifyAnswer",
                type: "post",
                dataType: "json",
                data: {
                    hunt: huntData.safename,
                    user: urlUserName,
                    key: userKey,
                    answer: answer
                },
                success: function(data){
                    if(data.error){
                        $("#clues-team-view").find(".error-msg").text("error: " + data.errorMsg);
                        return;
                    }
                    else if(data.correct === false){
                        $("#clues-team-view").find(".error-msg").text("Sorry, that's incorrect. Please try again.");
                    }
                    else{
                        $("#clues-team-view").find(".error-msg").text("");
                        var nextClue = data.nextClue;
                        console.log(nextClue.num);
                        _updateTeamView(nextClue.num, nextClue.desc);
                    }  
                },
                error: function(data){
                    console.log("error", data);
                },
                complete: function(){
                    _stopClueViewLoader();
                }
            });
        });
    }
    
    $("#submit-answer-button").click(processAnswerVerification);
    $("#answer-clue-form").submit(processAnswerVerification);
    $("#answer-clue-form").find(".textInput").keypress(function(e){
        if(e.which === 13){ // enter key
            processAnswerVerification(e);
            return false;
        }
    });
    
    _updateTeamView(solvedClues+1, undefined);
    _stopClueViewLoader();
}