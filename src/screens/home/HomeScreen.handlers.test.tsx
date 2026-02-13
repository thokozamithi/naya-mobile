import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import HomeScreen from './HomeScreen';

// This test will fail if any TouchableOpacity in Quick Access or header is missing an onPress handler

describe('HomeScreen missing handler detector', () => {
  it('all TouchableOpacity have onPress', () => {
    const { UNSAFE_getAllByType } = render(<HomeScreen navigation={{ navigate: jest.fn() }} />);
    const buttons = UNSAFE_getAllByType(require('react-native').TouchableOpacity);
    for (const btn of buttons) {
      expect(typeof btn.props.onPress).toBe('function');
    }
  });
});
