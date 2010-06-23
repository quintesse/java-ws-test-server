
if (!clientsPkg) var clientsPkg = {};

clientsPkg["period"] = 5;

clientsPkg["activate"] = function() {
    if (!this.toolbox) {
        var fn = function() {clientsPkg.showClients()};
        rws.onclientconnect = fn;
        rws.onclientdisconnect = fn;
        rws.onclientchange = fn;
        this.toolbox = this.loadToolbox("Clients", "clients.html", function() {
            $("#toolboxClientButton").click(function() {
                var name = $("#toolboxClientName").val();
                clientsPkg.setName(name);
            });
            clientsPkg.showClients();
            clientsPkg.interval = setInterval(fn, clientsPkg.period * 1000);
        });
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
        var txt;
        if (rws.isConnected()) {
            txt = "";
            for (id in rws.clients) {
                var client = rws.clients[id];
                txt = txt + "<li>" + client.name + "</li>";
            }
        } else {
            txt = 'Disconnected';
        }
        $("#toolboxClientList").html(txt);
        Toolbox.resizePanel(this.toolbox);
    }
}

clientsPkg["setName"] = function(name) {
    var me = __copy(rws.clients[rws.id]);
    me.name = name;
    rws.send("sys", "client", me);
}
