import { render, fireEvent } from '@testing-library/react-native';
import React from 'react';
import RoleSelectionScreen from './RoleSelectionScreen';

describe('Role Dashboard navigation/button smoke test', () => {
  it('renders logo, settings, create role, sign out', () => {
    const navigation = { navigate: jest.fn() };
    const { getByText } = render(<RoleSelectionScreen navigation={navigation} />);
    expect(getByText('N')).toBeTruthy();
    expect(getByText('Settings')).toBeTruthy();
    expect(getByText('Create Role')).toBeTruthy();
    expect(getByText('Sign Out')).toBeTruthy();
  });
  it('logo navigates to Home', () => {
    const navigation = { navigate: jest.fn() };
    const { getByText } = render(<RoleSelectionScreen navigation={navigation} />);
    fireEvent.press(getByText('N'));
    expect(navigation.navigate).toHaveBeenCalledWith('Home');
  });
  it('settings navigates to ProfileSettings', () => {
    const navigation = { navigate: jest.fn() };
    const { getByText } = render(<RoleSelectionScreen navigation={navigation} />);
    fireEvent.press(getByText('Settings'));
    expect(navigation.navigate).toHaveBeenCalledWith('ProfileSettings');
  });
});
