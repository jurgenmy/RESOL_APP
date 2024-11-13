//ShareTaskModal.tsx

import { useState, useEffect } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
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

  useEffect(() => {
    if (visible) {
      loadData();
    }
  }, [visible]);

  const loadData = async () => {
    const userId = FIREBASE_AUTH.currentUser?.uid;
    if (userId) {
      const userProfile = await UserService.getUserProfile(userId);
      if (userProfile) {
        const friendProfiles = await Promise.all(
          userProfile.friends.map(friendId => UserService.getUserProfile(friendId))
        );
        setFriends(friendProfiles.filter((p): p is UserProfile => p !== null));
        
        const userGroups = await GroupService.getUserGroups(userId);
        setGroups(userGroups);
      }
    }
  };

  const handleShareWithFriend = async (friendId: string) => {
    const userId = FIREBASE_AUTH.currentUser?.uid;
    if (userId) {
      await TaskService.shareTaskWithUser(taskId, userId, friendId);
      onClose();
    }
  };

  const handleShareWithGroup = async (groupId: string) => {
    const userId = FIREBASE_AUTH.currentUser?.uid;
    if (userId) {
      await TaskService.shareTaskWithGroup(taskId, userId, groupId);
      onClose();
    }
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
              onPress={() => setSelectedTab('groups')}
            >
              <Text>Grupos</Text>
            </TouchableOpacity>
          </View>

          {selectedTab === 'friends' ? (
            <FlatList
              data={friends}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.item}
                  onPress={() => handleShareWithFriend(item.id)}
                >
                  <Text>{item.displayName}</Text>
                </TouchableOpacity>
              )}
              keyExtractor={item => item.id}
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
  });

  export default ShareTaskModal;