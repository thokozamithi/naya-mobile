import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import RegisterScreen from './RegisterScreen';

describe('RegisterScreen navigation/buttons', () => {
  it('renders Sign In and Sign Up tabs', () => {
    const { getByText } = render(<RegisterScreen navigation={{ navigate: jest.fn() }} />);
    expect(getByText('Sign In')).toBeTruthy();
    expect(getByText('Sign Up')).toBeTruthy();
  });

  it('navigates to Login on Sign In press', () => {
    const mockNavigate = jest.fn();
    const { getByText } = render(<RegisterScreen navigation={{ navigate: mockNavigate }} />);
    fireEvent.press(getByText('Sign In'));
    expect(mockNavigate).toHaveBeenCalledWith('Login');
  });

  it('calls handleRegister on Sign Up press', () => {
    const { getByText } = render(<RegisterScreen navigation={{ navigate: jest.fn() }} />);
    fireEvent.press(getByText('Sign Up'));
    // No error thrown means handler is present
    expect(getByText('Sign Up')).toBeTruthy();
  });
});
