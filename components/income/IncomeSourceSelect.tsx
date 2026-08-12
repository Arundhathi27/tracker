import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { 
  Briefcase, Code, Landmark, TrendingUp, Gift, 
  RotateCcw, Sparkles, HelpCircle 
} from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { IncomeSource } from '@/types';

interface IncomeSourceSelectProps {
  selectedSource: IncomeSource | null;
  onSelect: (source: IncomeSource) => void;
  error?: string;
}

export const INCOME_SOURCES = [
  { id: 'Salary', name: 'Salary', icon: Briefcase, color: Colors.primary.DEFAULT },
  { id: 'Freelance', name: 'Freelance', icon: Code, color: Colors.accent.DEFAULT },
  { id: 'Business', name: 'Business', icon: Landmark, color: Colors.warning.DEFAULT },
  { id: 'Investment', name: 'Investment', icon: TrendingUp, color: Colors.success.DEFAULT },
  { id: 'Gift', name: 'Gift', icon: Gift, color: '#FF69B4' },
  { id: 'Refund', name: 'Refund', icon: RotateCcw, color: '#8A2BE2' },
  { id: 'Bonus', name: 'Bonus', icon: Sparkles, color: '#FFD700' },
  { id: 'Other', name: 'Other', icon: HelpCircle, color: Colors.text.tertiary },
];

export function getIncomeSourceIcon(name: string) {
  const source = INCOME_SOURCES.find(s => s.name === name);
  return source ? source.icon : HelpCircle;
}

export function getIncomeSourceColor(name: string) {
  const source = INCOME_SOURCES.find(s => s.name === name);
  return source ? source.color : Colors.primary.DEFAULT;
}

export function IncomeSourceSelect({ selectedSource, onSelect, error }: IncomeSourceSelectProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Income Source</Text>
      
      <View style={styles.grid}>
        {INCOME_SOURCES.map((source) => {
          const isSelected = selectedSource === source.id;
          const IconComp = source.icon;
          return (
            <TouchableOpacity
              key={source.id}
              style={[
                styles.sourceCard,
                isSelected && { borderColor: source.color, backgroundColor: `${source.color}15` }
              ]}
              onPress={() => onSelect(source.id as IncomeSource)}
            >
              <View style={[styles.iconWrapper, { backgroundColor: `${source.color}20` }]}>
                <IconComp size={24} color={source.color} />
              </View>
              <Text style={[
                styles.sourceName,
                isSelected && { color: source.color, fontWeight: '600' }
              ]} numberOfLines={1}>
                {source.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      
      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.secondary,
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  sourceCard: {
    width: '30%',
    backgroundColor: Colors.surface.DEFAULT,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  sourceName: {
    fontSize: 12,
    color: Colors.text.primary,
    textAlign: 'center',
  },
  errorText: {
    color: Colors.danger.DEFAULT,
    fontSize: 12,
    marginTop: 8,
  },
});
