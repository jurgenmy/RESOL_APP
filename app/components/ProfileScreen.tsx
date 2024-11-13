// components/ProfileScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  Image, 
  Alert,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Modal,
  Platform,
  ScrollView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { UserService } from '../services/UserService';
import { UserProfile } from '../types/social';
import { FIREBASE_AUTH, FIREBASE_DB } from '../../FirebaseConfig';
import * as ImagePicker from 'expo-image-picker';
import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';

import axios from 'axios';
import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useFocusEffect } from '@react-navigation/native';

type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  Profile: undefined;
  Groups: undefined;
  CompletedTasks: undefined;
  EditProfile: undefined;
};

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: Partial<UserProfile>) => void;
  currentProfile: UserProfile | null;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({
  visible,
  onClose,
  onSave,
  currentProfile
}) => {
  const [displayName, setDisplayName] = useState(currentProfile?.displayName || '');
  const [bio, setBio] = useState(currentProfile?.bio || '');

  const handleSave = () => {
    onSave({
      displayName,
      bio
    });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Editar Perfil</Text>
          
          <TextInput
            style={styles.modalInput}
            placeholder="Nombre de usuario"
            value={displayName}
            onChangeText={setDisplayName}
          />
          
          <TextInput
            style={[styles.modalInput, styles.bioInput]}
            placeholder="Biografía"
            value={bio}
            onChangeText={setBio}
            multiline
            numberOfLines={4}
          />
          
          <View style={styles.modalButtons}>
            <TouchableOpacity 
              style={[styles.modalButton, styles.cancelButton]} 
              onPress={onClose}
            >
              <Text style={styles.modalButtonText}>Cancelar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modalButton, styles.saveButton]} 
              onPress={handleSave}
            >
              <Text style={styles.modalButtonText}>Guardar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const ProfileScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [friends, setFriends] = useState<UserProfile[]>([]);
  const [pendingRequests, setPendingRequests] = useState<UserProfile[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredFriends, setFilteredFriends] = useState<UserProfile[]>([]);
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    totalGroups: 0
  });

  const loadProfile = async () => {
    try {
      const userId = FIREBASE_AUTH.currentUser?.uid;
      if (!userId) return;

      const userProfile = await UserService.getUserProfile(userId);
      setProfile(userProfile);
      
      // Cargar amigos
      const friendProfiles = await Promise.all(
        userProfile?.friends?.map(friendId => UserService.getUserProfile(friendId)) || []
      );
      const validFriends = friendProfiles.filter((p): p is UserProfile => p !== null);
      setFriends(validFriends);
      setFilteredFriends(validFriends);
      
      // Cargar solicitudes pendientes
      const pendingProfiles = await Promise.all(
        userProfile?.pendingFriends?.map(friendId => UserService.getUserProfile(friendId)) || []
      );
      setPendingRequests(pendingProfiles.filter((p): p is UserProfile => p !== null));

      // Cargar estadísticas
      const statsRef = doc(FIREBASE_DB, 'userStats', userId);
      const statsSnapshot = await getDoc(statsRef);
      if (statsSnapshot.exists()) {
          setStats(statsSnapshot.data() as any);
      }
      
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'No se pudo cargar el perfil');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadProfile();
  }, []);

  useEffect(() => {
    const filtered = friends.filter(friend => 
      friend.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      friend.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredFriends(filtered);
  }, [searchQuery, friends]);

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
        setIsLoading(true);
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
            
            setProfile(prev => prev ? {...prev, photoURL: uploadResponse.data.data.url} : null);
            Alert.alert('Éxito', 'Imagen de perfil actualizada');
          }
        }
      }
    } catch (error) {
      console.error('Error al actualizar imagen:', error);
      Alert.alert('Error', 'No se pudo actualizar la imagen de perfil');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptFriend = async (friendId: string) => {
    try {
      setIsLoading(true);
      const userId = FIREBASE_AUTH.currentUser?.uid;
      if (userId) {
        await UserService.acceptFriendRequest(userId, friendId);
        await loadProfile();
        Alert.alert('Éxito', 'Solicitud de amistad aceptada');
      }
    } catch (error) {
      console.error('Error accepting friend request:', error);
      Alert.alert('Error', 'No se pudo aceptar la solicitud');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    Alert.alert(
      'Confirmar',
      '¿Estás seguro de que quieres eliminar este amigo?',
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              const userId = FIREBASE_AUTH.currentUser?.uid;
              if (userId) {
                await UserService.removeFriend(userId, friendId);
                await loadProfile();
                Alert.alert('Éxito', 'Amigo eliminado');
              }
            } catch (error) {
              console.error('Error removing friend:', error);
              Alert.alert('Error', 'No se pudo eliminar el amigo');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleUpdateProfile = async (data: Partial<UserProfile>) => {
    try {
      setIsLoading(true);
      const userId = FIREBASE_AUTH.currentUser?.uid;
      if (userId) {
        const userRef = doc(FIREBASE_DB, 'users', userId);
        await setDoc(userRef, data);
        setProfile(prev => prev ? {...prev, ...data} : null);
        Alert.alert('Éxito', 'Perfil actualizado');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'No se pudo actualizar el perfil');
    } finally {
      setIsLoading(false);
    }
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

  if (isLoading) {
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
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Mi Perfil</Text>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => setIsEditModalVisible(true)}
        >
          <MaterialIcons name="edit" size={24} color="#4A90E2" />
        </TouchableOpacity>
      </View>
      
      {profile && (
        <View style={styles.profileInfo}>
          <TouchableOpacity onPress={handleUpdateProfileImage}>
            <Image 
              source={{ 
                uri: profile.photoURL || 'https://via.placeholder.com/150'
              }} 
              style={styles.profileImage}
            />
            <Text style={styles.changePhotoText}>Cambiar foto</Text>
          </TouchableOpacity>
          <Text style={styles.displayName}>{profile.displayName}</Text>
          <Text style={styles.email}>{profile.email}</Text>
          {profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}
          
          <TouchableOpacity style={styles.idContainer} onPress={copyUserId}>
            <Text style={styles.idText}>ID: {FIREBASE_AUTH.currentUser?.uid}</Text>
            <MaterialIcons name="content-copy" size={16} color="#666" />
          </TouchableOpacity>

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
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Solicitudes Pendientes ({pendingRequests.length})
        </Text>
        {pendingRequests.length > 0 ? (
          <FlatList
            data={pendingRequests}
            renderItem={({ item }) => (
              <View style={styles.requestItem}>
                <View style={styles.userInfo}>
                  <Image 
                    source={{ uri: item.photoURL || 'https://via.placeholder.com/50' }} 
                    style={styles.smallProfileImage}
                  />
                  <View>
                    <Text style={styles.userName}>{item.displayName}</Text>
                    <Text style={styles.userEmail}>{item.email}</Text>
                  </View>
                </View>
                <TouchableOpacity 
                  style={styles.acceptButton}
                  onPress={() => handleAcceptFriend(item.id)}
                >
                  <Text style={styles.buttonText}>Aceptar</Text>
                </TouchableOpacity>
              </View>
            )}
            keyExtractor={item => item.id}
            scrollEnabled={false}
          />
        ) : (
          <Text style={styles.emptyText}>No hay solicitudes pendientes</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Mis Amigos ({friends.length})
        </Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar amigos..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {filteredFriends.length > 0 ? (
          <FlatList
            data={filteredFriends}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.friendItem}
                onLongPress={() => handleRemoveFriend(item.id)}
                >
                <Image 
                  source={{ uri: item.photoURL || 'https://via.placeholder.com/50' }} 
                  style={styles.smallProfileImage}
                />
                <View style={styles.friendInfo}>
                  <Text style={styles.userName}>{item.displayName}</Text>
                  <Text style={styles.userEmail}>{item.email}</Text>
                  {item.bio && (
                    <Text style={styles.userBio} numberOfLines={1}>
                      {item.bio}
                    </Text>
                  )}
                </View>
                <MaterialIcons name="chevron-right" size={24} color="#666" />
              </TouchableOpacity>
            )}
            keyExtractor={item => item.id}
            scrollEnabled={false}
          />
        ) : (
          <Text style={styles.emptyText}>
            {searchQuery ? 'No se encontraron amigos' : 'No tienes amigos agregados'}
          </Text>
        )}
      </View>

      <EditProfileModal
        visible={isEditModalVisible}
        onClose={() => setIsEditModalVisible(false)}
        onSave={handleUpdateProfile}
        currentProfile={profile}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  editButton: {
    padding: 8,
  },
  profileInfo: {
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  profileImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    marginBottom: 8,
  },
  smallProfileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  changePhotoText: {
    color: '#4A90E2',
    textAlign: 'center',
    marginBottom: 8,
  },
  displayName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  bio: {
    fontSize: 16,
    color: '#444',
    textAlign: 'center',
    marginBottom: 8,
    paddingHorizontal: 32,
  },
  idContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  idText: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  searchInput: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  requestItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  friendInfo: {
    flex: 1,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 8,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
  },
  userBio: {
    fontSize: 14,
    color: '#888',
    marginTop: 2,
  },
  acceptButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    padding: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalInput: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  bioInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  modalButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#4A90E2',
  },
  cancelButton: {
    backgroundColor: '#666',
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default ProfileScreen;