
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

function __noCacheUrl(url) {
    return url + "?ts=" + (new Date()).valueOf()
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
// Drag support
// ****************************************************************

var dragging = false;
document.onmousemove = function(event) {
    if (dragging) {
        var diffX = event.pageX - mouseStartX;
        var diffY = event.pageY - mouseStartY;
        var objNewX = objStartX + diffX;
        var objNewY = objStartY + diffY;
        var id = draggedObj[0].id;

        // TODO make this generic! This part is only meant for the Starbutton package
        var scr = '$("#' + id + '").offset({ top: ' + objNewY + ', left: ' + objNewX + '})';
        MsgStore.store(id + '_update', { "action" : "run", "data" : scr });
        protocolhandler.broadcast("run", scr);
    }
}

document.onmouseup = function(event) {
    dragging = false;
}

$(".draggable").live("mousedown", function(event) {
    dragging = true;
    mouseStartX = event.pageX;
    mouseStartY = event.pageY;
    draggedObj = $(event.target);
    objStartX = draggedObj.offset().left;
    objStartY = draggedObj.offset().top;
    return false;
});


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
        if (console) console.log("addScriptSrc", __noCacheUrl(data));
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
        if (console) console.log("addCssLink", __noCacheUrl(data));
        var tmp = document.createElement("link");
        tmp.type = 'text/css';
        tmp.rel = 'stylesheet';
        tmp.href = data;
        document.getElementsByTagName('head')[0].appendChild(tmp);
    }
};


// ****************************************************************
// Toolbox
// ****************************************************************

var Toolbox = {
    "addPanel" : function(title, content) {
        var panel;
        var win = $("#toolbox");
        if (win) {
            if (win.children().length == 0) {
                win.dialog({
                    "width" : 200,
                    "resizable" : false,
                    "position" : ['right','top'],
                    "beforeclose" : function() { return false }
                });
            }
            var id = "toolboxpanel" + this._nextPanelId++;
            panel = $('<div><h3><a href="#">Title</a></h3><div>...</div></div>').attr("id", id);
            panel.appendTo(win);
            this.setPanelTitle(panel, title);
            this.setPanelContent(panel, content);
        }
        return panel;
    },

    "setPanelTitle" : function(panel, title) {
        if (panel) {
            panel.find("h3 a").text(title);
            this.resizePanel(panel);
        }
    },

    "setPanelContent" : function(panel, content) {
        if (panel) {
            panel.find("div").html(content);
            this.resizePanel(panel);
        }
    },

    "resizePanel" : function(panel, content) {
        if (panel) {
            panel.accordion("destroy");
            panel.accordion({
                "collapsible" : true
            });
        }
    },

    "removePanel" : function(panel) {
        var win = $("#toolbox");
        if (win) {
            if (panel) {
                panel.remove();
            }
            if (win.children().length == 0) {
                win.dialog("close");
            }
        }
    },

    "_nextPanelId" : 0
};
