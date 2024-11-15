// components/profile/ProfileInfo.tsx
import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { UserProfile } from '../../types/social';
import { styles } from '../styles';

interface ProfileInfoProps {
  profile: UserProfile;
  onImagePress: () => void;
  onCopyId: () => void;
  userId: string;
}

export const ProfileInfo: React.FC<ProfileInfoProps> = ({
  profile,
  onImagePress,
  onCopyId,
  userId,
}) => (
  <View style={styles.profileInfo}>
    <TouchableOpacity onPress={onImagePress}>
      <Image 
        source={{ uri: profile.photoURL || 'https://via.placeholder.com/150' }} 
        style={styles.profileImage}
      />
      <Text style={styles.changePhotoText}>Cambiar foto</Text>
    </TouchableOpacity>
    <Text style={styles.displayName}>
      {profile.firstName} {profile.lastName}
    </Text>
    <Text style={styles.email}>{profile.email}</Text>
    <Text style={styles.birthdate}>
      Fecha de nacimiento: {profile.birthdate}
    </Text>
    {profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}
    
    <TouchableOpacity style={styles.idContainer} onPress={onCopyId}>
      <Text style={styles.idText}>ID: {userId}</Text>
      <MaterialIcons name="content-copy" size={16} color="#666" />
    </TouchableOpacity>
  </View>
);

