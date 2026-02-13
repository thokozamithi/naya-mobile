import { render, fireEvent } from '@testing-library/react-native';
import React from 'react';
import LoginScreen from './LoginScreen';
import RegisterScreen from './RegisterScreen';

describe('Auth navigation and button smoke test', () => {
  it('LoginScreen: tabs and logo present, tab switches', () => {
    const navigation = { navigate: jest.fn() };
    const { getByText } = render(<LoginScreen navigation={navigation} />);
    expect(getByText('N')).toBeTruthy();
    expect(getByText('Sign In')).toBeTruthy();
    expect(getByText('Sign Up')).toBeTruthy();
    fireEvent.press(getByText('Sign Up'));
    expect(navigation.navigate).toHaveBeenCalledWith('Register');
  });
  it('RegisterScreen: tabs and logo present, tab switches', () => {
    const navigation = { navigate: jest.fn() };
    const { getByText } = render(<RegisterScreen navigation={navigation} />);
    expect(getByText('N')).toBeTruthy();
    expect(getByText('Sign In')).toBeTruthy();
    expect(getByText('Sign Up')).toBeTruthy();
    fireEvent.press(getByText('Sign In'));
    expect(navigation.navigate).toHaveBeenCalledWith('Login');
  });
});
