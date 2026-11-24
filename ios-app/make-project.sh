#!/bin/bash
# Makes the ADROS Xcode project in ios-app/ios (runs on GitHub's Mac; you don't need to run it).
set -euo pipefail
cd "$(dirname "$0")"
rm -rf ios
npm ci --no-audit --no-fund
# Swift Package Manager (no CocoaPods needed)
npx cap add ios --packagemanager SPM
npx cap sync ios
test -f ios/App/CapApp-SPM/Package.swift

# The app icon (1024 x 1024 PNG, no see-through parts)
cp icon-1024.png ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png

PL=ios/App/App/Info.plist
pb() { /usr/libexec/PlistBuddy -c "$1" "$PL"; }
# Words iPhone shows when ADROS asks for the camera / photos (school photos, answer photos)
pb "Add :NSCameraUsageDescription string ADROS uses the camera so you can take photos of school work and worksheet answers."
pb "Add :NSPhotoLibraryUsageDescription string ADROS opens your photos so you can add pictures of school work and worksheet answers."
pb "Add :NSPhotoLibraryAddUsageDescription string ADROS can save pictures and printouts to your photos."
# No special encryption (only normal HTTPS) -> no export question on every upload
pb "Add :ITSAppUsesNonExemptEncryption bool false"
# Modern iPhones only
pb "Delete :UIRequiredDeviceCapabilities"
pb "Add :UIRequiredDeviceCapabilities array"
pb "Add :UIRequiredDeviceCapabilities:0 string arm64"
echo "Xcode project ready in ios-app/ios"
