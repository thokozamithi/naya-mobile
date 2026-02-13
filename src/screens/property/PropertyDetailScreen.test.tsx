import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import PropertyDetailScreen from './PropertyDetailScreen';
import { NavigationContainer } from '@react-navigation/native';

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ signOut: jest.fn(), activeRole: 'landlord', user: { email: 'test@example.com', id: 'u1' } })
}));

const mockNavigate = jest.fn();
const mockNavigation = { navigate: mockNavigate, goBack: jest.fn() };

describe('PropertyDetailScreen navigation/buttons', () => {
  it('renders DashboardHeader and property title', () => {
    const { getByText } = render(
      <NavigationContainer>
        <PropertyDetailScreen navigation={mockNavigation} />
      </NavigationContainer>
    );
    expect(getByText('Edit Property')).toBeTruthy();
    expect(getByText('Request Maintenance')).toBeTruthy();
  });

  it('navigates to Home on logo press', () => {
    const { getByTestId } = render(
      <NavigationContainer>
        <PropertyDetailScreen navigation={mockNavigation} />
      </NavigationContainer>
    );
    fireEvent.press(getByTestId('dashboard-header-logo'));
    expect(mockNavigate).toHaveBeenCalledWith('Home');
  });

  it('navigates to RoleSelection on role switch', () => {
    const { getByTestId } = render(
      <NavigationContainer>
        <PropertyDetailScreen navigation={mockNavigation} />
      </NavigationContainer>
    );
    fireEvent.press(getByTestId('dashboard-header-role-switch'));
    expect(mockNavigate).toHaveBeenCalledWith('RoleSelection');
  });

  it('navigates to Home and calls signOut on sign out', () => {
    const { getByTestId } = render(
      <NavigationContainer>
        <PropertyDetailScreen navigation={mockNavigation} />
      </NavigationContainer>
    );
    fireEvent.press(getByTestId('dashboard-header-sign-out'));
    expect(mockNavigate).toHaveBeenCalledWith('Home');
  });
});
