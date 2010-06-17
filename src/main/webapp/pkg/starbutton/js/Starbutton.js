
function Starbutton(pkg) {
    this.pkg = pkg;
}

Starbutton.prototype.activate = function() {
    if (!this.toolbox) {
        var starbutton = this;
        this.toolbox = this.pkg.loadToolbox("Starbutton", "starbutton.html", function() {
            $("#starbuttonTwinkle").click(function() { starbutton.twinkle() });
            $("#starbuttonClear").click(function() { starbutton.clear() });
        });
    }
}

Starbutton.prototype.deactivate = function() {
    if (this.toolbox) {
        Toolbox.removePanel(this.toolbox);
        delete this.toolbox;
    }
}

Starbutton.prototype.isActive = function() {
    if (this.toolbox) {
        return true;
    } else {
        return false;
    }
}

Starbutton.prototype.twinkle = function() {
    var x = Math.floor(Math.random() * 500);
    var y = Math.floor(Math.random() * 500);
    var id = this.pkg.handler.getNewId();
    var html = '<img id="' + id + '" class="draggable" src="/pkg/starbutton/img/star.jpg" style="position:absolute; left:' + x + 'px; top:' + y + 'px; width:50px; height:50px" />';
    this.pkg.handler.persist("body", html, id + '_create');
}

Starbutton.prototype.clear = function() {
    this.pkg.handler.send("sys", "clear", null);
}
