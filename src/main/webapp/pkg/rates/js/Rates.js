
function Rates(pkg) {
    this.pkg = pkg;
    this.period = 2;
    this.oldPktRecv = 0;
    this.oldPktSent = 0;
}

Rates.prototype.activate = function() {
    if (!this.toolbox) {
        var rates = this;
        this.pkg.loadCss("rates.css");
        this.toolbox = this.pkg.loadToolbox("Rates", "rates.html", function() {
            rates.showRates();
            rates.interval = setInterval(function() {rates.showRates()}, rates.period * 1000);
        });
    }
}

Rates.prototype.deactivate = function() {
    if (this.toolbox) {
        clearInterval(this.interval);
        this.showRates();
        Toolbox.removePanel(this.toolbox);
        delete this.toolbox;
    }
}

Rates.prototype.showRates = function() {
    if (this.toolbox) {
        if (rws.isConnected()) {
            var pin = rws.pktRecv;
            var pout = rws.pktSent;
            var din = Math.ceil((pin - this.oldPktRecv) / this.period);
            var dout = Math.ceil((pout - this.oldPktSent) / this.period);
            this.oldPktRecv = pin;
            this.oldPktSent = pout;
            $("#incomingPackets").text(din);
            $("#outgoingPackets").text(dout);
            $("#packetratesTable").show();
            $("#packetratesDiv").hide();
            Toolbox.resizePanel(this.toolbox);
        } else {
            $("#packetratesTable").show();
            $("#packetratesDiv").hide();
            Toolbox.resizePanel(this.toolbox);
        }
    }
}
