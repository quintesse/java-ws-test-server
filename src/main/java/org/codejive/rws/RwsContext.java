package org.codejive.rws;

import java.util.Collections;
import java.util.HashMap;
import java.util.Set;
import org.eclipse.jetty.websocket.WebSocket;

/**
 *
 * @author tako
 */
public class RwsContext {

    private HashMap<String, Object> attributes;

    public RwsContext() {
        attributes = new HashMap<String, Object>();
    }

    public Object getAttribute(String name) {
        return attributes.get(name);
    }

    public void setAttribute(String name, Object value) {
        attributes.put(name, value);
    }

    public Set<String> getAttributeNames() {
        return Collections.unmodifiableSet(attributes.keySet());
    }

    public void clearAttributes() {
        attributes.clear();
    }
}
