import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ProfileScreen from './ProfileScreen';
import { NavigationContainer } from '@react-navigation/native';

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ signOut: jest.fn(), activeRole: 'tenant', user: { email: 'test@example.com', id: 'u1' } })
}));

const mockNavigate = jest.fn();
const mockNavigation = { navigate: mockNavigate };

describe('ProfileScreen navigation/buttons', () => {
  it('renders DashboardHeader and profile title', () => {
    const { getByText } = render(
      <NavigationContainer>
        <ProfileScreen navigation={mockNavigation} />
      </NavigationContainer>
    );
    expect(getByText('Profile')).toBeTruthy();
    expect(getByText('Edit Profile')).toBeTruthy();
    expect(getByText('Logout')).toBeTruthy();
  });

  it('navigates to Home on logo press', () => {
    const { getByTestId } = render(
      <NavigationContainer>
        <ProfileScreen navigation={mockNavigation} />
      </NavigationContainer>
    );
    fireEvent.press(getByTestId('dashboard-header-logo'));
    expect(mockNavigate).toHaveBeenCalledWith('Home');
  });

  it('navigates to RoleSelection on role switch', () => {
    const { getByTestId } = render(
      <NavigationContainer>
        <ProfileScreen navigation={mockNavigation} />
      </NavigationContainer>
    );
    fireEvent.press(getByTestId('dashboard-header-role-switch'));
    expect(mockNavigate).toHaveBeenCalledWith('RoleSelection');
  });

  it('navigates to Home and calls signOut on sign out', () => {
    const { getByTestId } = render(
      <NavigationContainer>
        <ProfileScreen navigation={mockNavigation} />
      </NavigationContainer>
    );
    fireEvent.press(getByTestId('dashboard-header-sign-out'));
    expect(mockNavigate).toHaveBeenCalledWith('Home');
  });

  it('navigates to ProfileSettings on Edit Profile', () => {
    const { getByText } = render(
      <NavigationContainer>
        <ProfileScreen navigation={mockNavigation} />
      </NavigationContainer>
    );
    fireEvent.press(getByText('Edit Profile'));
    expect(mockNavigate).toHaveBeenCalledWith('ProfileSettings');
  });
});
