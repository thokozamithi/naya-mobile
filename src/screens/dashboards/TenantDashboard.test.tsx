import { render, fireEvent } from '@testing-library/react-native';
import React from 'react';
import TenantDashboard from './TenantDashboard';

describe('Tenant Dashboard navigation/button smoke test', () => {
  it('renders DashboardHeader, tab bar, and quick actions', () => {
    const navigation = { navigate: jest.fn() };
    const { getByText } = render(<TenantDashboard navigation={navigation} />);
    expect(getByText('N')).toBeTruthy();
    expect(getByText('Switch Role')).toBeTruthy();
    expect(getByText('Sign Out')).toBeTruthy();
    expect(getByText('Overview')).toBeTruthy();
    expect(getByText('Pay Rent')).toBeTruthy();
    expect(getByText('View Lease')).toBeTruthy();
  });
  it('logo navigates to Home', () => {
    const navigation = { navigate: jest.fn() };
    const { getByText } = render(<TenantDashboard navigation={navigation} />);
    fireEvent.press(getByText('N'));
    expect(navigation.navigate).toHaveBeenCalledWith('Home');
  });
  it('role switch navigates to RoleSelection', () => {
    const navigation = { navigate: jest.fn() };
    const { getByText } = render(<TenantDashboard navigation={navigation} />);
    fireEvent.press(getByText('Switch Role'));
    expect(navigation.navigate).toHaveBeenCalledWith('RoleSelection');
  });
});
