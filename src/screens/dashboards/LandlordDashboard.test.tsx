import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import LandlordDashboard from './LandlordDashboard';
import { NavigationContainer } from '@react-navigation/native';

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ signOut: jest.fn(), activeRole: 'landlord' })
}));

const mockNavigate = jest.fn();
const mockNavigation = { navigate: mockNavigate };

describe('LandlordDashboard navigation/buttons', () => {
  it('renders DashboardHeader and tab triggers', () => {
    const { getByText } = render(
      <NavigationContainer>
        <LandlordDashboard navigation={mockNavigation} />
      </NavigationContainer>
    );
    expect(getByText('Landlord Dashboard')).toBeTruthy();
    expect(getByText('Overview')).toBeTruthy();
    expect(getByText('Properties')).toBeTruthy();
    expect(getByText('Find Specialists')).toBeTruthy();
  });

  it('navigates to Home on logo press', () => {
    const { getByTestId } = render(
      <NavigationContainer>
        <LandlordDashboard navigation={mockNavigation} />
      </NavigationContainer>
    );
    fireEvent.press(getByTestId('dashboard-header-logo'));
    expect(mockNavigate).toHaveBeenCalledWith('Home');
  });

  it('navigates to RoleSelection on role switch', () => {
    const { getByTestId } = render(
      <NavigationContainer>
        <LandlordDashboard navigation={mockNavigation} />
      </NavigationContainer>
    );
    fireEvent.press(getByTestId('dashboard-header-role-switch'));
    expect(mockNavigate).toHaveBeenCalledWith('RoleSelection');
  });

  it('navigates to Home and calls signOut on sign out', () => {
    const { getByTestId } = render(
      <NavigationContainer>
        <LandlordDashboard navigation={mockNavigation} />
      </NavigationContainer>
    );
    fireEvent.press(getByTestId('dashboard-header-sign-out'));
    expect(mockNavigate).toHaveBeenCalledWith('Home');
  });

  it('tab triggers switch active tab', () => {
    const { getByText } = render(
      <NavigationContainer>
        <LandlordDashboard navigation={mockNavigation} />
      </NavigationContainer>
    );
    fireEvent.press(getByText('Properties'));
    expect(getByText('Properties')).toBeTruthy();
  });

  it('navigates to SpecialistDirectory on Find Specialists', () => {
    const { getByText } = render(
      <NavigationContainer>
        <LandlordDashboard navigation={mockNavigation} />
      </NavigationContainer>
    );
    fireEvent.press(getByText('Find Specialists'));
    expect(mockNavigate).toHaveBeenCalledWith('SpecialistDirectory');
  });
});
