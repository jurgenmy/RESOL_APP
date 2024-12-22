import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import { FIREBASE_AUTH, FIREBASE_DB } from '../../FirebaseConfig';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  updateDoc,
  doc,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { TaskService } from '../services/TaskService';

interface Task {
  id: string;
  nombre: string;
  descripcion: string;
  resolucion: string;
  estado: string;
  prioridad: string;
  fecha: Date;
  nota?: string;
  isSharedTask?: boolean;
  sharedBy?: string;
  sharedByName?: string;
}

const CompletedTasks = () => {
  const [completedTasks, setCompletedTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const user = FIREBASE_AUTH.currentUser;

  const fetchCompletedTasks = async () => {
    if (user) {
      try {
        // Fetch regular completed tasks
        const tasksRef = collection(FIREBASE_DB, 'tasks');
        const q = query(
          tasksRef, 
          where('userId', '==', user.uid),
          where('estado', '==', 'finalizada'),
          orderBy('fecha', sortOrder)
        );
        
        const querySnapshot = await getDocs(q);
        const regularTasks = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          fecha: doc.data().fecha.toDate(),
          isSharedTask: false
        })) as Task[];

        // Fetch shared completed tasks
        const sharedTasks = await TaskService.fetchSharedTasks(user.uid);
        const completedSharedTasks = sharedTasks
          .filter(task => task.estado === 'finalizada')
          .map(task => ({
            id: task.id,
            nombre: task.nombre,
            descripcion: task.descripcion,
            resolucion: task.resolucion,
            estado: task.estado,
            prioridad: task.prioridad,
            fecha: task.fecha instanceof Timestamp ? task.fecha.toDate() : new Date(task.fecha),
            nota: task.nota,
            isSharedTask: true,
            sharedBy: task.sharedBy,
          })) as Task[];

        // Combine and sort all tasks
        const allTasks = [...regularTasks, ...completedSharedTasks].sort((a, b) => {
          if (sortOrder === 'desc') {
            return b.fecha.getTime() - a.fecha.getTime();
          }
          return a.fecha.getTime() - b.fecha.getTime();
        });
        
        setCompletedTasks(allTasks);
      } catch (error) {
        Alert.alert('Error', 'No se pudieron cargar las tareas completadas');
        console.error('Error fetching completed tasks:', error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    }
  };

  useEffect(() => {
    fetchCompletedTasks();
  }, [sortOrder]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchCompletedTasks();
  }, []);

  const reopenTask = async (taskId: string, isSharedTask: boolean) => {
    try {
      if (isSharedTask) {
        await TaskService.updateSharedTask(taskId, {
          estado: 'en proceso'
        });
      } else {
        const taskRef = doc(FIREBASE_DB, 'tasks', taskId);
        await updateDoc(taskRef, {
          estado: 'en proceso'
        });
      }
      Alert.alert('Éxito', 'La tarea ha sido reabierta');
      fetchCompletedTasks();
    } catch (error) {
      Alert.alert('Error', 'No se pudo reabrir la tarea');
      console.error('Error reopening task:', error);
    }
  };

  const confirmReopenTask = (taskId: string, isSharedTask: boolean) => {
    Alert.alert(
      'Reabrir Tarea',
      '¿Estás seguro de que deseas reabrir esta tarea?',
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Sí, reabrir',
          onPress: () => reopenTask(taskId, isSharedTask)
        }
      ]
    );
  };

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'prioridad alta':
        return '#FF6B6B';
      case 'prioridad media':
        return '#FFB347';
      case 'prioridad baja':
        return '#77DD77';
      default:
        return '#A0A0A0';
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Tareas Finalizadas</Text>
      <TouchableOpacity onPress={toggleSortOrder} style={styles.sortButton}>
        <Ionicons 
          name={sortOrder === 'asc' ? 'arrow-up' : 'arrow-down'} 
          size={24} 
          color="#2D9CDB" 
        />
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2D9CDB" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      {completedTasks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="checkmark-done-circle-outline" size={64} color="#2D9CDB" />
          <Text style={styles.emptyText}>No hay tareas finalizadas</Text>
        </View>
      ) : (
        <FlatList
          data={completedTasks}
          contentContainerStyle={styles.tasksList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          renderItem={({ item }) => (
            <View style={styles.taskItem}>
              <View style={styles.taskHeader}>
                <Text style={styles.taskTitle}>{item.nombre}</Text>
                <TouchableOpacity 
                  onPress={() => confirmReopenTask(item.id, item.isSharedTask || false)}
                  style={styles.reopenButton}
                >
                  <Ionicons name="refresh" size={20} color="#2D9CDB" />
                </TouchableOpacity>
              </View>
              {item.isSharedTask && item.sharedByName && (
                <Text style={styles.sharedByText}>
                  Compartida por: {item.sharedByName}
                </Text>
              )}
              <Text style={styles.taskText}>Descripción: {item.descripcion}</Text>
              <Text style={styles.taskText}>Resolución: {item.resolucion}</Text>
              <View style={styles.priorityContainer}>
                <Text style={[
                  styles.priorityTag,
                  { backgroundColor: getPriorityColor(item.prioridad) }
                ]}>
                  {item.prioridad}
                </Text>
              </View>
              <Text style={styles.dateText}>
                Finalizada el: {item.fecha.toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </Text>
              {item.nota && (
                <View style={styles.noteContainer}>
                  <Text style={styles.noteTitle}>Nota:</Text>
                  <Text style={styles.noteText}>{item.nota}</Text>
                </View>
              )}
            </View>
          )}
          keyExtractor={item => item.id}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D9CDB',
  },
  sortButton: {
    padding: 5,
  },
  tasksList: {
    paddingHorizontal: 5,
  },
  taskItem: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
    color: '#2D9CDB',
    flex: 1,
  },
  sharedByText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  reopenButton: {
    padding: 5,
  },
  taskText: {
    fontSize: 16,
    marginBottom: 5,
    color: '#333',
  },
  priorityContainer: {
    flexDirection: 'row',
    marginVertical: 5,
  },
  priorityTag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  dateText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 5,
  },
  noteContainer: {
    marginTop: 10,
    backgroundColor: '#f9f9f9',
    padding: 10,
    borderRadius: 5,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D9CDB',
    marginBottom: 5,
  },
  noteText: {
    fontSize: 14,
    color: '#444',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 10,
  },
});

export default CompletedTasks;