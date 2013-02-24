//modified from: http://stackoverflow.com/questions/4576724/dotted-stroke-in-canvas/4663129#4663129
function dashedLine(ctx, x, y, x2, y2, da) {
    if (!da) da = [10,2];
    ctx.save();
    var dx = (x2-x), dy = (y2-y);
    var len = Math.sqrt(dx*dx + dy*dy);
    var rot = Math.atan2(dy, dx);
    ctx.translate(x, y);
    ctx.moveTo(0, 0);
    ctx.rotate(rot);       
    var dc = da.length;
    var di = 0, draw = true;
    x = 0;
    while (len > x) {
        x += da[di++ % dc];
        if (x > len) x = len;
        draw ? ctx.lineTo(x, 0): ctx.moveTo(x, 0);
        draw = !draw;
    }       
    ctx.restore();
}

// modified from: 
// https://developer.mozilla.org/en-US/docs/Canvas_tutorial/Drawing_shapes
function roundedRect(ctx,x,y,width,height,radius, fillStyle, strokeStyle){
    ctx.beginPath();
    ctx.moveTo(x,y+radius);
    ctx.lineTo(x,y+height-radius);
    ctx.quadraticCurveTo(x,y+height,x+radius,y+height);
    ctx.lineTo(x+width-radius,y+height);
    ctx.quadraticCurveTo(x+width,y+height,x+width,y+height-radius);
    ctx.lineTo(x+width,y+radius);
    ctx.quadraticCurveTo(x+width,y,x+width-radius,y);
    ctx.lineTo(x+radius,y);
    ctx.quadraticCurveTo(x,y,x,y+radius);
    ctx.closePath();
    ctx.save();
    if(fillStyle !== undefined){
        ctx.fillStyle = fillStyle;
        ctx.fill();
    }
    if(strokeStyle !== undefined){
        ctx.strokeStyle = strokeStyle;
        ctx.stroke();
    }
    ctx.restore();
}

function loadCanvasMap(solvedClues, totalClues){
    drawCanvasMap(solvedClues, totalClues);
    $("#canvas-wrapper").find(".loader-area").hide();
    $("#canvas-wrapper").find(".loaded-content").show();
    $("#canvas-wrapper").scrollLeft($("#map-canvas").width());
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
    ctx.clearRect(0, 0, cWidth, cHeight);
    
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
    var borderRadius = 12;
    var nodeDist = Math.min(Math.max(75, Math.floor((wrapWidth-2*padding - totalClues*nodeWidth)/totalClues)), 500);

    var contentWidth = (totalClues * nodeWidth) + Math.max(0, totalClues-1)*nodeDist;
    canvas.width = contentWidth+2*padding;
    cWidth = canvas.width;
    
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
        if(i === solvedClues){
            dashedLine(ctx, prevLoc.cx, prevLoc.cy, loc.cx, loc.cy, [5,10]);
        }
        else{
            ctx.moveTo(prevLoc.cx, prevLoc.cy);
            ctx.lineTo(loc.cx, loc.cy);
        }
        ctx.stroke();
        ctx.closePath();
    }
    ctx.restore();
    
    // draw the nodes themselves
    ctx.save();
    ctx.textAlign = "center";
    ctx.font = "30px Arial";
    ctx.textBaseline = "middle";
    ctx.lineWidth = 2;
    for(var i=0; i < nodeLocations.length; i++){
        var loc = nodeLocations[i];
        if(i < solvedClues){
            ctx.fillStyle = "#efc98a";
            ctx.strokeStyle = "#5f3e06";
        }
        else if(i === solvedClues){
            // draw box shadow
            roundedRect(ctx, loc.left+2, loc.top+3, nodeWidth, nodeHeight, 
                        borderRadius, "#aaa", "#aaa");
            ctx.fillStyle = "#F0A830";
            ctx.strokeStyle = "#5f3e06";
        }
        else{
            ctx.fillStyle = "#b7b7b7";
            ctx.strokeStyle = "#474747";
        }
        roundedRect(ctx, loc.left, loc.top, nodeWidth, nodeHeight, borderRadius,
                    ctx.fillStyle, ctx.strokeStyle);
        ctx.fillStyle="black";
        ctx.fillText(String(i+1), loc.cx, loc.cy);
    }
    ctx.restore();
}