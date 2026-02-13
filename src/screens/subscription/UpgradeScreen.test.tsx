import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import UpgradeScreen from './UpgradeScreen';
import { NavigationContainer } from '@react-navigation/native';

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'u1', email: 'test@example.com' } })
}));
jest.mock('@/hooks/useSubscription', () => ({
  useSubscription: () => ({ isPro: false, createSubscription: jest.fn() })
}));

describe('UpgradeScreen navigation/buttons', () => {
  it('renders Browse Specialists button for Pro user', () => {
    jest.mock('@/hooks/useSubscription', () => ({
      useSubscription: () => ({ isPro: true, createSubscription: jest.fn() })
    }));
    const { getByText } = render(
      <NavigationContainer>
        <UpgradeScreen />
      </NavigationContainer>
    );
    expect(getByText('Browse Specialists')).toBeTruthy();
  });

  it('navigates to SpecialistDirectory on Browse Specialists press', () => {
    const mockNavigate = jest.fn();
    const { getByText } = render(
      <NavigationContainer>
        <UpgradeScreen navigation={{ navigate: mockNavigate }} />
      </NavigationContainer>
    );
    fireEvent.press(getByText('Browse Specialists'));
    expect(mockNavigate).toHaveBeenCalledWith('SpecialistDirectory');
  });

  it('renders plan selection and payment method buttons', () => {
    const { getByText } = render(
      <NavigationContainer>
        <UpgradeScreen />
      </NavigationContainer>
    );
    expect(getByText('Pro Monthly')).toBeTruthy();
    expect(getByText('Pro Yearly')).toBeTruthy();
    expect(getByText('Mobile Money')).toBeTruthy();
    expect(getByText('Bank Transfer')).toBeTruthy();
    expect(getByText('Card')).toBeTruthy();
  });
});
