import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

interface HeaderProps {
  isLoggedIn: boolean;
  onLogoPress: () => void;
  onSignIn: () => void;
  onGetStarted: () => void;
  onDashboard: () => void;
  onSettings: () => void;
  onSignOut: () => void;
  onRoleSwitch: () => void;
  activeRole?: string;
  userName?: string;
}

export const AppHeader: React.FC<HeaderProps> = ({
  isLoggedIn,
  onLogoPress,
  onSignIn,
  onGetStarted,
  onDashboard,
  onSettings,
  onSignOut,
  onRoleSwitch,
  activeRole,
  userName,
}) => {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isCompact = width < 380;

  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: insets.top }]}
      edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onLogoPress}>
          <Text style={styles.logo}>N</Text>
        </TouchableOpacity>
        <View style={[styles.navLinks, isCompact && styles.navLinksCompact]}>
          {!isLoggedIn ? (
            <>
              <TouchableOpacity onPress={onSignIn}>
                <Text style={[styles.link, isCompact && styles.linkCompact]}>Sign In</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onGetStarted}>
                <Text style={[styles.link, isCompact && styles.linkCompact]}>Get Started</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity onPress={onDashboard}>
                <Text style={[styles.link, isCompact && styles.linkCompact]}>Dashboard</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onSettings}>
                <Text style={[styles.link, isCompact && styles.linkCompact]}>Settings</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onSignOut}>
                <Text style={[styles.link, isCompact && styles.linkCompact]}>Sign Out</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onRoleSwitch}>
                <Text style={[styles.link, isCompact && styles.linkCompact]}>Switch Role</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
        {isLoggedIn && userName && (
          <Text style={styles.userName}>{userName} ({activeRole})</Text>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  logo: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  navLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexShrink: 1,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  navLinksCompact: {
    gap: 6,
  },
  link: {
    fontSize: 15,
    color: '#007AFF',
    marginHorizontal: 4,
    fontWeight: '600',
  },
  linkCompact: {
    fontSize: 13,
  },
  userName: {
    fontSize: 13,
    color: '#333',
    marginLeft: 10,
  },
});
