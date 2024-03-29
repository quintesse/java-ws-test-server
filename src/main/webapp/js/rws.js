
// ****************************************************************
// RWS protocol handler
// ****************************************************************

if (!rws) var rws = {};

// function to call when a connection has been established
// with the server. The function will be passed a reference
// to the ProtocolHandler object.
rws.onopen = function() {};

// function to call when the connection to the server has
// been lost or closed. The function will be passed a reference
// to the ProtocolHandler object.
rws.onclose = function() {};

// function to call when an exception has been received from the
// server as a result to a prior remote method call and no
// specific handler had been defined.
rws.exceptionHandler = function(ex) {alert('RWS Error: ' + ex)};

//
// Connect to the server
//   url - the URL of the server
rws.connect = function(url) {
    this.webSocket = new WebSocket(url);
    var handler = this;
    this.webSocket.onopen = function() {handler._onOpen()};
    this.webSocket.onmessage = function(msg) {handler._onMessage(msg)};
    this.webSocket.onclose = function(msg) {handler._onClose(msg)};

    // Reset packet counters
    this.pktRecv = 0;
    this.pktSent = 0;
};

// Return boolean indicating connection state
rws.isConnected = function(msg) {
    return this._connected;
};

// Send a message over the web socket
//   to - the recipient of the message. Use 'sys' for packets directed
//        to the server and 'all' to broadcast to all connected clients
//        (except for one where the packet originated).
//   data - the data necessary to complete the action
rws.send = function(to, data) {
    if (!this.webSocket) {
        console.log("ERROR: Cannot send, socket not connected!");
        throw "NotConnected";
    }

    var info = this._copy(data);
    info.to = to;

    var msg = JSON.stringify(info);
    this.webSocket.send(msg);
    this.pktSent++;

    if (console) {
        if (info.method) {
            console.log("Outgoing call:", to, "-", info.id, "-", info.object + '.' + info.method, "(", info.params, ")");
        } else if (info.method) {
            console.log("Outgoing result:", to, "-", info.id, "-", info.result);
        } else {
            console.log("Outgoing exception:", to, "-", info.id, "-", info.exception);
        }
    }
};

// Send a message over the web socket to all connected clients.
// (except for one where the packet originated).
//   data - the data necessary to complete the action.
rws.broadcast = function(data) {
    if (data.id) data.id = null; // Make sure we don't try to ask for results
    this.send('all', data);
};

// Send a message over the web socket to all members od the indicated group.
// (except for the client where the packet originated).
//   group - the name of the group to send the message to
//   data - the data necessary to complete the action.
rws.multicast = function(group, data) {
    if (data.id) data.id = null; // Make sure we don't try to ask for results
    this.send('#' + group, data);
};

// Returns a new Object ID (an ID guaranteed to be unique among all clients).
rws.getNewId = function() {
    if (!this.isConnected() && this.nextobjid > 1) {
        console.log("ERROR: Cannot get object ID, socket not connected!");
        throw "NotConnected";
    }
    return this.id + "_" + this.nextobjid++;
};

// Performs a remote method call on the server or another client.
//   to - the id of the remote site ("sys" for server).
//   method - the name of the method to call.
//   objName - the name of the remote object (can be undefined for global context).
//   onSuccess - the function to call with the result (can be undefined).
//   onFailure - the function to call when a remote error occurred (can be undefined).
//   params... - the parameters to pass can come after.
// Returns the Id of a future if it was created
rws.call = function() {
    var to = Array.prototype.shift.call(arguments);
    var method = Array.prototype.shift.call(arguments);
    var objName = Array.prototype.shift.call(arguments);
    var onSuccess = Array.prototype.shift.call(arguments);
    var onFailure = Array.prototype.shift.call(arguments);

    var info = {
        "method" : method
    }
    if (arguments.length > 0) {
        info["params"] = Array.prototype.slice.call(arguments);
    }
    if (objName) {
        info["object"] = objName;
    }

    var id;
    if (onSuccess || onFailure) {
        if (!onFailure) {
            onFailure = this.exceptionHandler;
        }
        id = this.getNewId();
        info["id"] = id;
        this._futures[id] = {
            "success" : onSuccess,
            "failure" : onFailure
        };
    }

    this.send(to, info);

    return id;
};

// Performs a remote method call on all clients (except for one where the packet
// originated). And performs the indicated action locally as well.
//   method - the name of the method to call
//   objName - the name of the remote object (can be undefined for global context)
//   params... - the parameters to pass can come after
rws.broadcall = function() {
    var method = Array.prototype.shift.call(arguments);
    var objName = Array.prototype.shift.call(arguments);

    var info = {
        "method" : method
    }
    if (arguments.length > 0) {
        info["params"] = Array.prototype.slice.call(arguments);
    }
    if (objName) {
        info["object"] = objName;
    }

    this.broadcast(info);
    this.perform(info);
};

// Performs a remote method call on all clients that are members of the indicated
// multicast group (except for one where the packet originated). And performs the
// indicated action locally as well.
//   group - the name of the group
//   method - the name of the method to call
//   objName - the name of the remote object (can be undefined for global context)
//   params... - the parameters to pass can come after
rws.multicall = function() {
    var group = Array.prototype.shift.call(arguments);
    var method = Array.prototype.shift.call(arguments);
    var objName = Array.prototype.shift.call(arguments);

    var info = {
        "method" : method
    }
    if (arguments.length > 0) {
        info["params"] = Array.prototype.slice.call(arguments);
    }
    if (objName) {
        info["object"] = objName;
    }

    this.multicast(group, info);
    this.perform(info);
};

