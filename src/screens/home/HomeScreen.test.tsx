import { render, fireEvent } from '@testing-library/react-native';
import React from 'react';
import HomeScreen from '@/screens/home/HomeScreen';

// Mock navigation and useAuth
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
}));
jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: null, activeRole: null, signOut: jest.fn() }),
}));

describe('HomeScreen navigation', () => {
  it('renders header and tour button', () => {
    const { getByText } = render(<HomeScreen navigation={{ navigate: jest.fn() }} />);
    expect(getByText('N')).toBeTruthy();
    expect(getByText('Take a Tour')).toBeTruthy();
  });

  it('navigates to Login on Sign In/Get Started', () => {
    const navigate = jest.fn();
    const { getByText } = render(<HomeScreen navigation={{ navigate }} />);
    fireEvent.press(getByText('Sign In'));
    fireEvent.press(getByText('Get Started'));
    expect(navigate).toHaveBeenCalledWith('Login');
  });

  it('shows alert on Take a Tour', () => {
    global.alert = jest.fn();
    const { getByText } = render(<HomeScreen navigation={{ navigate: jest.fn() }} />);
    fireEvent.press(getByText('Take a Tour'));
    expect(global.alert).toHaveBeenCalled();
  });
});
