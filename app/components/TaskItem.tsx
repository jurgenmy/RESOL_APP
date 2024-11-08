import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TaskItemProps {
  item: {
    id: string;
    nombre: string;
    descripcion: string;
    estado: string;
    prioridad: string;
    fecha: Date;
    nota?: string;
  };
  editTask: (id: string) => void;
  deleteTask: (id: string) => void;
  openNotesModal: (id: string) => void;
}

const TaskItem = ({ item, editTask, deleteTask, openNotesModal }: TaskItemProps) => {
  const getPriorityColor = (prioridad: string) => {
    switch (prioridad) {
      case 'prioridad alta':
        return '#FF6B6B';
      case 'prioridad media':
        return '#FFD93D';
      case 'prioridad baja':
        return '#6BCB77';
      default:
        return '#B2B2B2';
    }
  };

  return (
    <View style={styles.taskItem}>
      <View style={styles.taskHeader}>
        <Text style={styles.taskTitle}>{item.nombre}</Text>
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: '#4A90E2' }]}
            onPress={() => editTask(item.id)}
          >
            <Ionicons name="pencil" size={20} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: '#FF6347' }]}
            onPress={() => deleteTask(item.id)}
          >
            <Ionicons name="trash" size={20} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: '#6BCB77' }]}
            onPress={() => openNotesModal(item.id)}
          >
            <Ionicons name="document-text" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>
      
      <Text style={styles.taskDescription}>{item.descripcion}</Text>
      
      <View style={styles.taskFooter}>
        <View style={[styles.badge, { backgroundColor: getPriorityColor(item.prioridad) }]}>
          <Text style={styles.badgeText}>{item.prioridad}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: '#4A90E2' }]}>
          <Text style={styles.badgeText}>{item.estado}</Text>
        </View>
        <Text style={styles.dateText}>
          {new Date(item.fecha).toLocaleDateString()}
        </Text>
      </View>
      
      {item.nota && (
        <View style={styles.notesContainer}>
          <Text style={styles.notesText}>Nota: {item.nota}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  taskItem: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  taskDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 8,
    borderRadius: 5,
    marginLeft: 5,
  },
  taskFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  dateText: {
    fontSize: 12,
    color: '#666',
  },
  notesContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 5,
  },
  notesText: {
    fontSize: 12,
    color: '#666',
  },
});

export default TaskItem;