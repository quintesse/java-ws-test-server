/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package org.codejive.websocket.wstestserver;

import java.io.IOException;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.CopyOnWriteArraySet;
import java.util.concurrent.ConcurrentHashMap;
import javax.servlet.ServletConfig;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.codejive.rws.RwsObject;
import org.codejive.rws.RwsRegistry;
import org.eclipse.jetty.websocket.WebSocket;
import org.eclipse.jetty.websocket.WebSocketServlet;
import org.json.simple.JSONArray;
import org.json.simple.JSONObject;
import org.json.simple.JSONValue;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class DangerZoneWebSocketServlet extends WebSocketServlet {

    private final Map<String, DangerZoneWebSocket> _members = new ConcurrentHashMap<String, DangerZoneWebSocket>();
    private final Set<String> _storageIds = new CopyOnWriteArraySet<String>();
    private final Map<String, JSONObject> _storage = new ConcurrentHashMap<String, JSONObject>();
    private long _zoneId = 1;
    
    private enum Event {
        ready, store, remove, clear, clients, client, ping, pong, call
    }

    Logger logger = LoggerFactory.getLogger(DangerZoneWebSocketServlet.class);

    @Override
    public void init(ServletConfig config) throws ServletException {
        super.init(config);

        RwsObject pkg = new RwsObject("Package", new Package(config), new String[] { "listPackages" });

        RwsRegistry.register(pkg);
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

    /* ------------------------------------------------------------ */
    /* ------------------------------------------------------------ */
    class DangerZoneWebSocket implements WebSocket {

        private Outbound _outbound;
        private String _socketId;
        private String _userName;

        private static final String ACTION_INIT = "init";
        private static final String ACTION_ACTIVATE = "activate";
        private static final String ACTION_MULTI = "multi";
        private static final String ACTION_CLIENTS = "clients";
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
            _members.remove(_socketId);
            sendAll("sys", ACTION_CLIENT_DISCONNECT, newClientInfo(this), false);
        }

        private void onAction(Event event, Object data) {
            switch (event) {
                case ready:
                    doReady();
                    break;
                case store:
                    doStore(data);
                    break;
                case remove:
                    doRemove(data);
                    break;
                case clear:
                    doClear(data);
                    break;
                case clients:
                    doClients();
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
            list.add(newActionInfo(ACTION_CLIENTS, getClientList()));
            list.add(newActionInfo(ACTION_ACTIVATE, "rates"));
            for (String id : _storageIds) {
                JSONObject info = _storage.get(id);
                String action = (String) info.get("action");
                Object dat = info.get("data");
                list.add(newActionInfo(action, dat));
            }
            sendMultiple("sys", list);
        }

        private void doStore(Object data) {
            // Store and send the message to all connected sockets
            JSONObject info = (JSONObject) data;
            String id = (String) info.get("id");
            _storageIds.add(id);
            _storage.put(id, info);
            String action = (String) info.get("action");
            Object dat = info.get("data");
            sendAll(action, dat, false);
        }

        private void doRemove(Object data) {
            // "Unstore" and send the message to all connected sockets
            if (data instanceof JSONArray) {
                JSONArray a = (JSONArray) data;
                for (Object dat : a) {
                    String id = (String) dat;
                    _storageIds.remove(id);
                    _storage.remove(id);
                }
            } else {
                String id = (String) data;
                _storageIds.remove(id);
                _storage.remove(id);
            }
        }

        private void doClear(Object data) {
            _storageIds.clear();
            _storage.clear();
        }

        private void doClients() {
            send("sys", ACTION_CLIENTS, getClientList());
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
            if (params != null) {
                if (params instanceof JSONArray) {
                    args = ((JSONArray)params).toArray();
                } else {
                    args = new Object[1];
                    args[0] = params;
                }
            }
            
            try {
                Object result = RwsRegistry.call(obj, method, args);
                if (id != null) {
                    send("sys", ACTION_CALL_RESULT, newCallResult(id, result));
                }
            } catch (Throwable th) {
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

        private List<JSONObject> getClientList() {
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

    static class Package {
        private ServletConfig config;

        private static final String[] packages = new String[] {
            "chat", "clients", "keepalive", "rates", "starbutton", "sys"
        };

        public Package(ServletConfig config) {
            this.config = config;
        }

        public String[] listPackages() {
            // TODO Make this dynamic!!
            return packages;
        }
    }
}
