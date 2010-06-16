
var dragging = false;
document.onmousemove = function(event) {
    if (dragging) {
        var diffX = event.pageX - mouseStartX;
        var diffY = event.pageY - mouseStartY;
        var objNewX = objStartX + diffX;
        var objNewY = objStartY + diffY;
        var id = draggedObj[0].id;
        var scr = '$("#' + id + '").offset({ top: ' + objNewY + ', left: ' + objNewX + '})';
        protocolhandler.persist("run", scr, id + '_update');
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
    var id = protocolhandler.getNewId();
    var html = '<img id="' + id + '" class="draggable" src="/pkg/starbutton/img/star.jpg" style="position:absolute; left:' + x + 'px; top:' + y + 'px; width:50px; height:50px" />';
    protocolhandler.persist("body", html, id + '_create');
}

function starbutton(pkg) {
    this.pkg = pkg;
    pkg.loadHtml("main.html", function(bodyData) {
        ContentEditor.addBody("<br><b>starbutton ready.</b><br>")
    });
}

starbutton.prototype.createStar = new function() {
}