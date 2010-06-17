
// ****************************************************************
// Package - Sys
// ****************************************************************

function Sys(pkg) {
    this.pkg = pkg;
}

Sys.prototype.perform = function(action, data) {
    __dispatch(this, action, data);
}

Sys.prototype.init = function(data) {
    this.pkg.handler.id = data;
    this.pkg.handler.nextobjid = 1;
    this.pkg.handler.connected = true;
    if (this.pkg.handler.onopen) {
        this.pkg.handler.onopen(this.handler);
    }
}

Sys.prototype.single = function(info) {
    var action = info.action;
    var data = info.data;
    this.pkg.handler.perform(action, data);
}

Sys.prototype.multi = function(data) {
    for (var idx in data) {
        var actdat = data[idx];
        this.single(actdat);
    }
}

Sys.prototype.run = function(data) {
    eval(data);
}

Sys.prototype.head = function(data) {
   ContentEditor.addHead(data);
}

Sys.prototype.body = function(data) {
   ContentEditor.addBody(data);
}

Sys.prototype.script = function(data) {
   ContentEditor.addScript(data);
}

Sys.prototype.scriptSrc = function(data) {
   ContentEditor.addScriptSrc(data);
}

Sys.prototype.css = function(data) {
   ContentEditor.addCss(data);
}

Sys.prototype.cssLink = function(data) {
   ContentEditor.addCssLink(data);
}

Sys.prototype.clients = function(data) {
    for (var idx in data) {
        var client = data[idx];
        this.pkg.handler.registerClient(client)
    }
}

Sys.prototype.client = function(data) {
    this.pkg.handler.registerClient(data)
}

Sys.prototype.connect = function(data) {
    this.pkg.handler.registerClient(data)
}

Sys.prototype.disconnect = function(data) {
    this.pkg.handler.unregisterClient(data)
}

Sys.prototype.activate = function(pkgName) {
    this.pkg.handler.registerPackage(pkgName)
}
