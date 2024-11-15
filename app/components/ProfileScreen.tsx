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
import { doc, updateDoc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';

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
};const AddFriendModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  onAddFriend: (email: string) => Promise<void>;
}> = ({ visible, onClose, onAddFriend }) => {
  const [email, setEmail] = useState('');

  const handleSubmit = async () => {
    await onAddFriend(email);
    setEmail('');
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
          <Text style={styles.modalTitle}>Agregar Amigo</Text>
          
          <TextInput
            style={styles.modalInput}
            placeholder="Correo electrónico"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          
          <View style={styles.modalButtons}>
            <TouchableOpacity 
              style={[styles.modalButton, styles.cancelButton]} 
              onPress={() => {
                setEmail('');
                onClose();
              }}
            >
              <Text style={styles.modalButtonText}>Cancelar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modalButton, styles.saveButton]} 
              onPress={handleSubmit}
            >
              <Text style={styles.modalButtonText}>Enviar Solicitud</Text>
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
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [friendEmail, setFriendEmail] = useState('');

  
const loadProfile = async () => {
  try {
    const userId = FIREBASE_AUTH.currentUser?.uid;
    if (!userId) return;

    const userProfile = await UserService.getUserProfile(userId);
    setProfile(userProfile);
    
    // Cargar solicitudes pendientes
    if (userProfile?.pendingFriends?.length) {
      const pendingProfiles = await Promise.all(
        userProfile.pendingFriends.map(async (friendId) => {
          const profile = await UserService.getUserProfile(friendId);
          // Asegurarse de que el ID esté incluido en el perfil
          return profile ? {
            ...profile,
            uid: friendId,  // Aseguramos que uid esté presente
            friendId: friendId  // Respaldo adicional
          } : null;
        })
      );
      setPendingRequests(pendingProfiles.filter((p): p is UserProfile => p !== null));
    } else {
      setPendingRequests([]);
    }
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
      // Añadir log para debug
      console.log('Accepting friend with ID:', friendId);
      
      if (!friendId) {
        console.log('Friend ID is undefined or empty');
        Alert.alert('Error', 'El ID del amigo no está definido');
        return;
      }
  
      setIsLoading(true);
      const userId = FIREBASE_AUTH.currentUser?.uid;
      if (!userId) {
        Alert.alert('Error', 'No se pudo obtener el ID del usuario actual');
        return;
      }
  
      // Obtener documento del usuario actual
      const userRef = doc(FIREBASE_DB, 'users', userId);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();
  
      if (!userData) {
        Alert.alert('Error', 'No se pudieron obtener los datos del usuario');
        return;
      }
  
      const currentPending = userData.pendingFriends || [];
      const currentFriends = userData.friends || [];
  
      // Log para debug
      console.log('Current pending friends:', currentPending);
      console.log('Current friends:', currentFriends);
  
      // Verificar si la solicitud está pendiente
      if (!currentPending.includes(friendId)) {
        console.log('Friend ID not found in pending list');
        Alert.alert('Error', 'No se encontró la solicitud de amistad');
        return;
      }
  
      // Obtener documento del amigo
      const friendRef = doc(FIREBASE_DB, 'users', friendId);
      const friendDoc = await getDoc(friendRef);
      const friendData = friendDoc.data();
  
      if (!friendDoc.exists() || !friendData) {
        Alert.alert('Error', 'No se encontró el usuario amigo');
        return;
      }
  
      const friendFriends = friendData.friends || [];
  
      // Preparar actualizaciones
      const updatedUserData = {
        friends: [...new Set([...currentFriends, friendId])],
        pendingFriends: currentPending.filter((id: string) => id !== friendId)
      };
      
  
      const updatedFriendData = {
        friends: [...new Set([...friendFriends, userId])]
      };
  
      // Log para debug
      console.log('Updating user data:', updatedUserData);
      console.log('Updating friend data:', updatedFriendData);
  
      // Realizar actualizaciones
      await updateDoc(userRef, updatedUserData);
      await updateDoc(friendRef, updatedFriendData);
  
      // Recargar el perfil
      await loadProfile();
      Alert.alert('Éxito', 'Solicitud de amistad aceptada');
  
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
  
  const handleAddFriend = async (friendEmail: string) => {
    try {
      setIsLoading(true);

      if (!friendEmail) {
        Alert.alert('Error', 'Por favor ingresa un correo electrónico');
        return;
      }

      const currentUserId = FIREBASE_AUTH.currentUser?.uid;
      if (!currentUserId) {
        Alert.alert('Error', 'No se pudo obtener el ID del usuario actual');
        return;
      }

      // Primero buscar en Firestore
      const usersRef = collection(FIREBASE_DB, 'users');
      const emailQuery = query(usersRef, where('email', '==', friendEmail.toLowerCase().trim()));
      const querySnapshot = await getDocs(emailQuery);

      if (querySnapshot.empty) {

        Alert.alert('Error', 'No se encontró ningún usuario con ese correo electrónico');
        return;
      }

      const friendDoc = querySnapshot.docs[0];
      const friendId = friendDoc.id;

      if (friendId === currentUserId) {
        Alert.alert('Error', 'No puedes agregarte a ti mismo como amigo');
        return;
      }

      // Obtener datos actuales del usuario
      const currentUserDoc = await getDoc(doc(FIREBASE_DB, 'users', currentUserId));
      const currentUserData = currentUserDoc.data();

      if (!currentUserData) {
        Alert.alert('Error', 'No se pudieron obtener los datos del usuario');
        return;
      }

      // Verificar si ya son amigos
      if (currentUserData.friends?.includes(friendId)) {
        Alert.alert('Error', 'Este usuario ya es tu amigo');
        return;
      }

      // Verificar si ya hay una solicitud pendiente
      if (currentUserData.pendingFriends?.includes(friendId)) {
        Alert.alert('Info', 'Ya existe una solicitud pendiente con este usuario');
        return;
      }

      // Obtener datos del amigo
      const friendData = friendDoc.data();
      const updatedPendingFriends = [...(friendData.pendingFriends || []), currentUserId];

      // Actualizar pendingFriends del amigo
      await updateDoc(doc(FIREBASE_DB, 'users', friendId), {
        pendingFriends: updatedPendingFriends
      });

      setShowAddFriendModal(false);
      Alert.alert('Éxito', 'Solicitud de amistad enviada');
      
      // Recargar el perfil para actualizar la UI
      await loadProfile();
      
    } catch (error) {
      console.error('Error adding friend:', error);
      Alert.alert('Error', 'No se pudo enviar la solicitud de amistad');
    } finally {
      setIsLoading(false);
    }
  };
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
          <Text style={styles.displayName}>
            {profile.firstName} {profile.lastName}
          </Text>
          <Text style={styles.email}>{profile.email}</Text>
          <Text style={styles.birthdate}>
            Fecha de nacimiento: {profile.birthdate}
          </Text>
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
          <TouchableOpacity 
            style={styles.addFriendButton}
            onPress={() => setShowAddFriendModal(true)}
          >
            <MaterialIcons name="person-add" size={24} color="#fff" />
            <Text style={styles.addFriendButtonText}>Agregar Amigo</Text>
          </TouchableOpacity>

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
            onPress={() => {
              // Use uid instead of id
              const friendId = item.uid || item.friendId;
              if (friendId) {
                handleAcceptFriend(friendId);
              } else {
                Alert.alert('Error', 'No se pudo identificar al usuario');
              }
            }}
          >
            <Text style={styles.buttonText}>Aceptar</Text>
          </TouchableOpacity>
        </View>
      )}
      keyExtractor={item => item.uid || item.friendId || Math.random().toString()}
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
      <AddFriendModal
        visible={showAddFriendModal}
        onClose={() => setShowAddFriendModal(false)}
        onAddFriend={handleAddFriend}
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
  birthdate: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  addFriendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4A90E2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 16,
  },
  addFriendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default ProfileScreen;

