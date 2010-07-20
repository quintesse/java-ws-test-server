
package org.codejive.websocket.wstestserver;

import java.io.IOException;
import org.codejive.rws.RwsContext;
import org.codejive.rws.RwsObject;
import org.codejive.rws.RwsSession;
import org.codejive.rws.RwsWebSocketAdapter;
import org.eclipse.jetty.websocket.WebSocket.Outbound;
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
        RwsSession.setInstance(session);
        RwsObject obj = context.getRegistry().getObject("Session");
        context.getRegistry().register(obj, session, "session", session);
    }

    @Override
    public void onMessage(String msg) {
        log.info(this + " onMessage: " + msg);
        RwsSession.setInstance(session);
        try {
            JSONParser parser = new JSONParser();
            JSONObject info = (JSONObject) parser.parse(msg);
            session.handleMessage(info);
        } catch (ParseException ex) {
            log.error("Couldn't parse incoming message", ex);
        } catch (IOException ex) {
            log.error("Could not send message", ex);
        }
    }

    @Override
    public void onDisconnect() {
        log.info(this + " onDisconnect");
        RwsSession.setInstance(session);
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
}
