import React from 'react';
import { render } from '@testing-library/react-native';
import RoleSelectionScreen from './RoleSelectionScreen';

describe('Role Dashboard missing handler detector', () => {
  it('all TouchableOpacity have onPress', () => {
    const { UNSAFE_getAllByType } = render(<RoleSelectionScreen navigation={{ navigate: jest.fn() }} />);
    const buttons = UNSAFE_getAllByType(require('react-native').TouchableOpacity);
    for (const btn of buttons) {
      expect(typeof btn.props.onPress).toBe('function');
    }
  });
});
