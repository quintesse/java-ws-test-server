
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