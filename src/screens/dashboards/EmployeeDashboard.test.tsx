import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import EmployeeDashboard from './EmployeeDashboard';
import { NavigationContainer } from '@react-navigation/native';

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ signOut: jest.fn(), activeRole: 'employee', user: { email: 'test@example.com' } })
}));

const mockNavigate = jest.fn();
const mockNavigation = { navigate: mockNavigate };

describe('EmployeeDashboard navigation/buttons', () => {
  it('renders DashboardHeader and quick actions', () => {
    const { getByText } = render(
      <NavigationContainer>
        <EmployeeDashboard navigation={mockNavigation} />
      </NavigationContainer>
    );
    expect(getByText('Employee Dashboard')).toBeTruthy();
    expect(getByText('Quick Actions')).toBeTruthy();
    expect(getByText('Messages')).toBeTruthy();
    expect(getByText('Specialists')).toBeTruthy();
    expect(getByText('Settings')).toBeTruthy();
  });

  it('navigates to Home on logo press', () => {
    const { getByTestId } = render(
      <NavigationContainer>
        <EmployeeDashboard navigation={mockNavigation} />
      </NavigationContainer>
    );
    fireEvent.press(getByTestId('dashboard-header-logo'));
    expect(mockNavigate).toHaveBeenCalledWith('Home');
  });

  it('navigates to RoleSelection on role switch', () => {
    const { getByTestId } = render(
      <NavigationContainer>
        <EmployeeDashboard navigation={mockNavigation} />
      </NavigationContainer>
    );
    fireEvent.press(getByTestId('dashboard-header-role-switch'));
    expect(mockNavigate).toHaveBeenCalledWith('RoleSelection');
  });

  it('navigates to Home and calls signOut on sign out', () => {
    const { getByTestId } = render(
      <NavigationContainer>
        <EmployeeDashboard navigation={mockNavigation} />
      </NavigationContainer>
    );
    fireEvent.press(getByTestId('dashboard-header-sign-out'));
    expect(mockNavigate).toHaveBeenCalledWith('Home');
  });

  it('quick actions navigate correctly', () => {
    const { getByText } = render(
      <NavigationContainer>
        <EmployeeDashboard navigation={mockNavigation} />
      </NavigationContainer>
    );
    fireEvent.press(getByText('Messages'));
    fireEvent.press(getByText('Specialists'));
    fireEvent.press(getByText('Settings'));
    expect(mockNavigate).toHaveBeenCalledWith('Messaging');
    expect(mockNavigate).toHaveBeenCalledWith('SpecialistDirectory');
    expect(mockNavigate).toHaveBeenCalledWith('ProfileSettings');
  });
});
