var fs = require("fs");
var path = require("path");
var xcode = require("xcode");

var comment = "\"Crashlytics\"";

function getAppName() {
    var configXmlPath = path.join("config.xml");
    var content = fs.readFileSync(configXmlPath, "utf-8");
    var match = content.match(/<name[^>]*>([^<]+)<\/name>/);
    return match ? match[1] : null;
}

function getXcodeProjectPath() {
    var appName = getAppName();
    var newPath = path.join("platforms", "ios", "App.xcodeproj", "project.pbxproj");
    var oldPath = path.join("platforms", "ios", appName + ".xcodeproj", "project.pbxproj");

    if (fs.existsSync(newPath)) {
        return newPath;
    }
    return oldPath;
}

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

module.exports = function(context) {
    var xcodeProjectPath = getXcodeProjectPath();
    removeShellScriptBuildPhase(xcodeProjectPath);
    addShellScriptBuildPhase(xcodeProjectPath);
};
