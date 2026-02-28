package org.apache.cordova.firebasex;

import android.util.Log;

import com.google.firebase.crashlytics.FirebaseCrashlytics;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.PluginResult;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

public class FirebasexCrashlyticsPlugin extends CordovaPlugin {

    private static final String TAG = "FirebasexCrashlytics";
    private static final String CRASHLYTICS_COLLECTION_ENABLED = "firebase_crashlytics_collection_enabled";

    private FirebaseCrashlytics firebaseCrashlytics;

    @Override
    protected void pluginInitialize() {
        Log.d(TAG, "pluginInitialize");
        firebaseCrashlytics = FirebaseCrashlytics.getInstance();

        if (getMetaDataFromManifest(CRASHLYTICS_COLLECTION_ENABLED)) {
            FirebasexCorePlugin.getInstance().setPreference(CRASHLYTICS_COLLECTION_ENABLED, true);
        }
    }

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

    private boolean isCrashlyticsEnabled() {
        return FirebasexCorePlugin.getInstance().getPreference(CRASHLYTICS_COLLECTION_ENABLED);
    }

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

    private int conformBooleanForPluginResult(boolean value) {
        return value ? 1 : 0;
    }

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

    private void sendCrash(final CallbackContext callbackContext) {
        cordova.getActivity().runOnUiThread(new Runnable() {
            @Override
            public void run() {
                throw new RuntimeException("This is a crash");
            }
        });
    }

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
