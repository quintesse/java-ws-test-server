
// ****************************************************************
// Package - Sys
// ****************************************************************

function Sys(pkg) {
    this.pkg = pkg;
}

Sys.prototype.perform = function(from, action, data) {
    __dispatch(this, "do" + __upperFirst(action), from, data);
}

Sys.prototype.activate = function() {
    if (!this.toolbox) {
        var syspkg = this;
        this.toolbox = this.pkg.loadToolbox("Sys", "sys.html", function() {
            var box = $("#sysActivateTextbox");
            box.keypress(function(event) {
                if (event.keyCode == "13") {
                    var txt = box.val();
                    if (txt.substr(0, 1) == "-") {
                        txt = txt.substr(1);
                        syspkg.pkg.handler.deactivatePackage(txt);
                    } else {
                        syspkg.pkg.handler.registerPackage(txt);
                    }
                    box.val("");
                }
            });
        });
    }
}

Sys.prototype.deactivate = function() {
    if (this.toolbox) {
        Toolbox.removePanel(this.toolbox);
        delete this.toolbox;
    }
}

Sys.prototype.doInit = function(from, data) {
    this.pkg.handler.id = data;
    this.pkg.handler.nextobjid = 1;
    this.pkg.handler.connected = true;
    if (this.pkg.handler.onopen) {
        this.pkg.handler.onopen(this.handler);
    }
}

Sys.prototype.doPing = function(from, data) {
    this.pkg.handler.send("sys", "pong", data);
}

Sys.prototype.doPong = function(from, data) {
    // Just a reply to our ping, do nothing
}

Sys.prototype.doSingle = function(from, info) {
    var action = info.action;
    var data = info.data;
    this.pkg.handler.perform(from, action, data);
}

Sys.prototype.doMulti = function(from, data) {
    for (var idx in data) {
        var actdat = data[idx];
        this.doSingle(from, actdat);
    }
}

Sys.prototype.doRun = function(from, data) {
    eval(data);
}

Sys.prototype.doHead = function(from, data) {
   ContentEditor.addHead(data);
}

Sys.prototype.doBody = function(from, data) {
   ContentEditor.addBody(data);
}

Sys.prototype.doScript = function(from, data) {
   ContentEditor.addScript(data);
}

Sys.prototype.doScriptSrc = function(from, data) {
   ContentEditor.addScriptSrc(data);
}

Sys.prototype.doCss = function(from, data) {
   ContentEditor.addCss(data);
}

Sys.prototype.doCssLink = function(from, data) {
   ContentEditor.addCssLink(data);
}

Sys.prototype.doClients = function(from, data) {
    for (var idx in data) {
        var client = data[idx];
        this.pkg.handler.registerClient(client)
    }
}

Sys.prototype.doClient = function(from, data) {
    this.pkg.handler.registerClient(data)
}

Sys.prototype.doConnect = function(from, data) {
    this.pkg.handler.registerClient(data)
}

Sys.prototype.doDisconnect = function(from, data) {
    this.pkg.handler.unregisterClient(data)
}

Sys.prototype.doActivate = function(from, pkgName) {
    this.pkg.handler.registerPackage(pkgName)
}
