import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface DashboardHeaderProps {
  onLogoPress: () => void;
  onRoleSwitch: () => void;
  onSignOut: () => void;
  userName?: string;
  role?: string;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  onLogoPress,
  onRoleSwitch,
  onSignOut,
  userName,
  role,
}) => (
  <View style={styles.header}>
    <TouchableOpacity onPress={onLogoPress}>
      <Text style={styles.logo}>N</Text>
    </TouchableOpacity>
    <View style={styles.infoRow}>
      <Text style={styles.userInfo}>{userName} ({role})</Text>
      <TouchableOpacity onPress={onRoleSwitch} style={styles.switchBtn}>
        <Text style={styles.switchText}>Switch Role</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onSignOut} style={styles.signOutBtn}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  </View>
);

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
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userInfo: {
    fontSize: 13,
    color: '#333',
    marginRight: 10,
  },
  switchBtn: {
    marginHorizontal: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  switchText: {
    color: '#007AFF',
    fontWeight: '600',
    fontSize: 15,
  },
  signOutBtn: {
    marginHorizontal: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  signOutText: {
    color: '#FF3B30',
    fontWeight: '600',
    fontSize: 15,
  },
});
