package org.codejive.websocket.wstestserver;

import java.util.Collection;
import java.util.Collections;
import java.util.EventListener;
import java.util.EventObject;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;

/**
 *
 * @author tako
 */
public class MessageBus {
    private final Map<String, Bus> busses = new ConcurrentHashMap<String, Bus>();

    public class BusEvent extends EventObject {
        public BusEvent(Object jsonData) {
            super(jsonData);
        }
    }

    public interface BusListener extends EventListener {
        void create(BusEvent event);
        void delete(BusEvent event);
        void change(BusEvent event);
    }

    public class MessageEvent extends EventObject {
        public MessageEvent(Object jsonData) {
            super(jsonData);
        }
    }

    public interface MessageListener extends EventListener {
        void message(MessageEvent event);
    }

    public class Bus {
        private final String name;
        private final Set<MessageListener> listeners = new CopyOnWriteArraySet<MessageListener>();
        private final boolean visible;
        private final String owner;

        public Bus(String name, boolean visible, String owner) {
            this.name = name;
            this.visible = visible;
            this.owner = owner;
        }

        public String getName() {
            return name;
        }

        public String getOwner() {
            return owner;
        }

        public boolean isVisible() {
            return visible;
        }

        public void addMessageListener(MessageListener listener) {
            listeners.add(listener);
        }

        public void removeMessageListener(MessageListener listener) {
            listeners.remove(listener);
        }
    }

    public Collection<Bus> listBusses() {
        return Collections.unmodifiableCollection(busses.values());
    }

    public Bus getBus(String name) {
        Bus result = busses.get(name);
        if (result == null) {
            result = new Bus(name, true, null);
            busses.put(name, result);
        }
        return result;
    }
}
