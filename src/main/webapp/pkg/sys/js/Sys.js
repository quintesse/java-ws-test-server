
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
    this.pkg.handler.futures = {};
    this.pkg.handler.connected = true;
    if (this.pkg.handler.onopen) {
        this.pkg.handler.onopen(this.handler);
    }

    var panel = this.toolbox;
    Package.listPackages(function(data) {
        var txt = "";
        var lst = $("#sysPackageList");
        lst.empty();
        for (idx in data) {
            var p = data[idx];
            lst.append('<li><a href="#" onclick="protocolhandler.registerPackage(\'' + p+ '\'); return false;">' + p + '</a></li>');
        }
        Toolbox.resizePanel(panel);
    });
}

Sys.prototype.doPing = function(from, data) {
    this.pkg.handler.send("sys", "pong", data);
}

Sys.prototype.doPong = function(from, data) {
    // Just a reply to our ping, do nothing
}

Sys.prototype.doSingle = function(from, data) {
    var act = data.action;
    var dat = data.data;
    this.pkg.handler.perform(from, act, dat);
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

Sys.prototype.doActivate = function(from, data) {
    this.pkg.handler.registerPackage(data)
}

Sys.prototype.doCall = function(from, data) {
    var id = data.id;
    var obj = (data.object) ? window[data.object] : window;
    var method = data.method;
    var params = data.params;
    var fn = obj[method];

    var res = {
        "id" : id
    };
    try {
        res.result = fn.apply(obj, params);
    } catch (ex) {
        res.exception = ex;
    }
    this.pkg.handler.send(from, "result", res);
}

Sys.prototype.doResult = function(from, data) {
    var id = data.id;
    var fut = this.pkg.handler.futures[id];
    if (fut) {
        if (data.exception && fut.failure) {
            fut.failure(data.exception);
        } else {
            fut.success(data.result);
        }
        delete this.pkg.handler.futures[id];
    } else {
        if (console) console.warn("Unknown RESULT received from", from, "with", data);
    }
}