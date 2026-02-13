# Naya Central - React Native Mobile App

This is the iOS and Android mobile version of Naya Central, built with React Native and Expo.

## Prerequisites

- Node.js (v18+)
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- For iOS development: Xcode
- For Android development: Android Studio

## Installation

1. Install dependencies:
```bash
npm install
# or
yarn install
```

2. Create a `.env.local` file with your Supabase credentials:
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Development

Start the Expo development server:

```bash
npm start
```

Then choose your platform:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Press `w` for web

## Building

### iOS
```bash
eas build --platform ios
```

### Android
```bash
eas build --platform android
```

## Project Structure

```
src/
├── App.tsx                 # Main app component
├── screens/               # Screen components by feature
│   ├── auth/             # Login, Register, Role selection
│   ├── dashboards/       # Role-based dashboards
│   ├── profile/          # User profile
│   └── common/           # Loading, error screens
├── components/           # Reusable UI components
├── hooks/               # Custom React hooks
├── services/            # API and external services
├── navigation/          # Navigation configuration
└── lib/                 # Utilities and helpers
```

## Features

- Multi-role authentication (Tenant, Landlord, Builder, Specialist, Employee)
- Role-based dashboards
- User profile management
- Real-time sync with Supabase backend
- Native mobile UI components

## Sharing Code with Web App

This mobile app shares several components with the web version:
- Authentication logic (`useAuth` hook)
- Supabase client configuration
- User queries and data fetching hooks
- Business logic

To share more code, consider:
1. Moving shared logic to a `@naya/shared` package
2. Creating a monorepo structure
3. Using conditional imports for platform-specific code

## Troubleshooting

### Port Already in Use
```bash
pkill -f "Expo dev server"
```

### Clear Cache
```bash
expo start -c
```

### Rebuild Dependencies
```bash
rm -rf node_modules .expo
npm install
```

## Support

For issues or questions, please create an issue in the main repository.
