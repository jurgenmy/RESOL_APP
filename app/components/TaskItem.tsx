//TaskItem.tsx

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TaskService } from '../services/TaskService';
import { Alert } from 'react-native';
import ShareTaskModal from './ShareTaskModal';

interface TaskItemProps {
  item: {
    id: string;
    nombre: string;
    descripcion: string;
    estado: string;
    prioridad: string;
    fecha: Date;
    nota?: string;
    sharedBy?: string;
    sharedWith?: string[];
    assignedTo?: string;
    isGroupTask?: boolean;
    groupId?: string;
  };
  editTask: (id: string) => void;
  deleteTask: (id: string) => void;
  openNotesModal: (id: string) => void;
  onStatusChange?: (taskId: string, newStatus: string) => void;
}

const TaskItem = ({ item, editTask, deleteTask, openNotesModal, onStatusChange }: TaskItemProps) => {
  const [showShareModal, setShowShareModal] = useState(false);

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

  const renderNotePreview = (nota: string) => {
    const maxLength = 50;
    if (nota.length > maxLength) {
      return nota.substring(0, maxLength) + '...';
    }
    return nota;
  };

  const handleStatusChange = async () => {
    try {
      await TaskService.updateTaskStatus(item.id, 'finalizada');
      if (onStatusChange) {
        onStatusChange(item.id, 'finalizada');
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el estado de la tarea');
    }
  };

  const fechaFormateada = item.fecha instanceof Date 
    ? item.fecha.toLocaleDateString()
    : new Date(item.fecha).toLocaleDateString();

  return (
    <View style={styles.taskItem}>
      <View style={styles.taskHeader}>
        <Text style={styles.taskTitle} numberOfLines={1}>
          {item.nombre}
        </Text>
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: '#4A90E2' }]}
            onPress={() => editTask(item.id)}
          >
            <Ionicons name="pencil" size={20} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: '#6BCB77' }]}
            onPress={() => setShowShareModal(true)}
          >
            <Ionicons name="share-social" size={20} color="white" />
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

      <Text style={styles.taskDescription} numberOfLines={2}>
        {item.descripcion}
      </Text>

      <View style={styles.taskFooter}>
        <View style={[styles.badge, { backgroundColor: getPriorityColor(item.prioridad) }]}>
          <Text style={styles.badgeText}>{item.prioridad}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: '#4A90E2' }]}>
          <Text style={styles.badgeText}>{item.estado}</Text>
        </View>
        <Text style={styles.dateText}>{fechaFormateada}</Text>
      </View>

      {item.nota && (
        <TouchableOpacity 
          style={styles.notesContainer}
          onPress={() => openNotesModal(item.id)}
        >
          <Text style={styles.notesPreviewLabel}>Nota:</Text>
          <Text style={styles.notesPreviewText}>
            {renderNotePreview(item.nota)}
          </Text>
          {item.nota.length > 50 && (
            <Text style={styles.seeMoreText}>Ver más...</Text>
          )}
        </TouchableOpacity>
      )}

      {item.sharedBy && (
        <View style={styles.sharedInfo}>
          <Text style={styles.sharedText}>
            Compartido por: {item.sharedBy}
          </Text>
          {item.isGroupTask && item.groupId && (
            <Text style={styles.sharedText}>
              Grupo: {item.groupId}
            </Text>
          )}
          {item.assignedTo && (
            <Text style={styles.sharedText}>
              Asignado a: {item.assignedTo}
            </Text>
          )}
        </View>
      )}

      <ShareTaskModal
        visible={showShareModal}
        onClose={() => setShowShareModal(false)}
        taskId={item.id}
      />
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
  notesPreviewLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 4,
  },
  notesPreviewText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  seeMoreText: {
    fontSize: 12,
    color: '#4A90E2',
    marginTop: 4,
  },
  sharedInfo: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
  },
  sharedText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
});

export default TaskItem;