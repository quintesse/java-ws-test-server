package org.codejive.websocket.wstestserver;

import java.io.IOException;
import java.util.Collection;
import java.util.Collections;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
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
            client.send(from, data);
        }
    }

    public void sendAll(String from, JSONObject data, boolean meToo) throws IOException {
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
