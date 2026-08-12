import React from 'react';
import {
  View,
  ScrollView,
  ViewStyle,
  ScrollViewProps,
  StyleSheet,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';

// ─── Types ────────────────────────────────────────────────────────────────

interface ScreenContainerProps extends Omit<ScrollViewProps, 'style' | 'contentContainerStyle'> {
  children: React.ReactNode;
  /** Whether to enable scrolling */
  scrollable?: boolean;
  /** Custom background color */
  backgroundColor?: string;
  /** Horizontal padding for content */
  horizontalPadding?: number;
  /** Style for the inner content container */
  contentStyle?: ViewStyle;
  /** Whether to apply safe area insets on top */
  withTopInset?: boolean;
  /** Whether to apply safe area insets on bottom */
  withBottomInset?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────

export const ScreenContainer: React.FC<ScreenContainerProps> = ({
  children,
  scrollable = false,
  backgroundColor = Colors.background.DEFAULT,
  horizontalPadding = 20,
  contentStyle,
  withTopInset = true,
  withBottomInset = true,
  ...rest
}) => {
  const edges: ('top' | 'bottom' | 'left' | 'right')[] = [];
  if (withTopInset) edges.push('top');
  if (withBottomInset) edges.push('bottom');

  const content = scrollable ? (
    <ScrollView
      style={[styles.scroll, { backgroundColor }]}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingHorizontal: horizontalPadding },
        contentStyle,
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      {...rest}
    >
      {children}
    </ScrollView>
  ) : (
    <View
      style={[
        styles.container,
        { backgroundColor, paddingHorizontal: horizontalPadding },
        contentStyle,
      ]}
    >
      {children}
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor }]}
      edges={edges}
    >
      {content}
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 32,
  },
});
