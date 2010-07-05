
if (!clientsPkg) var clientsPkg = {};

//clientsPkg["period"] = 10;

clientsPkg["activate"] = function() {
    if (!this.toolbox) {
        var fn = function() {clientsPkg.showClients()};
        Context.subscribeClientConnect(fn);
        Context.subscribeClientDisconnect(fn);
        Context.subscribeClientChange(fn);
        this.toolbox = this.loadToolbox("Clients", "clients.html", function() {
            $("#toolboxClientButton").click(function() {
                var name = $("#toolboxClientName").val();
                clientsPkg.setName(name);
            });
            clientsPkg.showClients();
            //clientsPkg.interval = setInterval(fn, clientsPkg.period * 1000);
        });
    } else {
        clientsPkg.showClients();
    }
}

clientsPkg["deactivate"] = function() {
    if (this.toolbox) {
        clearInterval(this.interval);
        this.showClients();
        Toolbox.removePanel(this.toolbox);
        delete this.toolbox;
    }
}

clientsPkg["showClients"] = function() {
    if (this.toolbox) {
        if (rws.isConnected()) {
            Context.listClients(function(lst) {
                var txt = "";
                var newClients = {};
                for (id in lst) {
                    var client = lst[id];
                    newClients[client.id] = client;
                    txt = txt + "<li>" + client.name + "</li>";
                }
                clientsPkg.clients = newClients;
                $("#toolboxClientList").html(txt);
                Toolbox.resizePanel(clientsPkg.toolbox);
            });
        } else {
            $("#toolboxClientList").html('Disconnected');
            Toolbox.resizePanel(this.toolbox);
        }
    }
}

clientsPkg["setName"] = function(name) {
    Session.setName(name);
}
