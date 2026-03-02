/**
 * @file before_plugin_uninstall.js
 * @brief Hook script that runs before the crashlytics plugin is uninstalled from iOS.
 *
 * Removes the "Crashlytics" shell script build phase from the Xcode project,
 * reversing the changes made by {@link module:scripts/ios/after_plugin_install}.
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
 * Cordova hook entry point.
 * Removes the Crashlytics dSYM upload build phase from the Xcode project.
 *
 * @param {object} context - The Cordova hook context.
 */
module.exports = function(context) {
    var xcodeProjectPath = getXcodeProjectPath();
    removeShellScriptBuildPhase(xcodeProjectPath);
};
