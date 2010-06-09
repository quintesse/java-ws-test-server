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
        __onAction(action, data);
    }
}

function __onAction(action, data) {
    switch (action) {
        case 'run':
            eval(data);
            break;
        case 'script':
            __insertScript(data);
            break;
        case 'scriptsrc':
            __insertScriptSrc(data);
            break;
        case 'css':
            __insertCss(data);
            break;
        case 'csslink':
            __insertCssLink(data);
            break;
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

function __insertScript(data) {
    var tmp = document.createElement("script");
    tmp.type = 'text/javascript';
    tmp.innerHTML = data;
    document.getElementsByTagName('head')[0].appendChild(tmp);
}

function __insertScriptSrc(data) {
    var tmp = document.createElement("script");
    tmp.type = 'text/javascript';
    tmp.src = data;
    document.getElementsByTagName('head')[0].appendChild(tmp);
}

function __insertCss(data) {
    var tmp = document.createElement("style");
    tmp.type = 'text/css';
    tmp.innerHTML = data;
    document.getElementsByTagName('head')[0].appendChild(tmp);
}

function __insertCssLink(data) {
    var tmp = document.createElement("link");
    tmp.type = 'text/css';
    tmp.rel = 'stylesheet';
    tmp.href = data;
    document.getElementsByTagName('head')[0].appendChild(tmp);
}
