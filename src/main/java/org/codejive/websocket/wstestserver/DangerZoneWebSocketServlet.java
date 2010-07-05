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
import org.codejive.rws.RwsContext;
import org.codejive.rws.RwsException;

import org.codejive.rws.RwsObject;
import org.codejive.rws.RwsRegistry;
import org.codejive.rws.RwsSession;
import org.codejive.rws.converters.RwsBeanConverter;
import org.eclipse.jetty.websocket.WebSocket;
import org.eclipse.jetty.websocket.WebSocketServlet;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class DangerZoneWebSocketServlet extends WebSocketServlet {

    private final DataStore dataStore = new DataStore();
    
    Logger logger = LoggerFactory.getLogger(DangerZoneWebSocketServlet.class);

    @Override
    public void init(ServletConfig config) throws ServletException {
        super.init(config);
        try {
            // TODO Make this configurable!
            RwsObject srv = new RwsObject(DangerZoneWebSocketServlet.class, "Server", new RwsBeanConverter());
            // METHODS new String[]{"echo"}, true
            // INSTANCE srv.setTargetObject(null, this); // Scope.global,
            RwsRegistry.register(srv);

            RwsObject ctx = new RwsObject(RwsContext.class, "Context", new RwsBeanConverter());
            // METHODS new String[]{"listClients", "subscribeConnect", "unsubscribeConnect", "subscribeDisconnect", "unsubscribeDisconnect", "subscribeChange", "unsubscribeChange"}, true
            // INSTANCE Scope.global
            RwsRegistry.register(ctx);

            RwsObject clt = new RwsObject(RwsSession.class, "Session", new RwsBeanConverter());
            // INSTANCE Scope.connection
            RwsRegistry.register(clt);

            RwsObject store = new RwsObject(DataStore.class, "DataStore", new RwsBeanConverter());
            // INSTANCE store.setTargetObject(null, dataStore); // Scope.global,
            RwsRegistry.register(store);

            RwsObject pkg = new RwsObject(Package.class, "Package", new RwsBeanConverter());
            // INSTANCE pkg.setTargetObject(null, new Package(config)); // , Scope.global
            RwsRegistry.register(pkg);
            
//            String[] cltProps = {"id", "name"};
//            RwsRegistry.register(new RwsBeanConverter(cltProps, true), Clients.ClientInfo.class.getName());
//            RwsRegistry.register(new RwsBeanConverter(), Clients.ClientEvent.class.getName());
//            RwsRegistry.register(new RwsBeanConverter(), RwsSession.Subscription.class.getName());
        } catch (RwsException ex) {
            throw new ServletException("Could not initialize RwsRegistry", ex);
        }
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
