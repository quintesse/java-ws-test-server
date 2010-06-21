
// ****************************************************************
// Package - Sys
// ****************************************************************

function Sys(pkg) {
    this.pkg = pkg;
}

Sys.prototype.activate = function() {
    if (!this.toolbox) {
        var syspkg = this;
        this.toolbox = this.pkg.loadToolbox("Sys", "sys.html", function() {
            var box = $("#sysActivateTextbox");
            box.keypress(function(event) {
                if (event.keyCode == "13") {
                    var txt = box.val();
                    if (txt.substr(0, 1) == "-") {
                        txt = txt.substr(1);
                        syspkg.pkg.handler.deactivatePackage(txt);
                    } else {
                        syspkg.pkg.handler.registerPackage(txt);
                    }
                    box.val("");
                }
            });

            Package.listPackages(function(data) {
                var txt = "";
                var lst = $("#sysPackageList");
                lst.empty();
                for (idx in data) {
                    var p = data[idx];
                    lst.append('<li><a href="#" onclick="protocolhandler.registerPackage(\'' + p+ '\'); return false;">' + p + '</a></li>');
                }
                Toolbox.resizePanel(syspkg.toolbox);
            });
        });
    }
}

Sys.prototype.deactivate = function() {
    if (this.toolbox) {
        Toolbox.removePanel(this.toolbox);
        delete this.toolbox;
    }
}
