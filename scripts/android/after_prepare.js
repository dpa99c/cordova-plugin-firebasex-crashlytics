const fs = require('fs');
const path = require('path');

const gradlePluginVersion = '3.0.7'; // Latest version of the Crashlytics Gradle plugin as of 26 May 2026
const defaultGoogleServicesPluginVersion = '4.4.2';

module.exports = function(context) {
    console.log('[FirebasexCrashlytics] Running after_prepare hook to update root build.gradle with Crashlytics classpath.');
    const platformRoot = path.join(context.opts.projectRoot, 'platforms', 'android');
    const rootGradlePath = path.join(platformRoot, 'build.gradle');

    if (!fs.existsSync(rootGradlePath)) {
        return;
    }

    let gradleContent = fs.readFileSync(rootGradlePath, 'utf8');

    const gradleConfigPath = path.join(platformRoot, 'cdv-gradle-config.json');
    const gradleConfig = fs.existsSync(gradleConfigPath) ? JSON.parse(fs.readFileSync(gradleConfigPath, 'utf8')) : {};
    const googleServicesPluginVersion = gradleConfig.GRADLE_PLUGIN_GOOGLE_SERVICES_VERSION || defaultGoogleServicesPluginVersion;
    const pluginClasspaths = [
        {
            artifact: 'firebase-crashlytics-gradle',
            dependency: `classpath 'com.google.firebase:firebase-crashlytics-gradle:${gradlePluginVersion}'`
        },
        {
            artifact: 'com.google.gms:google-services',
            dependency: `classpath 'com.google.gms:google-services:${googleServicesPluginVersion}'`
        }
    ];
    const missingClasspaths = pluginClasspaths
        .filter(plugin => !gradleContent.includes(plugin.artifact))
        .map(plugin => plugin.dependency);

    if (missingClasspaths.length === 0) {
        console.log('[FirebasexCrashlytics] Crashlytics and Google Services classpaths already exist in root build.gradle');
        return;
    }

    const targetPattern = /(dependencies\s*\{)/;

    if (targetPattern.test(gradleContent)) {
        gradleContent = gradleContent.replace(targetPattern, `$1\n        ${missingClasspaths.join('\n        ')}`);
        fs.writeFileSync(rootGradlePath, gradleContent, 'utf8');
        console.log('[FirebasexCrashlytics] Successfully injected Firebase Gradle plugin classpaths into root build.gradle');
    } else {
        console.error('[FirebasexCrashlytics] Failed to locate buildscript dependencies block in root build.gradle');
    }
};