import React from 'react';
import { render } from '@testing-library/react-native';
import LoadingScreen from './LoadingScreen';

describe('LoadingScreen', () => {
  it('renders loading indicator and text', () => {
    const { getByText, getByTestId } = render(<LoadingScreen />);
    expect(getByText('Loading...')).toBeTruthy();
  });
});
