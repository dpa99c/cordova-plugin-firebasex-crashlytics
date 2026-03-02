package org.apache.cordova.firebasex;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/**
 * Custom exception class for representing JavaScript errors in Crashlytics.
 *
 * <p>Used by {@link FirebasexCrashlyticsPlugin#logError} to record JavaScript
 * exceptions with their original stack traces in Firebase Crashlytics.
 * Each stack frame from the JavaScript error is mapped to a Java
 * {@link StackTraceElement}.
 */
public class JavaScriptException extends Exception {

    /**
     * Creates a JavaScript exception with the given message.
     *
     * @param message the error message
     */
    public JavaScriptException(String message) {
        super(message);
    }

    /**
     * Creates a JavaScript exception with the given message and a parsed stack trace.
     *
     * @param message    the error message
     * @param stackTrace JSON array of stack frame objects, each containing
     *                   {@code functionName}, {@code fileName}, and {@code lineNumber}
     * @throws JSONException if parsing fails
     */
    public JavaScriptException(String message, JSONArray stackTrace) throws JSONException {
        super(message);
        this.handleStacktrace(stackTrace);
    }

    /**
     * Converts a JSON array of stack frames into Java {@link StackTraceElement} objects
     * and sets them on this exception.
     *
     * @param stackTrace JSON array of stack frame objects
     * @throws JSONException if parsing fails
     */
    private void handleStacktrace(JSONArray stackTrace) throws JSONException {
        if (stackTrace == null) {
            return;
        }
        StackTraceElement[] trace = new StackTraceElement[stackTrace.length()];
        for (int i = 0; i < stackTrace.length(); i++) {
            JSONObject elem = stackTrace.getJSONObject(i);
            trace[i] = new StackTraceElement(
                    "undefined",
                    elem.optString("functionName", "undefined"),
                    elem.optString("fileName", "undefined"),
                    elem.optInt("lineNumber", -1)
            );
        }
        this.setStackTrace(trace);
    }
}
