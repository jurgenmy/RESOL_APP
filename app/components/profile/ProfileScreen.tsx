// ProfileScreen.tsx
import React, { useState, useEffect } from 'react';
import { ScrollView, RefreshControl, View, ActivityIndicator, Alert } from 'react-native';
import { useProfile } from '../../hooks/useProfile';
import { useFocusEffect } from '@react-navigation/native';
import { ProfileHeader } from '../profile/ProfileHeader';
import { ProfileInfo } from '../profile/ProfileInfo';
import { ProfileStats } from '../profile/ProfileStats';
import { PendingRequests } from '../profile/PendingRequests';
import { FriendsList } from './FriendsLists';
import EditProfileModal from '../profile/EditProfileModal';
import AddFriendModal from '../profile/AddFriendModal';
import { styles } from '../styles';
import * as Clipboard from 'expo-clipboard';
import { FIREBASE_AUTH, FIREBASE_DB } from '../../../FirebaseConfig';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { doc, updateDoc } from 'firebase/firestore';

const ProfileScreen = () => {
  const {
    profile,
    friends,
    pendingRequests,
    stats,
    isLoading,
    deleteFriend,
    loadProfile,
    updateProfile,
    addFriend,
    acceptFriend
  } = useProfile();

  const [refreshing, setRefreshing] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);

  // Efecto para cargar el perfil al montar el componente
  useEffect(() => {
    loadProfile();
  }, []);

  // Efecto para recargar cuando la pantalla obtiene el foco
  useFocusEffect(
    React.useCallback(() => {
      loadProfile();
      return () => {
        // Cleanup si es necesario
      };
    }, [loadProfile])
  );

  const handleUpdateProfileImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Error', 'Se requiere permiso de acceso a la galería');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setIsImageLoading(true);
        const formData = new FormData();
        formData.append('image', {
          uri: result.assets[0].uri,
          type: 'image/jpeg',
          name: 'profile.jpg',
        } as any);

        const config = {
          method: 'post',
          url: 'https://api.imgbb.com/1/upload',
          params: {
            key: process.env.EXPO_PUBLIC_IMGBB_API_KEY,
          },
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'multipart/form-data',
          },
          data: formData,
        };

        const uploadResponse = await axios(config);
        if (uploadResponse.data && uploadResponse.data.data.url) {
          const userId = FIREBASE_AUTH.currentUser?.uid;
          if (userId) {
            const userRef = doc(FIREBASE_DB, 'users', userId);
            await updateDoc(userRef, {
              photoURL: uploadResponse.data.data.url,
            });

            loadProfile(); // Recargar el perfil después de actualizar la imagen
            Alert.alert('Éxito', 'Imagen de perfil actualizada');
          }
        }
      }
    } catch (error) {
      console.error('Error al actualizar imagen:', error);
      Alert.alert('Error', 'No se pudo actualizar la imagen de perfil');
    } finally {
      setIsImageLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadProfile();
    setRefreshing(false);
  };

  const copyUserId = async () => {
    try {
      await Clipboard.setStringAsync(FIREBASE_AUTH.currentUser?.uid || '');
      Alert.alert('Éxito', 'ID copiado al portapapeles');
    } catch (error) {
      console.error('Error copying ID:', error);
      Alert.alert('Error', 'No se pudo copiar el ID');
    }
  };

  if (isLoading || isImageLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <ProfileHeader onEditPress={() => setIsEditModalVisible(true)} />

      {profile && (
        <ProfileInfo
          profile={profile}
          onImagePress={handleUpdateProfileImage}
          onCopyId={copyUserId}
          userId={FIREBASE_AUTH.currentUser?.uid || ''}
        />
      )}

      <ProfileStats stats={stats} />

      <PendingRequests
        requests={pendingRequests}
        onAcceptRequest={acceptFriend}
      />

<FriendsList 
  friends={friends}
  onRefreshFriends={loadProfile}
  onDeleteFriend={deleteFriend}

/>

      <EditProfileModal
        visible={isEditModalVisible}
        onClose={() => setIsEditModalVisible(false)}
        onSave={updateProfile}
        currentProfile={profile}
      />

      <AddFriendModal
        visible={showAddFriendModal}
        onClose={() => setShowAddFriendModal(false)}
        onAddFriend={addFriend}
      />
    </ScrollView>
  );
};

export default ProfileScreen;
