import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Colors } from '@/constants/colors';
import { Shadows } from '@/constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────

interface CardProps extends ViewProps {
  children: React.ReactNode;
  /** Visual elevation level */
  elevation?: 'none' | 'sm' | 'md' | 'lg';
  /** Whether the card has a border */
  bordered?: boolean;
  /** Custom background color override */
  backgroundColor?: string;
  /** Make card pressable with spring animation */
  pressable?: boolean;
  /** Called when pressable card is pressed */
  onPress?: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────

export const Card: React.FC<CardProps> = ({
  children,
  elevation = 'md',
  bordered = false,
  backgroundColor,
  pressable = false,
  onPress,
  style,
  ...rest
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (pressable) {
      scale.value = withSpring(0.97, { damping: 18, stiffness: 300 });
    }
  };

  const handlePressOut = () => {
    if (pressable) {
      scale.value = withSpring(1, { damping: 18, stiffness: 300 });
    }
  };

  const cardStyle = [
    styles.card,
    elevation !== 'none' && Shadows[elevation],
    bordered && styles.bordered,
    backgroundColor ? { backgroundColor } : {},
    style,
    animatedStyle,
  ];

  if (pressable && onPress) {
    const { GestureDetector, Gesture } = require('react-native-gesture-handler');
    return (
      <Animated.View
        style={cardStyle}
        onTouchStart={handlePressIn}
        onTouchEnd={handlePressOut}
        {...(rest as any)}
      >
        {children}
      </Animated.View>
    );
  }

  return (
    <Animated.View style={cardStyle} {...(rest as any)}>
      {children}
    </Animated.View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface.DEFAULT,
    borderRadius: 16,
    padding: 20,
    overflow: 'hidden',
  },
  bordered: {
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
  },
});
