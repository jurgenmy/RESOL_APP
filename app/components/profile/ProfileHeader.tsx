//ProfileHeader.tsx

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { styles } from '../styles';

interface ProfileHeaderProps {
  onEditPress: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ onEditPress }) => (
  <View style={styles.header}>
    <Text style={styles.title}>Mi Perfil</Text>
    <TouchableOpacity style={styles.editButton} onPress={onEditPress}>
      <MaterialIcons name="edit" size={24} color="#4A90E2" />
    </TouchableOpacity>
  </View>
);
