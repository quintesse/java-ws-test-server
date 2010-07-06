/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

package org.codejive.websocket.wstestserver;

import java.io.IOException;
import java.lang.reflect.InvocationTargetException;
import org.codejive.rws.RwsContext;
import org.codejive.rws.RwsObject;
import org.codejive.rws.RwsRegistry;
import org.codejive.rws.RwsSession;
import org.codejive.rws.RwsWebSocketAdapter;
import org.eclipse.jetty.websocket.WebSocket.Outbound;
import org.json.simple.JSONArray;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author tako
 */
public class JettyWebSocketAdapter implements RwsWebSocketAdapter {
    private RwsContext context;
    private Outbound outbound;
    private RwsSession session;

    private static final Logger log = LoggerFactory.getLogger(DangerZoneWebSocketServlet.class);

    public JettyWebSocketAdapter(RwsContext context, Outbound outbound) {
        this.context = context;
        this.outbound = outbound;
    }

    @Override
    public void onConnect() {
        session = context.addSession(this);
        RwsObject obj = context.getRegistry().getObject("Session");
        context.getRegistry().register(obj, session, "session", session);
    }

    @Override
    public void onMessage(String msg) {
        log.info(this + " onMessage: " + msg);
        try {
            JSONParser parser = new JSONParser();
            JSONObject info = (JSONObject) parser.parse(msg);
            String to = (String) info.get("to");
            if (to == null || "sys".equals(to)) {
                // The message is for the server
                doCall(info);
            } else if ("all".equals(to)) {
                // Send the message to all connected sockets
                context.sendAll(session.getId(), info, false);
            } else {
                // Send the message to the indicated socket
                context.sendTo(session.getId(), to, info);
            }
        } catch (ParseException ex) {
            log.error("Couldn't parse incoming message", ex);
        } catch (IOException ex) {
            log.error("Could not send message", ex);
        }
    }

    @Override
    public void onDisconnect() {
        log.info(this + " onDisconnect");
        session.disconnect();
    }

    @Override
    public boolean isConnected() {
        return outbound.isOpen();
    }

    @Override
    public void disconnect() {
        context.removeSession(session);
        outbound.disconnect();
    }

    @Override
    public void sendMessage(String msg) throws IOException {
        outbound.sendMessage(msg);
    }

    private void doCall(JSONObject info) throws IOException {
        String id = (String) info.get("id"); // If null the caller is not interested in the result!
        String obj = (String) info.get("object");
        String method = (String) info.get("method");
        Object params = (Object) info.get("params");

        Object[] args = null;
        // Convert parameter map to array
        if (params != null && params instanceof JSONArray) {
            JSONArray p = (JSONArray) params;
            args = new Object[p.size()];
            for (int i = 0; i < p.size(); i++) {
                args[i] = p.get(i);
            }
        }

        try {
            Object result = context.getRegistry().call(session, obj, method, args);
            if (id != null) {
                session.send("sys", newCallResult(id, result));
            }
        } catch (InvocationTargetException ex) {
            log.error("Remote object returned an error", ex);
            if (id != null) {
                session.send("sys", newCallException(id, ex));
            }
        } catch (Throwable th) {
            log.error("Rws Call failed", th);
            if (id != null) {
                session.send("sys", newCallException(id, th));
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
