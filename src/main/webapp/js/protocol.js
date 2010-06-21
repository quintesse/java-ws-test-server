
// ****************************************************************
// ProtocolHandler
// ****************************************************************

// Create a ProtocolHandler object
//   onopen - function to call when a connection has been established
//            with the server. The function will be passed a reference
//            to the ProtocolHandler object.
//   onopen - function to call when the connection to the server has
//            been lost or closed. The function will be passed a reference
//            to the ProtocolHandler object.
//   onclient - function to call when a client connects or disconnects or
//              when we get sent an updated client list by the server.
function ProtocolHandler(props) {
    if (props) {
        this.onopen = props.onopen;
        this.onclose = props.onclose;
        this.onclientconnect = props.onclientconnect;
        this.onclientdisconnect = props.onclientdisconnect;
        this.onclientchange = props.onclientchange;
    }
    this.connected = false;
    this.packages = {};
    this.clients = {};
    this.exceptionHandler = function(ex) {alert('RWS Error: ' + ex)}
}

// Connect to the server
//   url - the URL of the server
ProtocolHandler.prototype.connect = function(url) {
    this.webSocket = new WebSocket(url);
    var handler = this;
    this.webSocket.onopen = function() {handler.onOpen()};
    this.webSocket.onmessage = function(msg) {handler.onMessage(msg)};
    this.webSocket.onclose = function(msg) {handler.onClose(msg)};

    // Reset packet counters
    this.pktRecv = 0;
    this.pktSent = 0;
}

// Handle opening of the web socket
ProtocolHandler.prototype.onOpen = function() {
    this.nextobjid = 1;
    this.futures = {};
    var handler = this;
    Client.getId(function(data) {
        handler.id = data;
        handler.connected = true;
        if (handler.onopen) {
            handler.onopen(this);
        }

        handler.registerPackage("sys");
    });
}

// Handle each message as it comes in over the web socket
ProtocolHandler.prototype.onMessage = function(msg) {
    this.pktRecv++;
    if (msg.data) {
        var info = JSON.parse(msg.data);
        var data = info.data;
        var from = info.from;
        if (console) console.log("Incoming message:", from, "-", data);

        if (info.method) {
            this.doCall(from, data);
        } else {
            this.doResult(from, data);
        }
    }
}

// Handle closing of the web socket
ProtocolHandler.prototype.onClose = function(msg) {
    this.webSocket = null;
    this.connected = false;
    if (this.onclose) {
        this.onclose(this);
    }
}

// Return boolean indicating connection state
ProtocolHandler.prototype.isConnected = function(msg) {
    return this.connected;
}

// Send a message over the web socket
//   to - the recipient of the message. Use 'sys' for packets directed
//        to the server and 'all' to broadcast to all connected clients
//        (except for one where the packet originated).
//   action - the action that should be performed.
//   data - the data necessary to complete the action (can be null).
ProtocolHandler.prototype.send = function(to, action, data) {
    var info = {
        "to" : to,
        "action" : action,
        "data" : data
    };
    var msg = JSON.stringify(info);
    this.webSocket.send(msg);
    this.pktSent++;
    if (console) console.log("Outgoing message:", to, "-", action, "-", data);
}

// Send a message over the web socket to all connected clients
// (except for one where the packet originated). And performs the
// indicated action locally as well.
//   action - the action that should be performed.
//   data - the data necessary to complete the action (can be null).
ProtocolHandler.prototype.broadcast = function(action, data) {
    this.send('all', action, data);
    this.perform(this.id, action, data);
}

// Returns a new Object ID (an ID guaranteed to be unique among all clients).
ProtocolHandler.prototype.getNewId = function() {
    return this.id + "_" + this.nextobjid++;
}

ProtocolHandler.prototype.doCall = function(from, data) {
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
    this.send(from, "result", res);
}

ProtocolHandler.prototype.doResult = function(from, data) {
    var id = data.id;
    var fut = this.futures[id];
    if (fut) {
        if (data.exception && fut.failure) {
            fut.failure(data.exception);
        } else {
            fut.success(data.result);
        }
        delete this.futures[id];
    } else {
        if (console) console.warn("Unknown RESULT received from", from, "with", data);
    }
}

// Performs a remote method call on the server or another client
//   to - the id of the remote site ("sys" for server)
//   method - the name of the method to call
//   objName - the name of the remote object (can be undefined for global context)
//   onSuccess - the function to call with the result (can be undefined)
//   onFailure - the function to call when a remote error occurred (can be undefined)
ProtocolHandler.prototype.call = function() {
    var to = Array.prototype.shift.call(arguments);
    var method = Array.prototype.shift.call(arguments);
    var objName = Array.prototype.shift.call(arguments);
    var onSuccess = Array.prototype.shift.call(arguments);
    var onFailure = Array.prototype.shift.call(arguments);

    var info = {
        "method" : method
    }
    if (arguments.length > 0) {
        info["params"] = arguments;
    }
    if (objName) {
        info["object"] = objName;
    }

    if (onSuccess || onFailure) {
        if (!onFailure) {
            onFailure = this.exceptionHandler;
        }
        var id = this.getNewId();
        info["id"] = id;
        this.futures[id] = {
            "success" : onSuccess,
            "failure" : onFailure
        };
    }

    this.send(to, 'call', info);
}

