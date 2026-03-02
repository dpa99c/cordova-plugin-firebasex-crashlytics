#!/usr/bin/env node

/**
 * @file after_prepare.js
 * @brief Cordova "after_prepare" hook for the cordova-plugin-firebasex-crashlytics plugin.
 *
 * On Android, injects the Firebase Crashlytics Gradle plugin into the build:
 * - Adds the `firebase-crashlytics-gradle` classpath dependency to the root `build.gradle`.
 * - Applies the `com.google.firebase.crashlytics` plugin to the app-level `build.gradle`.
 *
 * Delegates to the core plugin's shared Android and utilities modules.
 *
 * @module scripts/after_prepare
 */
'use strict';

var fs = require('fs');
var path = require('path');

/** @constant {string} Root directory of the Android platform. */
var ANDROID_DIR = 'platforms/android';

/**
 * Cordova hook entry point.
 *
 * @param {object} context - The Cordova hook context.
 */
module.exports = function (context) {
    var platforms = context.opts.platforms;

    if (platforms.indexOf('android') !== -1 && fs.existsSync(path.resolve(ANDROID_DIR))) {
        // Use the core plugin's android utilities to inject crashlytics gradle plugin
        var android = require('../../cordova-plugin-firebasex-core/scripts/lib/android');
        var utilities = require('../../cordova-plugin-firebasex-core/scripts/lib/utilities');
        utilities.setContext(context);

        android.addDependencyToRootGradle('com.google.firebase:firebase-crashlytics-gradle:3.0.3');
        android.applyPluginToAppGradle('com.google.firebase.crashlytics');
    }
};
