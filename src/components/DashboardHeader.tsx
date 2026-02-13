import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';

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
}) => {
  const { width } = useWindowDimensions();
  const isCompact = width < 380;

  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onLogoPress}>
        <Text style={styles.logo}>N</Text>
      </TouchableOpacity>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={styles.infoRowContent}
        style={styles.infoRowScroll}
      >
        <Text style={[styles.userInfo, isCompact && styles.userInfoCompact]} numberOfLines={1}>
          {userName} ({role})
        </Text>
        <TouchableOpacity onPress={onRoleSwitch} style={styles.switchBtn}>
          <Text style={[styles.switchText, isCompact && styles.btnTextCompact]}>Switch</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onSignOut} style={styles.signOutBtn}>
          <Text style={[styles.signOutText, isCompact && styles.btnTextCompact]}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  logo: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  infoRowScroll: {
    flexShrink: 1,
  },
  infoRowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userInfo: {
    fontSize: 12,
    color: '#333',
    marginRight: 8,
    maxWidth: 120,
  },
  userInfoCompact: {
    fontSize: 11,
    maxWidth: 80,
  },
  switchBtn: {
    marginHorizontal: 2,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  switchText: {
    color: '#007AFF',
    fontWeight: '600',
    fontSize: 13,
  },
  signOutBtn: {
    marginHorizontal: 2,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  signOutText: {
    color: '#FF3B30',
    fontWeight: '600',
    fontSize: 13,
  },
  btnTextCompact: {
    fontSize: 12,
  },
});
