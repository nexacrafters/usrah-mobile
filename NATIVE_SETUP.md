# Native Setup Guide for Usrah Mobile

This guide will help you initialize the native Android and iOS folders and configure all permissions.

## Prerequisites

- Node.js 18+ installed
- React Native CLI installed globally: `npm install -g react-native-cli`
- For iOS: Xcode 14+, CocoaPods
- For Android: Android Studio, JDK 17+

---

## Step 1: Initialize Native Project

```bash
# Create a fresh React Native project
npx react-native@latest init usrahMobileNative --version 0.76.8

# Copy all src/ files to the new project
# Windows
xcopy /E /I usrah-mobile\src usrahMobileNative\src

# macOS/Linux
cp -r usrah-mobile/src usrahMobileNative/src

# Copy package.json dependencies (merge them)
# Install all dependencies
cd usrahMobileNative
npm install
```

---

## Step 2: Android Permissions Configuration

### AndroidManifest.xml

Add the following permissions to `android/app/src/main/AndroidManifest.xml`:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <!-- Internet & Network -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <!-- Camera -->
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-feature android:name="android.hardware.camera" android:required="false" />
    <uses-feature android:name="android.hardware.camera.front" android:required="false" />

    <!-- Location (for Qibla direction) -->
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />

    <!-- Biometric/Fingerprint -->
    <uses-permission android:name="android.permission.USE_BIOMETRIC" />
    <uses-permission android:name="android.permission.USE_FINGERPRINT" />

    <!-- Notifications -->
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-permission android:name="android.permission.VIBRATE" />

    <!-- Storage (for recipe images) -->
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />

    <application
      android:name=".MainApplication"
      android:label="@string/app_name"
      android:icon="@mipmap/ic_launcher"
      android:roundIcon="@mipmap/ic_launcher_round"
      android:allowBackup="false"
      android:theme="@style/AppTheme"
      android:usesCleartextTraffic="true">

      <!-- Main Activity -->
      <activity
        android:name=".MainActivity"
        android:label="@string/app_name"
        android:configChanges="keyboard|keyboardHidden|orientation|screenLayout|screenSize|smallestScreenSize|uiMode"
        android:launchMode="singleTask"
        android:windowSoftInputMode="adjustResize"
        android:exported="true">
        <intent-filter>
          <action android:name="android.intent.action.MAIN" />
          <category android:name="android.intent.category.LAUNCHER" />
        </intent-filter>
      </activity>
    </application>

