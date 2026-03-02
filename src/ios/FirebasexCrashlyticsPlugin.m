/**
 * @file FirebasexCrashlyticsPlugin.m
 * @brief iOS implementation of the FirebaseX Crashlytics Cordova plugin.
 */
#import "FirebasexCrashlyticsPlugin.h"
#import "FirebasexCorePlugin.h"
@import FirebaseCrashlytics;

/** Preference key for persisting the Crashlytics collection enabled state. */
static NSString *const FIREBASE_CRASHLYTICS_COLLECTION_ENABLED = @"FIREBASE_CRASHLYTICS_COLLECTION_ENABLED";

@implementation FirebasexCrashlyticsPlugin

/**
 * Initialises the plugin by enabling Crashlytics collection by default.
 */
- (void)pluginInitialize {
    NSLog(@"FirebasexCrashlyticsPlugin: pluginInitialize");
    [[FirebasexCorePlugin sharedInstance] setPreferenceFlag:FIREBASE_CRASHLYTICS_COLLECTION_ENABLED flag:YES];
}

/**
 * Checks if Crashlytics collection is currently enabled.
 *
 * @return YES if collection is enabled, NO otherwise.
 */
- (BOOL)isCrashlyticsEnabled {
    return [[FirebasexCorePlugin sharedInstance] getPreferenceFlag:FIREBASE_CRASHLYTICS_COLLECTION_ENABLED];
}

/**
 * Enables or disables Crashlytics data collection.
 * Persists the setting via the core plugin's preference system.
 *
 * @param command Cordova command; args[0] = boolean enabled.
 */
- (void)setCrashlyticsCollectionEnabled:(CDVInvokedUrlCommand *)command {
    [self.commandDelegate runInBackground:^{
        @try {
            BOOL enabled = [[command argumentAtIndex:0] boolValue];
            [[FIRCrashlytics crashlytics] setCrashlyticsCollectionEnabled:enabled];
            [[FirebasexCorePlugin sharedInstance] setPreferenceFlag:FIREBASE_CRASHLYTICS_COLLECTION_ENABLED flag:enabled];
            CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
            [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
        } @catch (NSException *exception) {
            [[FirebasexCorePlugin sharedInstance] handlePluginExceptionWithContext:exception :command];
        }
    }];
}

/** Returns the Crashlytics collection enabled state to the JS callback. */
- (void)isCrashlyticsCollectionEnabled:(CDVInvokedUrlCommand *)command {
    [self.commandDelegate runInBackground:^{
        @try {
            CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK
                                                                messageAsBool:[self isCrashlyticsEnabled]];
            [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
        } @catch (NSException *exception) {
            [[FirebasexCorePlugin sharedInstance] handlePluginExceptionWithContext:exception :command];
        }
    }];
}

/** Returns whether the app crashed during the previous execution. */
- (void)didCrashOnPreviousExecution:(CDVInvokedUrlCommand *)command {
    [self.commandDelegate runInBackground:^{
        @try {
            CDVPluginResult *pluginResult;
            if (![self isCrashlyticsEnabled]) {
                pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR
                                                messageAsString:@"Cannot query didCrashOnPreviousExecution - Crashlytics collection is disabled"];
            } else {
                pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK
                                                   messageAsBool:[[FIRCrashlytics crashlytics] didCrashDuringPreviousExecution]];
            }
            [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
        } @catch (NSException *exception) {
            [[FirebasexCorePlugin sharedInstance] handlePluginExceptionWithContext:exception :command];
        }
    }];
}

/**
 * Records a non-fatal error to Crashlytics.
 *
 * Handles three code paths:
 * 1. If a stack trace array is provided (args[1]), creates a FIRExceptionModel with
 *    FIRStackFrame objects for each frame.
 * 2. If only a message is provided, records an NSError.
 * 3. If Crashlytics is disabled, returns an error.
 *
 * @param command Cordova command; args[0] = error message, args[1] = optional stack trace array.
 */
