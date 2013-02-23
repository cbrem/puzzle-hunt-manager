function loadCanvasMap(solvedClues, totalClues){
    drawCanvasMap(solvedClues, totalClues);
    $("#canvas-wrapper").find("img").remove();
    $("#map-canvas").show();
}

function drawCanvasMap(solvedClues, totalClues){
    var $canvas = $("#map-canvas");
    var $canvasWrap = $("#canvas-wrapper");
    if($canvas.length === 0){
        console.log("no map canvas found");
        return;
    }
    
    var canvas = $canvas.get(0);
    var ctx = canvas.getContext("2d");
    var wrapWidth = $canvasWrap.width();
    var wrapHeight = $canvasWrap.height();
    var cWidth = canvas.width;
    var cHeight = canvas.height;
    var padding = 35;
    
    if(totalClues <= 0){
        console.log("no clues available");
        ctx.textAlign = "center";
        ctx.font = "25px Arial";
        ctx.fillText("no clues available yet", cWidth/2, cHeight/2);
        return;
    }
    
    var nodeWidth = 50;
    var nodeHeight = 50;
    var nodeDist = Math.min(Math.max(100, Math.floor((wrapWidth-2*padding - totalClues*nodeWidth)/totalClues)), 500);
    
    var contentWidth = (totalClues * nodeWidth) + Math.max(0, totalClues-1)*nodeDist;
    canvas.width = contentWidth+2*padding;
    cWidth = contentWidth+2*padding;
    
    // calculate node locations
    var nodeLocations = [];
    for(var i=0; i < totalClues; i++){
        var left = padding+i*(nodeWidth+nodeDist);
        var top = Math.floor((Math.random() * (cHeight-nodeHeight-2*padding))+padding);
        var cx = Math.floor(left+nodeWidth/2);
        var cy = Math.floor(top+nodeHeight/2);
        nodeLocations.push({left: left, top:top, cx:cx, cy:cy});
    }
    
    // draw connecting lines
    ctx.save();
    ctx.lineWidth = 5;
    ctx.strokeStyle = "#5E412F";
    for(var i=1; i < Math.min(solvedClues+1, nodeLocations.length); i++){
        var loc = nodeLocations[i];
        var prevLoc = nodeLocations[i-1];
        ctx.beginPath();
        ctx.moveTo(prevLoc.cx, prevLoc.cy);
        ctx.lineTo(loc.cx, loc.cy);
        ctx.stroke();
        ctx.closePath();
    }
    ctx.restore();
    
    // draw the nodes themselves
    ctx.save();
    ctx.textAlign = "center";
    ctx.font = "30px Arial";
    ctx.textBaseline = "middle";
    ctx.lineWidth = 3;
    for(var i=0; i < nodeLocations.length; i++){
        var loc = nodeLocations[i];
        if(i < solvedClues){
            ctx.fillStyle = "#efc98a";
        }
        else if(i == solvedClues){
            ctx.fillStyle = "#F0A830";
        }
        else{
            ctx.fillStyle = "#b7b7b7";
        }
        ctx.fillRect(loc.left, loc.top, nodeWidth, nodeHeight);
        ctx.fillStyle="black";
        ctx.fillText(String(i+1), loc.cx, loc.cy);
    }
    ctx.restore();
}