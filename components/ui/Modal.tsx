import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal as RNModal, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
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

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  visible,
  onClose,
  title,
  children,
}) => {
  const [showModal, setShowModal] = useState(visible);
  
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);

  useEffect(() => {
    if (visible) {
      setShowModal(true);
      opacity.value = withTiming(1, { duration: 250, easing: Easing.out(Easing.ease) });
      scale.value = withSpring(1, { damping: 20, stiffness: 250 });
    } else {
      opacity.value = withTiming(0, { duration: 200, easing: Easing.in(Easing.ease) }, () => {
        runOnJS(setShowModal)(false);
      });
      scale.value = withTiming(0.9, { duration: 200 });
    }
  }, [visible]);

  const animatedBackdrop = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const animatedContent = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  if (!showModal) return null;

  return (
    <RNModal transparent visible={showModal} animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View style={[styles.backdrop, animatedBackdrop]} />
        </TouchableWithoutFeedback>
        
        <Animated.View style={[styles.content, animatedContent]}>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(24, 46, 28, 0.4)', // Darker cream-friendly backdrop
  },
  content: {
    width: '85%',
    backgroundColor: Colors.surface.DEFAULT,
    borderRadius: Theme.radius['2xl'],
    overflow: 'hidden',
    ...Theme.shadows.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.DEFAULT,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  closeButton: {
    padding: 4,
  },
  body: {
    padding: 20,
  },
});
