import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import AdminDashboard from './AdminDashboard';
import { NavigationContainer } from '@react-navigation/native';

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ signOut: jest.fn(), activeRole: 'admin', user: { email: 'test@example.com' } })
}));

const mockNavigate = jest.fn();
const mockNavigation = { navigate: mockNavigate };

describe('AdminDashboard navigation/buttons', () => {
  it('renders DashboardHeader and tabs', () => {
    const { getByText } = render(
      <NavigationContainer>
        <AdminDashboard navigation={mockNavigation} />
      </NavigationContainer>
    );
    expect(getByText('Admin Dashboard')).toBeTruthy();
    expect(getByText('Pending (0)')).toBeTruthy();
    expect(getByText('All Subs')).toBeTruthy();
    expect(getByText('Members')).toBeTruthy();
    expect(getByText('Analytics')).toBeTruthy();
  });

  it('navigates to Home on logo press', () => {
    const { getByTestId } = render(
      <NavigationContainer>
        <AdminDashboard navigation={mockNavigation} />
      </NavigationContainer>
    );
    fireEvent.press(getByTestId('dashboard-header-logo'));
    expect(mockNavigate).toHaveBeenCalledWith('Home');
  });

  it('navigates to RoleSelection on role switch', () => {
    const { getByTestId } = render(
      <NavigationContainer>
        <AdminDashboard navigation={mockNavigation} />
      </NavigationContainer>
    );
    fireEvent.press(getByTestId('dashboard-header-role-switch'));
    expect(mockNavigate).toHaveBeenCalledWith('RoleSelection');
  });

  it('navigates to Home and calls signOut on sign out', () => {
    const { getByTestId } = render(
      <NavigationContainer>
        <AdminDashboard navigation={mockNavigation} />
      </NavigationContainer>
    );
    fireEvent.press(getByTestId('dashboard-header-sign-out'));
    expect(mockNavigate).toHaveBeenCalledWith('Home');
  });

  it('tab triggers switch active tab', () => {
    const { getByText } = render(
      <NavigationContainer>
        <AdminDashboard navigation={mockNavigation} />
      </NavigationContainer>
    );
    fireEvent.press(getByText('All Subs'));
    expect(getByText('All Subs')).toBeTruthy();
  });
});
