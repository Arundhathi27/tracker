import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { Colors } from '@/constants/colors';
import { Button } from './Button';

// ─── Types ────────────────────────────────────────────────────────────────

interface EmptyStateProps {
  /** Icon element to display (e.g., a Lucide icon) */
  icon?: React.ReactNode;
  /** Main title text */
  title: string;
  /** Descriptive subtitle */
  description?: string;
  /** Label for the action button */
  actionLabel?: string;
  /** Called when action button is pressed */
  onAction?: () => void;
  /** Container style override */
  style?: ViewStyle;
}

// ─── Component ────────────────────────────────────────────────────────────

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  style,
}) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.ease) });
    translateY.value = withSpring(0, { damping: 18, stiffness: 200 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.container, style, animatedStyle]}>
      {/* Icon backdrop */}
      {icon && (
        <View style={styles.iconContainer}>
          {icon}
        </View>
      )}

      {/* Text */}
      <Text style={styles.title}>{title}</Text>
      {description && <Text style={styles.description}>{description}</Text>}

      {/* Action */}
      {actionLabel && onAction && (
        <View style={styles.actionContainer}>
          <Button
            label={actionLabel}
            onPress={onAction}
            variant="primary"
            size="md"
          />
        </View>
      )}
    </Animated.View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${Colors.primary.DEFAULT}18`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: `${Colors.primary.DEFAULT}30`,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  actionContainer: {
    marginTop: 24,
  },
});
