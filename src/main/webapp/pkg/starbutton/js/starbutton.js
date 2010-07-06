
if (!starbuttonPkg) var starbuttonPkg = {};

starbuttonPkg["activate"] = function() {
    if (!this.toolbox) {
        this.toolbox = this.loadToolbox("Starbutton", "starbutton.html", function() {
            $("#starbuttonTwinkle").click(function() {starbuttonPkg.twinkle()});
            $("#starbuttonClear").click(function() {starbuttonPkg.clear()});
            dataStore.listData('starbutton', function(data) {
                for (idx in data) {
                    var info = data[idx];
                    rws.perform(info);
                }
            })
        });
    }
}

starbuttonPkg["deactivate"] = function() {
    if (this.toolbox) {
        Toolbox.removePanel(this.toolbox);
        delete this.toolbox;
    }
}

starbuttonPkg["twinkle"] = function() {
    var id = "star_" + rws.getNewId();
    var x = Math.floor(Math.random() * 500);
    var y = Math.floor(Math.random() * 500);
    rws.broadcall("star", "starbuttonPkg", id, x, y);
    dataStore.store('starbutton', id, { "method" : "star", "object" : "starbuttonPkg", "params" : [id, x, y] });
}

starbuttonPkg["star"] = function(id, x, y) {
    var obj = $('#' + id);
    if (obj.length) {
        // Move existing Star
        obj.offset({ top: y, left: x});
    } else {
        // Create a new star
        var html = '<img id="' + id + '" class="star draggable" src="/pkg/starbutton/img/star.jpg" style="position:absolute; left:' + x + 'px; top:' + y + 'px; width:50px; height:50px" />';
        ContentEditor.addBody(html);
    }
}

starbuttonPkg["remove"] = function(id, x, y) {
    $('#' + id).remove();
}

starbuttonPkg["clear"] = function() {
    $(".star").each(function(idx, star) {
        var id = star.id;
        rws.broadcall("remove", "starbuttonPkg", id);
        dataStore.remove('starbutton', id);
    });
}
