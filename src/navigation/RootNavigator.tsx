import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, Platform } from 'react-native';
import { useAuth } from '@/hooks/useAuth';

// Import screens
import LoginScreen from '@/screens/auth/LoginScreen';
import RegisterScreen from '@/screens/auth/RegisterScreen';
import RoleSelectionScreen from '@/screens/auth/RoleSelectionScreen';
import TenantDashboard from '@/screens/dashboards/TenantDashboard';
import LandlordDashboard from '@/screens/dashboards/LandlordDashboard';
import BuilderDashboard from '@/screens/dashboards/BuilderDashboard';
import SpecialistDashboard from '@/screens/dashboards/SpecialistDashboard';
import EmployeeDashboard from '@/screens/dashboards/EmployeeDashboard';
import ProfileScreen from '@/screens/profile/ProfileScreen';
import ProfileSettingsScreen from '@/screens/profile/ProfileSettingsScreen';
import LoadingScreen from '@/screens/common/LoadingScreen';
import PropertyDetailScreen from '@/screens/property/PropertyDetailScreen';
import AddPropertyScreen from '@/screens/property/AddPropertyScreen';
import AddUnitScreen from '@/screens/property/AddUnitScreen';
import EditPropertyScreen from '@/screens/property/EditPropertyScreen';
import PropertyPaymentsScreen from '@/screens/property/PropertyPaymentsScreen';
import ProjectDetailScreen from '@/screens/project/ProjectDetailScreen';
import MessagingScreen from '@/screens/messaging/MessagingScreen';
import CreateMaintenanceRequestScreen from '@/screens/maintenance/CreateMaintenanceRequestScreen';
import MaintenanceRequestDetailScreen from '@/screens/maintenance/MaintenanceRequestDetailScreen';
import SpecialistDirectoryScreen from '@/screens/specialists/SpecialistDirectoryScreen';
import SpecialistRegistrationScreen from '@/screens/specialists/SpecialistRegistrationScreen';
import SpecialistProfileScreen from '@/screens/specialists/SpecialistProfileScreen';
import UpgradeScreen from '@/screens/subscription/UpgradeScreen';
import JoinPropertyScreen from '@/screens/tenant/JoinPropertyScreen';
import PayRentScreen from '@/screens/tenant/PayRentScreen';
import PaymentHistoryScreen from '@/screens/tenant/PaymentHistoryScreen';
import HomeScreen from '@/screens/home/HomeScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const tabScreenOptions = {
  headerShown: true,
  tabBarActiveTintColor: '#007AFF',
  tabBarInactiveTintColor: '#8E8E93',
  tabBarStyle: {
    backgroundColor: '#fff',
    borderTopColor: '#e0e0e0',
    paddingBottom: Platform.OS === 'ios' ? 0 : 4,
  },
  tabBarLabelStyle: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
};

const TabIcon = ({ label, focused }: { label: string; focused: boolean }) => (
  <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{label}</Text>
);

const AuthStack = () => (
  <Stack.Navigator initialRouteName="Landing" screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Landing" component={HomeScreen} />
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
);

const TenantTabsNavigator = () => (
  <Tab.Navigator screenOptions={tabScreenOptions}>
    <Tab.Screen
      name="Home"
      component={HomeScreen}
      options={{
        title: 'Home',
        tabBarIcon: ({ focused }) => <TabIcon label="🏠" focused={focused} />,
      }}
    />
    <Tab.Screen
      name="TenantHome"
      component={TenantDashboard}
      options={{
        title: 'Dashboard',
        tabBarIcon: ({ focused }) => <TabIcon label="📋" focused={focused} />,
      }}
    />
    <Tab.Screen
      name="Profile"
      component={ProfileScreen}
      options={{
        title: 'Profile',
        tabBarIcon: ({ focused }) => <TabIcon label="👤" focused={focused} />,
      }}
    />
  </Tab.Navigator>
);

const TenantTabs = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="TenantTabsStack" component={TenantTabsNavigator} />
    <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} options={{ headerShown: true, title: 'Select Role' }} />
    <Stack.Screen name="PropertyDetail" component={PropertyDetailScreen} options={{ headerShown: true }} />
    <Stack.Screen name="Messaging" component={MessagingScreen} options={{ headerShown: true }} />
    <Stack.Screen name="CreateMaintenanceRequest" component={CreateMaintenanceRequestScreen} options={{ headerShown: false, presentation: 'modal' }} />
    <Stack.Screen name="MaintenanceRequestDetail" component={MaintenanceRequestDetailScreen} options={{ headerShown: true, title: 'Maintenance Request' }} />
    <Stack.Screen name="ProfileSettings" component={ProfileSettingsScreen} options={{ headerShown: true }} />
    <Stack.Screen name="SpecialistDirectory" component={SpecialistDirectoryScreen} options={{ headerShown: true }} />
    <Stack.Screen name="SpecialistProfile" component={SpecialistProfileScreen} options={{ headerShown: true, title: 'Specialist' }} />
    <Stack.Screen name="SpecialistRegistration" component={SpecialistRegistrationScreen} options={{ headerShown: true, title: 'Register as Specialist' }} />
    <Stack.Screen name="JoinProperty" component={JoinPropertyScreen} options={{ headerShown: false, presentation: 'modal' }} />
    <Stack.Screen name="PayRent" component={PayRentScreen} options={{ headerShown: false }} />
    <Stack.Screen name="PaymentHistory" component={PaymentHistoryScreen} options={{ headerShown: false }} />
    <Stack.Screen name="Upgrade" component={UpgradeScreen} options={{ headerShown: true, title: 'Upgrade' }} />
  </Stack.Navigator>
);

