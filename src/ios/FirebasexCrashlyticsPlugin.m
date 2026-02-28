#import "FirebasexCrashlyticsPlugin.h"
#import "FirebasexCorePlugin.h"
@import FirebaseCrashlytics;

static NSString *const FIREBASE_CRASHLYTICS_COLLECTION_ENABLED = @"FIREBASE_CRASHLYTICS_COLLECTION_ENABLED";

@implementation FirebasexCrashlyticsPlugin

- (void)pluginInitialize {
    NSLog(@"FirebasexCrashlyticsPlugin: pluginInitialize");
    [[FirebasexCorePlugin sharedInstance] setPreferenceFlag:FIREBASE_CRASHLYTICS_COLLECTION_ENABLED flag:YES];
}

- (BOOL)isCrashlyticsEnabled {
    return [[FirebasexCorePlugin sharedInstance] getPreferenceFlag:FIREBASE_CRASHLYTICS_COLLECTION_ENABLED];
}

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

- (void)sendCrash:(CDVInvokedUrlCommand *)command {
    assert(NO);
}

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
