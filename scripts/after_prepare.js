#!/usr/bin/env node

'use strict';

var fs = require('fs');
var path = require('path');

var ANDROID_DIR = 'platforms/android';

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