const LandlordTabsNavigator = () => (
  <Tab.Navigator screenOptions={tabScreenOptions}>
    <Tab.Screen
      name="Home"
      component={HomeScreen}
      options={{
        title: 'Home',
        tabBarIcon: ({ focused }) => <TabIcon label="🏠" focused={focused} />,
      }}
    />
    <Tab.Screen
      name="LandlordHome"
      component={LandlordDashboard}
      options={{
        title: 'Properties',
        tabBarIcon: ({ focused }) => <TabIcon label="🏢" focused={focused} />,
      }}
    />
    <Tab.Screen
      name="Profile"
      component={ProfileScreen}
      options={{
        title: 'Profile',
        tabBarIcon: ({ focused }) => <TabIcon label="👤" focused={focused} />,
      }}
    />
  </Tab.Navigator>
);

const LandlordTabs = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="LandlordTabsStack" component={LandlordTabsNavigator} />
    <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} options={{ headerShown: true, title: 'Select Role' }} />
    <Stack.Screen name="PropertyDetail" component={PropertyDetailScreen} options={{ headerShown: true }} />
    <Stack.Screen name="PropertyPayments" component={PropertyPaymentsScreen} options={{ headerShown: false }} />
    <Stack.Screen name="AddProperty" component={AddPropertyScreen} options={{ headerShown: false, presentation: 'modal' }} />
    <Stack.Screen name="AddUnit" component={AddUnitScreen} options={{ headerShown: false, presentation: 'modal' }} />
    <Stack.Screen name="EditProperty" component={EditPropertyScreen} options={{ headerShown: false, presentation: 'modal' }} />
    <Stack.Screen name="Messaging" component={MessagingScreen} options={{ headerShown: true }} />
    <Stack.Screen name="CreateMaintenanceRequest" component={CreateMaintenanceRequestScreen} options={{ headerShown: false, presentation: 'modal' }} />
    <Stack.Screen name="MaintenanceRequestDetail" component={MaintenanceRequestDetailScreen} options={{ headerShown: true, title: 'Maintenance Request' }} />
    <Stack.Screen name="ProfileSettings" component={ProfileSettingsScreen} options={{ headerShown: true }} />
    <Stack.Screen name="SpecialistDirectory" component={SpecialistDirectoryScreen} options={{ headerShown: true }} />
    <Stack.Screen name="SpecialistProfile" component={SpecialistProfileScreen} options={{ headerShown: true, title: 'Specialist' }} />
    <Stack.Screen name="SpecialistRegistration" component={SpecialistRegistrationScreen} options={{ headerShown: true, title: 'Register as Specialist' }} />
    <Stack.Screen name="Upgrade" component={UpgradeScreen} options={{ headerShown: true, title: 'Upgrade' }} />
  </Stack.Navigator>
);

const BuilderTabsNavigator = () => (
  <Tab.Navigator screenOptions={tabScreenOptions}>
    <Tab.Screen
      name="Home"
      component={HomeScreen}
      options={{
        title: 'Home',
        tabBarIcon: ({ focused }) => <TabIcon label="🏠" focused={focused} />,
      }}
    />
    <Tab.Screen
      name="BuilderHome"
      component={BuilderDashboard}
      options={{
        title: 'Projects',
        tabBarIcon: ({ focused }) => <TabIcon label="🔨" focused={focused} />,
      }}
    />
    <Tab.Screen
      name="Profile"
      component={ProfileScreen}
      options={{
        title: 'Profile',
        tabBarIcon: ({ focused }) => <TabIcon label="👤" focused={focused} />,
      }}
    />
  </Tab.Navigator>
);

const BuilderTabs = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="BuilderTabsStack" component={BuilderTabsNavigator} />
    <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} options={{ headerShown: true, title: 'Select Role' }} />
    <Stack.Screen name="ProjectDetail" component={ProjectDetailScreen} options={{ headerShown: true }} />
    <Stack.Screen name="PropertyDetail" component={PropertyDetailScreen} options={{ headerShown: true }} />
    <Stack.Screen name="Messaging" component={MessagingScreen} options={{ headerShown: true }} />
    <Stack.Screen name="ProfileSettings" component={ProfileSettingsScreen} options={{ headerShown: true }} />
    <Stack.Screen name="SpecialistDirectory" component={SpecialistDirectoryScreen} options={{ headerShown: true }} />
    <Stack.Screen name="SpecialistProfile" component={SpecialistProfileScreen} options={{ headerShown: true, title: 'Specialist' }} />
    <Stack.Screen name="SpecialistRegistration" component={SpecialistRegistrationScreen} options={{ headerShown: true, title: 'Register as Specialist' }} />
    <Stack.Screen name="Upgrade" component={UpgradeScreen} options={{ headerShown: true, title: 'Upgrade' }} />
  </Stack.Navigator>
);

