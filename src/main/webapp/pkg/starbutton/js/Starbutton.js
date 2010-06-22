
function Starbutton(pkg) {
    this.pkg = pkg;
}

Starbutton.prototype.activate = function() {
    if (!this.toolbox) {
        var starbutton = this;
        this.toolbox = this.pkg.loadToolbox("Starbutton", "starbutton.html", function() {
            $("#starbuttonTwinkle").click(function() { starbutton.twinkle() });
            $("#starbuttonClear").click(function() { starbutton.clear() });
            MsgStore.listMessages(function(data) {
                for (idx in data) {
                    var info = data[idx];
                    var act = info.action;
                    var dat = info.data;
                    starbutton.pkg.handler.perform("sys", act, dat);
                }
            })
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
    var id = "star_" + rws.getNewId();
    var html = '<img id="' + id + '" class="star draggable" src="/pkg/starbutton/img/star.jpg" style="position:absolute; left:' + x + 'px; top:' + y + 'px; width:50px; height:50px" />';
    MsgStore.store(id + '_create', { "action" : "body", "data" : html});
    rws.broadcast("body", html);
}

Starbutton.prototype.clear = function() {
    var starbutton = this;
    $(".star").each(function(idx, star) {
        var id = star.id;
        MsgStore.remove(id + '_create');
        MsgStore.remove(id + '_update');
        starbutton.pkg.handler.broadcast("run", '$("#' + id + '").remove()');
    });
}
