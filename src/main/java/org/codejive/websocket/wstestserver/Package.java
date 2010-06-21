package org.codejive.websocket.wstestserver;

import javax.servlet.ServletConfig;

public class Package {

    private ServletConfig config;
    private static final String[] packages = new String[]{"chat", "clients", "keepalive", "rates", "starbutton", "sys"};

    public Package(ServletConfig config) {
        this.config = config;
    }

    public String[] listPackages() {
        // TODO Make this dynamic!!
        return packages;
    }
}
