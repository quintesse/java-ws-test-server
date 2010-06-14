/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package org.codejive.websocket.wstestserver;

import java.io.IOException;
import java.util.LinkedList;
import java.util.Set;
import java.util.concurrent.CopyOnWriteArraySet;

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
    private long _zoneId = 1;
    
    private enum Event {
        ready
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
                Object data = (String) info.get("data");
                if (to == null || "sys".equals(to)) {
                    Event event = Event.valueOf(action.toLowerCase());
                    onAction(event, data);
                } else if ("all".equals(to)) {
                    Action act = Action.valueOf(action.toLowerCase());
                    sendAll(act, data);
                } else {
                    Action act = Action.valueOf(action.toLowerCase());
                    sendTo(to, act, data);
                }
            } catch (ParseException ex) {
                logger.error("Couldn't parse incoming message", ex);
            }
        }

        @Override
        public void onDisconnect() {
            logger.info(this+" onDisconnect");
            _members.remove(this);
        }

        private void onAction(Event event, Object data) {
            switch (event) {
                case ready:
                    sendMultiple(
                        Action.init, Long.toString(_zoneId++),
                        Action.run, "$('#main').removeClass('spinner')",
                        Action.body, "<h1>YO</h1>",
                        Action.activate, "starbutton"
                    );
                    break;
            }
        }

        private void sendMultiple(Object... info) {
            LinkedList<JSONObject> list = new LinkedList();
            for (int i = 0; i < info.length; i += 2) {
                JSONObject map = new JSONObject();
                Action action = (Action) info[i];
                String data = (String) info[i + 1];
                map.put("action", action.toString());
                map.put("data", data);
                list.add(map);
            }
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
                logger.warn("Could not send message", e);
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
