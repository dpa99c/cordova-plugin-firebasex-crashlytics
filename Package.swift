// swift-tools-version:5.9
import PackageDescription

let firebaseSDKVersion: Version = "undefined"

let package = Package(
    name: "cordova-plugin-firebasex-crashlytics",
    platforms: [.iOS(.v13)],
    products: [
        .library(
            name: "cordova-plugin-firebasex-crashlytics",
            targets: ["FirebasexCrashlyticsPlugin"]
        )
    ],
    dependencies: [
        .package(url: "https://github.com/apache/cordova-ios.git", branch: "master"),
        .package(url: "https://github.com/firebase/firebase-ios-sdk.git", exact: firebaseSDKVersion),
    ],
    targets: [
        .target(
            name: "FirebasexCrashlyticsPlugin",
            dependencies: [
                .product(name: "Cordova", package: "cordova-ios"),
                .product(name: "FirebaseCrashlytics", package: "firebase-ios-sdk"),
            ],
            path: "src/ios",
            publicHeadersPath: "."
        )
    ]
)