import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { Landmark } from 'lucide-react-native';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/colors';
import { Theme } from '@/constants/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function WelcomeScreen() {
  const fadeOpacity = useSharedValue(0);
  const slideY = useSharedValue(20);

  useEffect(() => {
    fadeOpacity.value = withDelay(
      150,
      withTiming(1, { duration: 800, easing: Easing.out(Easing.ease) })
    );
    slideY.value = withDelay(
      150,
      withTiming(0, { duration: 800, easing: Easing.out(Easing.ease) })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeOpacity.value,
    transform: [{ translateY: slideY.value }],
  }));

  const handleGetStarted = () => {
    router.push('/(auth)/signup' as any);
  };

  const handleSignIn = () => {
    router.push('/(auth)/login' as any);
  };

  return (
    <View style={styles.screen}>
      <ScreenContainer scrollable={false} horizontalPadding={32}>
        <View style={styles.content}>
          {/* Top spacer for visual balance */}
          <View style={styles.spacer} />

          <Animated.View style={[styles.illustrationContainer, animatedStyle]}>
            <View style={styles.iconCircle}>
              <Landmark size={48} color={Colors.primary.DEFAULT} strokeWidth={1.5} />
            </View>
            <Text style={styles.logoText}>BudgetWise</Text>
          </Animated.View>

          <Animated.View style={[styles.textContainer, animatedStyle]}>
            <Text style={styles.heading}>Take Control of Your Money</Text>
            <Text style={styles.subheading}>
              Plan budgets, track expenses, and achieve your financial goals with clarity.
            </Text>
          </Animated.View>

          <View style={styles.spacer} />

          <Animated.View style={[styles.actionContainer, animatedStyle]}>
            <Button
              label="Get Started"
              onPress={handleGetStarted}
              variant="primary"
              size="lg"
              fullWidth
            />
            <Button
              label="Sign In"
              onPress={handleSignIn}
              variant="secondary"
              size="lg"
              fullWidth
            />
          </Animated.View>

          <Animated.View style={[styles.footer, animatedStyle]}>
            <Text style={styles.footerText}>
              Your data is encrypted and securely stored. By continuing, you agree to our{' '}
              <Text style={styles.footerLink}>Terms & Privacy</Text>.
            </Text>
          </Animated.View>
        </View>
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background.DEFAULT,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  spacer: {
    flex: 1,
    maxHeight: SCREEN_HEIGHT * 0.1,
  },
  illustrationContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.surface.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    ...Theme.shadows.sm,
  },
  logoText: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.primary.DEFAULT,
    letterSpacing: 0.5,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  heading: {
    fontSize: 34,
    fontWeight: '800',
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -0.5,
    lineHeight: 40,
  },
  subheading: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  actionContainer: {
    gap: 16,
    marginBottom: 32,
  },
  footer: {
    paddingBottom: Platform.OS === 'ios' ? 16 : 32,
  },
  footerText: {
    fontSize: 12,
    color: Colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  footerLink: {
    color: Colors.primary.DEFAULT,
    fontWeight: '600',
  },
});
