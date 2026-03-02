package org.apache.cordova.firebasex;

import android.util.Log;

import com.google.firebase.crashlytics.FirebaseCrashlytics;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.PluginResult;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/**
 * Cordova plugin for Firebase Crashlytics on Android.
 *
 * <p>Provides crash reporting, non-fatal error logging with JavaScript stack traces,
 * custom key-value pairs, user identification, and control over Crashlytics
 * data collection. Most methods check if Crashlytics collection is enabled
 * before performing operations.
 *
 * @see <a href="https://firebase.google.com/docs/crashlytics">Firebase Crashlytics</a>
 */
public class FirebasexCrashlyticsPlugin extends CordovaPlugin {

    /** Log tag for all messages from this plugin. */
    private static final String TAG = "FirebasexCrashlytics";

    /** SharedPreferences key for the Crashlytics collection enabled state. */
    private static final String CRASHLYTICS_COLLECTION_ENABLED = "firebase_crashlytics_collection_enabled";

    /** Firebase Crashlytics instance. */
    private FirebaseCrashlytics firebaseCrashlytics;

    /**
     * Initialises the plugin.
     *
     * Obtains the Crashlytics instance and reads the collection-enabled flag
     * from the AndroidManifest meta-data, persisting it to shared preferences
     * if set.
     */
    @Override
    protected void pluginInitialize() {
        Log.d(TAG, "pluginInitialize");
        firebaseCrashlytics = FirebaseCrashlytics.getInstance();

        if (getMetaDataFromManifest(CRASHLYTICS_COLLECTION_ENABLED)) {
            FirebasexCorePlugin.getInstance().setPreference(CRASHLYTICS_COLLECTION_ENABLED, true);
        }
    }

