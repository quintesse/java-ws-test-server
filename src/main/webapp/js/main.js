function connect() {
    //var location = document.location.toString().replace('http://','ws://').replace('https://','wss://');
    var url = 'ws://localhost:8080/dangerzone';
    __webSocket = new WebSocket(url);
    __webSocket.onopen = __onOpen;
    __webSocket.onmessage = __onMessage;
    __webSocket.onclose = __onClose;
}

function __onOpen() {
    __send('ready', null);
}

function __onMessage(msg) {
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
        __perform(action, data);
    }
}

function __onClose(msg) {
    __webSocket = null;
    alert('Bye!');
}

function __send(action, data) {
    if (data != null) {
        if (action == null) action = '';
        __webSocket.send(action + '#' + data);
    } else {
        __webSocket.send(action);
    }
}

function __dispatch() {
    var fn = Array.prototype.shift.call(arguments);
    fn = (typeof fn == "function") ? fn : window[fn];
    return fn.apply(this, arguments);
}

function __doRun(data) {
    eval(data);
}

function __perform(action, data) {
    var func = '__do' + action.slice(0, 1).toUpperCase() + action.slice(1);
    __dispatch(func, data);
}

function __doMulti(data) {
    var info = JSON.parse(data);
    for (var action in info) {
        var mdata = info[action];
        __perform(action, mdata);
    }
}





function __doHead(data) {
    $('head').append(data);
}

function __doBody(data) {
    $('body').append(data);
}

function __doScript(data) {
    var tmp = document.createElement("script");
    tmp.type = 'text/javascript';
    tmp.innerHTML = data;
    document.getElementsByTagName('head')[0].appendChild(tmp);
}

function __doScriptsrc(data) {
    var tmp = document.createElement("script");
    tmp.type = 'text/javascript';
    tmp.src = data;
    document.getElementsByTagName('head')[0].appendChild(tmp);
}

function __doCss(data) {
    var tmp = document.createElement("style");
    tmp.type = 'text/css';
    tmp.innerHTML = data;
    document.getElementsByTagName('head')[0].appendChild(tmp);
}

function __doCsslink(data) {
    var tmp = document.createElement("link");
    tmp.type = 'text/css';
    tmp.rel = 'stylesheet';
    tmp.href = data;
    document.getElementsByTagName('head')[0].appendChild(tmp);
}
