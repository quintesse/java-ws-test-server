
function Clients(pkg) {
    this.pkg = pkg;
    this.period = 5;
}

Clients.prototype.activate = function() {
    if (!this.toolbox) {
        var clients = this;
        var fn = function() {clients.showClients()};
        this.pkg.handler.onclientconnect = fn;
        this.pkg.handler.onclientdisconnect = fn;
        this.pkg.handler.onclientchange = fn;
        this.toolbox = this.pkg.loadToolbox("Clients", "clients.html", function() {
            $("#toolboxClientButton").click(function() {
                var name = $("#toolboxClientName").val();
                clients.setName(name);
            });
            clients.showClients();
            clients.interval = setInterval(fn, clients.period * 1000);
        });
    }
}

Clients.prototype.deactivate = function() {
    if (this.toolbox) {
        clearInterval(this.interval);
        this.showClients();
        Toolbox.removePanel(this.toolbox);
        delete this.toolbox;
    }
}

Clients.prototype.showClients = function() {
    if (this.toolbox) {
        var txt;
        if (this.pkg.handler.isConnected()) {
            txt = "";
            for (id in this.pkg.handler.clients) {
                var client = this.pkg.handler.clients[id];
                txt = txt + "<li>" + client.name + "</li>";
            }
        } else {
            txt = 'Disconnected';
        }
        $("#toolboxClientList").html(txt);
        Toolbox.resizePanel(this.toolbox);
    }
}

Clients.prototype.setName = function(name) {
    var me = __copy(this.pkg.handler.clients[this.pkg.handler.id]);
    me.name = name;
    this.pkg.handler.send("sys", "client", me);
}
