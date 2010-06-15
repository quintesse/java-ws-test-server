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

import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.eclipse.jetty.websocket.WebSocket;
import org.eclipse.jetty.websocket.WebSocketServlet;
import org.json.simple.JSONObject;
import org.json.simple.JSONValue;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class DangerZoneWebSocketServlet extends WebSocketServlet {

    private final Set<DangerZoneWebSocket> _members = new CopyOnWriteArraySet<DangerZoneWebSocket>();
    private final Set<String> _storageIds = new CopyOnWriteArraySet<String>();
    private final Map<String, JSONObject> _storage = new ConcurrentHashMap<String, JSONObject>();
    private long _zoneId = 1;
    
    private enum Event {
        ready, store, remove, clear
    }

    private enum Action {
        run, script, scriptsrc, css, csslink, head, body, multi, activate, init
    }

    Logger logger = LoggerFactory.getLogger(DangerZoneWebSocketServlet.class);

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws javax.servlet.ServletException, IOException {
        getServletContext().getNamedDispatcher("default").forward(request, response);
    }

    @Override
    public void service(ServletRequest req, ServletResponse res) throws ServletException, IOException {
        super.service(req, res);
    }

    @Override
    protected WebSocket doWebSocketConnect(HttpServletRequest request, String protocol) {
        return new DangerZoneWebSocket();
    }

    /* ------------------------------------------------------------ */
    /* ------------------------------------------------------------ */
    class DangerZoneWebSocket implements WebSocket {

        private Outbound _outbound;

        @Override
        public void onConnect(Outbound outbound) {
            logger.info(this + " onConnect");
            _outbound = outbound;
            _members.add(this);
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
                    // Send the message to all conencted sockets
                    Action act = Action.valueOf(action.toLowerCase());
                    sendAll(act, data);
                } else {
                    // Send the message to the indicated socket
                    Action act = Action.valueOf(action.toLowerCase());
                    sendTo(to, act, data);
                }
            } catch (ParseException ex) {
                logger.error("Couldn't parse incoming message", ex);
            }
        }

        @Override
        public void onDisconnect() {
            logger.info(this + " onDisconnect");
            _members.remove(this);
        }

        private void onAction(Event event, Object data) {
            switch (event) {
                case ready: {
                    LinkedList<JSONObject> list = new LinkedList();
                    addMultiple(list, Action.init, Long.toString(_zoneId++));
                    addMultiple(list, Action.run, "$('#main').removeClass('spinner')");
                    addMultiple(list, Action.body, "<h1>YO</h1>");
                    addMultiple(list, Action.activate, "starbutton");
                    for (String id : _storageIds) {
                        JSONObject info = _storage.get(id);
                        String action = (String) info.get("action");
                        Action act = Action.valueOf(action.toLowerCase());
                        Object dat = info.get("data");
                        addMultiple(list, act, dat);
                    }
                    sendMultiple(list);
                    }
                    break;
                case store: {
                    // Store and send the message to all conencted sockets
                    JSONObject info = (JSONObject) data;
                    String id = (String) info.get("id");
                    _storageIds.add(id);
                    _storage.put(id, info);
                    String action = (String) info.get("action");
                    Action act = Action.valueOf(action.toLowerCase());
                    Object dat = info.get("data");
                    sendAll(act, dat);
                    }
                    break;
                case remove: {
                    // "Unstore" and send the message to all conencted sockets
                    String id = (String) data;
                    _storageIds.remove(id);
                    _storage.remove(id);
                    }
                    break;
                case clear:
                    _storageIds.clear();
                    _storage.clear();
                    break;
            }
        }

        private void addMultiple(List<JSONObject> list, Action action, Object data) {
            JSONObject obj = new JSONObject();
            obj.put("action", action.toString());
            obj.put("data", data);
            list.add(obj);
        }

        private void sendMultiple(Object... info) {
            LinkedList<JSONObject> list = new LinkedList();
            for (int i = 0; i < info.length; i += 2) {
                addMultiple(list, (Action) info[i], info[i + 1]);
            }
            sendMultiple(list);
        }

        private void sendMultiple(List<JSONObject> list) {
            send(Action.multi, list);
        }

        private void send(Action action, Object data) {
            try {
                JSONObject info = new JSONObject();
                info.put("action", action.toString());
                info.put("data", data);
                String jsonText = JSONValue.toJSONString(info);
                _outbound.sendMessage(info.toString());
            } catch (IOException e) {
                logger.error("Could not send message, disconnecting socket", e);
                _outbound.disconnect();
                _members.remove(this);
            }
        }

        private void sendAll(Action action, Object data) {
            for (DangerZoneWebSocket member : _members) {
                if (member != this) {
                    member.send(action, data);
                }
            }
        }

        private void sendTo(String to, Action action, Object data) {
            // Not implemented yet
            throw new UnsupportedOperationException("Not implemented yet");
        }
    }
}
