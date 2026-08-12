// Type declaration for react-native-reanimated 3.x
// These declarations cover the APIs used in this project.
// The package types are at lib/typescript/*.d.ts but not properly exported.
declare module 'react-native-reanimated' {
  import type { ComponentType, Component } from 'react';
  import type { ViewProps, TextProps, ImageProps, ScrollViewProps } from 'react-native';
  import { View, Text, Image, ScrollView } from 'react-native';

  // ─── Shared Values ────────────────────────────────────────────────────────
  export interface SharedValue<T> {
    value: T;
    addListener: (id: number, listener: (value: T) => void) => void;
    removeListener: (id: number) => void;
    modify: (modifier: (value: T) => T, forceUpdate?: boolean) => void;
  }

  export function useSharedValue<T>(initialValue: T): SharedValue<T>;

  // ─── Animated Styles ──────────────────────────────────────────────────────
  export type AnimatedStyleProp<T> = T | T[];
  export function useAnimatedStyle<T extends object>(updater: () => T, dependencies?: unknown[]): T;

  // ─── Animation Builders ───────────────────────────────────────────────────
  export interface WithTimingConfig {
    duration?: number;
    easing?: (t: number) => number;
  }
  export function withTiming(toValue: number, config?: WithTimingConfig, callback?: (finished?: boolean) => void): number;
  export function withTiming(toValue: string, config?: WithTimingConfig, callback?: (finished?: boolean) => void): string;

  export interface WithSpringConfig {
    damping?: number;
    mass?: number;
    stiffness?: number;
    overshootClamping?: boolean;
    restSpeedThreshold?: number;
    restDisplacementThreshold?: number;
    velocity?: number;
    duration?: number;
    clamp?: { min?: number; max?: number };
  }
  export function withSpring(toValue: number, config?: WithSpringConfig, callback?: (finished?: boolean) => void): number;

  export function withRepeat(animation: number | string, numberOfReps?: number, reverse?: boolean, callback?: (finished?: boolean, current?: number | string) => void): number;
  export function withSequence(...animations: (number | string)[]): number;
  export function withDelay(delayMs: number, delayedAnimation: number | string): number;

  export function cancelAnimation<T>(sharedValue: SharedValue<T>): void;

  export function runOnJS<A extends unknown[], R>(fn: (...args: A) => R): (...args: A) => void;
  export function runOnUI<A extends unknown[], R>(fn: (...args: A) => R): (...args: A) => void;

  // ─── Easing ───────────────────────────────────────────────────────────────
  export const Easing: {
    linear: (t: number) => number;
    ease: (t: number) => number;
    quad: (t: number) => number;
    cubic: (t: number) => number;
    poly: (n: number) => (t: number) => number;
    sin: (t: number) => number;
    circle: (t: number) => number;
    exp: (t: number) => number;
    elastic: (bounciness?: number) => (t: number) => number;
    back: (s?: number) => (t: number) => number;
    bounce: (t: number) => number;
    bezier: (x1: number, y1: number, x2: number, y2: number) => (t: number) => number;
    in: (easing: (t: number) => number) => (t: number) => number;
    out: (easing: (t: number) => number) => (t: number) => number;
    inOut: (easing: (t: number) => number) => (t: number) => number;
  };

  // ─── Animated Components ──────────────────────────────────────────────────
  export function createAnimatedComponent<T extends ComponentType<any>>(component: T): T;

  export const Animated: {
    View: ComponentType<ViewProps & { style?: any }>;
    Text: ComponentType<TextProps & { style?: any }>;
    Image: ComponentType<ImageProps & { style?: any }>;
    ScrollView: ComponentType<ScrollViewProps & { style?: any }>;
    createAnimatedComponent: typeof createAnimatedComponent;
  };

  // Default export is the Animated namespace
  const AnimatedDefault: typeof Animated & {
    View: ComponentType<ViewProps & { style?: any }>;
    Text: ComponentType<TextProps & { style?: any }>;
    Image: ComponentType<ImageProps & { style?: any }>;
    ScrollView: ComponentType<ScrollViewProps & { style?: any }>;
    createAnimatedComponent: typeof createAnimatedComponent;
  };

  export default AnimatedDefault;
}
