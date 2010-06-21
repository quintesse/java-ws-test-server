/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package org.codejive.websocket.wstestserver;

import java.io.IOException;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import javax.servlet.ServletConfig;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.codejive.rws.RwsContext;

import org.codejive.rws.RwsObject;
import org.codejive.rws.RwsObject.Scope;
import org.codejive.rws.RwsRegistry;
import org.eclipse.jetty.websocket.WebSocket;
import org.eclipse.jetty.websocket.WebSocketServlet;
import org.json.simple.JSONObject;
import org.json.simple.JSONValue;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class DangerZoneWebSocketServlet extends WebSocketServlet {

    private final Map<String, DangerZoneWebSocket> _members = new ConcurrentHashMap<String, DangerZoneWebSocket>();
    private final MessageStore _msgStore = new MessageStore();
    private long _zoneId = 1;
    
    private enum Event {
        ready, client, ping, pong, call
    }

    Logger logger = LoggerFactory.getLogger(DangerZoneWebSocketServlet.class);

    @Override
    public void init(ServletConfig config) throws ServletException {
        super.init(config);

        // TODO Make this configurable!

        RwsObject srv = new RwsObject("Server", this.getClass(), Scope.global, new String[] { "listClients" });
        srv.setTargetObject(null, this);
        RwsRegistry.register(srv);
        
        RwsObject store = new RwsObject("MsgStore", MessageStore.class, Scope.global, new String[] { "getNames", "getMessages", "get", "store", "remove", "clear" });
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

    public List<JSONObject> listClients() {
        LinkedList<JSONObject> list = new LinkedList();
        for (DangerZoneWebSocket member : _members.values()) {
            list.add(newClientInfo(member));
        }
        return list;
    }

    private JSONObject newClientInfo(DangerZoneWebSocket member) {
        JSONObject obj = new JSONObject();
        obj.put("id", member._socketId);
        obj.put("name", member._userName);
        return obj;
    }

    /* ------------------------------------------------------------ */
    /* ------------------------------------------------------------ */
    class DangerZoneWebSocket implements WebSocket {

        private Outbound _outbound;
        private String _socketId;
        private String _userName;
        private RwsContext _context;

        private static final String ACTION_INIT = "init";
        private static final String ACTION_ACTIVATE = "activate";
        private static final String ACTION_MULTI = "multi";
        private static final String ACTION_CLIENT_CHANGE = "client";
        private static final String ACTION_CLIENT_CONNECT = "connect";
        private static final String ACTION_CLIENT_DISCONNECT = "disconnect";
        private static final String ACTION_PONG = "pong";
        private static final String ACTION_CALL_RESULT = "result";

        @Override
        public void onConnect(Outbound outbound) {
            logger.info(this + " onConnect");
            _outbound = outbound;
            _socketId = Long.toString(_zoneId++);
            _userName = "Client #" + _socketId;
            _context = new RwsContext(this);
            _members.put(_socketId, this);
            sendAll("sys", ACTION_CLIENT_CONNECT, newClientInfo(this), false);
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
                Object data = info.get("data");
                if (to == null || "sys".equals(to)) {
                    // The message is for the server
                    Event event = Event.valueOf(action.toLowerCase());
                    onAction(event, data);
                } else if ("all".equals(to)) {
                    // Send the message to all connected sockets
                    sendAll(action, data, false);
                } else {
                    // Send the message to the indicated socket
                    sendTo(to, action, data);
                }
            } catch (ParseException ex) {
                logger.error("Couldn't parse incoming message", ex);
            }
        }

        @Override
        public void onDisconnect() {
            logger.info(this + " onDisconnect");
            _context = null;
            _members.remove(_socketId);
            sendAll("sys", ACTION_CLIENT_DISCONNECT, newClientInfo(this), false);
        }

        private void onAction(Event event, Object data) {
            switch (event) {
                case ready:
                    doReady();
                    break;
                case client:
                    doClient(data);
                    break;
                case ping:
                    doPing(data);
                    break;
                case pong:
                    // Do nothing
                    break;
                case call:
                    doCall(data);
                    break;
            }
        }

        private void doReady() {
            LinkedList<JSONObject> list = new LinkedList();
            list.add(newActionInfo(ACTION_INIT, _socketId));
            sendMultiple("sys", list);
        }

        private void doClient(Object data) {
            JSONObject info = (JSONObject) data;
            _userName = (String) info.get("name");
            sendAll("sys", ACTION_CLIENT_CHANGE, newClientInfo(this), true);
        }

        private void doPing(Object data) {
            send("sys", ACTION_PONG, data);
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
                Object result = RwsRegistry.call(_context, obj, method, args);
                if (id != null) {
                    send("sys", ACTION_CALL_RESULT, newCallResult(id, result));
                }
            } catch (Throwable th) {
                logger.error("Rws Call failed", th);
                if (id != null) {
                    send("sys", ACTION_CALL_RESULT, newCallException(id, th));
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

        private JSONObject newActionInfo(String action, Object data) {
            JSONObject obj = new JSONObject();
            obj.put("action", action);
            obj.put("data", data);
            return obj;
        }

        private void sendMultiple(String from, Object... info) {
            LinkedList<JSONObject> list = new LinkedList();
            for (int i = 0; i < info.length; i += 2) {
                list.add(newActionInfo((String) info[i], info[i + 1]));
            }
            sendMultiple(from, list);
        }

        private void sendMultiple(String from, List<JSONObject> list) {
            send(from, ACTION_MULTI, list);
        }

        private void send(String from, String action, Object data) {
            try {
                JSONObject info = new JSONObject();
                info.put("action", action);
                info.put("data", data);
                info.put("from", from);
                String jsonText = JSONValue.toJSONString(info);
                _outbound.sendMessage(info.toString());
            } catch (IOException e) {
                logger.error("Could not send message, disconnecting socket", e);
                _outbound.disconnect();
                _context = null;
                _members.remove(_socketId);
                sendAll("sys", ACTION_CLIENT_DISCONNECT, newClientInfo(this), false);
            }
        }

        private void sendAll(String action, Object data, boolean meToo) {
            sendAll(_socketId, action, data, meToo);
        }

        private void sendAll(String from, String action, Object data, boolean meToo) {
            for (DangerZoneWebSocket member : _members.values()) {
                if (meToo || member != this) {
                    member.send(from, action, data);
                }
            }
        }

        private void sendTo(String action, Object data) {
            sendTo(_socketId, action, data);
        }

        private void sendTo(String to, String action, Object data) {
            DangerZoneWebSocket member = _members.get(to);
            if (member != null) {
                member.send(_socketId, action, data);
            }
        }
    }
}
