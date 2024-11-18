import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FIREBASE_AUTH } from '../../FirebaseConfig';
import { Timestamp } from 'firebase/firestore';
// Components
import TaskItem from './TaskItem';
import TaskFormModal from './TaskFormModal';
import NotesModal from './NotesModal';
import LogoutModal from './LogoutModal';
import Header from './Header';
import BottomButtons from './BottomButtons';
import FilterBar from './FilterBar';

// Services and Utils
import { TaskService } from '../services/TaskService';
import { Task, initialTaskState, TaskStatus, TaskPriority } from '../types';
import { SharedTask } from '../types/social';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  CompletedTasks: undefined;
};

interface HomeProps {
  setUser: (user: null) => void;
}

const Home = ({ setUser }: HomeProps) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [tasks, setTasks] = useState<(Task | SharedTask)[]>([]);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task>(initialTaskState);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('fecha');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    initializeApp();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTasks();
    }, [])
  );

  const initializeApp = async () => {
    await setupNotifications();
    await loadTasks();
  };

  const setupNotifications = async () => {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      Alert.alert(
        'Notificaciones',
        'Las notificaciones son importantes para recordarte tus tareas. Por favor, habilítalas en la configuración de tu dispositivo.',
        [{ text: 'OK' }]
      );
      return false;
    }
    
    return true;
  };

  const loadTasks = async () => {
    try {
      const userId = FIREBASE_AUTH.currentUser?.uid;
      if (!userId) throw new Error('Usuario no autenticado');

      const [fetchedTasks, fetchedSharedTasks] = await Promise.all([
        TaskService.fetchTasks(userId),
        TaskService.fetchSharedTasks(userId)
      ]);

      const processedTasks = fetchedTasks.map(task => ({
        ...task,
        fecha: task.fecha instanceof Timestamp ? task.fecha.toDate() : new Date(task.fecha)
      }));

      const processedSharedTasks = fetchedSharedTasks.map(task => ({
        ...task,
        fecha: task.fecha instanceof Timestamp ? task.fecha.toDate() : new Date(task.fecha),
        isSharedTask: true
      }));

      const activeTasks = [...processedTasks, ...processedSharedTasks]
        .filter(task => task.estado !== 'finalizada');

      setTasks(activeTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
      Alert.alert('Error', 'No se pudieron cargar las tareas');
    }
  };

  const scheduleNotification = async (task: Task): Promise<string | null> => {
    try {
      const hasPermission = await setupNotifications();
      if (!hasPermission) return null;

      // Cancelar notificaciones existentes para esta tarea
      await cancelExistingNotification(task.id);

      const taskDate = new Date(task.fecha);
      const notificationDate = calculateNotificationDate(taskDate, task.notificacion);
      
      // Si la fecha de notificación ya pasó, no programamos
      if (notificationDate.getTime() <= Date.now()) {
        console.log('Fecha de notificación ya pasada:', notificationDate);
        return null;
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '📅 Tarea Pendiente',
          body: `"${task.nombre}" vence ${formatRelativeDate(taskDate)}`,
          data: { taskId: task.id },
          sound: true,
          priority: 'high',
        },
        trigger: {
          date: notificationDate,
        },
      });

      console.log('Notificación programada:', {
        id: notificationId,
        taskName: task.nombre,
        notificationDate: notificationDate.toLocaleString(),
      });

      return notificationId;
    } catch (error) {
      console.error('Error al programar notificación:', error);
      return null;
    }
  };

  const calculateNotificationDate = (taskDate: Date, notificationConfig?: Task['notificacion']): Date => {
    const notificationDate = new Date(taskDate);
    
    if (notificationConfig?.tipo === 'dias-antes' && notificationConfig.diasAntes) {
      notificationDate.setDate(notificationDate.getDate() - notificationConfig.diasAntes);
    }
    
    if (notificationConfig?.hora) {
      const hora = new Date(notificationConfig.hora);
      notificationDate.setHours(hora.getHours(), hora.getMinutes(), 0, 0);
    }
    
    return notificationDate;
  };

  const cancelExistingNotification = async (taskId: string) => {
    try {
      const notifications = await Notifications.getAllScheduledNotificationsAsync();
      const existingNotification = notifications.find(
        n => n.content.data?.taskId === taskId
      );
      
      if (existingNotification) {
        await Notifications.cancelScheduledNotificationAsync(existingNotification.identifier);
      }
    } catch (error) {
      console.error('Error al cancelar notificación existente:', error);
    }
  };

  const formatRelativeDate = (date: Date): string => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'hoy';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'mañana';
    } else {
      return `el ${date.toLocaleDateString()}`;
    }
  };

  const handleSaveTask = async () => {
    try {
      const userId = FIREBASE_AUTH.currentUser?.uid;
      if (!userId) throw new Error('Usuario no autenticado');

      if (!currentTask.nombre?.trim()) {
        Alert.alert('Error', 'El nombre de la tarea es requerido');
        return;
      }

      const taskToSave: Task = {
        ...currentTask,
        estado: currentTask.estado as TaskStatus,
        prioridad: currentTask.prioridad as TaskPriority,
        fecha: currentTask.fecha || new Date(),
        nota: currentTask.nota || ''
      };

      if (editingTaskId) {
        const isSharedTask = tasks.find(t => t.id === editingTaskId && 'sharedBy' in t);
        
        if (isSharedTask) {
          await TaskService.updateSharedTask(editingTaskId, taskToSave);
        } else {
          await TaskService.updateTask(editingTaskId, taskToSave);
        }
      } else {
        const newTaskId = await TaskService.addTask(taskToSave, userId);
        taskToSave.id = newTaskId;
      }

      const notificationId = await scheduleNotification(taskToSave);
      if (notificationId) {
        console.log(`Notificación programada con ID: ${notificationId}`);
      }

      setShowTaskModal(false);
      setCurrentTask(initialTaskState);
      setEditingTaskId(null);
      await loadTasks();
      
      Alert.alert('Éxito', 'Tarea guardada correctamente');
    } catch (error) {
      console.error('Error al guardar tarea:', error);
      Alert.alert('Error', 'No se pudo guardar la tarea');
    }
  };

  const filterAndSortTasks = useCallback(() => {
    return [...tasks]
      .filter(task => {
        const searchLower = searchQuery.toLowerCase();
        const taskDate = task.fecha instanceof Date ? task.fecha : new Date(task.fecha);
        return (
          task.nombre.toLowerCase().includes(searchLower) ||
          taskDate.toLocaleDateString().includes(searchQuery)
        );
      })
      .sort((a, b) => {
        const getSortValue = (task: Task | SharedTask) => {
          switch (sortBy) {
            case 'nombre':
              return task.nombre;
            case 'prioridad':
              const prioridadOrder: { [key: string]: number } = {
                'prioridad alta': 1,
                'prioridad media': 2,
                'prioridad baja': 3,
                'sin prioridad': 4
              };
              return prioridadOrder[task.prioridad];
            case 'fecha':
            default:
              return task.fecha instanceof Date ? task.fecha.getTime() : new Date(task.fecha).getTime();
          }
        };

        const aValue = getSortValue(a);
        const bValue = getSortValue(b);

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortDirection === 'asc' ? 
            aValue.localeCompare(bValue) : 
            bValue.localeCompare(aValue);
        }

        return sortDirection === 'asc' ? 
          Number(aValue) - Number(bValue) : 
          Number(bValue) - Number(aValue);
      });
  }, [tasks, searchQuery, sortBy, sortDirection]);

  const handleAddTask = () => {
    setCurrentTask(initialTaskState);
    setEditingTaskId(null);
    setShowTaskModal(true);
  };

  const handleSortChange = (newSortBy: string) => {
    setSortBy(newSortBy);
    setSortDirection(prev => (sortBy === newSortBy ? (prev === 'asc' ? 'desc' : 'asc') : 'desc'));
  };
  const handleEditTask = (taskId: string) => {
    const taskToEdit = tasks.find(task => task.id === taskId);
    if (taskToEdit) {
      // Asegurarse de que la tarea tenga todos los campos necesarios
      const editableTask: Task = {
        ...initialTaskState, // Asegura valores por defecto
        ...taskToEdit,
        fecha: taskToEdit.fecha instanceof Date ? taskToEdit.fecha : new Date(taskToEdit.fecha),
        notificacion: taskToEdit.notificacion || {
          tipo: 'mismo-dia',
          hora: new Date(),
          diasAntes: 0
        }
      };
      setCurrentTask(editableTask);
      setEditingTaskId(taskId);
      setShowTaskModal(true);
    }
  };
  const handleDeleteTask = async (taskId: string) => {
    try {
      await TaskService.deleteTask(taskId);
      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
      Alert.alert('Éxito', 'Tarea eliminada correctamente');
    } catch (error) {
      Alert.alert('Error', 'No se pudo eliminar la tarea');
    }
  };

  const handleOpenNotes = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      setCurrentTask(task);
      setShowNotesModal(true);
    }
  };