- (void)logError:(CDVInvokedUrlCommand *)command {
    [self.commandDelegate runInBackground:^{
        @try {
            NSString *errorMessage = [command.arguments objectAtIndex:0];
            CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];

            if (![self isCrashlyticsEnabled]) {
                pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR
                                                messageAsString:@"Cannot log error - Crashlytics collection is disabled"];
            } else if ([command.arguments objectAtIndex:0] == [NSNull null]) {
                pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR
                                                messageAsString:@"Cannot log error - error message is empty"];
            } else if ([command.arguments count] > 1) {
                NSArray *stackFrames = [command.arguments objectAtIndex:1];
                NSString *message = errorMessage;
                NSString *name = @"Uncaught Javascript exception";
                NSMutableArray *customFrames = [[NSMutableArray alloc] init];
                FIRExceptionModel *exceptionModel = [FIRExceptionModel exceptionModelWithName:name reason:message];
                for (NSDictionary *stackFrame in stackFrames) {
                    FIRStackFrame *customFrame = [FIRStackFrame
                        stackFrameWithSymbol:stackFrame[@"functionName"]
                                        file:stackFrame[@"fileName"]
                                        line:(uint32_t)[stackFrame[@"lineNumber"] intValue]];
                    [customFrames addObject:customFrame];
                }
                exceptionModel.stackTrace = customFrames;
                [[FIRCrashlytics crashlytics] recordExceptionModel:exceptionModel];
            } else {
                NSMutableDictionary *userInfo = [[NSMutableDictionary alloc] init];
                NSError *error = [NSError errorWithDomain:errorMessage code:0 userInfo:userInfo];
                [[FIRCrashlytics crashlytics] recordError:error];
            }
            [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
        } @catch (NSException *exception) {
            [[FirebasexCorePlugin sharedInstance] handlePluginExceptionWithContext:exception :command];
        }
    }];
}

/**
 * Logs a message to appear in the Crashlytics logs tab of crash reports.
 * Returns an error if Crashlytics collection is disabled.
 */
- (void)logMessage:(CDVInvokedUrlCommand *)command {
    [self.commandDelegate runInBackground:^{
        @try {
            NSString *message = [command argumentAtIndex:0 withDefault:@""];
            CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
            if (![self isCrashlyticsEnabled]) {
                pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR
                                                messageAsString:@"Cannot log message - Crashlytics collection is disabled"];
            } else if (message) {
                [[FIRCrashlytics crashlytics] logWithFormat:@"%@", message];
            }
            [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
        } @catch (NSException *exception) {
            [[FirebasexCorePlugin sharedInstance] handlePluginExceptionWithContext:exception :command];
        }
    }];
}

/**
 * Sets a custom key-value pair on crash reports.
 * Returns an error if Crashlytics collection is disabled.
 */
- (void)setCrashlyticsCustomKey:(CDVInvokedUrlCommand *)command {
    [self.commandDelegate runInBackground:^{
        @try {
            NSString *key = [command argumentAtIndex:0 withDefault:@""];
            NSString *value = [command argumentAtIndex:1 withDefault:@""];
            CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
            if (![self isCrashlyticsEnabled]) {
                pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR
                                                messageAsString:@"Cannot set custom key/value - Crashlytics collection is disabled"];
            } else {
                [[FIRCrashlytics crashlytics] setCustomValue:value forKey:key];
            }
            [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
        } @catch (NSException *exception) {
            [[FirebasexCorePlugin sharedInstance] handlePluginExceptionWithContext:exception :command];
        }
    }];
}

/** Forces a crash for testing Crashlytics integration (terminates the app via assert). */
- (void)sendCrash:(CDVInvokedUrlCommand *)command {
    assert(NO);
}

/**
 * Sets the user ID for crash reports.
 * Returns an error if Crashlytics collection is disabled.
 */
- (void)setCrashlyticsUserId:(CDVInvokedUrlCommand *)command {
    @try {
        NSString *userId = [command.arguments objectAtIndex:0];
        CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
        if (![self isCrashlyticsEnabled]) {
            pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR
                                            messageAsString:@"Cannot set user ID - Crashlytics collection is disabled"];
        } else {
            [[FIRCrashlytics crashlytics] setUserID:userId];
        }
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    } @catch (NSException *exception) {
        [[FirebasexCorePlugin sharedInstance] handlePluginExceptionWithContext:exception :command];
    }
}

@end
