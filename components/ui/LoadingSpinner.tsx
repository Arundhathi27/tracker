import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { Colors } from '@/constants/colors';

// ─── Types ────────────────────────────────────────────────────────────────

interface LoadingSpinnerProps {
  /** Spinner size in pixels */
  size?: number;
  /** Spinner color */
  color?: string;
  /** Container style */
  style?: ViewStyle;
  /** Whether to fill and center within parent */
  fullScreen?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 40,
  color = Colors.primary.DEFAULT,
  style,
  fullScreen = false,
}) => {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(0.8);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 800,
        easing: Easing.linear,
      }),
      -1,
      false
    );

    scale.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) }),
        withTiming(0.8, { duration: 400, easing: Easing.in(Easing.ease) })
      ),
      -1,
      true
    );

    return () => {
      cancelAnimation(rotation);
      cancelAnimation(scale);
    };
  }, []);

  const spinnerStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }, { scale: scale.value }],
  }));

  const spinner = (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: size / 10,
          borderColor: `${color}30`, // 19% opacity ring
          borderTopColor: color,
        },
        spinnerStyle,
      ]}
    />
  );

  if (fullScreen) {
    return (
      <View style={[styles.fullScreen, style]}>
        {spinner}
      </View>
    );
  }

  return <View style={[styles.container, style]}>{spinner}</View>;
};

// ─── Styles ───────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  fullScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background.DEFAULT,
  },
});
