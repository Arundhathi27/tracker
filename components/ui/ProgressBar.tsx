import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';

interface ProgressBarProps {
  progress: number;
  color?: string;
  height?: number;
}

export function ProgressBar({ progress, color = Colors.primary.DEFAULT, height = 8 }: ProgressBarProps) {
  const clamped = Math.min(Math.max(progress, 0), 1);
  const isOver = progress > 1;
  return (
    <View style={[styles.bg, { height }]}>
      <View style={[styles.fill, { width: `${clamped * 100}%`, backgroundColor: isOver ? Colors.danger.DEFAULT : color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  bg: {
    backgroundColor: Colors.border.DEFAULT,
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
});
