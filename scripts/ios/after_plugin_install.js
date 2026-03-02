/**
 * @file after_plugin_install.js
 * @brief Hook script that runs after the crashlytics plugin is installed on iOS.
 *
 * Adds a "Crashlytics" shell script build phase to the Xcode project that uploads
 * dSYM files to Firebase Crashlytics after each build. Any existing Crashlytics
 * build phase is removed first to prevent duplicates.
 *
 * The build phase runs the `FirebaseCrashlytics/run` script from the Pods directory
 * with the dSYM and GoogleService-Info.plist paths as inputs.
 */
var fs = require("fs");
var path = require("path");
var xcode = require("xcode");

/** @constant {string} The Xcode build phase comment/name used to identify the Crashlytics phase. */
var comment = "\"Crashlytics\"";

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
    var xcodeProjectPath = getXcodeProjectPath();
    removeShellScriptBuildPhase(xcodeProjectPath);
    addShellScriptBuildPhase(xcodeProjectPath);
};
