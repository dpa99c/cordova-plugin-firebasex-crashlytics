#import <Cordova/CDVPlugin.h>

@interface FirebasexCrashlyticsPlugin : CDVPlugin

- (void)setCrashlyticsCollectionEnabled:(CDVInvokedUrlCommand *)command;
- (void)isCrashlyticsCollectionEnabled:(CDVInvokedUrlCommand *)command;
- (void)setCrashlyticsUserId:(CDVInvokedUrlCommand *)command;
- (void)setCrashlyticsCustomKey:(CDVInvokedUrlCommand *)command;
- (void)logMessage:(CDVInvokedUrlCommand *)command;
- (void)logError:(CDVInvokedUrlCommand *)command;
- (void)sendCrash:(CDVInvokedUrlCommand *)command;
- (void)didCrashOnPreviousExecution:(CDVInvokedUrlCommand *)command;

@end
