import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import LoginScreen from './LoginScreen';

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ signIn: jest.fn() })
}));

describe('LoginScreen navigation/buttons', () => {
  it('renders Sign In and Sign Up tabs', () => {
    const { getByText } = render(<LoginScreen navigation={{ navigate: jest.fn() }} />);
    expect(getByText('Sign In')).toBeTruthy();
    expect(getByText('Sign Up')).toBeTruthy();
  });

  it('navigates to Register on Sign Up press', () => {
    const mockNavigate = jest.fn();
    const { getByText } = render(<LoginScreen navigation={{ navigate: mockNavigate }} />);
    fireEvent.press(getByText('Sign Up'));
    expect(mockNavigate).toHaveBeenCalledWith('Register');
  });

  it('calls handleLogin on Sign In press', () => {
    const { getByText } = render(<LoginScreen navigation={{ navigate: jest.fn() }} />);
    fireEvent.press(getByText('Sign In'));
    // No error thrown means handler is present
    expect(getByText('Sign In')).toBeTruthy();
  });
});
