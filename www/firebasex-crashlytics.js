var exec = require('cordova/exec');

var SERVICE = 'FirebasexCrashlyticsPlugin';

exports.setCrashlyticsCollectionEnabled = function (enabled, success, error) {
    exec(success, error, SERVICE, "setCrashlyticsCollectionEnabled", [!!enabled]);
};

exports.isCrashlyticsCollectionEnabled = function (success, error) {
    exec(success, error, SERVICE, "isCrashlyticsCollectionEnabled", []);
};

exports.logMessage = function (message, success, error) {
    exec(success, error, SERVICE, "logMessage", [message]);
};

exports.sendCrash = function (success, error) {
    exec(success, error, SERVICE, "sendCrash", []);
};

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

exports.setCrashlyticsUserId = function (userId, success, error) {
    exec(success, error, SERVICE, "setCrashlyticsUserId", [userId]);
};

exports.setCrashlyticsCustomKey = function (key, value, success, error) {
    exec(success, error, SERVICE, "setCrashlyticsCustomKey", [key, value]);
};

exports.didCrashOnPreviousExecution = function (success, error) {
    exec(success, error, SERVICE, "didCrashOnPreviousExecution", []);
};