const SpecialistTabsNavigator = () => (
  <Tab.Navigator screenOptions={tabScreenOptions}>
    <Tab.Screen
      name="Home"
      component={HomeScreen}
      options={{
        title: 'Home',
        tabBarIcon: ({ focused }) => <TabIcon label="🏠" focused={focused} />,
      }}
    />
    <Tab.Screen
      name="SpecialistHome"
      component={SpecialistDashboard}
      options={{
        title: 'Jobs',
        tabBarIcon: ({ focused }) => <TabIcon label="🔧" focused={focused} />,
      }}
    />
    <Tab.Screen
      name="Profile"
      component={ProfileScreen}
      options={{
        title: 'Profile',
        tabBarIcon: ({ focused }) => <TabIcon label="👤" focused={focused} />,
      }}
    />
  </Tab.Navigator>
);

const SpecialistTabs = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="SpecialistTabsStack" component={SpecialistTabsNavigator} />
    <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} options={{ headerShown: true, title: 'Select Role' }} />
    <Stack.Screen name="Messaging" component={MessagingScreen} options={{ headerShown: true }} />
    <Stack.Screen name="ProfileSettings" component={ProfileSettingsScreen} options={{ headerShown: true }} />
    <Stack.Screen name="SpecialistDirectory" component={SpecialistDirectoryScreen} options={{ headerShown: true }} />
    <Stack.Screen name="SpecialistProfile" component={SpecialistProfileScreen} options={{ headerShown: true, title: 'Specialist' }} />
    <Stack.Screen name="SpecialistRegistration" component={SpecialistRegistrationScreen} options={{ headerShown: true, title: 'Edit Specialist Profile' }} />
    <Stack.Screen name="Upgrade" component={UpgradeScreen} options={{ headerShown: true, title: 'Upgrade' }} />
  </Stack.Navigator>
);

const EmployeeTabsNavigator = () => (
  <Tab.Navigator screenOptions={tabScreenOptions}>
    <Tab.Screen
      name="Home"
      component={HomeScreen}
      options={{
        title: 'Home',
        tabBarIcon: ({ focused }) => <TabIcon label="🏠" focused={focused} />,
      }}
    />
    <Tab.Screen
      name="EmployeeHome"
      component={EmployeeDashboard}
      options={{
        title: 'Dashboard',
        tabBarIcon: ({ focused }) => <TabIcon label="📊" focused={focused} />,
      }}
    />
    <Tab.Screen
      name="Profile"
      component={ProfileScreen}
      options={{
        title: 'Profile',
        tabBarIcon: ({ focused }) => <TabIcon label="👤" focused={focused} />,
      }}
    />
  </Tab.Navigator>
);

const EmployeeTabs = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="EmployeeTabsStack" component={EmployeeTabsNavigator} />
    <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} options={{ headerShown: true, title: 'Select Role' }} />
    <Stack.Screen name="ProjectDetail" component={ProjectDetailScreen} options={{ headerShown: true }} />
    <Stack.Screen name="Messaging" component={MessagingScreen} options={{ headerShown: true }} />
    <Stack.Screen name="ProfileSettings" component={ProfileSettingsScreen} options={{ headerShown: true }} />
    <Stack.Screen name="SpecialistDirectory" component={SpecialistDirectoryScreen} options={{ headerShown: true }} />
    <Stack.Screen name="SpecialistProfile" component={SpecialistProfileScreen} options={{ headerShown: true, title: 'Specialist' }} />
    <Stack.Screen name="SpecialistRegistration" component={SpecialistRegistrationScreen} options={{ headerShown: true, title: 'Register as Specialist' }} />
    <Stack.Screen name="Upgrade" component={UpgradeScreen} options={{ headerShown: true, title: 'Upgrade' }} />
  </Stack.Navigator>
);

export const RootNavigator = () => {
  const { session, loading, activeRole } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      {!session ? (
        <AuthStack />
      ) : !activeRole ? (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="ProfileSettings" component={ProfileSettingsScreen} options={{ headerShown: true }} />
        </Stack.Navigator>
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {activeRole === 'tenant' && (
            <Stack.Screen name="TenantApp" component={TenantTabs} />
          )}
          {activeRole === 'landlord' && (
            <Stack.Screen name="LandlordApp" component={LandlordTabs} />
          )}
          {activeRole === 'builder' && (
            <Stack.Screen name="BuilderApp" component={BuilderTabs} />
          )}
          {activeRole === 'specialist' && (
            <Stack.Screen name="SpecialistApp" component={SpecialistTabs} />
          )}
          {activeRole === 'employee' && (
            <Stack.Screen name="EmployeeApp" component={EmployeeTabs} />
          )}
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
};
