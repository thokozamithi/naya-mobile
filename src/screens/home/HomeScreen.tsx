import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  Dimensions,
} from 'react-native';
import { AppHeader } from '@/components/AppHeader';
import { useAuth } from '@/hooks/useAuth';

const HomeScreen = ({ navigation }: any) => {
  const { user, activeRole, signOut } = useAuth();
    // Header navigation handlers
    const handleLogoPress = () => {
      if (user) {
        navigation.navigate('RoleSelection');
      } else {
        navigation.navigate('Home');
      }
    };
    const handleSignIn = () => navigation.navigate('Login');
    const handleGetStarted = () => navigation.navigate('Login');
    const handleDashboard = () => {
      const target = getDashboardTarget();
      if (target) {
        navigation.navigate(target);
      } else {
        navigation.navigate('RoleSelection');
      }
    };
    const handleSettings = () => navigation.navigate('ProfileSettings');
    const handleSignOut = () => {
      signOut();
      navigation.navigate('Home');
    };
    const handleRoleSwitch = () => navigation.navigate('RoleSelection');
  const screenWidth = Dimensions.get('window').width;

  const getDashboardTarget = () => {
    const roleMap: Record<string, string> = {
      tenant: 'TenantHome',
      landlord: 'LandlordHome',
      builder: 'BuilderHome',
      specialist: 'SpecialistHome',
      employee: 'EmployeeHome',
    };
    return activeRole ? roleMap[activeRole] || 'Home' : null;
  };

  const quickAccessItems = [
    {
      id: 'properties',
      title: 'Properties',
      icon: '🏠',
      roles: ['landlord', 'tenant'],
      action: () => {
        const target = getDashboardTarget();
        if (!user) return navigation.navigate('Login');
        return navigation.navigate(target as any);
      },
    },
    {
      id: 'projects',
      title: 'Projects',
      icon: '📋',
      roles: ['builder', 'employee'],
      action: () => {
        const target = getDashboardTarget();
        if (!user) return navigation.navigate('Login');
        return navigation.navigate(target as any);
      },
    },
    {
      id: 'messaging',
      title: 'Messages',
      icon: '💬',
      roles: ['tenant', 'landlord', 'builder', 'specialist', 'employee'],
      action: () => {
        if (!user) return navigation.navigate('Login');
        return navigation.navigate('Messaging');
      },
    },
    {
      id: 'specialists',
      title: 'Find Specialists',
      icon: '🔧',
      roles: ['tenant', 'landlord', 'builder', 'employee'],
      action: () => {
        if (!user) return navigation.navigate('Login');
        return navigation.navigate('SpecialistDirectory');
      },
    },
    {
      id: 'profile',
      title: 'Profile Settings',
      icon: '⚙️',
      roles: ['tenant', 'landlord', 'builder', 'specialist', 'employee'],
      action: () => {
        if (!user) return navigation.navigate('Login');
        return navigation.navigate('ProfileSettings');
      },
    },
  ];

  const availableItems = quickAccessItems.filter((item) =>
    item.roles.includes(activeRole || '')
  );

  const getRoleGreeting = () => {
    switch (activeRole) {
      case 'tenant':
        return 'Tenant Dashboard';
      case 'landlord':
        return 'Landlord Dashboard';
      case 'builder':
        return 'Builder Dashboard';
      case 'specialist':
        return 'Specialist Dashboard';
      case 'employee':
        return 'Employee Dashboard';
      default:
        return 'Dashboard';
    }
  };

  const getRoleDescription = () => {
    switch (activeRole) {
      case 'tenant':
        return 'Browse properties, report issues, and connect with landlords';
      case 'landlord':
        return 'Manage your properties, track tenants, and handle maintenance';
      case 'builder':
        return 'Track your construction projects and manage teams';
      case 'specialist':
        return 'View job opportunities and connect with clients';
      case 'employee':
        return 'Manage assigned tasks and collaborate with teams';
      default:
        return 'Welcome to Naya app';
    }
  };

  return (
    <>
      <AppHeader
        isLoggedIn={!!user}
        onLogoPress={handleLogoPress}
        onSignIn={handleSignIn}
        onGetStarted={handleGetStarted}
        onDashboard={handleDashboard}
        onSettings={handleSettings}
        onSignOut={handleSignOut}
        onRoleSwitch={handleRoleSwitch}
        activeRole={activeRole || undefined}
        userName={user?.user_metadata?.full_name}
      />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <Text style={styles.greeting}>{getRoleGreeting()}</Text>
        <Text style={styles.userName}>{user?.user_metadata?.full_name || 'User'}</Text>
        <Text style={styles.description}>{getRoleDescription()}</Text>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Account Status</Text>
          <Text style={styles.statValue}>Active</Text>
          <Text style={styles.statSmall}>✓ Verified</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Current Role</Text>
          <Text style={styles.statValue}>{activeRole?.toUpperCase()}</Text>
          <Text style={styles.statSmall}>Switch in Settings</Text>
        </View>
      </View>

      {/* Quick Access */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Access</Text>
        <View style={styles.gridContainer}>
          {availableItems.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.quickAccessCard,
                index % 2 === 0 ? styles.cardLeft : styles.cardRight,
              ]}
              onPress={item.action}
            >
              <Text style={styles.quickAccessIcon}>{item.icon}</Text>
              <Text style={styles.quickAccessTitle}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.activityContainer}>
          <View style={styles.activityItem}>
            <View style={styles.activityDot} />
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>Welcome to Naya</Text>
              <Text style={styles.activityTime}>Just now</Text>
            </View>
          </View>
          <View style={styles.activityItem}>
            <View style={styles.activityDot} />
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>Set up complete</Text>
              <Text style={styles.activityTime}>Today</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Features Highlight */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Key Features</Text>
        <View style={styles.featuresList}>
          <View style={styles.featureItem}>
            <Text style={styles.featureBullet}>•</Text>
            <Text style={styles.featureText}>Real-time messaging with professionals</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureBullet}>•</Text>
            <Text style={styles.featureText}>Browse and hire verified specialists</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureBullet}>•</Text>
            <Text style={styles.featureText}>Track projects and maintenance requests</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureBullet}>•</Text>
            <Text style={styles.featureText}>Manage properties and subscriptions</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={styles.tourButton}
        onPress={() => {
          // TODO: Integrate driver.js or tour logic here
          Alert.alert('Tour', 'Tour would start (driver.js integration pending)');
        }}
      >
        <Text style={styles.tourButtonText}>Take a Tour</Text>
      </TouchableOpacity>
      <View style={styles.footer} />
    </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  tourButton: {
    alignSelf: 'flex-end',
    marginTop: 12,
    marginRight: 16,
    backgroundColor: '#007AFF',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 18,
    elevation: 2,
  },
  tourButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  welcomeSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  userName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
    marginBottom: 8,
  },
  description: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  statSmall: {
    fontSize: 11,
    color: '#28A745',
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickAccessCard: {
    flex: 1,
    backgroundColor: '#f0f8ff',
    borderRadius: 12,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 96,
    borderWidth: 1,
    borderColor: '#d0e8ff',
  },
  cardLeft: {
    marginRight: 6,
  },
  cardRight: {
    marginLeft: 6,
  },
  quickAccessIcon: {
    fontSize: 26,
    marginBottom: 8,
  },
  quickAccessTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
    textAlign: 'center',
  },
  activityContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
    marginRight: 12,
    marginTop: 6,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 13,
    color: '#000',
    fontWeight: '500',
  },
  activityTime: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  featuresList: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  featureBullet: {
    fontSize: 12,
    color: '#007AFF',
    marginRight: 12,
    fontWeight: '600',
  },
  featureText: {
    flex: 1,
    fontSize: 12,
    color: '#555',
    lineHeight: 16,
  },
  footer: {
    height: 20,
  },
});

export default HomeScreen;
