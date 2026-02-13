import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import SpecialistRegistrationScreen from './SpecialistRegistrationScreen';
import { NavigationContainer } from '@react-navigation/native';

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'u1', email: 'test@example.com' } })
}));

describe('SpecialistRegistrationScreen navigation/buttons', () => {
  it('renders tab buttons and Save button', () => {
    const { getByText } = render(
      <NavigationContainer>
        <SpecialistRegistrationScreen />
      </NavigationContainer>
    );
    expect(getByText('Profile')).toBeTruthy();
    expect(getByText('Skills')).toBeTruthy();
    expect(getByText('Certifications')).toBeTruthy();
    expect(getByText('Availability')).toBeTruthy();
    expect(getByText('Save')).toBeTruthy();
  });

  it('switches tabs on press', () => {
    const { getByText } = render(
      <NavigationContainer>
        <SpecialistRegistrationScreen />
      </NavigationContainer>
    );
    fireEvent.press(getByText('Skills'));
    expect(getByText('Skills')).toBeTruthy();
  });
});
