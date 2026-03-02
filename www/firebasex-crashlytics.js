/**
 * @fileoverview Cordova JavaScript interface for the FirebaseX Crashlytics plugin.
 *
 * Provides crash reporting, error logging with stack traces, custom keys,
 * and control over Crashlytics data collection.
 *
 * @module firebasex-crashlytics
 * @see https://firebase.google.com/docs/crashlytics
 */

var exec = require('cordova/exec');

/** @private Cordova service name registered in plugin.xml. */
var SERVICE = 'FirebasexCrashlyticsPlugin';

/**
 * Enables or disables Crashlytics data collection.
 *
 * When disabled, no crash data is collected or sent. The setting persists
 * across app restarts. Most other Crashlytics methods will return errors
 * when collection is disabled.
 *
 * @param {boolean} enabled - {@code true} to enable, {@code false} to disable.
 * @param {function} success - Called on success.
 * @param {function} error - Called with an error message on failure.
 */
exports.setCrashlyticsCollectionEnabled = function (enabled, success, error) {
    exec(success, error, SERVICE, "setCrashlyticsCollectionEnabled", [!!enabled]);
};

/**
 * Returns the current Crashlytics data collection enabled state.
 *
 * @param {function} success - Called with a boolean: {@code true} if enabled.
 * @param {function} error - Called with an error message on failure.
 */
exports.isCrashlyticsCollectionEnabled = function (success, error) {
    exec(success, error, SERVICE, "isCrashlyticsCollectionEnabled", []);
};

/**
 * Logs a message to Crashlytics for the next crash report.
 *
 * These messages appear in the "Logs" tab of a crash report in the Firebase console.
 * Requires Crashlytics collection to be enabled.
 *
 * @param {string} message - The message to log.
 * @param {function} success - Called on success.
 * @param {function} error - Called with an error message on failure.
 */
exports.logMessage = function (message, success, error) {
    exec(success, error, SERVICE, "logMessage", [message]);
};

/**
 * Forces a crash (for testing Crashlytics integration).
 *
 * This intentionally throws an unhandled exception that will be reported
 * to Crashlytics. The app will terminate.
 *
 * @param {function} success - Not called (app crashes).
 * @param {function} error - Not called (app crashes).
 */
exports.sendCrash = function (success, error) {
    exec(success, error, SERVICE, "sendCrash", []);
};

/**
 * Records a non-fatal error to Crashlytics.
 *
 * Optionally accepts a JavaScript stack trace array for symbolicated reporting.
 * Each stack frame should be an object with {@code functionName}, {@code fileName},
 * and {@code lineNumber} properties.
 *
 * @param {string} message - The error message.
 * @param {Array.<{functionName: string, fileName: string, lineNumber: number}>} [stackTrace] -
 *   Optional array of stack frame objects. If omitted, a generic exception is recorded.
 * @param {function} success - Called on success.
 * @param {function} error - Called with an error message on failure.
 */
exports.logError = function (message, stackTrace, success, error) {
    var args = [message];
    if (stackTrace) {
        if (typeof stackTrace === 'function') {
            error = success;
            success = stackTrace;
        } else {
            args.push(stackTrace);
        }
    }
    exec(success, error, SERVICE, "logError", args);
};

/**
 * Sets the user ID for Crashlytics crash reports.
 *
 * @param {string} userId - The user ID string.
 * @param {function} success - Called on success.
 * @param {function} error - Called with an error message if Crashlytics is disabled.
 */
exports.setCrashlyticsUserId = function (userId, success, error) {
    exec(success, error, SERVICE, "setCrashlyticsUserId", [userId]);
};

/**
 * Sets a custom key-value pair for Crashlytics crash reports.
 *
 * Custom keys appear in the "Keys" tab of a crash report.
 *
 * @param {string} key - The key name.
 * @param {string|number|boolean} value - The value (supports string, number, boolean).
 * @param {function} success - Called on success.
 * @param {function} error - Called with an error message if Crashlytics is disabled.
 */
exports.setCrashlyticsCustomKey = function (key, value, success, error) {
    exec(success, error, SERVICE, "setCrashlyticsCustomKey", [key, value]);
};

/**
 * Returns whether the app crashed during the previous execution.
 *
 * @param {function} success - Called with a boolean: {@code true} if a crash occurred.
 * @param {function} error - Called with an error message if Crashlytics is disabled.
 */
exports.didCrashOnPreviousExecution = function (success, error) {
    exec(success, error, SERVICE, "didCrashOnPreviousExecution", []);
};
