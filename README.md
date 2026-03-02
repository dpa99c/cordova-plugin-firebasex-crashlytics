# cordova-plugin-firebasex-crashlytics

[![npm version](https://img.shields.io/npm/v/cordova-plugin-firebasex-crashlytics.svg)](https://www.npmjs.com/package/cordova-plugin-firebasex-crashlytics)

Firebase Crashlytics module for the [modular FirebaseX Cordova plugin suite](https://github.com/dpa99c/cordova-plugin-firebasex#modular-plugins).

By default this plugin will ensure fatal native crashes in your apps are reported to Firebase via the Firebase Crashlytics SDK.

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**

- [Installation](#installation)
  - [Plugin variables](#plugin-variables)
- [Disable data collection on startup](#disable-data-collection-on-startup)
- [iOS setup](#ios-setup)
  - [Set up project to automatically upload dSYM files](#set-up-project-to-automatically-upload-dsym-files)
- [API](#api)
  - [setCrashlyticsCollectionEnabled](#setcrashlyticscollectionenabled)
  - [isCrashlyticsCollectionEnabled](#iscrashlyticscollectionenabled)
  - [didCrashOnPreviousExecution](#didcrashonpreviousexecution)
  - [setCrashlyticsUserId](#setcrashlyticsuserid)
  - [sendCrash](#sendcrash)
  - [setCrashlyticsCustomKey](#setcrashlyticscustomkey)
  - [logMessage](#logmessage)
  - [logError](#logerror)
- [Reporting issues](#reporting-issues)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# Installation

Install the plugin by adding it to your project's config.xml:

    cordova plugin add cordova-plugin-firebasex-crashlytics

or by running:

    cordova plugin add cordova-plugin-firebasex-crashlytics

**This module depends on `cordova-plugin-firebasex-core` which will be installed automatically as a dependency.**

## Plugin variables

The following plugin variables are used to configure the crashlytics module at install time.
They can be set on the command line at plugin installation time:

    cordova plugin add cordova-plugin-firebasex-crashlytics --variable VARIABLE_NAME=value

Or in your `config.xml`:

    <plugin name="cordova-plugin-firebasex-crashlytics">
        <variable name="VARIABLE_NAME" value="value" />
    </plugin>

| Variable | Default | Description |
|---|---|---|
| `FIREBASE_CRASHLYTICS_COLLECTION_ENABLED` | `true` | Whether to enable Crashlytics data collection at app startup. Set to `false` to [disable data collection on startup](#disable-data-collection-on-startup). |

# Disable data collection on startup

By default, Crashlytics data will begin being collected as soon as the app starts up.
However, for data protection or privacy reasons, you may wish to disable data collection until such time as the user has granted their permission.

To do this, set the `FIREBASE_CRASHLYTICS_COLLECTION_ENABLED` plugin variable to `false` at plugin install time:

    cordova plugin add cordova-plugin-firebasex-crashlytics \
     --variable FIREBASE_CRASHLYTICS_COLLECTION_ENABLED=false

This will disable Crashlytics data collection (on both Android & iOS) until you call [setCrashlyticsCollectionEnabled](#setcrashlyticscollectionenabled):

```javascript
FirebasexCrashlyticsPlugin.setCrashlyticsCollectionEnabled(true);
```

Notes:

-   Calling `setCrashlyticsCollectionEnabled()` will have no effect if the `FIREBASE_CRASHLYTICS_COLLECTION_ENABLED` variable is set to `true` (the default).
-   Calling `setCrashlyticsCollectionEnabled(true|false)` will enable/disable data collection during the current app session and across subsequent app sessions until such time as the same method is called again with a different value.

# iOS setup

## Set up project to automatically upload dSYM files

This plugin automatically adds a Crashlytics dSYM upload build phase to the Xcode project during installation. This ensures debug symbols are uploaded to Firebase for symbolicated crash reports. The build phase is removed when the plugin is uninstalled.

See the Firebase Documentation [Get started with Firebase Crashlytics](https://firebase.google.com/docs/crashlytics/get-started?platform=ios#set-up-dsym-uploading) for more details.

Make sure `cordova-plugin-firebasex-crashlytics` is the last plugin in the cordova section of your `package.json`:

```json
{
    "cordova": {
        "platforms": [
            "ios",
            "android"
        ],
        "plugins": {
            "cordova-plugin-firebasex-crashlytics": {
            }
        }
    }
}
```

# API

The following methods are available via the `FirebasexCrashlyticsPlugin` global object.

## setCrashlyticsCollectionEnabled

Manually enable/disable Crashlytics data collection, e.g. if [disabled on app startup](#disable-data-collection-on-startup).

**Parameters**:

-   {boolean} setEnabled - whether to enable or disable Crashlytics data collection.
-   {function} success - (optional) callback function which will be invoked on success
-   {function} error - (optional) callback function which will be passed a {string} error message as an argument

```javascript
var shouldSetEnabled = true;
FirebasexCrashlyticsPlugin.setCrashlyticsCollectionEnabled(
    shouldSetEnabled,
    function () {
        console.log("Crashlytics data collection is enabled");
    },
    function (error) {
        console.error(
            "Crashlytics data collection couldn't be enabled: " + error
        );
    }
);
```

## isCrashlyticsCollectionEnabled

Indicates whether Crashlytics collection setting is currently enabled.

**Parameters**:

-   {function} success - callback function which will be invoked on success.
    Will be passed a {boolean} indicating if the setting is enabled.
-   {function} error - (optional) callback function which will be passed a {string} error message as an argument

```javascript
FirebasexCrashlyticsPlugin.isCrashlyticsCollectionEnabled(
    function (enabled) {
        console.log(
            "Crashlytics data collection is " +
                (enabled ? "enabled" : "disabled")
        );
    },
    function (error) {
        console.error(
            "Error getting Crashlytics data collection setting: " + error
        );
    }
);
```

## didCrashOnPreviousExecution

Checks whether the app crashed on its previous run.

**Parameters**:

-   {function} success - callback function which will be invoked on success.
    Will be passed a {boolean} indicating whether the app crashed on its previous run.
-   {function} error - (optional) callback function which will be passed a {string} error message as an argument

```javascript
FirebasexCrashlyticsPlugin.didCrashOnPreviousExecution(function(didCrashOnPreviousExecution){
    console.log(`Did crash on previous execution: ${didCrashOnPreviousExecution}`));
}, function(error){
    console.error(`Error getting Crashlytics did crash on previous execution: ${error}`);
});
```

## setCrashlyticsUserId

Set Crashlytics user identifier.

To diagnose an issue, it's often helpful to know which of your users experienced a given crash. Crashlytics includes a way to anonymously identify users in your crash reports.
To add user IDs to your reports, assign each user a unique identifier in the form of an ID number, token, or hashed value.

See [the Firebase docs for more](https://firebase.google.com/docs/crashlytics/customize-crash-reports?authuser=0#set_user_ids).

**Parameters**:

-   {string} userId - User ID to associate with Crashlytics reports

```javascript
FirebasexCrashlyticsPlugin.setCrashlyticsUserId("user_id");
```

## sendCrash

Simulates (causes) a fatal native crash which causes a crash event to be sent to Crashlytics (useful for testing).
See [the Firebase documentation](https://firebase.google.com/docs/crashlytics/force-a-crash?authuser=0#force_a_crash_to_test_your_implementation) regarding crash testing.
Crashes will appear under `Event type = "Crashes"` in the Crashlytics console.

**Parameters**: None

```javascript
FirebasexCrashlyticsPlugin.sendCrash();
```

## setCrashlyticsCustomKey

Records a custom key and value to be associated with subsequent fatal and non-fatal reports.

Multiple calls to this method with the same key will update the value for that key.

The value of any key at the time of a fatal or non-fatal event will be associated with that event.

Keys and associated values are visible in the session view on the Firebase Crashlytics console.

A maximum of 64 key/value pairs can be written, and new keys added beyond that limit will be ignored. Keys or values that exceed 1024 characters will be truncated.

**Parameters**:

-   {string} key - A unique key
-   {string | number | boolean} value - A value to be associated with the given key
-   {function} success - (optional) callback function which will be invoked on success
-   {function} error - (optional) callback function which will be passed a {string} error message as an argument

```javascript
FirebasexCrashlyticsPlugin.setCrashlyticsCustomKey(
    "number",
    3.5,
    function () {
        console.log("set custom key: number, with value: 3.5");
    },
    function (error) {
        console.error("Failed to set-custom key", error);
    }
);
FirebasexCrashlyticsPlugin.setCrashlyticsCustomKey("bool", true);
FirebasexCrashlyticsPlugin.setCrashlyticsCustomKey("string", "Ipsum lorem");
// Following is just used to trigger report for Firebase
FirebasexCrashlyticsPlugin.logMessage("about to send a crash for testing!");
FirebasexCrashlyticsPlugin.sendCrash();
```

## logMessage

Sends a crash-related log message that will appear in the `Logs` section of the next native crash event.
Note: if you don't then crash, the message won't be sent!
Also logs the message to the native device console.

**Parameters**:

-   {string} message - message to associate with next native crash event

```javascript
FirebasexCrashlyticsPlugin.logMessage("about to send a crash for testing!");
FirebasexCrashlyticsPlugin.sendCrash();
```

## logError

Sends a non-fatal error event to Crashlytics.
In a Cordova app, you may use this to log unhandled Javascript exceptions, for example.

The event will appear under `Event type = "Non-fatals"` in the Crashlytics console.
The error message will appear in the `Logs` section of the non-fatal error event.
Note that logged errors will only be sent to the Crashlytics server on the next full app restart.
Also logs the error message to the native device console.

**Parameters**:

-   {string} errorMessage - non-fatal error message to log to Crashlytics
-   {object} stackTrace - (optional) a stack trace generated by [stacktrace.js](http://www.stacktracejs.com/)
-   {function} success - (optional) callback function which will be invoked on success
-   {function} error - (optional) callback function which will be passed a {string} error message as an argument

```javascript
// Send an unhandled JS exception
var appRootURL = window.location.href.replace("index.html", "");
window.onerror = function (errorMsg, url, line, col, error) {
    var logMessage = errorMsg;
    var stackTrace = null;

    var sendError = function () {
        FirebasexCrashlyticsPlugin.logError(
            logMessage,
            stackTrace,
            function () {
                console.log("Sent JS exception");
            },
            function (error) {
                console.error("Failed to send JS exception", error);
            }
        );
    };

    logMessage +=
        ": url=" +
        url.replace(appRootURL, "") +
        "; line=" +
        line +
        "; col=" +
        col;

    if (typeof error === "object") {
        StackTrace.fromError(error).then(function (trace) {
            stackTrace = trace;
            sendError();
        });
    } else {
        sendError();
    }
};

// Send a non-fatal error
FirebasexCrashlyticsPlugin.logError(
    "A non-fatal error",
    function () {
        console.log("Sent non-fatal error");
    },
    function (error) {
        console.error("Failed to send non-fatal error", error);
    }
);
```

An example of how the error entry will appear in the Crashlytics console:
<br/>
<b>Android</b>
<br/>
<img src="https://user-images.githubusercontent.com/2345062/68016874-5e0cdb80-fc8d-11e9-9a26-97b448039cf5.png"/>

<br/><br/>
<b>iOS</b>
<br/>
<img src="https://user-images.githubusercontent.com/2345062/68041597-d1800e80-fcc8-11e9-90e1-eeeedf9cc43f.png"/>

# Reporting issues

Before reporting an issue with this plugin, please do the following:
- Check the existing [issues](https://github.com/dpa99c/cordova-plugin-firebasex-crashlytics/issues) to see if the issue has already been reported.
- Check the [issue template](https://github.com/dpa99c/cordova-plugin-firebasex-crashlytics/issues/new/choose) and provide all requested information.
- The more information and context you provide, the easier it is for the maintainers to understand the issue and provide a resolution.
