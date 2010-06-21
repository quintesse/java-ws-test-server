package org.codejive.websocket.wstestserver;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;

/**
 *
 * @author tako
 */
public class MessageStore {
    private final Set<String> _storageIds = new CopyOnWriteArraySet<String>();
    private final Map<String, Object> _storage = new ConcurrentHashMap<String, Object>();

    public Set<String> listNames() {
        return Collections.unmodifiableSet(_storageIds);
    }

    public Collection<Object> listMessages() {
        ArrayList result = new ArrayList(_storage.size());
        for (String id : _storageIds) {
            result.add(_storage.get(id));
        }
        return result;
    }

    public Object get(String id) {
        return _storage.get(id);
    }
    
    public void store(String id, Object data) {
        _storageIds.add(id);
        _storage.put(id, data);
    }

    public void remove(String id) {
        _storageIds.remove(id);
        _storage.remove(id);
    }

    public void clear(Object data) {
        _storageIds.clear();
        _storage.clear();
    }
}
