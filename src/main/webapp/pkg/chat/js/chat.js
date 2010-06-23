
if (!chatPkg) var chatPkg = {};

chatPkg["perform"] = function(from, action, data) {
    __dispatch(this, "do" + __upperFirst(action), from, data);
}

chatPkg["activate"] = function() {
    if (!this.toolbox) {
        this.toolbox = this.loadToolbox("Chat", "chat.html", function() {
            var box = $("#chatTextbox");
            box.keypress(function(event) {
                if (event.keyCode == "13") {
                    var txt = box.val();
                    chatPkg.sendMessage(txt);
                    box.val("");
                }
            });
        });
    }
}

chatPkg["deactivate"] = function() {
    if (this.toolbox) {
        Toolbox.removePanel(this.toolbox);
        delete this.toolbox;
    }
}

chatPkg["sendMessage"] = function(txt) {
    if (txt.length > 0) {
        this.broadcast("message", txt);
    }
}

chatPkg["doMessage"] = function(from, data) {
    var name = from;
    var client = rws.clients[from];
    if (client) {
        name = client.name;
    }
    var lst = $("#chatTextarea");
    $("<b>" + name + "</b> : " + data + "<br>").appendTo(lst);
    lst.last("b").scrollTop(1000000);
}