</manifest>
```

### build.gradle

Update `android/app/build.gradle`:

```gradle
android {
    compileSdkVersion 34

    defaultConfig {
        applicationId "com.usrah.mobile"
        minSdkVersion 24
        targetSdkVersion 34
        versionCode 1
        versionName "1.0.0"
        multiDexEnabled true
    }

    buildTypes {
        release {
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}

dependencies {
    implementation fileTree(dir: "libs", include: ["*.jar"])
    implementation "com.facebook.react:react-android"

    // For new architecture
    implementation "com.facebook.react:react-native"
    implementation "com.facebook.react:hermes-android"

    // Camera
    implementation project(':react-native-vision-camera')

    // Biometrics
    implementation project(':react-native-biometrics')

    // Notifications
    implementation project(':notifee_react-native')
}
```

---

## Step 3: iOS Permissions Configuration

### Info.plist

Add the following to `ios/usrahMobileNative/Info.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <!-- Camera Permission -->
    <key>NSCameraUsageDescription</key>
    <string>Usrah needs camera access to take photos for recipes and profile pictures</string>

    <!-- Photo Library Permission -->
    <key>NSPhotoLibraryUsageDescription</key>
    <string>Usrah needs access to your photos to upload recipe images</string>
    <key>NSPhotoLibraryAddUsageDescription</key>
    <string>Usrah needs access to save photos to your library</string>

    <!-- Location Permission (for Qibla) -->
    <key>NSLocationWhenInUseUsageDescription</key>
    <string>Usrah needs your location to calculate prayer times and Qibla direction</string>
    <key>NSLocationAlwaysUsageDescription</key>
    <string>Usrah needs your location for accurate prayer time notifications</string>

    <!-- Biometric Permission -->
    <key>NSFaceIDUsageDescription</key>
    <string>Usrah uses Face ID for secure and convenient login</string>

    <!-- Notifications -->
    <key>UIBackgroundModes</key>
    <array>
        <string>remote-notification</string>
    </array>

    <!-- App Transport Security -->
    <key>NSAppTransportSecurity</key>
    <dict>
        <key>NSAllowsArbitraryLoads</key>
        <true/>
        <key>NSExceptionDomains</key>
        <dict>
            <key>localhost</key>
            <dict>
                <key>NSExceptionAllowsInsecureHTTPLoads</key>
                <true/>
            </dict>
        </dict>
    </dict>
</dict>
</plist>
```

### Podfile

Update `ios/Podfile`:

```ruby
# Resolve react_native_pods.rb with node to allow for hoisting
require_relative '../node_modules/react-native/scripts/react_native_pods'
require_relative '../node_modules/@react-native-community/cli-platform-ios/native_modules'

platform :ios, min_ios_version_supported
prepare_react_native_project!

target 'usrahMobileNative' do
  config = use_native_modules!

  use_react_native!(
    :path => config[:reactNativePath],
    :hermes_enabled => true,
    :fabric_enabled => false, # Set to true for new architecture
    :app_clip_enabled => false
  )

  # Native modules
  pod 'react-native-vision-camera', :path => '../node_modules/react-native-vision-camera'
  pod 'react-native-biometrics', :path => '../node_modules/react-native-biometrics'
  pod 'RNNotifee', :path => '../node_modules/@notifee/react-native'

  post_install do |installer|
    react_native_post_install(
      installer,
      config[:reactNativePath],
      :mac_catalyst_enabled => false
    )
  end
end
```

---

## Step 4: Install Pods (iOS only)

```bash
cd ios
pod install
cd ..
```

---

## Step 5: Run the App

### Android

```bash
# Start Metro bundler
npm start

# In another terminal, run Android
npm run android
# or
npx react-native run-android
```

### iOS

```bash
# Start Metro bundler
npm start

# In another terminal, run iOS
npm run ios
# or
npx react-native run-ios
```

---

## Step 6: Configure Native Modules

### Camera (react-native-vision-camera)

1. The permissions are already added above
2. Camera component is ready to use in the app
3. Use the CameraService wrapper in `src/services/native/camera.service.ts`

### Biometrics (react-native-biometrics)

1. The permissions are already added above
2. Use the BiometricService wrapper in `src/services/native/biometric.service.ts`
3. Enable biometric login in the Login screen

### Notifications (@notifee/react-native)

1. The permissions are already added above
2. Use the NotificationService wrapper in `src/services/native/notification.service.ts`
3. Set up prayer time notifications in the Prayer Times screen

### Location (@react-native-community/geolocation)

1. The permissions are already added above
2. Use the LocationService wrapper in `src/services/native/location.service.ts`
3. Calculate Qibla direction for the Prayer Times screen

### Secure Storage (react-native-keychain)

1. No permissions needed
2. Use the StorageService wrapper in `src/services/native/storage.service.ts`
3. Store encryption keys and credentials securely

---

## Step 7: Enable Services in Code

### Uncomment Native Module Imports

Go to each service file in `src/services/native/` and uncomment the imports:

1. `biometric.service.ts` - Uncomment `import ReactNativeBiometrics`
2. `camera.service.ts` - Uncomment `import {Camera, useCameraDevices}`
3. `notification.service.ts` - Uncomment `import notifee`
4. `storage.service.ts` - Uncomment `import * as Keychain`
5. `location.service.ts` - Uncomment `import Geolocation`

Also uncomment the actual implementation code (currently using mocks).

---

## Step 8: Test All Features

### Test Checklist

- [ ] App launches successfully
- [ ] Onboarding screens swipe correctly
- [ ] Login screen displays
- [ ] Biometric authentication works
- [ ] Camera opens for recipe photos
- [ ] Location permission requested
- [ ] Qibla direction calculated
- [ ] Prayer time notifications scheduled
- [ ] Chat messages send/receive
- [ ] Expenses, tasks, recipes CRUD operations
- [ ] Navigation between all screens
- [ ] Islamic features (prayer times, dhikr counter)

---

## Troubleshooting

### Android Build Errors

```bash
# Clean build
cd android
./gradlew clean
cd ..

# Rebuild
npm run android
```

### iOS Build Errors

```bash
# Clean build
cd ios
rm -rf Pods Podfile.lock
pod install
cd ..

# Rebuild
npm run ios
```

### Metro Bundler Issues

```bash
# Reset cache
npm start -- --reset-cache

# Or
npx react-native start --reset-cache
```

### Native Module Linking Issues

```bash
# Auto-link
npx react-native link

# Or manually rebuild
cd android && ./gradlew clean && cd ..
cd ios && pod install && cd ..
```

---

## Production Build

### Android APK

```bash
cd android
./gradlew assembleRelease
# APK location: android/app/build/outputs/apk/release/app-release.apk
```

### iOS Archive

1. Open `ios/usrahMobileNative.xcworkspace` in Xcode
2. Product → Archive
3. Distribute App → App Store Connect

---

## Next Steps

1. **Backend Integration**: Connect to usrah-api backend
2. **Prayer Times API**: Integrate real prayer times service
3. **Testing**: Complete testing on real devices
4. **App Store Submission**: Prepare for iOS App Store and Google Play Store
5. **Analytics**: Add Firebase Analytics
6. **Crash Reporting**: Add Sentry or Firebase Crashlytics

---

## Support

For issues, refer to:
- React Native Documentation: https://reactnative.dev/docs/getting-started
- React Native Vision Camera: https://react-native-vision-camera.com/
- Notifee: https://notifee.app/
- Geolocation: https://github.com/react-native-community/geolocation

---

**App is ready for native deployment! 🎉**
