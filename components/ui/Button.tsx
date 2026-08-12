import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  View,
  TouchableOpacityProps,
  StyleSheet,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Colors } from '@/constants/colors';

// ─── Types ────────────────────────────────────────────────────────────────

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  /** Button label text */
  label: string;
  /** Visual variant */
  variant?: Variant;
  /** Size preset */
  size?: Size;
  /** Show loading spinner and disable interaction */
  isLoading?: boolean;
  /** Left icon element */
  leftIcon?: React.ReactNode;
  /** Right icon element */
  rightIcon?: React.ReactNode;
  /** Make the button fill its container */
  fullWidth?: boolean;
  /** Custom style */
  style?: any;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

// ─── Component ────────────────────────────────────────────────────────────

export const Button: React.FC<ButtonProps> = ({
  label,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  style,
  disabled,
  onPress,
  ...rest
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
    opacity.value = withTiming(0.85, { duration: 80 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    opacity.value = withTiming(1, { duration: 80 });
  };

  const isDisabled = disabled || isLoading;

  return (
    <AnimatedTouchable
      style={[
        styles.base,
        styles[`size_${size}`],
        styles[`variant_${variant}`],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
        animatedStyle,
      ]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      activeOpacity={1}
      {...rest}
    >
      {isLoading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost' ? Colors.primary.DEFAULT : Colors.white}
        />
      ) : (
        <View style={styles.content}>
          {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
          <Text style={[styles.label, styles[`label_${variant}`], styles[`labelSize_${size}`]]}>
            {label}
          </Text>
          {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
        </View>
      )}
    </AnimatedTouchable>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  base: {
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftIcon: {
    marginRight: 8,
  },
  rightIcon: {
    marginLeft: 8,
  },

  // ─── Size variants ──────────────────────────────────────────────────────
  size_sm: {
    height: 36,
    paddingHorizontal: 16,
    minWidth: 80,
  },
  size_md: {
    height: 48,
    paddingHorizontal: 24,
    minWidth: 120,
  },
  size_lg: {
    height: 56,
    paddingHorizontal: 32,
    minWidth: 160,
  },

  // ─── Color variants ─────────────────────────────────────────────────────
  variant_primary: {
    backgroundColor: Colors.primary.DEFAULT,
    shadowColor: Colors.primary[900],
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  variant_secondary: {
    backgroundColor: Colors.secondary.DEFAULT,
    shadowColor: Colors.secondary[900],
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  variant_outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.primary.DEFAULT,
  },
  variant_ghost: {
    backgroundColor: 'transparent',
  },
  variant_danger: {
    backgroundColor: Colors.danger.DEFAULT,
    shadowColor: Colors.danger[900],
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },

  // ─── Label styles ────────────────────────────────────────────────────────
  label: {
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  label_primary: { color: Colors.surface.DEFAULT },
  label_secondary: { color: Colors.text.primary },
  label_outline: { color: Colors.primary.DEFAULT },
  label_ghost: { color: Colors.primary.DEFAULT },
  label_danger: { color: Colors.white },

  // ─── Label sizes ─────────────────────────────────────────────────────────
  labelSize_sm: { fontSize: 13 },
  labelSize_md: { fontSize: 15 },
  labelSize_lg: { fontSize: 17 },
});
