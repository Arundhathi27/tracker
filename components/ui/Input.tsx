import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  TextStyle,
  TextInputProps,
  StyleSheet,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { Colors } from '@/constants/colors';

// ─── Types ────────────────────────────────────────────────────────────────

interface InputProps extends TextInputProps {
  /** Label displayed above the input */
  label?: string;
  /** Error message shown below the input */
  error?: string;
  /** Helper text shown below the input (hidden when error is present) */
  hint?: string;
  /** Icon on the left side of the input */
  leftIcon?: React.ReactNode;
  /** Icon or action on the right side */
  rightElement?: React.ReactNode;
  /** Whether the input is required */
  isRequired?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────

export const Input: React.FC<InputProps> = ({
  label,
  error,
  hint,
  leftIcon,
  rightElement,
  isRequired = false,
  editable = true,
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const borderColorValue = useSharedValue<string>(Colors.border.DEFAULT);
  const shadowOpacityValue = useSharedValue<number>(0);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    borderColor: withTiming(borderColorValue.value, { duration: 200 }),
    shadowOpacity: withTiming(shadowOpacityValue.value, { duration: 200 }),
  }));

  const handleFocus = () => {
    setIsFocused(true);
    borderColorValue.value = error ? Colors.danger.DEFAULT : Colors.primary.DEFAULT;
    shadowOpacityValue.value = 0.08;
    rest.onFocus?.({} as any);
  };

  const handleBlur = () => {
    setIsFocused(false);
    borderColorValue.value = error ? Colors.danger.DEFAULT : Colors.border.DEFAULT;
    shadowOpacityValue.value = 0;
    rest.onBlur?.({} as any);
  };

  // Update border color when error changes
  React.useEffect(() => {
    if (error) {
      borderColorValue.value = Colors.danger.DEFAULT;
    } else if (!isFocused) {
      borderColorValue.value = Colors.border.DEFAULT;
    }
  }, [error, isFocused]);

  const inputStyles: TextStyle[] = [styles.input];
  if (leftIcon) inputStyles.push(styles.inputWithLeft);
  if (rightElement) inputStyles.push(styles.inputWithRight);

  return (
    <View style={styles.wrapper}>
      {/* Label */}
      {label && (
        <View style={styles.labelRow}>
          <Text style={styles.label}>{label}</Text>
          {isRequired && <Text style={styles.required}>*</Text>}
        </View>
      )}

      {/* Input container */}
      <Animated.View
        style={[
          styles.container,
          !editable && styles.disabled,
          animatedContainerStyle,
          {
            shadowColor: error ? Colors.danger.DEFAULT : Colors.primary.DEFAULT,
            shadowOffset: { width: 0, height: 0 },
            shadowRadius: 8,
            elevation: isFocused ? 4 : 0,
          },
        ]}
      >
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}

        <TextInput
          style={inputStyles}
          placeholderTextColor={Colors.text.disabled}
          selectionColor={Colors.primary.DEFAULT}
          onFocus={handleFocus}
          onBlur={handleBlur}
          editable={editable}
          {...rest}
        />

        {rightElement && <View style={styles.rightElement}>{rightElement}</View>}
      </Animated.View>

      {/* Error or hint */}
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.secondary,
    letterSpacing: 0.2,
  },
  required: {
    fontSize: 13,
    color: Colors.danger.DEFAULT,
    fontWeight: '600',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface.DEFAULT,
    borderWidth: 1,
    borderRadius: 16,
    minHeight: 52,
    paddingHorizontal: 16,
  },
  disabled: {
    opacity: 0.5,
  },
  leftIcon: {
    marginRight: 12,
  },
  rightElement: {
    marginLeft: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.text.primary,
    paddingVertical: 12,
  },
  inputWithLeft: {
    paddingLeft: 0,
  },
  inputWithRight: {
    paddingRight: 0,
  },
  error: {
    fontSize: 12,
    color: Colors.danger.DEFAULT,
    fontWeight: '500',
  },
  hint: {
    fontSize: 12,
    color: Colors.text.tertiary,
  },
});
