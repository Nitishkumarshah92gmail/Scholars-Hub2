# StudyShare Android App

Native Android APK powered by [Capacitor](https://capacitorjs.com).  
Bundles the compiled React frontend as local assets — no WebView-to-URL, no internet required to load the shell.

---

## Prerequisites

| Tool | Minimum version | Install |
|------|----------------|---------|
| Node.js | 18+ | https://nodejs.org |
| npm | 9+ | bundled with Node |
| Android Studio | Hedgehog (2023.1) or newer | https://developer.android.com/studio |
| Android SDK | API 33+ (Android 13) | via Android Studio SDK Manager |
| Java (JDK) | 17 | bundled with Android Studio |

---

## First-Time Setup (Do This Once)

### 1. Fill in your environment file

Edit `frontend/.env.production.app` and replace every placeholder:

```env
VITE_API_URL=https://scholars-hub2-1.onrender.com/api
VITE_SUPABASE_URL=https://YOUR_ID.supabase.co
VITE_SUPABASE_ANON_KEY=your_actual_anon_key
VITE_CANONICAL_ORIGIN=https://scholars-hub2-1.onrender.com
VITE_OPENROUTER_API_KEY=sk-or-...
VITE_YOUTUBE_API_KEY=AIza...
```

### 2. Install Capacitor dependencies

```powershell
cd studyshare-app
npm install
```

### 3. Install Capacitor CLI globally (optional but convenient)

```powershell
npm install -g @capacitor/cli
```

### 4. Initialise Capacitor (only if `capacitor.config.ts` was not picked up)

```powershell
# Run from studyshare-app/
npx cap init StudyShare com.studyshare.app --web-dir www
```

### 5. Run the Supabase migration

Open your Supabase project → **SQL Editor** → paste the contents of  
`supabase-push-schema.sql` and click **Run**.

### 6. Set up Firebase

1. Go to [Firebase Console](https://console.firebase.google.com) → **Add project**
2. Inside the project → **Add app** → **Android**
3. Set package name exactly: `com.studyshare.app`
4. Download `google-services.json`
5. Place the file at `studyshare-app/android/app/google-services.json`

> **NEVER commit google-services.json to source control** — the `.gitignore` already excludes it.

### 7. Add Firebase environment variables to your backend

In your Render/hosting dashboard (or local `.env`):

```
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
```

Get these from Firebase Console → **Project Settings** → **Service Accounts** → **Generate new private key**.

### 8. Install firebase-admin in the backend

```powershell
cd backend
npm install firebase-admin
```

### 9. Build the app and generate the Android project

```powershell
cd studyshare-app

# 1. Build frontend + copy to www/ + cap sync
.\scripts\build-app.ps1

# 2. Generate the Android Studio project (only needed once)
npx cap add android

# 3. Apply Gradle patches for Firebase
#    See patches/android-build.gradle.patch.txt
#    See patches/android-app-build.gradle.patch.txt
```

### 10. Open in Android Studio

```powershell
npx cap open android
```

---

## Building the Signed Release APK

1. In Android Studio: **Build → Generate Signed Bundle / APK**
2. Choose **APK** (not Bundle)
3. **Create new keystore** (first time only):
   - Save the `.jks` file somewhere **outside** the project directory and back it up
   - Remember the keystore password, key alias, and key password
4. Select **release** build variant
5. Check both **V1 (Jar Signature)** and **V2 (Full APK Signature)**
6. Click **Create**

Output: `android/app/release/app-release.apk`

> **CRITICAL:** Keep the keystore file safe. If you lose it, you cannot publish updates to users who installed the original APK (Android refuses to install an APK signed with a different key over an existing install).

### Recommended keystore backup strategy
- Copy the `.jks` file to a password manager (e.g. Bitwarden file attachment)
- Store a copy on an encrypted USB drive
- Document the passwords in your password manager

---

## Rebuilding After Website Updates

Every time the React website is updated and you want those changes in the APK:

```powershell
cd studyshare-app
.\scripts\build-app.ps1
```

Then in Android Studio: **Build → Generate Signed Bundle / APK** using the same keystore.

---

## App Icon

1. In Android Studio, right-click `android/app/src/main/res`
2. **New → Image Asset**
3. **Icon Type:** Launcher Icons (Adaptive and Legacy)
4. Select your StudyShare logo PNG as the source image
5. Set **Background layer** color to `#0f172a` (navy)
6. Click **Next → Finish**

This generates all required `mipmap-*` densities automatically.

---

## Signing an Updated APK with the Existing Keystore

```powershell
# Option A: Android Studio (GUI)
# Build → Generate Signed Bundle / APK → choose existing keystore → enter passwords

# Option B: Command line
cd studyshare-app/android
./gradlew assembleRelease

# Then sign manually:
jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 \
  -keystore /path/to/your.jks \
  app/build/outputs/apk/release/app-release-unsigned.apk \
  your-key-alias

# Zipalign for APK optimisation:
zipalign -v 4 \
  app/build/outputs/apk/release/app-release-unsigned.apk \
  app/release/app-release.apk
```

---

## Push Notification Testing

1. Install the APK on a real device or emulator with Google Play Services
2. Log into the app
3. In Firebase Console → **Cloud Messaging** → **Send test message**
4. Target **Registration token** → paste the FCM token from Logcat (`[PushNotifications] FCM token received`)
5. Send the message

---

## Troubleshooting

| Problem | Likely cause | Fix |
|---------|-------------|-----|
| API calls fail on device | CORS not updated | Confirm `capacitor://localhost` and `https://localhost` are in `ALLOWED_ORIGINS` in `backend/server.js` |
| Splash screen not navy | Old Android splash resource | Open Android Studio → `res/drawable/splash.xml` → check background color |
| Push not received | Missing `google-services.json` | Place file at `android/app/google-services.json` and sync |
| Push not received | Firebase creds not in backend env | Set `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` |
| `cap sync` fails | Android project not initialised | Run `npx cap add android` first |
| Gradle build fails | Google Services plugin missing | See `patches/android-build.gradle.patch.txt` |

---

## Project Structure

```
studyshare-app/
├── capacitor.config.ts       # Capacitor config (appId, plugins, scheme)
├── package.json              # Capacitor npm dependencies
├── .gitignore                # Excludes build artifacts and google-services.json
├── scripts/
│   └── build-app.ps1         # One-command build + sync script
├── patches/
│   ├── android-build.gradle.patch.txt      # Gradle classpath addition
│   └── android-app-build.gradle.patch.txt  # Google Services plugin addition
├── www/                      # Compiled React app (populated by build-app.ps1)
└── android/                  # Full Android Studio project (generated by cap add android)
    ├── app/
    │   ├── src/main/
    │   │   └── res/          # Icons, splash screen resources
    │   ├── build.gradle      # App-level Gradle (add google-services plugin here)
    │   └── google-services.json  # NOT committed — download from Firebase Console
    └── build.gradle          # Project-level Gradle (add classpath here)
```

---

## Related files in the main project

| File | Purpose |
|------|---------|
| `frontend/.env.production.app` | App-only env vars (absolute API URL) |
| `frontend/src/hooks/usePushNotifications.js` | FCM registration + deep-link hook |
| `backend/server.js` | CORS allowlist (includes Capacitor origins) |
| `backend/services/pushNotifications.js` | Firebase Admin push dispatch |
| `backend/routes/notifications.js` | `/register-device` + `/unregister-device` routes |
| `supabase-push-schema.sql` | `device_tokens` table migration |
