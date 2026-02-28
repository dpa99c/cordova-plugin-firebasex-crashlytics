# cordova-plugin-firebasex-crashlytics

Crashlytics module for `cordova-plugin-firebasex`.

## Installation

```bash
cordova plugin add cordova-plugin-firebasex-crashlytics
```

This plugin depends on `cordova-plugin-firebasex-core` which will be installed automatically.

## Preferences

| Preference | Default | Description |
|---|---|---|
| `FIREBASE_CRASHLYTICS_COLLECTION_ENABLED` | `true` | Enable/disable Crashlytics data collection at build time |

## API

### setCrashlyticsCollectionEnabled(enabled, success, error)
Enable or disable Crashlytics data collection at runtime.

```javascript
FirebasexCrashlyticsPlugin.setCrashlyticsCollectionEnabled(true, function() {
    console.log("Crashlytics collection enabled");
}, function(error) {
    console.error(error);
});
```

### isCrashlyticsCollectionEnabled(success, error)
Check if Crashlytics data collection is currently enabled.

```javascript
FirebasexCrashlyticsPlugin.isCrashlyticsCollectionEnabled(function(enabled) {
    console.log("Crashlytics enabled: " + enabled);
}, function(error) {
    console.error(error);
});
```

### logMessage(message, success, error)
Log a message to Crashlytics. Messages are associated with the next crash report.

```javascript
FirebasexCrashlyticsPlugin.logMessage("User clicked checkout button");
```

### logError(message, stackTrace, success, error)
Log a non-fatal error to Crashlytics. Optionally provide a stack trace.

```javascript
// Without stack trace
FirebasexCrashlyticsPlugin.logError("Something went wrong");

// With stack trace
FirebasexCrashlyticsPlugin.logError("Something went wrong", [
    { functionName: "myFunction", fileName: "app.js", lineNumber: 42 },
    { functionName: "onClick", fileName: "ui.js", lineNumber: 15 }
]);
```

### setCrashlyticsUserId(userId, success, error)
Set a user identifier for Crashlytics reports.

```javascript
FirebasexCrashlyticsPlugin.setCrashlyticsUserId("user123");
```

### setCrashlyticsCustomKey(key, value, success, error)
Set a custom key/value pair for Crashlytics reports. Value can be a string, number, or boolean.

```javascript
FirebasexCrashlyticsPlugin.setCrashlyticsCustomKey("user_level", 5);
FirebasexCrashlyticsPlugin.setCrashlyticsCustomKey("premium", true);
FirebasexCrashlyticsPlugin.setCrashlyticsCustomKey("plan", "enterprise");
```

### sendCrash(success, error)
Force a test crash. Useful for testing Crashlytics integration.

```javascript
FirebasexCrashlyticsPlugin.sendCrash();
```

### didCrashOnPreviousExecution(success, error)
Check if the app crashed during the previous execution.

```javascript
FirebasexCrashlyticsPlugin.didCrashOnPreviousExecution(function(didCrash) {
    if (didCrash) {
        console.log("App crashed on previous run");
    }
});
```

## iOS Build Phase

This plugin automatically adds a Crashlytics dSYM upload build phase to the Xcode project during installation. This ensures debug symbols are uploaded to Firebase for symbolicated crash reports. The build phase is removed when the plugin is uninstalled.
