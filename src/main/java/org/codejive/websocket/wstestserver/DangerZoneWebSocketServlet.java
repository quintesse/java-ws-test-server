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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class DangerZoneWebSocketServlet extends WebSocketServlet {

    private final Set<DangerZoneWebSocket> _members = new CopyOnWriteArraySet<DangerZoneWebSocket>();

    private enum Event {
        ready
    }

    private enum Action {
        run, script, scriptsrc, css, csslink, head, body, multi, activate
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
            Event event = null;
            String data = null;
            int p = msg.indexOf('#');
            if (p > 0) {
                event = Event.valueOf(msg.substring(0, p).toLowerCase());
                data = msg.substring(p + 1);
            } else if (p == 0) {
                data = msg.substring(1);
            } else {
                event = Event.valueOf(msg.toLowerCase());
            }
            onAction(event, data);
        }

        @Override
        public void onDisconnect() {
            logger.info(this+" onDisconnect");
            _members.remove(this);
        }

        private void onAction(Event event, String data) {
            switch (event) {
                case ready:
                    sendMultiple(
                        Action.run, "$('#main').removeClass('spinner')",
                        Action.body, "<h1>YO1!</h1>",
                        Action.body, "<h1>YO2!</h1>",
                        Action.body, "<h1>YO3!</h1>",
                        Action.body, "<h1>YO4!</h1>",
                        Action.body, "<h1>YO5!</h1>",
                        Action.body, "<h1>YO6!</h1>",
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
            String jsonText = JSONValue.toJSONString(list);
            send(Action.multi, jsonText);
        }

        private void send(Action action, String data) {
            try {
                if (data != null) {
                    if (action == null) {
                        _outbound.sendMessage("#" + data);
                    } else {
                        _outbound.sendMessage(action + "#" + data);
                    }
                } else {
                    _outbound.sendMessage(action.toString());
                }
            } catch (IOException e) {
                logger.warn("Could not send message", e);
            }
        }

        private void sendAll(Action action, String data) {
            for (DangerZoneWebSocket member : _members) {
                member.send(action, data);
            }
        }
    }
}
