import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, DimensionValue } from 'react-native';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
}) => {
  return (
    <View style={styles.container}>
      {icon && <Text style={styles.icon}>{icon}</Text>}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});

interface LoadingSkeletonProps {
  height?: number;
  width?: DimensionValue;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  height = 20,
  width = '100%',
}) => {
  return (
    <View
      style={[
        skeletonStyles.skeleton,
        { height, width },
      ]}
    />
  );
};

const skeletonStyles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginVertical: 8,
  },
});

export { skeletonStyles };
