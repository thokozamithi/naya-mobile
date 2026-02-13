import React from 'react';
import { render } from '@testing-library/react-native';
import LoginScreen from './LoginScreen';
import RegisterScreen from './RegisterScreen';

describe('Auth missing handler detector', () => {
  it('LoginScreen: all TouchableOpacity have onPress', () => {
    const { UNSAFE_getAllByType } = render(<LoginScreen navigation={{ navigate: jest.fn() }} />);
    const buttons = UNSAFE_getAllByType(require('react-native').TouchableOpacity);
    for (const btn of buttons) {
      expect(typeof btn.props.onPress).toBe('function');
    }
  });
  it('RegisterScreen: all TouchableOpacity have onPress', () => {
    const { UNSAFE_getAllByType } = render(<RegisterScreen navigation={{ navigate: jest.fn() }} />);
    const buttons = UNSAFE_getAllByType(require('react-native').TouchableOpacity);
    for (const btn of buttons) {
      expect(typeof btn.props.onPress).toBe('function');
    }
  });
});
