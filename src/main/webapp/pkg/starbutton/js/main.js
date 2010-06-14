
var dragging = false;
document.onmousemove = function(event) {
    if (dragging) {
        diffX = event.pageX - mouseStartX;
        diffY = event.pageY - mouseStartY;
        objNewX = objStartX + diffX;
        objNewY = objStartY + diffY;
//        draggedObj.offset({ top: objNewY, left: objNewX });
        var scr = '$("#' + draggedObj[0].id + '").offset({ top: ' + objNewY + ', left: ' + objNewX + '})';
        dangerzone.broadcast("run", scr);
    }
}

document.onmouseup = function(event) {
    dragging = false;
}

$(".draggable").live("mousedown", function(event) {
    dragging = true;
    mouseStartX = event.pageX;
    mouseStartY = event.pageY;
    draggedObj = $(event.target);
    objStartX = draggedObj.offset().left;
    objStartY = draggedObj.offset().top;
    return false;
});

function twinkle() {
    var x = Math.floor(Math.random() * 500);
    var y = Math.floor(Math.random() * 500);
    var id = dangerzone.getNewId();
    var html = '<img id="' + id + '" class="draggable" src="/pkg/starbutton/img/star.jpg" style="position:absolute; left:' + x + 'px; top:' + y + 'px; width:50px; height:50px" />';
    dangerzone.broadcast("body", html);
}

function starbutton(pkg) {
    this.pkg = pkg;
    pkg.loadHtml("main.html", function(bodyData) {
        pkg.zone.addBody("<br><b>starbutton ready.</b><br>")
    });
}

starbutton.prototype.createStar = new function() {
}