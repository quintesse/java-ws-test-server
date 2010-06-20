
package org.codejive.rws;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import org.json.simple.JSONArray;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author tako
 */
public class RwsObject {
    private final String name;
    private Object targetObject;
    private final String targetClassName;
    private final boolean singleton;
    private final Set<String> allowedMethods = new HashSet<String>();

    private static final Logger log = LoggerFactory.getLogger(RwsRegistry.class);

    public String getName() {
        return name;
    }

    public Set<String> getMethodNames() {
        return Collections.unmodifiableSet(allowedMethods);
    }

    public RwsObject(String name, Object targetObject, Collection<String> allowedMethods) {
        this.name = name;
        this.targetObject = targetObject;
        this.targetClassName = null;
        this.singleton = true;
        this.allowedMethods.addAll(allowedMethods);
    }

    public RwsObject(String name, Object targetObject, String[] allowedMethods) {
        this(name, targetObject, Arrays.asList(allowedMethods));
    }

    public RwsObject(String name, String targetClassName, boolean singleton, Collection<String> allowedMethods) {
        this.name = name;
        this.targetObject = null;
        this.targetClassName = targetClassName;
        this.singleton = singleton;
        this.allowedMethods.addAll(allowedMethods);
    }

    public RwsObject(String name, String targetClassName, boolean singleton, String[] allowedMethods) {
        this(name, targetClassName, singleton, Arrays.asList(allowedMethods));
    }

    public Object getTargetObject() throws RwsException {
        Object result;
        if (targetObject == null) {
            log.info("Creating target object for '%s'", name);
            try {
                Class targetClass = Class.forName(targetClassName);
                result = targetClass.newInstance();
                if (singleton) {
                    targetObject = result;
                }
            } catch (InstantiationException ex) {
                throw new RwsException("Could not create target object for '" + name + "'", ex);
            } catch (IllegalAccessException ex) {
                throw new RwsException("Could not create target object for '" + name + "'", ex);
            } catch (ClassNotFoundException ex) {
                throw new RwsException("Could not create target object for '" + name + "'", ex);
            }
        } else {
            result = targetObject;
        }
        return result;
    }

    public Object call(String methodName, Object[] args) throws RwsException {
        Object result = null;
        try {
            Object obj = getTargetObject();

            Method method = null;
            Object[] convertedArgs = null;
            List<Method> methods = getMethods(obj.getClass(), methodName, (args != null) ? args.length : 0);
            if (methods.size() > 1) {
                // There are several candidates, let's find the best one
                log.trace("Found %d possible candidates for method '%s'", methods.size(), methodName);
                convertedArgs = new Object[args.length];
                int bestConversions = Integer.MAX_VALUE;
                for (Method m : methods) {
                    int conversions = 0;
                    for (int i = 0; i < args.length; i++) {
                        Class argClass = args[i].getClass();
                        Class paramClass = m.getParameterTypes()[i];
                        if (argClass != paramClass) {
                            // Types are not the same, let's see if conversion is possible
                            conversions = Integer.MAX_VALUE; // No
                            // TODO Implement conversion stuff
                        }
                    }
                    if (conversions < bestConversions) {
                        bestConversions = conversions;
                        method = m;
                    }
                }
            } else if (methods.size() == 1) {
                method = methods.get(0);
                convertedArgs = args;
            }
            if (method != null) {
                Object tmpResult = method.invoke(obj, convertedArgs);
                result = convert(tmpResult);
            } else {
                throw new RwsException("Couldn't find matching method '" + methodName + "'");
            }
        } catch (IllegalAccessException ex) {
            throw new RwsException("Could not call method '" + methodName + "' on object '" + name + "'", ex);
        } catch (IllegalArgumentException ex) {
            throw new RwsException("Could not call method '" + methodName + "' on object '" + name + "'", ex);
        } catch (InvocationTargetException ex) {
            throw new RwsException("Remote method call'" + methodName + "' on object '" + name + "' failed", ex);
        }
        return result;
    }

    private Object convert(Object value) {
        Object result = null;
        if (value != null) {
            if (value instanceof Iterable) {
                JSONArray arr = new JSONArray();
                Iterable iter = (Iterable) value;
                for (Object val : iter) {
                    arr.add(convert(val));
                }
                result = arr;
            } else if (value.getClass().isArray()) {
                JSONArray arr = new JSONArray();
                Object[] values = (Object[]) value;
                for (Object val : values) {
                    arr.add(convert(val));
                }
                result = arr;
            } else {
                result = value.toString();
            }
        }
        return result;
    }

    private List<Method> getMethods(Class cls, String method, int argCount) {
        Method[] allMethods = cls.getMethods();
        ArrayList<Method> methods = new ArrayList<Method>();
        for (Method m : allMethods) {
            if (m.getName().equals(method) && m.getParameterTypes().length == argCount) {
                methods.add(m);
            }
        }
        return methods;
    }
}
