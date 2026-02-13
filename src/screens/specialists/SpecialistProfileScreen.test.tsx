import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import SpecialistProfileScreen from './SpecialistProfileScreen';
import { NavigationContainer } from '@react-navigation/native';

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'u1', email: 'test@example.com' } })
}));
jest.mock('@tanstack/react-query', () => ({
  useQuery: () => ({
    data: {
      id: 's1',
      user_id: 'u2',
      name: 'Jane Doe',
      specialties: ['Plumbing'],
      bio: 'Expert in home repairs',
      rating: 4.8,
      review_count: 12,
      hourly_rate: 50,
      phone: '123-456-7890',
      email: 'jane@example.com',
      location: 'New York',
      profile_photo: null,
      verified: true,
      created_at: '',
      updated_at: '',
    },
    isLoading: false,
    error: null,
  })
}));

describe('SpecialistProfileScreen navigation/buttons', () => {
  it('renders tabs and action buttons', () => {
    const { getByText } = render(
      <NavigationContainer>
        <SpecialistProfileScreen />
      </NavigationContainer>
    );
    expect(getByText('Hire')).toBeTruthy();
    expect(getByText('Message')).toBeTruthy();
  });

  it('shows tab buttons and switches tab', () => {
    const { getByText } = render(
      <NavigationContainer>
        <SpecialistProfileScreen />
      </NavigationContainer>
    );
    fireEvent.press(getByText('Portfolio'));
    expect(getByText('Portfolio')).toBeTruthy();
  });
});
