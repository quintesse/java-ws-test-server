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

import org.codejive.rws.RwsObject;
import org.codejive.rws.RwsObject.Scope;
import org.codejive.rws.RwsRegistry;
import org.codejive.websocket.wstestserver.Clients.ClientInfo;
import org.eclipse.jetty.websocket.WebSocket;
import org.eclipse.jetty.websocket.WebSocketServlet;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class DangerZoneWebSocketServlet extends WebSocketServlet {

    private final Clients clients = new Clients();
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
        clts.setTargetObject(null, clients);
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

        private ClientInfo _client;

        @Override
        public void onConnect(Outbound outbound) {
            logger.info(this + " onConnect");
            _client = clients.addClient(outbound);

            RwsRegistry.getObject("Client").setTargetObject(_client, _client);
        }

        @Override
        public void onMessage(byte frame, byte[] data, int offset, int length) {
            // Log.info(this+" onMessage: "+TypeUtil.toHexString(data,offset,length));
        }

        @Override
        public void onMessage(byte frame, String msg) {
            logger.info(this + " onMessage: " + msg);
            try {
                JSONParser parser = new JSONParser();
                JSONObject info = (JSONObject) parser.parse(msg);
                String to = (String) info.get("to");
                String action = (String) info.get("action");
                if (to == null || "sys".equals(to)) {
                    // The message is for the server
                    doCall(info);
                } else if ("all".equals(to)) {
                    // Send the message to all connected sockets
                    clients.sendAll(_client.getId(), info, false);
                } else {
                    // Send the message to the indicated socket
                    clients.sendTo(_client.getId(), to, info);
                }
            } catch (ParseException ex) {
                logger.error("Couldn't parse incoming message", ex);
            }
        }

        @Override
        public void onDisconnect() {
            logger.info(this + " onDisconnect");
            clients.removeClient(_client);
            _client = null;
        }

        private void doCall(Object data) {
            JSONObject info = (JSONObject) data;
            String id = (String) info.get("id"); // If null the caller is not interested in the result!
            String obj = (String) info.get("object");
            String method = (String) info.get("method");
            Object params = (Object) info.get("params");

            Object[] args = null;
            // Convert parameter map to array
            if (params != null && params instanceof JSONObject) {
                JSONObject p = (JSONObject) params;
                args = new Object[p.size()];
                for (int i = 0; i < p.size(); i++) {
                    args[i] = p.get(Integer.toString(i));
                }
            }
            
            try {
                Object result = RwsRegistry.call(_client, obj, method, args);
                if (id != null) {
                    _client.send("sys", newCallResult(id, result));
                }
            } catch (Throwable th) {
                logger.error("Rws Call failed", th);
                if (id != null) {
                    _client.send("sys", newCallException(id, th));
                }
            }
        }

        private JSONObject newCallResult(String id, Object data) {
            JSONObject obj = new JSONObject();
            obj.put("id", id);
            obj.put("result", data);
            return obj;
        }

        private JSONObject newCallException(String id, Throwable th) {
            JSONObject obj = new JSONObject();
            obj.put("id", id);
            obj.put("exception", th.toString());
            return obj;
        }
    }
}
