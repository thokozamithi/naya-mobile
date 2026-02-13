# React Native Mobile App - Setup Guide

## Quick Start

### 1. Install Latest Node & Expo CLI

```bash
# Install Node.js from https://nodejs.org (v18+)
# Then install Expo CLI globally
npm install -g expo-cli
```

### 2. Navigate to Project

```bash
cd "C:\Users\tk-ze\OneDrive\Documents\My App Dev\Naya mobile"
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Supabase

Create `.env.local` file in the project root:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your Supabase credentials:
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Get these from: https://app.supabase.com → Project Settings → API

### 5. Start Development Server

```bash
npm start
```

This will open Expo DevTools. Choose your platform:
- **Press `i`** for iOS simulator (requires Xcode on Mac)
- **Press `a`** for Android emulator (requires Android Studio)
- **Press `w`** for web preview
- **Scan QR code** with Expo Go app on your phone

## Project Structure

```
Naya mobile/
├── index.js                 # Entry point
├── package.json            # Dependencies
├── app.json                # Expo configuration
├── tsconfig.json           # TypeScript config
├── .env.local              # Environment variables (DO NOT COMMIT)
├── .gitignore
├── README.md
├── src/
│   ├── App.tsx             # Main app wrapper with providers
│   ├── screens/            # Screen components
│   │   ├── auth/           # Login, Register, Role selection
│   │   ├── dashboards/     # Tenant, Landlord, Builder, Specialist, Employee
│   │   ├── profile/        # User profile
│   │   └── common/         # Loading, error states
│   ├── components/         # Reusable UI components
│   ├── hooks/              # Custom React hooks
│   │   ├── useAuth.ts      # Authentication context
│   │   ├── useQueries.ts   # TanStack Query hooks
│   │   ├── useData.ts      # Data fetching hooks
│   │   └── useTheme.ts     # Theme utilities
│   ├── services/           # External service integration
│   │   └── supabase.ts     # Supabase client
│   ├── navigation/         # Navigation setup
│   │   └── RootNavigator.tsx
│   └── lib/                # Utilities
│       ├── utils.ts
│       ├── notifications.ts
│       ├── storage.ts
```

## Running on Different Platforms

### iOS Simulator (Mac only)

```bash
npm run ios
# Or from Expo menu: press 'i'
```

Requires:
- Xcode installed
- iOS simulator downloaded via Xcode

### Android Emulator

```bash
npm run android
# Or from Expo menu: press 'a'
```

Requires:
- Android Studio installed
- Android emulator configured
- Android SDK setup

### Physical Device

1. Install Expo Go app on your phone (iOS App Store or Google Play Store)
2. Run `npm start`
3. Scan the QR code with your phone's camera
4. App opens in Expo Go

## Building for Production

### iOS App Store

```bash
eas build --platform ios
```

Requirements:
- Apple Developer account ($99/year)
- Provisioning profiles set up
- EAS CLI: `npm install -g eas-cli`

### Google Play Store

```bash
eas build --platform android
```

Requirements:
- Google Play account ($25 one-time fee)
- Keystore file generated
- EAS CLI: `npm install -g eas-cli`

## Troubleshooting

### Port 8081 Already in Use
```bash
# Windows
netstat -ano | findstr :8081
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :8081
kill -9 <PID>
```

### Clear Cache & Reinstall
```bash
npm start -c
cd node_modules
rm -rf .expo
cd ..
npm install
```

### Supabase Connection Issues
1. Check `.env.local` exists and has correct credentials
2. Verify Supabase project is active
3. Check API key permissions in Supabase dashboard
4. Test with: `npm start` and check console for errors

### iOS Simulator Issues
```bash
# Restart simulator
xcrun simctl shutdown all
xcrun simctl erase all

# Rebuild app
npm run ios -- --rebuild
```

### Android Emulator Issues
```bash
# Clear emulator data
emulator -avd YourAVDName -wipe-data

# Rebuild app
npm run android -- --rebuild
```

## Sharing Code Between Web and Mobile

Your project currently has:
- **Web app**: `../Naya Central App` (React + Vite)
- **Mobile app**: Current directory (React Native + Expo)

### Shared Code

Both apps share the same Supabase backend and authentication. To maximize code reuse:

1. **Authentication** - Both apps use `useAuth` hook pattern
2. **API layer** - Both apps use Supabase directly
3. **Business logic** - Can be extracted to shared utilities
4. **Type definitions** - Can share TypeScript types

### Future Monorepo Setup (Optional)

To share more code between web and mobile:

```
naya-project/
├── packages/
│   ├── web/                # React web app
│   ├── mobile/             # React Native app
│   ├── shared/             # Shared utilities
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   └── utils/
│   └── supabase/           # Supabase functions
```

## Additional Resources

- [React Native Docs](https://reactnative.dev)
- [Expo Docs](https://docs.expo.dev)
- [React Navigation](https://reactnavigation.org)
- [Supabase Docs](https://supabase.com/docs)
- [TanStack Query](https://tanstack.com/query)

## Common Commands

```bash
# Start development
npm start

# Run on iOS
npm run ios

# Run on Android  
npm run android

# Run on web
npm run web

# Type check
npm run type-check

# Lint code
npm run lint

# Build for production
eas build --platform ios
eas build --platform android
```

## Next Steps

1. ✅ Project structure is set up
2. ✅ Authentication is configured
3. ✅ Navigation is ready
4. ⏭️ **Next**: Add your Supabase credentials to `.env.local`
5. ⏭️ **Then**: Run `npm install` and `npm start`
6. ⏭️ **Finally**: Test on device/emulator

Good luck! 🚀
