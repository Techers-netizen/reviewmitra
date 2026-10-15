# 📱 ReviewMitra — Native Android Project

This folder contains the complete, dedicated native Android project for **ReviewMitra** (`com.opensoz.reviewmitra`).

---

## 🚀 Features of the Android App

1. **Native Mobile Shell & Layout:**
   - Emerald Material Top App Bar with auto-updating page title.
   - Native Bottom Navigation Bar (`Overview`, `Reviews`, `QR Standee`, `Auto-Reply`, `Settings`).
   - Native Swipe-to-Refresh with emerald progress spinner.
   - Offline connection detection with intuitive "Retry" screen.
   - Native back-press navigation handling.
2. **Deep-Link & External App Intents:**
   - Review links (Google Maps, Facebook, WhatsApp alerts) automatically open in their real external native apps!
3. **Hardware & JavaScript Bridge (`WebAppInterface`):**
   - Haptic vibration on button taps (`AndroidBridge.vibrate(50)`).
   - Native Android toasts.

---

## 🛠️ How to Open and Build for Google Play Store

### 1. Open in Android Studio
1. Launch **Android Studio**.
2. Select **Open an Existing Project** and choose the `android` folder:
   `c:\Users\lenopvo\Desktop\ANTIGRAVITY PROJECT\Reviewmitra\android`
3. Android Studio will automatically sync Gradle dependencies (`compileSdk 34`, `androidx`, `material`).

### 2. Generate Signed Bundle (.aab) for Google Play Store
1. In Android Studio top menu:
   👉 **Build** > **Generate Signed Bundle / APK...**
2. Choose **Android App Bundle** (`.aab`).
3. Select or create your Keystore file (`release.keystore`).
4. Select build variant: **release**.
5. Click **Finish**!
6. Android Studio will output:
   `app/release/app-release.aab`

### 3. Upload to Google Play Console
1. Go to [Google Play Console](https://play.google.com/console).
2. Select your App > **Production** (or **Closed Testing**).
3. Click **Create new release** and drag & drop `app-release.aab`.
4. Enter Release notes:
   *"Initial release of ReviewMitra — AI-Powered Review Management for Local Businesses."*
5. Submit for Review!

---

**Publisher:** OpenSoz Technologies  
**Support:** help.opensoz@gmail.com
