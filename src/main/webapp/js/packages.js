

// ****************************************************************
// Packages
// ****************************************************************

var Packages = {
    "packages" : {},

    // Returns the local URL for the given package name.
    //   pkgName - the name of the package.
    "packageUrl" : function(pkgName) {
        return "/pkg/" + pkgName + "/";
    },

    // Loads, registers and activates the package with the given name.
    //   pkgName - the name of the package to register.
    "registerPackage" : function(pkgName) {
        if (!this.packages[pkgName]) {
            var pkgs = this;
            ContentEditor.addScriptSrc(this.packageUrl(pkgName) + "js/" + pkgName + ".js", function() {
                var obj = window[pkgName + 'Pkg'];
                pkgs._extend(obj, pkgName);
                pkgs.packages[pkgName] = obj;
                pkgs.activatePackage(obj);
            });
        } else {
            this.activatePackage(pkgName);
        }
    },

    // Activates the given package.
    //   pkg - the package to activate or its name.
    "activatePackage" : function(pkg) {
        if (typeof pkg == "string") {
            pkg = this.packages[pkg];
        }
        if (pkg && pkg.activate) {
            pkg.activate();
        }
    },

    // Deactivates the given package.
    //   pkg - the package to deactivate or its name.
    "deactivatePackage" : function(pkg) {
        if (typeof pkg == "string") {
            pkg = this.packages[pkg];
        }
        if (pkg && pkg.deactivate) {
            pkg.deactivate();
        }
    },

    // Returns if the given package is active or not.
    //   pkg - the package or its name.
    "isActive" : function(pkg) {
        if (typeof pkg == "string") {
            pkg = this.packages[pkg];
        }
        if (pkg && pkg.isActive) {
            return pkg.isActive();
        } else {
            // Packages that don't have a way to activate/deactivate are assumed
            // to be always active.
            return true;
        }
    },

    // Peforms the specified action.
    //   from - the originator of the action
    //   action - action to perform.
    //   data - data necessary to perform the action.
    "perform" : function(from, action, data) {
        var pkgName = "sys";
        var p = action.indexOf(":");
        if (p > 0) {
            pkgName = action.substring(0, p);
            action = action.substr(p + 1);
        }
        this.packages[pkgName].perform(from, action, data);
    },

    "_extend" : function(pkg, pkgName) {
        pkg.packageName = pkgName;

        pkg["isActive"] = function() {
            if (this.toolbox) {
                return true;
            } else {
                return false;
            }
        }

        pkg["loadHtml"] = function(name, target, callback) {
            $.get(Packages.packageUrl(this.packageName) + "html/" + name, function(bodyData) {
                if (target) {
                    target.html(bodyData);
                } else {
                    ContentEditor.addBody(bodyData);
                }
                if (callback) {
                    callback.apply();
                }
            });
        }

        pkg["loadScript"] = function(name, callback) {
            ContentEditor.addScriptSrc(Packages.packageUrl(this.packageName) + "js/" + name, callback);
        }

        pkg["loadCss"] = function(name) {
            ContentEditor.addCssLink(Packages.packageUrl(this.packageName) + "css/" + name);
        }

        pkg["loadToolbox"] = function(title, name, callback) {
            var panel = Toolbox.addPanel(title, "...");
            $.get(Packages.packageUrl(this.packageName) + "html/" + name, function(bodyData) {
                Toolbox.setPanelContent(panel, bodyData);
                if (callback) {
                    callback.apply();
                }
            });
            return panel;
        }

        // Send a message over the web socket to the equivalent package on the other side
        //   to - the recipient of the message. Use 'sys' for packets directed
        //        to the server and 'all' to broadcast to all connected clients
        //        (except for one where the packet originated).
        //   data - the data necessary to complete the action.
        pkg["send"] = function(to, data) {
            data.pkg = this.packageName;
            rws.send(to, data);
        }

        // Send a message over the web socket to the equivalent package for all
        // connected clients (except for one where the packet originated).
        // And performs the indicated action locally as well.
        //   data - the data necessary to complete the action (can be null).
        pkg["broadcast"] = function(data) {
            data.pkg = this.packageName;
            rws.broadcast(data);
        }
    }
}


// ****************************************************************
// Package
// ****************************************************************

function Package(packageName) {
    this.packageName = packageName;
}


