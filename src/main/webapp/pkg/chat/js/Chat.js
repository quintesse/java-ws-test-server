
function Chat(pkg) {
    this.pkg = pkg;
}

Chat.prototype.perform = function(from, action, data) {
    __dispatch(this, "do" + __upperFirst(action), from, data);
}

Chat.prototype.activate = function() {
    if (!this.toolbox) {
        var chat = this;
        this.toolbox = this.pkg.loadToolbox("Chat", "chat.html", function() {
            var box = $("#chatTextbox");
            box.keypress(function(event) {
                if (event.keyCode == "13") {
                    var txt = box.val();
                    chat.sendMessage(txt);
                    box.val("");
                }
            });
        });
    }
}

Chat.prototype.deactivate = function() {
    if (this.toolbox) {
        Toolbox.removePanel(this.toolbox);
        delete this.toolbox;
    }
}

Chat.prototype.isActive = function() {
    if (this.toolbox) {
        return true;
    } else {
        return false;
    }
}

Chat.prototype.sendMessage = function(txt) {
    if (txt.length > 0) {
        this.pkg.broadcast("message", txt);
    }
}

Chat.prototype.doMessage = function(from, data) {
    var name = from;
    var client = this.pkg.handler.clients[from];
    if (client) {
        name = client.name;
    }
    var lst = $("#chatTextarea");
    $("<b>" + name + "</b> : " + data + "<br>").appendTo(lst);
    lst.last("b").scrollTop(1000000);
}