    /**
     * Dispatches Cordova actions to plugin methods.
     *
     * <p>Supported actions: setCrashlyticsCollectionEnabled, isCrashlyticsCollectionEnabled,
     * setCrashlyticsUserId, setCrashlyticsCustomKey, logMessage, logError, sendCrash,
     * didCrashOnPreviousExecution.
     */
    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
        switch (action) {
            case "setCrashlyticsCollectionEnabled":
                this.setCrashlyticsCollectionEnabled(callbackContext, args.getBoolean(0));
                return true;
            case "isCrashlyticsCollectionEnabled":
                this.isCrashlyticsCollectionEnabled(callbackContext);
                return true;
            case "setCrashlyticsUserId":
                this.setCrashlyticsUserId(callbackContext, args.getString(0));
                return true;
            case "setCrashlyticsCustomKey":
                this.setCrashlyticsCustomKey(callbackContext, args);
                return true;
            case "logMessage":
                this.logMessage(callbackContext, args);
                return true;
            case "logError":
                this.logError(callbackContext, args);
                return true;
            case "sendCrash":
                this.sendCrash(callbackContext);
                return true;
            case "didCrashOnPreviousExecution":
                this.didCrashOnPreviousExecution(callbackContext);
                return true;
            default:
                return false;
        }
    }

    /**
     * Checks if Crashlytics collection is currently enabled.
     *
     * @return {@code true} if collection is enabled
     */
    private boolean isCrashlyticsEnabled() {
        return FirebasexCorePlugin.getInstance().getPreference(CRASHLYTICS_COLLECTION_ENABLED);
    }

    /**
     * Reads a boolean meta-data value from the AndroidManifest.
     *
     * @param name the meta-data key
     * @return the boolean value, or {@code false} if not found or on error
     */
    private boolean getMetaDataFromManifest(String name) {
        try {
            android.content.pm.ApplicationInfo ai = cordova.getActivity().getPackageManager()
                    .getApplicationInfo(cordova.getActivity().getPackageName(), android.content.pm.PackageManager.GET_META_DATA);
            if (ai.metaData != null) {
                return ai.metaData.getBoolean(name, false);
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to read meta-data from manifest: " + e.getMessage());
        }
        return false;
    }

    /**
     * Converts a boolean to an integer for Cordova plugin results (1 = true, 0 = false).
     */
    private int conformBooleanForPluginResult(boolean value) {
        return value ? 1 : 0;
    }

    /**
     * Enables or disables Crashlytics data collection.
     * Persists the setting via the core plugin's shared preferences.
     */
    private void setCrashlyticsCollectionEnabled(final CallbackContext callbackContext, final boolean enabled) {
        cordova.getThreadPool().execute(new Runnable() {
            public void run() {
                try {
                    firebaseCrashlytics.setCrashlyticsCollectionEnabled(enabled);
                    FirebasexCorePlugin.getInstance().setPreference(CRASHLYTICS_COLLECTION_ENABLED, enabled);
                    callbackContext.success();
                } catch (Exception e) {
                    FirebasexCorePlugin.handleExceptionWithContext(e, callbackContext);
                }
            }
        });
    }

    /** Returns the Crashlytics collection enabled state to the JS callback. */
    private void isCrashlyticsCollectionEnabled(final CallbackContext callbackContext) {
        cordova.getThreadPool().execute(new Runnable() {
            public void run() {
                try {
                    callbackContext.success(conformBooleanForPluginResult(isCrashlyticsEnabled()));
                } catch (Exception e) {
                    FirebasexCorePlugin.handleExceptionWithContext(e, callbackContext);
                }
            }
        });
    }

    /**
     * Sets the user ID for crash reports. Runs on the UI thread.
     * Returns an error if Crashlytics collection is disabled.
     */
    private void setCrashlyticsUserId(final CallbackContext callbackContext, final String userId) {
        cordova.getActivity().runOnUiThread(new Runnable() {
            public void run() {
                try {
                    if (isCrashlyticsEnabled()) {
                        firebaseCrashlytics.setUserId(userId);
                        callbackContext.success();
                    } else {
                        callbackContext.error("Cannot set Crashlytics user ID - Crashlytics collection is disabled");
                    }
                } catch (Exception e) {
                    FirebasexCorePlugin.handleExceptionWithContext(e, callbackContext);
                }
            }
        });
    }

    /**
     * Sets a custom key-value pair on crash reports.
     *
     * <p>Supports Integer, Double, Long, String, and Boolean value types.
     * Returns an error if Crashlytics collection is disabled or the value
     * type is not supported.
     */
    private void setCrashlyticsCustomKey(final CallbackContext callbackContext, final JSONArray data) {
        cordova.getThreadPool().execute(new Runnable() {
            public void run() {
                if (isCrashlyticsEnabled()) {
                    try {
                        Object value = data.get(1);
                        if (value instanceof Integer) {
                            firebaseCrashlytics.setCustomKey(data.getString(0), data.getInt(1));
                            callbackContext.success();
                        } else if (value instanceof Double) {
                            firebaseCrashlytics.setCustomKey(data.getString(0), data.getDouble(1));
                            callbackContext.success();
                        } else if (value instanceof Long) {
                            firebaseCrashlytics.setCustomKey(data.getString(0), data.getLong(1));
                            callbackContext.success();
                        } else if (value instanceof String) {
                            firebaseCrashlytics.setCustomKey(data.getString(0), data.getString(1));
                            callbackContext.success();
                        } else if (value instanceof Boolean) {
                            firebaseCrashlytics.setCustomKey(data.getString(0), data.getBoolean(1));
                            callbackContext.success();
                        } else {
                            callbackContext.error("Cannot set custom key - Value is not an acceptable type");
                        }
                    } catch (Exception e) {
                        FirebasexCorePlugin.handleExceptionWithContext(e, callbackContext);
                    }
                } else {
                    callbackContext.error("Cannot set custom key - Crashlytics collection is disabled");
                }
            }
        });
    }

    /**
     * Logs a message to Crashlytics. Messages appear in the crash report logs tab.
     * Returns an error if Crashlytics collection is disabled.
     */
    private void logMessage(final CallbackContext callbackContext, final JSONArray data) {
        if (isCrashlyticsEnabled()) {
            String message = data.optString(0);
            try {
                firebaseCrashlytics.log(message);
            } catch (Exception e) {
                Log.e(TAG, e.getMessage());
            }
            callbackContext.success();
        } else {
            callbackContext.error("Cannot log message - Crashlytics collection is disabled");
        }
    }

    /**
     * Records a non-fatal error to Crashlytics.
     *
     * <p>If a stack trace array is provided (args[1]), each frame is converted to a
     * {@link StackTraceElement} and attached to a {@link JavaScriptException}.
     * Otherwise, a simple {@link JavaScriptException} with just the message is recorded.
     *
     * Returns an error if Crashlytics collection is disabled.
     */
    private void logError(final CallbackContext callbackContext, final JSONArray args) throws JSONException {
        final String message = args.getString(0);

        cordova.getThreadPool().execute(new Runnable() {
            public void run() {
                try {
                    if (isCrashlyticsEnabled()) {
                        if (args.length() == 2) {
                            JSONArray stackTrace = args.getJSONArray(1);
                            StackTraceElement[] trace = new StackTraceElement[stackTrace.length()];
                            for (int i = 0; i < stackTrace.length(); i++) {
                                JSONObject elem = stackTrace.getJSONObject(i);
                                trace[i] = new StackTraceElement(
                                        "",
                                        elem.optString("functionName", "(anonymous function)"),
                                        elem.optString("fileName", "(unknown file)"),
                                        elem.optInt("lineNumber", -1)
                                );
                            }
                            Exception e = new JavaScriptException(message);
                            e.setStackTrace(trace);
                            firebaseCrashlytics.recordException(e);
                        } else {
                            firebaseCrashlytics.recordException(new JavaScriptException(message));
                        }
                        Log.e(TAG, message);
                        callbackContext.success(1);
                    } else {
                        callbackContext.error("Cannot log error - Crashlytics collection is disabled");
                    }
                } catch (Exception e) {
                    FirebasexCorePlugin.handleExceptionWithContext(e, callbackContext);
                }
            }
        });
    }

    /**
     * Forces a crash on the UI thread for testing Crashlytics integration.
     * The app will terminate with a {@link RuntimeException}.
     */
    private void sendCrash(final CallbackContext callbackContext) {
        cordova.getActivity().runOnUiThread(new Runnable() {
            @Override
            public void run() {
                throw new RuntimeException("This is a crash");
            }
        });
    }

    /**
     * Returns whether the app crashed during the previous execution.
     * Returns an error if Crashlytics collection is disabled.
     */
    private void didCrashOnPreviousExecution(final CallbackContext callbackContext) {
        cordova.getThreadPool().execute(new Runnable() {
            public void run() {
                if (isCrashlyticsEnabled()) {
                    try {
                        callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.OK, firebaseCrashlytics.didCrashOnPreviousExecution()));
                    } catch (Exception e) {
                        FirebasexCorePlugin.handleExceptionWithContext(e, callbackContext);
                    }
                } else {
                    callbackContext.error("Cannot query didCrashOnPreviousExecution - Crashlytics collection is disabled");
                }
            }
        });
    }
}
