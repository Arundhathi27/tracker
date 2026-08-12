import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal as RNModal, TouchableOpacity, TouchableWithoutFeedback, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { X } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { Theme } from '@/constants/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  visible,
  onClose,
  title,
  children,
}) => {
  const [showSheet, setShowSheet] = useState(visible);
  
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(SCREEN_HEIGHT);

  useEffect(() => {
    if (visible) {
      setShowSheet(true);
      opacity.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.ease) });
      translateY.value = withSpring(0, { damping: 22, stiffness: 200 });
    } else {
      opacity.value = withTiming(0, { duration: 250, easing: Easing.in(Easing.ease) });
      translateY.value = withTiming(SCREEN_HEIGHT, { duration: 300, easing: Easing.in(Easing.ease) }, () => {
        runOnJS(setShowSheet)(false);
      });
    }
  }, [visible]);

  const animatedBackdrop = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const animatedSheet = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!showSheet) return null;

  return (
    <RNModal transparent visible={showSheet} animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View style={[styles.backdrop, animatedBackdrop]} />
        </TouchableWithoutFeedback>
        
        <Animated.View style={[styles.sheet, animatedSheet]}>
          <View style={styles.dragHandleContainer}>
            <View style={styles.dragHandle} />
          </View>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={20} color={Colors.text.secondary} />
            </TouchableOpacity>
          </View>
          <View style={styles.body}>
            {children}
          </View>
        </Animated.View>
      </View>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(24, 46, 28, 0.4)',
  },
  sheet: {
    backgroundColor: Colors.surface.DEFAULT,
    borderTopLeftRadius: Theme.radius['3xl'],
    borderTopRightRadius: Theme.radius['3xl'],
    minHeight: 250,
    maxHeight: '90%',
    ...Theme.shadows.xl,
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border.DEFAULT,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  closeButton: {
    padding: 4,
    marginRight: -4,
  },
  body: {
    paddingHorizontal: 24,
    paddingBottom: 40, // extra padding for bottom safe area
  },
});
