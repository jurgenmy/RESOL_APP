//ProfileStats.tsx

import React from 'react';
import { View, Text } from 'react-native';
import { styles } from '../styles';

interface ProfileStatsProps {
  stats: {
    totalTasks: number;
    completedTasks: number;
    totalGroups: number;
  };
}

export const ProfileStats: React.FC<ProfileStatsProps> = ({ stats }) => (
  <View style={styles.statsContainer}>
    <View style={styles.statItem}>
      <Text style={styles.statNumber}>{stats.totalTasks}</Text>
      <Text style={styles.statLabel}>Tareas</Text>
    </View>
    <View style={styles.statItem}>
      <Text style={styles.statNumber}>{stats.completedTasks}</Text>
      <Text style={styles.statLabel}>Completadas</Text>
    </View>
    <View style={styles.statItem}>
      <Text style={styles.statNumber}>{stats.totalGroups}</Text>
      <Text style={styles.statLabel}>Grupos</Text>
    </View>
  </View>
);