rws.perform = function(data) {
    var obj = (data.object) ? window[data.object] : window;
    var method = data.method;
    var params = data.params;
    var fn = obj[method];
    return fn.apply(obj, params);
};

// Subscribes to a remote event source
//   to - the id of the remote site ("sys" for server)
//   action - the name of the event action to subscribe to
//   event - the name of the event set to subscribe to
//   objName - the name of the remote object (can be undefined for global context)
//   handler - the function to call for each incoming event
// Returns the Id of the handler
rws.subscribe = function(to, action, event, objName, handler) {

    var sub = new Subscription();
    sub.clientId = this.id;
    sub.handlerId = this.getNewId();
    sub.action = action;
    sub.event = event;
    sub.object = objName;

    this._futures[sub.handlerId] = {
        "to" : to,
        "info" : sub,
        "handler" : handler
    };

    session.subscribe(sub, undefined, function(data) {
        delete rws._futures[sub.handlerId];
        rws.exceptionHandler(data);
    });

    return sub.handlerId;
};

// Unsubscribes from a remote event source
//   handlerid - the id of the handler that was returned when subscribing
rws.unsubscribe = function(handlerId) {
    var fut = this._futures[handlerId];
    if (fut) {
        session.unsubscribe(fut.info, function() {
            delete rws._futures[handlerId];
        }, undefined);
    }
};

// ****************************************************************
// PRIVATE METHODS BELOW - DO NOT USE
// ****************************************************************

rws._connected = false;
rws._futures = {};

// Handle opening of the web socket
rws._onOpen = function() {
    this.nextobjid = 1;
    var handler = this;
    // The following line could have been implemented as:
    //    session.getId(function(data)
    // but this would mean requiring another javascript import.
    rws.call('sys', 'getId', 'session', function(data) {
        handler.id = data;
        handler._connected = true;
        if (handler.onopen) {
            handler.onopen(this);
        }
    });
};

// Handle each message as it comes in over the web socket
rws._onMessage = function(msg) {
    this.pktRecv++;
    if (msg.data) {
        var info = JSON.parse(msg.data);
        this._handleMessage(info);
    }
};

// Handle closing of the web socket
rws._onClose = function(msg) {
    this.webSocket = null;
    this._connected = false;
    if (this.onclose) {
        this.onclose(this);
    }
};

rws._handleMessage = function(data) {
    if (data instanceof Array) {
        info = data;
    } else {
        info = [ data ];
    }
    for (idx in info) {
        var msg = info[idx];
        if (typeof msg.method != "undefined") {
            if (console) console.log("Incoming call:", msg.from, "-", msg.object + '.' + msg.method, "(", msg.params, ")");
            this._handleCall(msg);
        } else if (typeof msg.result != "undefined") {
            if (console) console.log("Incoming result:", msg.from, "-", msg.id, "-", msg.result);
            this._handleResult(msg);
        } else if (typeof msg.exception != "undefined") {
            if (console) console.log("Incoming exception:", msg.from, "-", msg.id, "-", msg.exception);
            this._handleException(msg);
        } else if (typeof msg.event != "undefined") {
            if (console) console.log("Incoming event:", msg.from, "-", msg.id, "-", msg.event);
            this._handleEvent(msg);
        } else {
            if (console) console.log("Received unknown message:", msg);
        }
    }
};

rws._handleCall = function(data) {
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
    if (id) {
        this.send(data.from, res);
    }
};

rws._handleResult = function(data) {
    var id = data.id;
    var fut = this._futures[id];
    if (fut) {
        if (fut.success) {
            fut.success(data.result);
        }
        delete this._futures[id];
    } else {
        if (console) console.warn("Unknown RESULT received from", data.from, "with", data);
    }
};

rws._handleException = function(data) {
    var id = data.id;
    var fut = this._futures[id];
    if (fut) {
        if (fut.failure) {
            fut.failure(data.exception);
        }
        delete this._futures[id];
    } else {
        if (console) console.warn("Unknown EXCEPTION received from", data.from, "with", data);
    }
};

rws._handleEvent = function(data) {
    var id = data.id;
    var fut = this._futures[id];
    if (fut) {
        if (fut.handler) {
            fut.handler(data.event);
        }
    } else {
        if (console) console.warn("Unknown EVENT received from", data.from, "with", data);
    }
};

rws._copy = function(value) {
    var newvalue = {};
    for (prop in value) {
        if (this[prop] && typeof this[prop] == "object") {
            newvalue[prop] = this._copy(value[prop]);
        } else {
            newvalue[prop] = value[prop];
        }
    }
    return newvalue;
};

rws._pretty = function(obj, pad) {
    var indent = '    ';
    if (!pad) pad = '';
    var out = '';
    if (obj instanceof Array) {
        out += '[';
        for (var i=0; i<obj.length; i++) {
            var val = this._pretty(obj[i], pad + indent);
            if (val.indexOf('\n') >= 0) {
                out += '\n' + pad + indent;
            } else {
                out += ' ';
            }
            out += val + ',';
        }
        out = out.replace(/,$/, '');
        if (out.indexOf('\n') >= 0) {
            out += '\n]';
        } else {
            out += ' ]';
        }
    } else if (obj instanceof Object) {
        out += '{\n';
        for (var i in obj) {
            out += pad + indent + this._pretty(i, pad + indent) + ' : ' + this._pretty(obj[i], pad + indent) + ',\n';
        }
        out = out.replace(/,\n$/, '\n') + pad + '}';
    } else if (typeof obj == 'string') {
        out += "'" + obj + "'";
    } else {
        out += obj;
    }
    return out;
}

