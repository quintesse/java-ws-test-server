
// ****************************************************************
// DangerZone
// ****************************************************************


function DangerZone() {
    this.actionHandler = new ActionHandler(this);
    this.connect('ws://localhost:8080/dangerzone');
}

DangerZone.prototype.connect = function(url) {
    //var location = document.location.toString().replace('http://','ws://').replace('https://','wss://');
    this.webSocket = new WebSocket(url);
    var zone = this;
    this.webSocket.onopen = function() {zone.onOpen()};
    this.webSocket.onmessage = function(msg) {zone.onMessage(msg)};
    this.webSocket.onclose = function(msg) {zone.onClose(msg)};
}

DangerZone.prototype.onOpen = function() {
    this.send('ready', null);
}

DangerZone.prototype.onMessage = function(msg) {
    if (msg.data) {
        var action = null;
        var data = null;
        var p = msg.data.indexOf("#");
        if (p > 0) {
            action = msg.data.slice(0, p);
            data = msg.data.slice(p + 1);
        } else if (p == 0) {
            data = msg.data.slice(1);
        } else {
            action = msg.data;
        }
        this.perform(action, data);
    }
}

DangerZone.prototype.onClose = function(msg) {
    this.webSocket = null;
    $('#main').removeClass('spinner')
    alert('Bye!');
}

DangerZone.prototype.send = function(action, data) {
    if (data != null) {
        if (action == null) action = '';
        this.webSocket.send(action + '#' + data);
    } else {
        this.webSocket.send(action);
    }
}

DangerZone.prototype.perform = function(action, data) {
    __dispatch(this.actionHandler, action, data);
}

DangerZone.prototype.addHead = function(data) {
    $('head').append(data);
}

DangerZone.prototype.addBody = function(data) {
    $('body').append(data);
}

DangerZone.prototype.addScript = function(data) {
    var tmp = document.createElement("script");
    tmp.type = 'text/javascript';
    tmp.innerHTML = data;
    document.getElementsByTagName('head')[0].appendChild(tmp);
}

DangerZone.prototype.addScriptSrc = function(data, callback) {
    var tmp = document.createElement("script");
    tmp.type = 'text/javascript';
    tmp.src = data;
    tmp.onload = callback;
    document.getElementsByTagName('head')[0].appendChild(tmp);
}

DangerZone.prototype.addCss = function(data) {
    var tmp = document.createElement("style");
    tmp.type = 'text/css';
    tmp.innerHTML = data;
    document.getElementsByTagName('head')[0].appendChild(tmp);
}

DangerZone.prototype.addCssLink = function(data) {
    var tmp = document.createElement("link");
    tmp.type = 'text/css';
    tmp.rel = 'stylesheet';
    tmp.href = data;
    document.getElementsByTagName('head')[0].appendChild(tmp);
}

DangerZone.prototype.packageUrl = function(pkgName) {
    return "/pkg/" + pkgName + "/";
}


// ****************************************************************
// ActionHandler
// ****************************************************************

function ActionHandler(zone) {
    this.zone = zone;
}

ActionHandler.prototype.run = function(data) {
    eval(data);
}

ActionHandler.prototype.multi = function(data) {
    var info = JSON.parse(data);
    for (var idx in info) {
        var actdat = info[idx];
        var act = actdat.action;
        var dat = actdat.data;
        this.zone.perform(act, dat);
    }
}

ActionHandler.prototype.head = function(data) {
   this.zone.addHead(data);
}

ActionHandler.prototype.body = function(data) {
   this.zone.addBody(data);
}

ActionHandler.prototype.script = function(data) {
   this.zone.addScript(data);
}

ActionHandler.prototype.scriptSrc = function(data) {
   this.zone.addScriptSrc(data);
}

ActionHandler.prototype.css = function(data) {
   this.zone.addCss(data);
}

ActionHandler.prototype.cssLink = function(data) {
   this.zone.addCssLink(data);
}

ActionHandler.prototype.activate = function(pkgName) {
    var handler = this;
    this.zone.addScriptSrc(this.zone.packageUrl("starbutton") + "js/main.js", function() {
        var pkg = new Package(handler.zone, pkgName);
        var fn = window[pkgName];
        var result = new fn(pkg);
    });
}


// ****************************************************************
// Package
// ****************************************************************

function Package(zone, packageName) {
    this.zone = zone;
    this.packageName = packageName;
}

Package.prototype.loadHtml = function(name, callback) {
    var zone = this.zone;
    $.get(zone.packageUrl(this.packageName) + "html/" + name, function(bodyData) {
        zone.addBody(bodyData);
        if (callback) {
            callback.apply();
        }
    });
}

Package.prototype.loadScript = function(name, callback) {
    this.zone.addScriptSrc(this.zone.packageUrl("starbutton") + "js/" + name, callback);
}

Package.prototype.loadCss = function(name) {
    this.zone.addCssLink(this.zone.packageUrl("starbutton") + "css/" + name);
}

//Channel.prototype.send = function(objid, action, data) {
//    var info = {
//        "id" : objid,
//        "action" : action,
//        "data" : data
//    };
//    this.zone.send("object", info)
//}


// ****************************************************************
// Global
// ****************************************************************

function __dispatch() {
    var obj = Array.prototype.shift.call(arguments);
    var fnName = Array.prototype.shift.call(arguments);
    var fn = obj[fnName];
    return fn.apply(obj, arguments);
}
