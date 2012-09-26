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
public class DataStore {
    private final Map<String, CategoryData> categories = new ConcurrentHashMap<String, CategoryData>();

    private static final Set<String> emptyNames = Collections.unmodifiableSet(new CopyOnWriteArraySet<String>());
    private static final Collection<Object> emptyData = Collections.unmodifiableList(new ArrayList<Object>());

    private class CategoryData {
        private final Set<String> storageIds = new CopyOnWriteArraySet<String>();
        private final Map<String, Object> storage = new ConcurrentHashMap<String, Object>();
    }

    public Set<String> listCategories() {
        return Collections.unmodifiableSet(categories.keySet());
    }

    public Set<String> listNames(String category) {
        Set<String> result;
        CategoryData data = categories.get(category);
        if (data != null) {
            result = Collections.unmodifiableSet(data.storageIds);
        } else {
            result = emptyNames;
        }
        return result;
    }

    public Collection<Object> listData(String category) {
        Collection result;
        CategoryData data = categories.get(category);
        if (data != null) {
            result = new ArrayList(data.storage.size());
            for (String id : data.storageIds) {
                result.add(data.storage.get(id));
            }
        } else {
            result = emptyData;
        }
        return result;
    }

    public Object get(String category, String id) {
        Object result;
        CategoryData data = categories.get(category);
        if (data != null) {
            result = data.storage.get(id);
        } else {
            result = null;
        }
        return result;
    }
    
    public synchronized void store(String category, String id, Object info) {
        CategoryData data = categories.get(category);
        if (data == null) {
            data = new CategoryData();
            categories.put(category, data);
        }
        data.storageIds.add(id);
        data.storage.put(id, info);
    }

    public synchronized void remove(String category, String id) {
        CategoryData data = categories.get(category);
        if (data != null) {
            data.storageIds.remove(id);
            data.storage.remove(id);
        }
    }

    public synchronized void clear(String category) {
        CategoryData data = categories.get(category);
        if (data != null) {
            data.storageIds.clear();
            data.storage.clear();
        }
    }

    public synchronized void clearAll() {
        categories.clear();
    }
}
