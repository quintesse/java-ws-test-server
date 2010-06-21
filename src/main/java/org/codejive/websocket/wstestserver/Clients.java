package org.codejive.websocket.wstestserver;

import java.io.IOException;
import java.util.Collection;
import java.util.Collections;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.codejive.rws.RwsContext;
import org.eclipse.jetty.websocket.WebSocket.Outbound;
import org.json.simple.JSONObject;
import org.json.simple.JSONValue;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author tako
 */
public class Clients {
    private final Map<String, ClientInfo> clients = new ConcurrentHashMap<String, ClientInfo>();

    private static long nextClientId = 1;

    private final Logger log = LoggerFactory.getLogger(Clients.class);

    public class ClientInfo extends RwsContext {
        private Outbound outbound;
        private String id;
        private String name;

        private ClientInfo(Outbound outbound) {
            this.outbound = outbound;
            id = Long.toString(nextClientId++);
            name = "Client #" + id;
        }

        public String getId() {
            return id;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
            fireChange(new ClientEvent(this));
        }

        public void send(String from, Object data) {
            if (outbound.isOpen()) {
                try {
                    JSONObject info = new JSONObject();
                    info.put("data", data);
                    info.put("from", from);
                    String jsonText = JSONValue.toJSONString(info);
                    outbound.sendMessage(jsonText);
                } catch (IOException e) {
                    log.error("Could not send message, disconnecting socket", e);
                    removeClient(this);
                    if (outbound.isOpen()) outbound.disconnect();
                }
            } else {
                log.error("Unable to send message: socket closed");
            }
        }
    }

    public class ClientEvent {
        private ClientInfo client;

        private ClientEvent(ClientInfo client) {
            this.client = client;
        }
        
        public ClientInfo getClient() {
            return client;
        }
    }

    public ClientInfo addClient(Outbound outbound) {
        ClientInfo client = new ClientInfo(outbound);
        clients.put(client.getId(), client);
        fireConnect(new ClientEvent(client));
        return client;
    }
    
    public void removeClient(ClientInfo client) {
        clients.remove(client.getId());
        client.clearAttributes();
        fireDisconnect(new ClientEvent(client));
    }

    public Collection<ClientInfo> listClients() {
        return Collections.unmodifiableCollection(clients.values());
    }

    public void sendTo(String from, String to, Object data) {
        ClientInfo client = clients.get(to);
        if (client != null) {
            client.send(from, data);
        }
    }

    public void sendAll(String from, Object data, boolean meToo) {
        for (ClientInfo client : clients.values()) {
            if (meToo || !client.getId().equals(from)) {
                client.send(from, data);
            }
        }
    }

    private void fireConnect(ClientEvent event) {
    }

    public void subscribeConnect() {
    }

    public void unsubscribeConnect() {
    }

    private void fireDisconnect(ClientEvent event) {

    }

    public void subscribeDisconnect() {
    }

    public void unsubscribeDisconnect() {
    }

    private void fireChange(ClientEvent event) {

    }

    public void subscribeChange() {
    }

    public void unsubscribeChange() {
    }
}
