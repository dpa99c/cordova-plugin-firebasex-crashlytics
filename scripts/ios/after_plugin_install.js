/**
 * @file after_plugin_install.js
 * @brief Hook script that runs after the crashlytics plugin is installed on iOS.
 *
 * 1. Updates the FirebaseCrashlytics pod version in the Podfile based on the
 *    IOS_FIREBASE_SDK_VERSION plugin variable, allowing users to override the
 *    default Firebase SDK version.
 *
 * 2. Adds a "Crashlytics" shell script build phase to the Xcode project that uploads
 *    dSYM files to Firebase Crashlytics after each build. Any existing Crashlytics
 *    build phase is removed first to prevent duplicates.
 *
 * The build phase runs the `FirebaseCrashlytics/run` script from the Pods directory
 * with the dSYM and GoogleService-Info.plist paths as inputs.
 *
 * Plugin variables are resolved using a 4-layer override strategy:
 * 1. Defaults from plugin.xml preferences (via hook context).
 * 2. Overrides from `config.xml` `<plugin><variable>` elements (wrapper and own plugin ID).
 * 3. Overrides from `package.json` `cordova.plugins` entries (wrapper and own plugin ID).
 * 4. CLI variables passed at install time (highest priority).
 */
var fs = require("fs");
var path = require("path");
var xcode = require("xcode");

/** @constant {string} The plugin identifier. */
var PLUGIN_ID = "cordova-plugin-firebasex-crashlytics";
/** @constant {string} The wrapper meta-plugin identifier used as a fallback source for plugin variables. */
var WRAPPER_PLUGIN_ID = "cordova-plugin-firebasex";

/** @constant {string} The Xcode build phase comment/name used to identify the Crashlytics phase. */
var comment = "\"Crashlytics\"";

/**
 * Resolves plugin variables using the 4-layer override strategy.
 *
 * @param {object} context - The Cordova hook context.
 * @returns {Object} Resolved plugin variable key/value pairs.
 */
function resolvePluginVariables(context) {
    var pluginVariables = {};

    // 1. Defaults from plugin.xml preferences
    var plugin = context.opts.plugin;
    if (plugin && plugin.pluginInfo && plugin.pluginInfo._et && plugin.pluginInfo._et._root && plugin.pluginInfo._et._root._children) {
        plugin.pluginInfo._et._root._children.forEach(function(child) {
            if (child.tag === "preference") {
                pluginVariables[child.attrib.name] = child.attrib.default;
            }
        });
    }

    // 2. Overrides from config.xml
    try {
        var configXmlPath = path.join(context.opts.projectRoot, "config.xml");
        if (fs.existsSync(configXmlPath)) {
            var configXml = fs.readFileSync(configXmlPath, "utf-8");
            [WRAPPER_PLUGIN_ID, PLUGIN_ID].forEach(function(pluginId) {
                var pluginRegex = new RegExp('<plugin[^>]+name="' + pluginId + '"[^>]*>(.*?)</plugin>', "s");
                var pluginMatch = configXml.match(pluginRegex);
                if (pluginMatch) {
                    var varRegex = /<variable\s+name="([^"]+)"\s+value="([^"]+)"\s*\/>/g;
                    var varMatch;
                    while ((varMatch = varRegex.exec(pluginMatch[1])) !== null) {
                        pluginVariables[varMatch[1]] = varMatch[2];
                    }
                }
            });
        }else {
            console.warn("[FirebasexCrashlytics] config.xml not found at expected path: " + configXmlPath);
        }
    } catch (e) {
        console.warn("[FirebasexCrashlytics] Could not read config.xml for plugin variables: " + e.message);
    }

    // 3. Overrides from package.json
    try {
        var packageJsonPath = path.join(context.opts.projectRoot, "package.json");
        if (fs.existsSync(packageJsonPath)) {
            var packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
            if (packageJson.cordova && packageJson.cordova.plugins) {
                [WRAPPER_PLUGIN_ID, PLUGIN_ID].forEach(function(pluginId) {
                    if (packageJson.cordova.plugins[pluginId]) {
                        var pluginVars = packageJson.cordova.plugins[pluginId];
                        for (var key in pluginVars) {
                            pluginVariables[key] = pluginVars[key];
                        }
                    }
                });
            }
        }else{
            console.warn("[FirebasexCrashlytics] package.json not found at expected path: " + packageJsonPath);
        }
    } catch (e) {
        console.warn("[FirebasexCrashlytics] Could not read package.json for plugin variables: " + e.message);
    }

    // 4. CLI variable overrides (highest priority)
    if (context.opts && context.opts.cli_variables) {
        Object.keys(context.opts.cli_variables).forEach(function(key) {
            pluginVariables[key] = context.opts.cli_variables[key];
        });
    }

    return pluginVariables;
}

