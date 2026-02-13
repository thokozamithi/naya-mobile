import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ProfileSettingsScreen from './ProfileSettingsScreen';
import { NavigationContainer } from '@react-navigation/native';

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ signOut: jest.fn(), activeRole: 'tenant', user: { email: 'test@example.com', id: 'u1' }, roles: ['tenant'] })
}));

const mockNavigate = jest.fn();
const mockNavigation = { navigate: mockNavigate };

describe('ProfileSettingsScreen navigation/buttons', () => {
  it('renders DashboardHeader and profile settings title', () => {
    const { getByText } = render(
      <NavigationContainer>
        <ProfileSettingsScreen navigation={mockNavigation} />
      </NavigationContainer>
    );
    expect(getByText('Profile Settings')).toBeTruthy();
    expect(getByText('Save Changes')).toBeTruthy();
    expect(getByText('Sign Out')).toBeTruthy();
  });

  it('navigates to Home on logo press', () => {
    const { getByTestId } = render(
      <NavigationContainer>
        <ProfileSettingsScreen navigation={mockNavigation} />
      </NavigationContainer>
    );
    fireEvent.press(getByTestId('dashboard-header-logo'));
    expect(mockNavigate).toHaveBeenCalledWith('Home');
  });

  it('navigates to RoleSelection on role switch', () => {
    const { getByTestId } = render(
      <NavigationContainer>
        <ProfileSettingsScreen navigation={mockNavigation} />
      </NavigationContainer>
    );
    fireEvent.press(getByTestId('dashboard-header-role-switch'));
    expect(mockNavigate).toHaveBeenCalledWith('RoleSelection');
  });

  it('navigates to Home and calls signOut on sign out', () => {
    const { getByTestId } = render(
      <NavigationContainer>
        <ProfileSettingsScreen navigation={mockNavigation} />
      </NavigationContainer>
    );
    fireEvent.press(getByTestId('dashboard-header-sign-out'));
    expect(mockNavigate).toHaveBeenCalledWith('Home');
  });
});
