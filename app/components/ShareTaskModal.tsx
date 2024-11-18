import { useState, useEffect } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, FlatList, Alert } from 'react-native';
import { FIREBASE_AUTH } from '../../FirebaseConfig';
import { UserService } from '../services/UserService';
import { GroupService } from '../services/GroupService';
import { TaskService } from '../services/TaskService';
import { UserProfile, Group } from '../types/social';

interface ShareTaskModalProps {
  visible: boolean;
  onClose: () => void;
  taskId: string;
}

const ShareTaskModal = ({ visible, onClose, taskId }: ShareTaskModalProps) => {
  const [friends, setFriends] = useState<UserProfile[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedTab, setSelectedTab] = useState<'friends' | 'groups'>('friends');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && taskId) {
      loadData();
    }
  }, [visible, taskId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const currentUser = FIREBASE_AUTH.currentUser;
      if (!currentUser?.uid) {
        Alert.alert('Error', 'No se encontró usuario autenticado');
        onClose();
        return;
      }

      console.log('Loading data for user:', currentUser.uid); // Debug log

      const userProfile = await UserService.getUserProfile(currentUser.uid);
      if (!userProfile) {
        Alert.alert('Error', 'No se encontró el perfil del usuario');
        onClose();
        return;
      }

      console.log('User friends:', userProfile.friends); // Debug log

      if (userProfile.friends && userProfile.friends.length > 0) {
        const friendProfiles = await Promise.all(
          userProfile.friends.map(async (friendId) => {
            try {
              const profile = await UserService.getUserProfile(friendId);
              console.log('Friend profile loaded:', friendId, profile); // Debug log
              return profile;
            } catch (error) {
              console.error('Error loading friend profile:', friendId, error);
              return null;
            }
          })
        );

        const validFriendProfiles = friendProfiles.filter((p): p is UserProfile => p !== null);
        console.log('Valid friend profiles:', validFriendProfiles.length); // Debug log
        setFriends(validFriendProfiles);
      } else {
        console.log('No friends found for user'); // Debug log
        setFriends([]);
      }

      const userGroups = await GroupService.getUserGroups(currentUser.uid);
      console.log('User groups loaded:', userGroups.length); // Debug log
      setGroups(userGroups);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleShareWithFriend = async (friendId: string) => {
    try {
      setLoading(true);
      const currentUser = FIREBASE_AUTH.currentUser;
      
      if (!currentUser?.uid) {
        throw new Error('Usuario no autenticado');
      }

      await TaskService.shareTaskWithUser(taskId, currentUser.uid, friendId);
      
      // Recargar los datos después de compartir
      await loadData();
      
      Alert.alert('Éxito', 'Tarea compartida correctamente');
      onClose();
    } catch (error: any) {
      console.error('Error sharing task:', error);
      Alert.alert('Error', error.message || 'Error al compartir la tarea');
    } finally {
      setLoading(false);
    }
  };

  const handleShareWithGroup = async (groupId: string) => {
    if (!groupId) {
      Alert.alert('Error', 'ID de grupo no válido');
      return;
    }

    const currentUser = FIREBASE_AUTH.currentUser;
    if (!currentUser?.uid) {
      Alert.alert('Error', 'Usuario no autenticado');
      return;
    }

    try {
      setLoading(true);
      console.log('Sharing task with group:', {
        taskId,
        userId: currentUser.uid,
        groupId
      }); // Debug log

      await TaskService.shareTaskWithGroup(taskId, currentUser.uid, groupId);
      Alert.alert('Éxito', 'Tarea compartida con el grupo correctamente');
      onClose();
    } catch (error) {
      console.error('Error sharing task with group:', error);
      Alert.alert('Error', 'Error al compartir la tarea con el grupo');
    } finally {
      setLoading(false);
    }
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>
        {selectedTab === 'friends' ? 'No tienes amigos agregados' : 'No perteneces a ningún grupo'}
      </Text>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>Compartir Tarea</Text>

          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, selectedTab === 'friends' && styles.activeTab]}
              onPress={() => setSelectedTab('friends')}
            >
              <Text>Amigos</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, selectedTab === 'groups' && styles.activeTab]}
              // onPress={() => setSelectedTab('groups')}
            >
              {/* <Text>Grupos</Text> */}
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <Text>Cargando...</Text>
            </View>
          ) : selectedTab === 'friends' ? (
            <FlatList
              data={friends}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.item}
                  onPress={() => handleShareWithFriend(item.id)}
                >
                  <Text>{item.displayName || 'Usuario sin nombre'}</Text>
                </TouchableOpacity>
              )}
              keyExtractor={item => item.id}
              ListEmptyComponent={renderEmptyList}
            />
          ) : (
            <FlatList
              data={groups}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.item}
                  onPress={() => handleShareWithGroup(item.id)}
                >
                  <Text>{item.name}</Text>
                </TouchableOpacity>
              )}
              keyExtractor={item => item.id}
              ListEmptyComponent={renderEmptyList}
            />
          )}

          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
          >
            <Text style={styles.closeButtonText}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  tabs: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#ddd',
  },
  activeTab: {
    borderBottomColor: '#4A90E2',
  },
  item: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  closeButton: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#4A90E2',
    borderRadius: 10,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
    textAlign: 'center',
  },
});

export default ShareTaskModal;