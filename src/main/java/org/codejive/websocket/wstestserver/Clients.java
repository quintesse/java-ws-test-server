package org.codejive.websocket.wstestserver;

import java.io.IOException;
import java.util.Collection;
import java.util.Collections;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;
import org.codejive.rws.RwsHandler;
import org.codejive.rws.RwsSession;
import org.codejive.rws.RwsWebSocketAdapter;
import org.json.simple.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author tako
 */
public class Clients {
    private final Map<String, ClientInfo> clients = new ConcurrentHashMap<String, ClientInfo>();
    private final Set<RwsHandler> connectHandlers = new CopyOnWriteArraySet<RwsHandler>();
    private final Set<RwsHandler> disconnectHandlers = new CopyOnWriteArraySet<RwsHandler>();
    private final Set<RwsHandler> changeHandlers = new CopyOnWriteArraySet<RwsHandler>();

    private final Logger log = LoggerFactory.getLogger(Clients.class);

    public class ClientInfo extends RwsSession {
        private String name;

        private ClientInfo(RwsWebSocketAdapter adapter) {
            super(adapter);
            name = "Client #" + getId();
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
            fireChange(new ClientEvent(this));
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

    public ClientInfo addClient(RwsWebSocketAdapter adapter) {
        ClientInfo client = new ClientInfo(adapter);
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

    public void sendTo(String from, String to, JSONObject data) throws IOException {
        ClientInfo client = clients.get(to);
        if (client != null) {
            send(client, from, data);
        }
    }

    public void sendAll(String from, JSONObject data, boolean meToo) {
        for (ClientInfo client : clients.values()) {
            if (meToo || !client.getId().equals(from)) {
                try {
                    send(client, from, data);
                } catch (IOException ex) {
                    // Ignore
                }
            }
        }
    }

    private void send(ClientInfo client, String from, JSONObject data) throws IOException {
        try {
            client.send(from, data);
        } catch (IOException ex) {
            log.error("Could not send message, disconnecting socket", ex);
            removeClient(client);
            if (client.isConnected()) {
                client.disconnect();
            }
            throw ex;
        }
    }

    private void fireConnect(ClientEvent event) {
    }

    public void subscribeConnect(RwsHandler handler) {
        connectHandlers.add(handler);
    }

    public void unsubscribeConnect(RwsHandler handler) {
        connectHandlers.remove(handler);
    }

    private void fireDisconnect(ClientEvent event) {

    }

    public void subscribeDisconnect(RwsHandler handler) {
        disconnectHandlers.add(handler);
    }

    public void unsubscribeDisconnect(RwsHandler handler) {
        disconnectHandlers.remove(handler);
    }

    private void fireChange(ClientEvent event) {

    }

    public void subscribeChange(RwsHandler handler) {
        changeHandlers.add(handler);
    }

    public void unsubscribeChange(RwsHandler handler) {
        changeHandlers.remove(handler);
    }
}
