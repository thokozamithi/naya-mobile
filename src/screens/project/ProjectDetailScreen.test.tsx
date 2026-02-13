import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ProjectDetailScreen from './ProjectDetailScreen';
import { NavigationContainer } from '@react-navigation/native';

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ signOut: jest.fn(), activeRole: 'builder', user: { email: 'test@example.com', id: 'u1' } })
}));

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const mockNavigation = { navigate: mockNavigate, goBack: mockGoBack };

describe('ProjectDetailScreen navigation/buttons', () => {
  it('renders Back to Dashboard link', () => {
    const { getByText } = render(
      <NavigationContainer>
        <ProjectDetailScreen navigation={mockNavigation} />
      </NavigationContainer>
    );
    expect(getByText('← Back to Dashboard')).toBeTruthy();
  });

  it('navigates to BuilderHome on Back to Dashboard for builder', () => {
    const { getByText } = render(
      <NavigationContainer>
        <ProjectDetailScreen navigation={mockNavigation} />
      </NavigationContainer>
    );
    fireEvent.press(getByText('← Back to Dashboard'));
    expect(mockNavigate).toHaveBeenCalledWith('BuilderHome');
  });

  it('calls goBack for non-builder roles', () => {
    jest.mock('@/hooks/useAuth', () => ({
      useAuth: () => ({ signOut: jest.fn(), activeRole: 'tenant', user: { email: 'test@example.com', id: 'u1' } })
    }));
    const { getByText } = render(
      <NavigationContainer>
        <ProjectDetailScreen navigation={{ ...mockNavigation, navigate: jest.fn(), goBack: mockGoBack }} />
      </NavigationContainer>
    );
    fireEvent.press(getByText('← Back to Dashboard'));
    expect(mockGoBack).toHaveBeenCalled();
  });

  it('shows action buttons for builder/employee', () => {
    const { getByText } = render(
      <NavigationContainer>
        <ProjectDetailScreen navigation={mockNavigation} />
      </NavigationContainer>
    );
    expect(getByText('Update Progress')).toBeTruthy();
    expect(getByText('Edit Project')).toBeTruthy();
    expect(getByText('Add Update')).toBeTruthy();
  });
});