const handleSaveNotes = async () => {
    try {
      if (!currentTask.id) {
        throw new Error('ID de tarea no válido');
      }

      const noteUpdate = {
        nota: currentTask.nota ?? ''
      };

      await TaskService.updateTask(currentTask.id, noteUpdate);
      
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === currentTask.id
            ? { ...task, nota: currentTask.nota }
            : task
        )
      );

      setShowNotesModal(false);
      Alert.alert('Éxito', 'Nota guardada correctamente');
    } catch (error) {
      console.error('Error al guardar nota:', error);
      Alert.alert('Error', 'No se pudo guardar la nota');
    }
  };

  const handleLogout = () => {
    FIREBASE_AUTH.signOut();
    setUser(null);
  };

  const sortedAndFilteredTasks = filterAndSortTasks();
  
  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Mis Tareas" 
        onBackPress={() => setShowLogoutModal(true)} 
      />

      <FilterBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        sortBy={sortBy}
        setSortBy={handleSortChange}
        sortDirection={sortDirection}
      />

      <FlatList
        data={filterAndSortTasks()}
        renderItem={({ item }) => (
          <TaskItem
            item={item}
            editTask={handleEditTask}
            deleteTask={handleDeleteTask}
            openNotesModal={handleOpenNotes}
          />
        )}
        keyExtractor={item => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
      />

      <TaskFormModal
        visible={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        task={currentTask}
        setTask={setCurrentTask}
        onSave={handleSaveTask}
        editingTaskId={editingTaskId}
        showDatePicker={showDatePicker}
        setShowDatePicker={setShowDatePicker}
      />

      <NotesModal
        visible={showNotesModal}
        onClose={() => setShowNotesModal(false)}
        task={currentTask}
        setTask={setCurrentTask}
        onSave={handleSaveNotes}
      />

      <LogoutModal
        visible={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onLogout={handleLogout}
      />

      <BottomButtons
        onCompletedPress={() => navigation.navigate('CompletedTasks')}
        onAddPress={handleAddTask}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 10,
    paddingBottom: 90,
  },
});

export default Home;