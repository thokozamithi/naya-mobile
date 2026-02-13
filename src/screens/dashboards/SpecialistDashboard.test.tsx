import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import SpecialistDashboard from './SpecialistDashboard';
import { NavigationContainer } from '@react-navigation/native';

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ signOut: jest.fn(), activeRole: 'specialist', user: { email: 'test@example.com' } })
}));

const mockNavigate = jest.fn();
const mockNavigation = { navigate: mockNavigate };

describe('SpecialistDashboard navigation/buttons', () => {
  it('renders DashboardHeader and quick actions', () => {
    const { getByText } = render(
      <NavigationContainer>
        <SpecialistDashboard navigation={mockNavigation} />
      </NavigationContainer>
    );
    expect(getByText('Specialist Dashboard')).toBeTruthy();
    expect(getByText('Quick Actions')).toBeTruthy();
    expect(getByText('Messages')).toBeTruthy();
    expect(getByText('Directory')).toBeTruthy();
    expect(getByText('Settings')).toBeTruthy();
  });

  it('navigates to Home on logo press', () => {
    const { getByTestId } = render(
      <NavigationContainer>
        <SpecialistDashboard navigation={mockNavigation} />
      </NavigationContainer>
    );
    fireEvent.press(getByTestId('dashboard-header-logo'));
    expect(mockNavigate).toHaveBeenCalledWith('Home');
  });

  it('navigates to RoleSelection on role switch', () => {
    const { getByTestId } = render(
      <NavigationContainer>
        <SpecialistDashboard navigation={mockNavigation} />
      </NavigationContainer>
    );
    fireEvent.press(getByTestId('dashboard-header-role-switch'));
    expect(mockNavigate).toHaveBeenCalledWith('RoleSelection');
  });

  it('navigates to Home and calls signOut on sign out', () => {
    const { getByTestId } = render(
      <NavigationContainer>
        <SpecialistDashboard navigation={mockNavigation} />
      </NavigationContainer>
    );
    fireEvent.press(getByTestId('dashboard-header-sign-out'));
    expect(mockNavigate).toHaveBeenCalledWith('Home');
  });

  it('quick actions navigate correctly', () => {
    const { getByText } = render(
      <NavigationContainer>
        <SpecialistDashboard navigation={mockNavigation} />
      </NavigationContainer>
    );
    fireEvent.press(getByText('Messages'));
    fireEvent.press(getByText('Directory'));
    fireEvent.press(getByText('Settings'));
    expect(mockNavigate).toHaveBeenCalledWith('Messaging');
    expect(mockNavigate).toHaveBeenCalledWith('SpecialistDirectory');
    expect(mockNavigate).toHaveBeenCalledWith('ProfileSettings');
  });

  it('edit profile navigates to SpecialistRegistration', () => {
    const { getByText } = render(
      <NavigationContainer>
        <SpecialistDashboard navigation={mockNavigation} />
      </NavigationContainer>
    );
    fireEvent.press(getByText('Edit Profile'));
    expect(mockNavigate).toHaveBeenCalledWith('SpecialistRegistration');
  });
});
