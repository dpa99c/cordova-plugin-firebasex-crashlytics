/**
 * @file FirebasexCrashlyticsPlugin.h
 * @brief Cordova plugin interface for Firebase Crashlytics on iOS.
 *
 * Provides crash reporting, non-fatal error logging with JavaScript stack traces,
 * custom key-value pairs, user identification, and Crashlytics collection control.
 */
#import <Cordova/CDVPlugin.h>

/**
 * @brief Cordova plugin class for Firebase Crashlytics on iOS.
 *
 * @see https://firebase.google.com/docs/crashlytics
 */
@interface FirebasexCrashlyticsPlugin : CDVPlugin

/** Enables or disables Crashlytics data collection. @param command args[0]: boolean enabled. */
- (void)setCrashlyticsCollectionEnabled:(CDVInvokedUrlCommand *)command;
/** Returns the Crashlytics collection enabled state. */
- (void)isCrashlyticsCollectionEnabled:(CDVInvokedUrlCommand *)command;
/** Sets the user ID for crash reports. @param command args[0]: string userId. */
- (void)setCrashlyticsUserId:(CDVInvokedUrlCommand *)command;
/** Sets a custom key-value pair on crash reports. @param command args[0]: key, args[1]: value. */
- (void)setCrashlyticsCustomKey:(CDVInvokedUrlCommand *)command;
/** Logs a message to appear in the crash report logs tab. @param command args[0]: message. */
- (void)logMessage:(CDVInvokedUrlCommand *)command;
/** Records a non-fatal error, optionally with a stack trace. @param command args[0]: message, args[1]: optional stack trace array. */
- (void)logError:(CDVInvokedUrlCommand *)command;
/** Forces a crash for testing Crashlytics integration (terminates the app). */
- (void)sendCrash:(CDVInvokedUrlCommand *)command;
/** Returns whether the app crashed during the previous execution. */
- (void)didCrashOnPreviousExecution:(CDVInvokedUrlCommand *)command;

@end
