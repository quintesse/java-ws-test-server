
// ****************************************************************
// Package - Sys
// ****************************************************************

if (!sysPkg) var sysPkg = {};

sysPkg["activate"] = function() {
    if (!this.toolbox) {
        this.toolbox = this.loadToolbox("Sys", "sys.html", function() {
            var box = $("#sysActivateTextbox");
            box.keypress(function(event) {
                if (event.keyCode == "13") {
                    var txt = box.val();
                    if (txt.substr(0, 1) == "-") {
                        txt = txt.substr(1);
                        Packages.deactivatePackage(txt);
                    } else {
                        Packages.registerPackage(txt);
                    }
                    box.val("");
                }
            });

            setTimeout(function() {
                Package.listPackages(function(data) {
                    var lst = $("#sysPackageList");
                    lst.empty();
                    for (idx in data) {
                        var p = data[idx];
                        lst.append('<li><a href="#" onclick="Packages.registerPackage(\'' + p+ '\'); return false;">' + p + '</a></li>');
                    }
                    Toolbox.resizePanel(sysPkg.toolbox);
                });
            }, 200);
            
        });
    }
}

sysPkg["deactivate"] = function() {
    if (this.toolbox) {
        Toolbox.removePanel(this.toolbox);
        delete this.toolbox;
    }
}
