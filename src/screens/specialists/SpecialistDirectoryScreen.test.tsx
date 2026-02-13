import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import SpecialistDirectoryScreen from './SpecialistDirectoryScreen';
import { NavigationContainer } from '@react-navigation/native';

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'u1', email: 'test@example.com' } })
}));
jest.mock('@/hooks/useData', () => ({
  useSpecialists: () => ({
    data: [
      {
        id: 's1',
        user_id: 'u2',
        name: 'Jane Doe',
        specialties: ['Plumbing', 'Electrical'],
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
    ],
    isLoading: false,
    error: null,
  })
}));

describe('SpecialistDirectoryScreen navigation/buttons', () => {
  it('renders Find Specialists header and Register button', () => {
    const { getByText } = render(
      <NavigationContainer>
        <SpecialistDirectoryScreen />
      </NavigationContainer>
    );
    expect(getByText('Find Specialists')).toBeTruthy();
    expect(getByText('Register')).toBeTruthy();
  });

  it('navigates to SpecialistRegistration on Register press', () => {
    const mockNavigate = jest.fn();
    const { getByText } = render(
      <NavigationContainer>
        <SpecialistDirectoryScreen navigation={{ navigate: mockNavigate }} />
      </NavigationContainer>
    );
    fireEvent.press(getByText('Register'));
    expect(mockNavigate).toHaveBeenCalledWith('SpecialistRegistration');
  });

  it('navigates to SpecialistProfile on View Profile press', () => {
    const mockNavigate = jest.fn();
    const { getByText } = render(
      <NavigationContainer>
        <SpecialistDirectoryScreen navigation={{ navigate: mockNavigate }} />
      </NavigationContainer>
    );
    fireEvent.press(getByText('View Profile'));
    expect(mockNavigate).toHaveBeenCalledWith('SpecialistProfile', { specialistId: 's1' });
  });
});
