
if (!ratesPkg) var ratesPkg = {};

ratesPkg["period"] = 2;
ratesPkg["oldPktRecv"] = 0;
ratesPkg["oldPktSent"] = 0;

ratesPkg["activate"] = function() {
    if (!this.toolbox) {
        this.loadCss("rates.css");
        this.toolbox = this.loadToolbox("Rates", "rates.html", function() {
            ratesPkg.showRates();
            ratesPkg.interval = setInterval(function() {ratesPkg.showRates()}, ratesPkg.period * 1000);
        });
    }
}

ratesPkg["deactivate"] = function() {
    if (this.toolbox) {
        clearInterval(this.interval);
        this.showRates();
        Toolbox.removePanel(this.toolbox);
        delete this.toolbox;
    }
}

ratesPkg["showRates"] = function() {
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
