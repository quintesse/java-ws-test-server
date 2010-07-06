
if (!keepalivePkg) var keepalivePkg = {};

keepalivePkg["period"] = 5;
keepalivePkg["rates"] = rws.pktRecv + rws.pktSent;

keepalivePkg["activate"] = function() {
    if (!this.toolbox) {
        this.toolbox = this.loadToolbox("Keepalive", "keepalive.html", function() {
            $("#keepaliveCheck").click(function() {
                var checked = $("#keepaliveCheck")[0].checked;
                keepalivePkg.activatePing(checked);
            });
            var checked = $("#keepaliveCheck")[0].checked;
            keepalivePkg.activatePing(checked);
        });
    }
}

keepalivePkg["deactivate"] = function() {
    if (this.toolbox) {
        this.activatePing(false);
        Toolbox.removePanel(this.toolbox);
        delete this.toolbox;
    }
}

keepalivePkg["activatePing"] = function(active) {
    if (active) {
        if (!this.keepaliveInterval) {
            var keepalive = this;
            this.keepaliveInterval = setInterval(function() {keepalive.sendPing()}, keepalive.period * 1000);
        }
    } else {
        if (this.keepaliveInterval) {
            clearInterval(this.keepaliveInterval);
            delete this.keepaliveInterval;
        }
    }
}

keepalivePkg["sendPing"] = function() {
    var newRates = rws.pktRecv + rws.pktSent;
    if (newRates == this.rates) {
        server.echo(0);
    } else {
        this.rates = newRates;
    }
}
