// components/GroupsScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, Alert, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { GroupService } from '../services/GroupService';
import { Group } from '../types/social';
import { FIREBASE_AUTH } from '../../FirebaseConfig';

type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  Profile: undefined;
  Groups: undefined;
  CompletedTasks: undefined;
};

const GroupsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [groups, setGroups] = useState<Group[]>([]);
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    const userId = FIREBASE_AUTH.currentUser?.uid;
    if (userId) {
      const userGroups = await GroupService.getUserGroups(userId);
      setGroups(userGroups);
    }
  };

  const handleCreateGroup = async () => {
    const userId = FIREBASE_AUTH.currentUser?.uid;
    if (userId && newGroupName.trim()) {
      try {
        const newGroup = {
          name: newGroupName.trim(),
          description: newGroupDescription.trim(),
          owner: userId,
          members: [userId],
          tasks: [],
          createdAt: new Date()
        };
        
        await GroupService.createGroup(newGroup);
        setShowNewGroupModal(false);
        setNewGroupName('');
        setNewGroupDescription('');
        loadGroups();
      } catch (error) {
        Alert.alert('Error', 'No se pudo crear el grupo');
      }
    }
  };

  const NewGroupModal = () => (
    <Modal
      visible={showNewGroupModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowNewGroupModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Crear Nuevo Grupo</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Nombre del grupo"
            value={newGroupName}
            onChangeText={setNewGroupName}
          />
          
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Descripción"
            value={newGroupDescription}
            onChangeText={setNewGroupDescription}
            multiline
          />
          
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.button, styles.createButton]}
              onPress={handleCreateGroup}
            >
              <Text style={styles.buttonText}>Crear</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => setShowNewGroupModal(false)}
            >
              <Text style={styles.buttonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mis Grupos</Text>

      <TouchableOpacity
        style={styles.createGroupButton}
        onPress={() => setShowNewGroupModal(true)}
      >
        <Text style={styles.createGroupButtonText}>Crear Nuevo Grupo</Text>
      </TouchableOpacity>

      <FlatList
        data={groups}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.groupItem}>
            <Text style={styles.groupName}>{item.name}</Text>
            <Text style={styles.groupDescription}>{item.description}</Text>
            <Text style={styles.groupMembers}>
              {item.members.length} miembro{item.members.length !== 1 ? 's' : ''}
            </Text>
          </TouchableOpacity>
        )}
        keyExtractor={item => item.id}
      />

      <NewGroupModal />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  createGroupButton: {
    backgroundColor: '#4A90E2',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  createGroupButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  groupItem: {
    padding: 15,
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    marginBottom: 10,
  },
  groupName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  groupDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  groupMembers: {
    fontSize: 12,
    color: '#888',
  },
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
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  button: {
    padding: 15,
    borderRadius: 8,
    width: '45%',
    alignItems: 'center',
  },
  createButton: {
    backgroundColor: '#4A90E2',
  },
  cancelButton: {
    backgroundColor: '#FF6347',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default GroupsScreen;