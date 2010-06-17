
// ****************************************************************
// Package - Sys
// ****************************************************************

function Sys(pkg) {
    this.pkg = pkg;
}

Sys.prototype.perform = function(action, data) {
    __dispatch(this, "do" + __upperFirst(action), data);
}

Sys.prototype.doInit = function(data) {
    this.pkg.handler.id = data;
    this.pkg.handler.nextobjid = 1;
    this.pkg.handler.connected = true;
    if (this.pkg.handler.onopen) {
        this.pkg.handler.onopen(this.handler);
    }
}

Sys.prototype.doPing = function(data) {
    this.pkg.handler.send("sys", "pong", data);
}

Sys.prototype.doPong = function(data) {
    // Just a reply to our ping, do nothing
}

Sys.prototype.doSingle = function(info) {
    var action = info.action;
    var data = info.data;
    this.pkg.handler.perform(action, data);
}

Sys.prototype.doMulti = function(data) {
    for (var idx in data) {
        var actdat = data[idx];
        this.doSingle(actdat);
    }
}

Sys.prototype.doRun = function(data) {
    eval(data);
}

Sys.prototype.doHead = function(data) {
   ContentEditor.addHead(data);
}

Sys.prototype.doBody = function(data) {
   ContentEditor.addBody(data);
}

Sys.prototype.doScript = function(data) {
   ContentEditor.addScript(data);
}

Sys.prototype.doScriptSrc = function(data) {
   ContentEditor.addScriptSrc(data);
}

Sys.prototype.doCss = function(data) {
   ContentEditor.addCss(data);
}

Sys.prototype.doCssLink = function(data) {
   ContentEditor.addCssLink(data);
}

Sys.prototype.doClients = function(data) {
    for (var idx in data) {
        var client = data[idx];
        this.pkg.handler.registerClient(client)
    }
}

Sys.prototype.doClient = function(data) {
    this.pkg.handler.registerClient(data)
}

Sys.prototype.doConnect = function(data) {
    this.pkg.handler.registerClient(data)
}

Sys.prototype.doDisconnect = function(data) {
    this.pkg.handler.unregisterClient(data)
}

Sys.prototype.doActivate = function(pkgName) {
    this.pkg.handler.registerPackage(pkgName)
}
