import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

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
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onLogoPress}>
        <Text style={styles.logo}>N</Text>
      </TouchableOpacity>
      <View style={styles.navLinks}>
        {!isLoggedIn ? (
          <>
            <TouchableOpacity onPress={onSignIn}><Text style={styles.link}>Sign In</Text></TouchableOpacity>
            <TouchableOpacity onPress={onGetStarted}><Text style={styles.link}>Get Started</Text></TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity onPress={onDashboard}><Text style={styles.link}>Dashboard</Text></TouchableOpacity>
            <TouchableOpacity onPress={onSettings}><Text style={styles.link}>Settings</Text></TouchableOpacity>
            <TouchableOpacity onPress={onSignOut}><Text style={styles.link}>Sign Out</Text></TouchableOpacity>
            <TouchableOpacity onPress={onRoleSwitch}><Text style={styles.link}>Switch Role</Text></TouchableOpacity>
          </>
        )}
      </View>
      {isLoggedIn && userName && (
        <Text style={styles.userName}>{userName} ({activeRole})</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
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
  },
  link: {
    fontSize: 15,
    color: '#007AFF',
    marginHorizontal: 8,
    fontWeight: '600',
  },
  userName: {
    fontSize: 13,
    color: '#333',
    marginLeft: 10,
  },
});