/**
 * Reads the application name from `config.xml`.
 *
 * @returns {string|null} The app name, or `null` if it cannot be determined.
 */
function getAppName() {
    var configXmlPath = path.join("config.xml");
    var content = fs.readFileSync(configXmlPath, "utf-8");
    var match = content.match(/<name[^>]*>([^<]+)<\/name>/);
    return match ? match[1] : null;
}

/**
 * Returns the path to the Xcode project's `project.pbxproj` file.
 * Supports both the legacy layout (`<AppName>.xcodeproj`) used by cordova-ios <8
 * and the new layout (`App.xcodeproj`) used by cordova-ios >=8.
 *
 * @returns {string} Relative path to `project.pbxproj`.
 */
function getXcodeProjectPath() {
    var appName = getAppName();
    var newPath = path.join("platforms", "ios", "App.xcodeproj", "project.pbxproj");
    var oldPath = path.join("platforms", "ios", appName + ".xcodeproj", "project.pbxproj");

    if (fs.existsSync(newPath)) {
        return newPath;
    }
    return oldPath;
}

/**
 * Removes any existing "Crashlytics" shell script build phase from the Xcode project.
 * Iterates over all `PBXShellScriptBuildPhase` entries and `PBXNativeTarget` build
 * phase references, deleting those whose name or comment matches "Crashlytics".
 *
 * @param {string} xcodeProjectPath - Path to the `project.pbxproj` file.
 */
