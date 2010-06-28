/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package org.codejive.websocket.wstestserver;

import java.io.IOException;
import javax.servlet.ServletConfig;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.codejive.rws.RwsHandler;

import org.codejive.rws.RwsObject;
import org.codejive.rws.RwsObject.Scope;
import org.codejive.rws.RwsRegistry;
import org.codejive.rws.converters.RwsBeanConverter;
import org.eclipse.jetty.websocket.WebSocket;
import org.eclipse.jetty.websocket.WebSocketServlet;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class DangerZoneWebSocketServlet extends WebSocketServlet {

    private final MessageStore _msgStore = new MessageStore();
    
    Logger logger = LoggerFactory.getLogger(DangerZoneWebSocketServlet.class);

    @Override
    public void init(ServletConfig config) throws ServletException {
        super.init(config);

        // TODO Make this configurable!

        RwsObject srv = new RwsObject("Server", DangerZoneWebSocketServlet.class, Scope.global, new String[] {
            "echo"
        });
        srv.setTargetObject(null, this);
        RwsRegistry.register(srv);

        RwsObject clts = new RwsObject("Clients", Clients.class, Scope.global, new String[] {
            "listClients", "subscribeConnect", "unsubscribeConnect",
            "subscribeDisconnect", "unsubscribeDisconnect",
            "subscribeChange", "unsubscribeChange"
        });
        RwsRegistry.register(clts);
        
        RwsObject clt = new RwsObject("Client", Clients.ClientInfo.class, Scope.connection, new String[] {
            "getId", "getName", "setName"
        });
        RwsRegistry.register(clt);

        RwsObject store = new RwsObject("MsgStore", MessageStore.class, Scope.global, new String[] {
            "listNames", "listMessages", "get", "store", "remove", "clear"
        });
        store.setTargetObject(null, _msgStore);
        RwsRegistry.register(store);

        RwsObject pkg = new RwsObject("Package", Package.class, Scope.global, new String[] { "listPackages" });
        pkg.setTargetObject(null, new Package(config));
        RwsRegistry.register(pkg);

        String[] cltProps = { "id", "name" };
        RwsRegistry.register(new RwsBeanConverter(cltProps, true), Clients.ClientInfo.class.getName());

        RwsRegistry.register(new RwsBeanConverter(), RwsHandler.class.getName());
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws javax.servlet.ServletException, IOException {
        getServletContext().getNamedDispatcher("default").forward(request, response);
    }

    @Override
    protected WebSocket doWebSocketConnect(HttpServletRequest request, String protocol) {
        return new DangerZoneWebSocket();
    }

    public Object echo(Object value) {
        return value;
    }
    
    /* ------------------------------------------------------------ */
    /* ------------------------------------------------------------ */
    class DangerZoneWebSocket implements WebSocket {
        private JettyWebSocketAdapter adapter;
        
        @Override
        public void onConnect(Outbound outbound) {
            logger.info(this + " onConnect - creating JettyWebSocketAdapter");
            adapter = new JettyWebSocketAdapter(outbound);
            adapter.onConnect();
        }

        @Override
        public void onMessage(byte frame, byte[] data, int offset, int length) {
            // Log.info(this+" onMessage: "+TypeUtil.toHexString(data,offset,length));
        }

        @Override
        public void onMessage(byte frame, String msg) {
            adapter.onMessage(msg);
        }

        @Override
        public void onDisconnect() {
            adapter.onDisconnect();
            adapter = null;
        }
    }
}