// Peforms the specified action.
//   from - the originator of the action
//   action - action to perform.
//   data - data necessary to perform the action.
ProtocolHandler.prototype.perform = function(from, action, data) {
    var pkgName = "sys";
    var p = action.indexOf(":");
    if (p > 0) {
        pkgName = action.substring(0, p);
        action = action.substr(p + 1);
    }
    this.packages[pkgName].perform(from, action, data);
}

// Returns the local URL for the given package name.
//   pkgName - the name of the package.
ProtocolHandler.prototype.packageUrl = function(pkgName) {
    return "/pkg/" + pkgName + "/";
}

// Loads, registers and activates the package with the given name.
//   pkgName - the name of the package to register.
ProtocolHandler.prototype.registerPackage = function(pkgName) {
    if (!this.packages[pkgName]) {
        var handler = this;
        var clsName = __upperFirst(pkgName);
        ContentEditor.addScriptSrc(this.packageUrl(pkgName) + "js/" + clsName + ".js", function() {
            var pkg = new Package(handler, pkgName);
            var fn = window[clsName];
            var obj = new fn(pkg);
            handler.packages[pkgName] = obj;
            handler.activatePackage(obj);
        });
    } else {
        this.activatePackage(pkgName);
    }
}

// Activates the given package.
//   pkg - the package to activate or its name.
ProtocolHandler.prototype.activatePackage = function(pkg) {
    if (typeof pkg == "string") {
        pkg = this.packages[pkg];
    }
    if (pkg && pkg.activate) {
        pkg.activate();
    }
}

// Deactivates the given package.
//   pkg - the package to deactivate or its name.
ProtocolHandler.prototype.deactivatePackage = function(pkg) {
    if (typeof pkg == "string") {
        pkg = this.packages[pkg];
    }
    if (pkg && pkg.deactivate) {
        pkg.deactivate();
    }
}

// Returns if the given package is active or not.
//   pkg - the package or its name.
ProtocolHandler.prototype.isActive = function(pkg) {
    if (typeof pkg == "string") {
        pkg = this.packages[pkg];
    }
    if (pkg && pkg.isActive) {
        return pkg.isActive();
    } else {
        // Packages that don't have a way to activate/deactivate are assumed
        // to be always active.
        return true;
    }
}

// Registers the given client. Will raise the event "onclientconnect" if the
// client wasn't yet registered or "onclientchange" if it was.
//   client - the client to register.
ProtocolHandler.prototype.registerClient = function(client) {
    var handler = this;
    if (!this.clients[client.id]) {
        this.clients[client.id] = client;
        if (this.onclientconnect) {
            setTimeout(function() {handler.onclientconnect(client)}, 200);
        }
    } else {
        var oldclient = __copy(this.clients[client.id]);
        this.clients[client.id] = client;
        if (this.onclientchange && (oldclient.name != client.name)) {
            setTimeout(function() {handler.onclientchange(client)}, 200);
        }
    }
}

// Unregisters the given client. Will raise the event "onclientdisconnect"
// if the client was in effect registered.
//   client - the client to unregister.
ProtocolHandler.prototype.unregisterClient = function(client) {
    var handler = this;
    if (this.clients[client.id]) {
        delete this.clients[client.id];
        if (this.onclientdisconnect) {
            setTimeout(function() {handler.onclientdisconnect(client)}, 200);
        }
    }
}


// ****************************************************************
// Package
// ****************************************************************

function Package(handler, packageName) {
    this.handler = handler;
    this.packageName = packageName;
}

Package.prototype.loadHtml = function(name, target, callback) {
    var handler = this.handler;
    $.get(handler.packageUrl(this.packageName) + "html/" + name, function(bodyData) {
        if (target) {
            target.html(bodyData);
        } else {
            ContentEditor.addBody(bodyData);
        }
        if (callback) {
            callback.apply();
        }
    });
}

Package.prototype.loadScript = function(name, callback) {
    ContentEditor.addScriptSrc(this.handler.packageUrl(this.packageName) + "js/" + name, callback);
}

Package.prototype.loadCss = function(name) {
    ContentEditor.addCssLink(this.handler.packageUrl(this.packageName) + "css/" + name);
}

Package.prototype.loadToolbox = function(title, name, callback) {
    var panel = Toolbox.addPanel(title, "...");
    var handler = this.handler;
    $.get(handler.packageUrl(this.packageName) + "html/" + name, function(bodyData) {
        Toolbox.setPanelContent(panel, bodyData);
        if (callback) {
            callback.apply();
        }
    });
    return panel;
}

// Send a message over the web socket to the equivalent package on the other side
//   to - the recipient of the message. Use 'sys' for packets directed
//        to the server and 'all' to broadcast to all connected clients
//        (except for one where the packet originated).
//   action - the action that should be performed.
//   data - the data necessary to complete the action (can be null).
Package.prototype.send = function(to, action, data) {
    this.handler.send(to, this.packageName + ":" + action, data);
}

// Send a message over the web socket to the equivalent package for all
// connected clients (except for one where the packet originated).
// And performs the indicated action locally as well.
//   action - the action that should be performed.
//   data - the data necessary to complete the action (can be null).
Package.prototype.broadcast = function(action, data) {
    this.handler.broadcast(this.packageName + ":" + action, data);
}
