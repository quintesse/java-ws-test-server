
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
function ProtocolHandler(onopen, onclose) {
    this.onopen = onopen;
    this.onclose = onclose;
    this.connected = false;
    this.actionHandler = new ActionHandler(this);
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
    // Tell the server we're ready
    // (Server will then send us an INIT packet)
    this.send('sys', 'ready', null);
}

// Handle each message as it comes in over the web socket
ProtocolHandler.prototype.onMessage = function(msg) {
    this.pktRecv++;
    if (msg.data) {
        var info = JSON.parse(msg.data);
        var action = info.action;
        var data = info.data;
        var from = info.from;
        this.perform(action, data);
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
}

// Send a message over the web socket to all connected clients
// (except for one where the packet originated). And performs the
// indicated action locally as well.
//   action - the action that should be performed.
//   data - the data necessary to complete the action (can be null).
ProtocolHandler.prototype.broadcast = function(action, data) {
    this.send('all', action, data);
    this.perform(action, data);
}

// Special version of the broadcast() function that sends a message
// over the web socket to all connected clients (except for one where
// the packet originated) telling the server to store a copy of it
// using the specified identifier. The server will automatically "replay"
// stored messages to new clients making statefull objects possible.
// And finally it performs the indicated action locally as well.
//   action - the action that should be performed.
//   data - the data necessary to complete the action (can be null).
//   id - the identifier to asociate with the stored action on the server.
ProtocolHandler.prototype.persist = function(action, data, id) {
    var info = {
        "to" : "all",
        "action" : action,
        "data" : data,
        "id" : id
    };
    this.send('sys', 'store', info);
    this.perform(action, data);
}

// Special version of the broadcast() function that sends a message
// over the web socket to all connected clients (except for one where
// the packet originated) telling the server to remove a previously
// stored message with the same identifier. The server will not "replay"
// that message to new clients anymore.
// And finally it performs the indicated action locally as well.
//   action - the action that should be performed.
//   data - the data necessary to complete the action (can be null).
//   id - the identifier of the stored action to remove from the server.
ProtocolHandler.prototype.unpersist = function(action, data, id) {
    this.send('sys', 'remove', id);
    this.broadcast(action, data);
}

// Peforms the specified action.
//   action - action to perform.
//   data - data necessary to perform the action.
ProtocolHandler.prototype.perform = function(action, data) {
    __dispatch(this.actionHandler, action, data);
}

// Returns a new Object ID (an ID guaranteed to be unique among all clients).
ProtocolHandler.prototype.getNewId = function() {
    return this.id + "_" + this.nextobjid++;
}

// Returns the local URL for the given package name.
//   pkgName - the name of the package.
ProtocolHandler.prototype.packageUrl = function(pkgName) {
    return "/pkg/" + pkgName + "/";
}


// ****************************************************************
// ActionHandler
// ****************************************************************

function ActionHandler(handler) {
    this.handler = handler;
}

ActionHandler.prototype.init = function(data) {
    this.handler.id = data;
    this.handler.nextobjid = 1;
    this.handler.connected = true;
    if (this.handler.onopen) {
        this.handler.onopen(this.handler);
    }
}

ActionHandler.prototype.single = function(info) {
    var action = info.action;
    var data = info.data;
    this.handler.perform(action, data);
}

ActionHandler.prototype.multi = function(data) {
    for (var idx in data) {
        var actdat = data[idx];
        this.single(actdat);
    }
}

ActionHandler.prototype.run = function(data) {
    eval(data);
}

ActionHandler.prototype.head = function(data) {
   ContentEditor.addHead(data);
}

ActionHandler.prototype.body = function(data) {
   ContentEditor.addBody(data);
}

ActionHandler.prototype.script = function(data) {
   ContentEditor.addScript(data);
}

ActionHandler.prototype.scriptSrc = function(data) {
   ContentEditor.addScriptSrc(data);
}

ActionHandler.prototype.css = function(data) {
   ContentEditor.addCss(data);
}

ActionHandler.prototype.cssLink = function(data) {
   ContentEditor.addCssLink(data);
}

ActionHandler.prototype.activate = function(pkgName) {
    var handler = this;
    ContentEditor.addScriptSrc(this.handler.packageUrl("starbutton") + "js/main.js", function() {
        var pkg = new Package(handler.handler, pkgName);
        var fn = window[pkgName];
        var result = new fn(pkg);
    });
}


// ****************************************************************
// ContentEditor
// ****************************************************************

var ContentEditor = {
    "addHead" : function(data) {
        $('head').append(data);
    },

    "addBody" : function(data) {
        $('body').append(data);
    },

    "addScript" : function(data) {
        var tmp = document.createElement("script");
        tmp.type = 'text/javascript';
        tmp.innerHTML = data;
        document.getElementsByTagName('head')[0].appendChild(tmp);
    },

    "addScriptSrc" : function(data, callback) {
        var tmp = document.createElement("script");
        tmp.type = 'text/javascript';
        tmp.src = data;
        tmp.onload = callback;
        document.getElementsByTagName('head')[0].appendChild(tmp);
    },

    "addCss" : function(data) {
        var tmp = document.createElement("style");
        tmp.type = 'text/css';
        tmp.innerHTML = data;
        document.getElementsByTagName('head')[0].appendChild(tmp);
    },

    "addCssLink" : function(data) {
        var tmp = document.createElement("link");
        tmp.type = 'text/css';
        tmp.rel = 'stylesheet';
        tmp.href = data;
        document.getElementsByTagName('head')[0].appendChild(tmp);
    }
};


// ****************************************************************
// Package
// ****************************************************************

function Package(handler, packageName) {
    this.handler = handler;
    this.packageName = packageName;
}

Package.prototype.loadHtml = function(name, callback) {
    var handler = this.handler;
    $.get(handler.packageUrl(this.packageName) + "html/" + name, function(bodyData) {
        ContentEditor.addBody(bodyData);
        if (callback) {
            callback.apply();
        }
    });
}

Package.prototype.loadScript = function(name, callback) {
    ContentEditor.addScriptSrc(this.handler.packageUrl("starbutton") + "js/" + name, callback);
}

Package.prototype.loadCss = function(name) {
    ContentEditor.addCssLink(this.handler.packageUrl("starbutton") + "css/" + name);
}

//Channel.prototype.send = function(objid, action, data) {
//    var info = {
//        "id" : objid,
//        "action" : action,
//        "data" : data
//    };
//    this.handler.send("object", info)
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

var windowAlertBackup = window.alert;
window.alert = function(message){
    var dialog = $("#errorDialog");
    dialog.text(message);
    dialog.dialog({
        draggable: true,
        resizable: false,
        modal: true,
        autoOpen: true,
        position: 'center',
        stack: false,
        buttons : {
            'Ok' : function() {
                $("#errorDialog").dialog('close');
            }
        },
        title : (arguments.length > 1) ? arguments[1] : "Alert"
    });
}

