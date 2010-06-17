
// ****************************************************************
// Global
// ****************************************************************

function __dispatch() {
    var obj = Array.prototype.shift.call(arguments);
    var fnName = Array.prototype.shift.call(arguments);
    var fn = obj[fnName];
    return fn.apply(obj, arguments);
}

function __upperFirst(value) {
    var result;
    if (value && value.length > 0) {
        result = value.substr(0, 1).toUpperCase() + value.substr(1);
    } else {
        result = value;
    }
    return result;
}

function __copy(value) {
    var newvalue = {};
    for (prop in value) {
        if (this[prop] && typeof this[prop] == "object") {
            newvalue[prop] = __copy(value[prop]);
        } else {
            newvalue[prop] = value[prop];
        }
    }
    return newvalue;
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
