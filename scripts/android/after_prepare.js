const fs = require('fs');
const path = require('path');

const gradlePluginVersion = '3.0.7'; // Latest version of the Crashlytics Gradle plugin as of 26 May 2026

module.exports = function(context) {
    console.log('[FirebasexCrashlytics] Running after_prepare hook to update root build.gradle with Crashlytics classpath.');
    const platformRoot = path.join(context.opts.projectRoot, 'platforms', 'android');
    const rootGradlePath = path.join(platformRoot, 'build.gradle');

    if (!fs.existsSync(rootGradlePath)) {
        return;
    }

    let gradleContent = fs.readFileSync(rootGradlePath, 'utf8');

    // Define the dependency line to inject
    const crashlyticsClasspath = `classpath 'com.google.firebase:firebase-crashlytics-gradle:${gradlePluginVersion}'`;

    // Avoid duplicate injections
    if (gradleContent.includes('firebase-crashlytics-gradle')) {
        console.log('[FirebasexCrashlytics] Crashlytics classpath already exists in root build.gradle');
        return;
    }

    // Locate the buildscript dependencies block
    const targetPattern = /(dependencies\s*\{)/;

    if (targetPattern.test(gradleContent)) {
        gradleContent = gradleContent.replace(targetPattern, `$1\n        ${crashlyticsClasspath}`);
        fs.writeFileSync(rootGradlePath, gradleContent, 'utf8');
        console.log('[FirebasexCrashlytics] Successfully injected Crashlytics classpath into root build.gradle');
    } else {
        console.error('[FirebasexCrashlytics] Failed to locate buildscript dependencies block in root build.gradle');
    }
};