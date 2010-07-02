package org.codejive.websocket.wstestserver;

import java.io.IOException;
import java.util.Collection;
import java.util.Collections;
import java.util.EventListener;
import java.util.EventObject;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;
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
    private final Set<ClientListener> listeners = new CopyOnWriteArraySet<ClientListener>();

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
            fireChange(this);
        }
    }

    public class ClientEvent extends EventObject {
        public ClientEvent(ClientInfo client) {
            super(client);
        }
    }

    public interface ClientListener extends EventListener {
        void connect(ClientEvent event);
        void disconnect(ClientEvent event);
        void change(ClientEvent event);
    }

    public ClientInfo addClient(RwsWebSocketAdapter adapter) {
        ClientInfo client = new ClientInfo(adapter);
        clients.put(client.getId(), client);
        fireConnect(client);
        return client;
    }
    
    public void removeClient(ClientInfo client) {
        clients.remove(client.getId());
        client.clearAttributes();
        fireDisconnect(client);
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

    public void addClientListener(ClientListener listener) {
        listeners.add(listener);
    }

    public void removeClientListener(ClientListener listener) {
        listeners.remove(listener);
    }

    private void fireConnect(ClientInfo client) {
        ClientEvent event = new ClientEvent(client);
        for (ClientListener l : listeners) {
            try {
                l.connect(event);
            } catch (Throwable th) {
                log.warn("Could not fire event on a listener");
            }
        }
    }

    private void fireDisconnect(ClientInfo client) {
        ClientEvent event = new ClientEvent(client);
        for (ClientListener l : listeners) {
            try {
                l.disconnect(event);
            } catch (Throwable th) {
                log.warn("Could not fire event on a listener");
            }
        }
    }

    private void fireChange(ClientInfo client) {
        ClientEvent event = new ClientEvent(client);
        for (ClientListener l : listeners) {
            try {
                l.change(event);
            } catch (Throwable th) {
                log.warn("Could not fire event on a listener");
            }
        }
    }
}
