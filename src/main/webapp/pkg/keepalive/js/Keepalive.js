
function Keepalive(pkg) {
    this.pkg = pkg;
    this.period = 5;
    this.rates = pkg.handler.pktRecv + pkg.handler.pktSent;
}

Keepalive.prototype.activate = function() {
    if (!this.toolbox) {
        var keepalive = this;
        this.toolbox = this.pkg.loadToolbox("Keepalive", "keepalive.html", function() {
            $("#keepaliveCheck").click(function() {
                var checked = $("#keepaliveCheck")[0].checked;
                keepalive.activatePing(checked);
            });
            var checked = $("#keepaliveCheck")[0].checked;
            keepalive.activatePing(checked);
        });
    }
}

Keepalive.prototype.deactivate = function() {
    if (this.toolbox) {
        this.activatePing(false);
        Toolbox.removePanel(this.toolbox);
        delete this.toolbox;
    }
}

Keepalive.prototype.activatePing = function(active) {
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

Keepalive.prototype.sendPing = function() {
    var newRates = this.pkg.handler.pktRecv + this.pkg.handler.pktSent;
    if (newRates == this.rates) {
        Server.echo(0);
    } else {
        this.rates = newRates;
    }
}
