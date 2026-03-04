interface StackTraceElement {
    functionName?: string;
    fileName?: string;
    lineNumber?: number;
}

interface FirebasexCrashlytics {
    setCrashlyticsCollectionEnabled(enabled: boolean, success?: () => void, error?: (err: string) => void): void;
    isCrashlyticsCollectionEnabled(success: (enabled: boolean) => void, error?: (err: string) => void): void;
    logMessage(message: string, success?: () => void, error?: (err: string) => void): void;
    sendCrash(success?: () => void, error?: (err: string) => void): void;
    logError(message: string, stackTrace?: StackTraceElement[] | (() => void), success?: () => void, error?: (err: string) => void): void;
    setCrashlyticsUserId(userId: string, success?: () => void, error?: (err: string) => void): void;
    setCrashlyticsCustomKey(key: string, value: string | number | boolean, success?: () => void, error?: (err: string) => void): void;
    didCrashOnPreviousExecution(success: (didCrash: boolean) => void, error?: (err: string) => void): void;
}