function removeShellScriptBuildPhase(xcodeProjectPath) {
    var xcodeProject = xcode.project(xcodeProjectPath);
    xcodeProject.parseSync();

    var buildPhases = xcodeProject.hash.project.objects.PBXShellScriptBuildPhase;
    if (!buildPhases) return;

    var commentTest = comment.replace(/"/g, '');

    for (var buildPhaseId in buildPhases) {
        var buildPhase = buildPhases[buildPhaseId];
        var shouldDelete = false;

        if (buildPhaseId.indexOf("_comment") === -1) {
            shouldDelete = buildPhase.name && buildPhase.name.indexOf(commentTest) !== -1;
        } else {
            shouldDelete = buildPhase === commentTest;
        }
        if (shouldDelete) {
            delete buildPhases[buildPhaseId];
        }
    }

    var nativeTargets = xcodeProject.hash.project.objects.PBXNativeTarget;
    for (var nativeTargetId in nativeTargets) {
        if (nativeTargetId.indexOf("_comment") !== -1) continue;
        var nativeTarget = nativeTargets[nativeTargetId];
        nativeTarget.buildPhases = nativeTarget.buildPhases.filter(function (buildPhase) {
            return buildPhase.comment !== commentTest;
        });
    }

    fs.writeFileSync(path.resolve(xcodeProjectPath), xcodeProject.writeSync());
}

/**
 * Adds a "Crashlytics" shell script build phase to the Xcode project.
 * The phase runs the FirebaseCrashlytics dSYM upload script with the following inputs:
 * - dSYM folder path and contents
 * - dSYM Info.plist
 * - GoogleService-Info.plist (from the built resources)
 * - The app executable path
 *
 * The phase is added to all native targets in the project.
 *
 * @param {string} xcodeProjectPath - Path to the `project.pbxproj` file.
 */
function addShellScriptBuildPhase(xcodeProjectPath) {
    var xcodeProject = xcode.project(xcodeProjectPath);
    xcodeProject.parseSync();

    var script = '"' + '\\"${PODS_ROOT}/FirebaseCrashlytics/run\\"' + '"';
    var id = xcodeProject.generateUuid();

    if (!xcodeProject.hash.project.objects.PBXShellScriptBuildPhase) {
        xcodeProject.hash.project.objects.PBXShellScriptBuildPhase = {};
    }

    xcodeProject.hash.project.objects.PBXShellScriptBuildPhase[id] = {
        isa: "PBXShellScriptBuildPhase",
        buildActionMask: 2147483647,
        files: [],
        inputPaths: [
            '"${DWARF_DSYM_FOLDER_PATH}/${DWARF_DSYM_FILE_NAME}"',
            '"${DWARF_DSYM_FOLDER_PATH}/${DWARF_DSYM_FILE_NAME}/Contents/Resources/DWARF/${PRODUCT_NAME}"',
            '"${DWARF_DSYM_FOLDER_PATH}/${DWARF_DSYM_FILE_NAME}/Contents/Info.plist"',
            '"$(TARGET_BUILD_DIR)/$(UNLOCALIZED_RESOURCES_FOLDER_PATH)/GoogleService-Info.plist"',
            '"$(TARGET_BUILD_DIR)/$(EXECUTABLE_PATH)"',
        ],
        name: comment,
        outputPaths: [],
        runOnlyForDeploymentPostprocessing: 0,
        shellPath: "/bin/sh",
        shellScript: script,
        showEnvVarsInLog: 0
    };

    xcodeProject.hash.project.objects.PBXShellScriptBuildPhase[id + "_comment"] = comment;

    for (var nativeTargetId in xcodeProject.hash.project.objects.PBXNativeTarget) {
        if (nativeTargetId.indexOf("_comment") !== -1) continue;
        var nativeTarget = xcodeProject.hash.project.objects.PBXNativeTarget[nativeTargetId];
        nativeTarget.buildPhases.push({ value: id, comment: comment });
    }

    fs.writeFileSync(path.resolve(xcodeProjectPath), xcodeProject.writeSync());
}

/**
 * Cordova hook entry point.
 * Removes any existing Crashlytics build phase, then adds a fresh one.
 *
 * @param {object} context - The Cordova hook context.
 */
module.exports = function(context) {
    // Update FirebaseCrashlytics pod version in Podfile
    var pluginVariables = resolvePluginVariables(context);
    if (pluginVariables["IOS_FIREBASE_SDK_VERSION"]) {
        try {
            var iosPlatformPath = path.join(context.opts.projectRoot, "platforms", "ios");
            var podFilePath = path.join(iosPlatformPath, "Podfile");
            if (fs.existsSync(podFilePath)) {
                var podFileContents = fs.readFileSync(podFilePath, "utf-8");
                var versionRegex = /\d+\.\d+\.\d+[^'"]*/;
                var crashlyticsPodRegEx = /pod 'FirebaseCrashlytics', '(\d+\.\d+\.\d+[^'"]*)'/g;
                var matches = podFileContents.match(crashlyticsPodRegEx);
                if (matches) {
                    var modified = false;
                    matches.forEach(function(match) {
                        var currentVersion = match.match(versionRegex)[0];
                        if (currentVersion !== pluginVariables["IOS_FIREBASE_SDK_VERSION"]) {
                            podFileContents = podFileContents.replace(match, match.replace(currentVersion, pluginVariables["IOS_FIREBASE_SDK_VERSION"]));
                            modified = true;
                        }
                    });
                    if (modified) {
                        fs.writeFileSync(podFilePath, podFileContents);
                        console.log("[FirebasexCrashlytics] Firebase Crashlytics version set to v" + pluginVariables["IOS_FIREBASE_SDK_VERSION"] + " in Podfile");
                    }
                }
            }
        } catch(e) {
            console.warn("[FirebasexCrashlytics] Error setting Firebase Crashlytics version: " + e.message);
        }
    }

    var xcodeProjectPath = getXcodeProjectPath();
    removeShellScriptBuildPhase(xcodeProjectPath);
    addShellScriptBuildPhase(xcodeProjectPath);
};
