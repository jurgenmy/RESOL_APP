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
import { collection, query, where, getDocs, getDoc } from 'firebase/firestore';
import { TouchableOpacity, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const ProfileScreen = () => {
  // Mover todos los estados al principio del componente
  const [refreshing, setRefreshing] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    profile,
    friends,
    pendingRequests,
    stats,
    deleteFriend,
    loadProfile,
    updateProfile,
    acceptFriend
  } = useProfile();

  // Unificar la lógica de carga inicial
  useEffect(() => {
    loadProfile();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  const handleAddFriend = async (friendEmail: string) => {
    if (!friendEmail) {
      Alert.alert('Error', 'El email es requerido');
      return;
    }

    try {
      setIsLoading(true);
      const currentUserId = FIREBASE_AUTH.currentUser?.uid;
      if (!currentUserId) {
        Alert.alert('Error', 'Usuario no autenticado');
        return;
      }

      const usersRef = collection(FIREBASE_DB, 'users');
      const emailQuery = query(usersRef, where('email', '==', friendEmail.toLowerCase().trim()));
      const querySnapshot = await getDocs(emailQuery);

      if (querySnapshot.empty) {
        Alert.alert('Error', 'Usuario no encontrado');
        return;
      }

      const friendDoc = querySnapshot.docs[0];
      const friendId = friendDoc.id;
      const friendData = friendDoc.data();

      if (friendId === currentUserId) {
        Alert.alert('Error', 'No puedes agregarte a ti mismo');
        return;
      }

      const updatedPendingFriends = [...(friendData.pendingFriends || []), currentUserId];
      await updateDoc(doc(FIREBASE_DB, 'users', friendId), {
        pendingFriends: updatedPendingFriends
      });

      setShowAddFriendModal(false);
      Alert.alert('Éxito', 'Solicitud enviada');
      await loadProfile();
    } catch (error) {
      console.error('Error adding friend:', error);
      Alert.alert('Error', 'No se pudo enviar la solicitud');
    } finally {
      setIsLoading(false);
    }
  };

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

        const response = await axios.post('https://api.imgbb.com/1/upload', formData, {
          params: {
            key: process.env.EXPO_PUBLIC_IMGBB_API_KEY,
          },
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'multipart/form-data',
          },
        });

        if (response.data?.data?.url) {
          const userId = FIREBASE_AUTH.currentUser?.uid;
          if (userId) {
            await updateDoc(doc(FIREBASE_DB, 'users', userId), {
              photoURL: response.data.data.url,
            });
            await loadProfile();
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
      const userId = FIREBASE_AUTH.currentUser?.uid;
      if (userId) {
        await Clipboard.setStringAsync(userId);
        Alert.alert('Éxito', 'ID copiado al portapapeles');
      }
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
         
      {/* <ProfileStats stats={stats} /> */}

      <PendingRequests
        requests={pendingRequests}
        onAcceptRequest={acceptFriend}
      />

      <TouchableOpacity 
        style={styles.addFriendButton}
        onPress={() => setShowAddFriendModal(true)}
      >
        <MaterialIcons name="person-add" size={12} color="#fff" />
        <Text style={styles.addFriendButtonText}>Agregar Amigo</Text>
      </TouchableOpacity>

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
        onAddFriend={handleAddFriend}
      />
    </ScrollView>
  );
};

export default ProfileScreen;