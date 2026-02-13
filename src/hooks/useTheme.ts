import { useColorScheme } from 'react-native';
import { useEffect, useState } from 'react';

export const useIsDarkMode = () => {
  const colorScheme = useColorScheme();
  return colorScheme === 'dark';
};

export const useResponsive = () => {
  const [dimensions, setDimensions] = useState({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    const updateDimensions = () => {
      // This would be implemented with Dimensions from react-native
    };
    
    return () => {};
  }, []);

  return {
    isSmall: dimensions.width < 360,
    isMedium: dimensions.width >= 360 && dimensions.width < 480,
    isLarge: dimensions.width >= 480,
  };
};
