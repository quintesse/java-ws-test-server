
package org.codejive.rws;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;
import org.json.simple.JSONArray;
import org.json.simple.JSONAware;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author tako
 */
public class RwsObject {
    private final String name;
    private final Class targetClass;
    private final Scope scope;
    private final Set<String> allowedMethods = new HashSet<String>();

    private Object targetObject;
    
    public enum Scope { call, connection, global };

    private static final Logger log = LoggerFactory.getLogger(RwsRegistry.class);

    public String getName() {
        return name;
    }

    public Class getTargetClass() {
        return targetClass;
    }

    public Set<String> getMethodNames() {
        return Collections.unmodifiableSet(allowedMethods);
    }

    public RwsObject(String name, Class targetClass, Scope scope, Collection<String> allowedMethods) {
        this.name = name;
        this.targetClass = targetClass;
        this.scope = scope;
        this.allowedMethods.addAll(allowedMethods);
    }

    public RwsObject(String name, Class targetClass, Scope scope, String[] allowedMethods) {
        this(name, targetClass, scope, Arrays.asList(allowedMethods));
    }

    public Method getTargetMethod(String methodName) throws RwsException {
        Method[] allMethods = targetClass.getMethods();
        ArrayList<Method> methods = new ArrayList<Method>();
        for (Method m : allMethods) {
            if (m.getName().equals(methodName)) {
                methods.add(m);
            }
        }
        if (methods.size() > 1) {
            throw new RwsException("Overloaded method '" + methodName + "' for object '" + name + "', which is not supported");
        } else if (methods.isEmpty()) {
            throw new RwsException("Couldn't find matching method '" + methodName + "' for object '" + name + "'");
        }
        return methods.get(0);
    }

    public Object getTargetObject(RwsContext context) throws RwsException {
        Object result = null;
        switch (scope) {
            case connection:
                result = context.getAttribute("__rws__" + name);
                break;
            case global:
                result = targetObject;
                break;
        }
        if (result == null) {
            log.info("Creating target object for '{}'", name);
            try {
                result = targetClass.newInstance();
                setTargetObject(context, result);
            } catch (InstantiationException ex) {
                throw new RwsException("Could not create target object for '" + name + "'", ex);
            } catch (IllegalAccessException ex) {
                throw new RwsException("Could not create target object for '" + name + "'", ex);
            }
        }
        return result;
    }

    public void setTargetObject(RwsContext context, Object targetObject) {
        switch (scope) {
            case connection:
                context.setAttribute("__rws__" + name, targetObject);
                break;
            case global:
                this.targetObject = targetObject;
                break;
        }
    }

    public Object call(RwsContext context, String methodName, Object[] args) throws RwsException {
        Object result = null;
        try {
            Object obj = getTargetObject(context);
            Method method = getTargetMethod(methodName);
            Object[] convertedArgs = null;
            if (args != null) {
                convertedArgs = new Object[args.length];
                for (int i = 0; i < args.length; i++) {
                    Class argClass = args[i].getClass();
                    Class paramClass = method.getParameterTypes()[i];
                    if (argClass != paramClass) {
                        // Types are not the same, let's see if conversion is possible
                        // TODO Implement conversion stuff
                        convertedArgs[i] = convertFromJSON(args[i], paramClass);
                    } else {
                        convertedArgs[i] = args[i];
                    }
                }
            }
            Object tmpResult = method.invoke(obj, convertedArgs);
            result = convertToJSON(tmpResult);
        } catch (IllegalAccessException ex) {
            throw new RwsException("Could not call method '" + methodName + "' on object '" + name + "'", ex);
        } catch (IllegalArgumentException ex) {
            throw new RwsException("Could not call method '" + methodName + "' on object '" + name + "'", ex);
        } catch (InvocationTargetException ex) {
            throw new RwsException("Remote method call'" + methodName + "' on object '" + name + "' failed", ex);
        }
        return result;
    }

    private Object convertToJSON(Object value) {
        Object result = null;
        if (value != null) {
            if (value instanceof JSONAware) {
                result = value;
            } else if (value instanceof Iterable) {
                JSONArray arr = new JSONArray();
                Iterable iter = (Iterable) value;
                for (Object val : iter) {
                    arr.add(convertToJSON(val));
                }
                result = arr;
            } else if (value.getClass().isArray()) {
                JSONArray arr = new JSONArray();
                Object[] values = (Object[]) value;
                for (Object val : values) {
                    arr.add(convertToJSON(val));
                }
                result = arr;
            } else {
                result = value.toString();
            }
        }
        return result;
    }

    private Object convertFromJSON(Object value, Class targetType) {
        Object result = null;
        if (value != null) {
            if (targetType.isAssignableFrom(value.getClass())) {
                result = value;
            } else {
                result = value.toString();
            }
        }
        return result;
    }
}
