import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FIREBASE_AUTH } from '../../FirebaseConfig';
import { TouchableOpacity, Text } from 'react-native';
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
import { Task, initialTaskState } from '../types';
import { SharedTask } from '../types/social';
import * as Notifications from 'expo-notifications';

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
    askNotificationPermission();
    loadTasks();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTasks();
    }, [])
  );

  const loadTasks = async () => {
    try {
      const userId = FIREBASE_AUTH.currentUser?.uid;
      if (userId) {
        // Cargar tareas normales
        const fetchedTasks = await TaskService.fetchTasks(userId);
        const processedTasks = fetchedTasks.map(task => ({
          ...task,
          fecha: task.fecha instanceof Timestamp ? task.fecha.toDate() : task.fecha
        }));

        // Cargar tareas compartidas
        const fetchedSharedTasks = await TaskService.fetchSharedTasks(userId);
        const processedSharedTasks = fetchedSharedTasks.map(task => ({
          ...task,
          fecha: task.fecha instanceof Timestamp ? task.fecha.toDate() : task.fecha,
          isSharedTask: true // Marcador para identificar tareas compartidas
        }));

        // Combinar ambos tipos de tareas
        const allTasks = [...processedTasks, ...processedSharedTasks];
        
        // Filtrar tareas activas
        const activeTasks = allTasks.filter(task => task.estado !== 'finalizada');
        setTasks(activeTasks);
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
      Alert.alert('Error', 'No se pudieron cargar las tareas');
    }
  };

  const filterAndSortTasks = () => {
    let filteredTasks = [...tasks].filter(task => {
      const searchLower = searchQuery.toLowerCase();
      const taskDate = task.fecha instanceof Date ? task.fecha : new Date(task.fecha);
      const taskName = task.nombre.toLowerCase();
      
      return taskName.includes(searchLower) || 
             taskDate.toLocaleDateString().includes(searchQuery);
    });

    return filteredTasks.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'nombre':
          comparison = a.nombre.localeCompare(b.nombre);
          break;
        case 'prioridad':
          const prioridadOrder: { [key: string]: number } = {
            'prioridad alta': 1,
            'prioridad media': 2,
            'prioridad baja': 3,
            'sin prioridad': 4
          };
          comparison = prioridadOrder[a.prioridad] - prioridadOrder[b.prioridad];
          break;
        case 'fecha':
          const dateA = a.fecha instanceof Date ? a.fecha : new Date(a.fecha);
          const dateB = b.fecha instanceof Date ? b.fecha : new Date(b.fecha);
          comparison = dateA.getTime() - dateB.getTime();
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  };

  const handleSaveTask = async () => {
    try {
      const userId = FIREBASE_AUTH.currentUser?.uid;
      if (!userId) throw new Error('Usuario no autenticado');

      if (!currentTask.nombre?.trim()) {
        Alert.alert('Error', 'El nombre de la tarea es requerido');
        return;
      }

      const taskToSave = {
        ...currentTask,
        estado: currentTask.estado || 'en proceso',
        fecha: currentTask.fecha || new Date(),
      };

      if (editingTaskId) {
        // Verificar si es una tarea compartida
        const isSharedTask = tasks.find(t => t.id === editingTaskId && 'sharedBy' in t);
        
        if (isSharedTask) {
          await TaskService.updateSharedTask(editingTaskId, taskToSave);
        } else {
          await TaskService.updateTask(editingTaskId, taskToSave);
        }
        
        setTasks(prevTasks =>
          prevTasks.map(task =>
            task.id === editingTaskId ? { ...task, ...taskToSave } : task
          )
        );
      } else {
        const newTaskId = await TaskService.addTask(taskToSave, userId);
        const newTask = { ...taskToSave, id: newTaskId };
        setTasks(prevTasks => [...prevTasks, newTask]);
      }

      await scheduleNotification(taskToSave);

      setShowTaskModal(false);
      setCurrentTask(initialTaskState);
      setEditingTaskId(null);
      Alert.alert('Éxito', 'Tarea guardada correctamente');
    } catch (error) {
      console.error('Error al guardar tarea:', error);
      Alert.alert('Error', 'No se pudo guardar la tarea');
    }
    loadTasks();
  };

  //Debug para probar las notificaciones
  const handleDebugNotification = async () => {
    console.log("handleDebugNotification se está ejecutando");
    await scheduleNotification({
      id: 'debug-task',
      nombre: 'Debug Task',
      descripcion: 'Descripción por defecto',
      resolucion: 'Sin resolución',
      estado: 'en proceso',
      prioridad: 'prioridad baja',
      fecha: new Date(Date.now() + 2500),
    });
  };

  useEffect(() => {
    askNotificationPermission();
    loadTasks();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTasks();
    }, [])
  );


  const handleSortChange = (newSortBy: string) => {
    if (sortBy === newSortBy) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(newSortBy);
      setSortDirection('desc');
    }
  };



  const handleAddTask = () => {
    setCurrentTask(initialTaskState);
    setEditingTaskId(null);
    setShowTaskModal(true);
  };

  const handleEditTask = (taskId: string) => {
    const taskToEdit = tasks.find(task => task.id === taskId);
    if (taskToEdit) {
      setCurrentTask(taskToEdit);
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


  async function askNotificationPermission() {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      alert('¡Permiso para enviar notificaciones no concedido!');
    }
  }

  async function scheduleNotification(task: Task) {
    const taskDate = task.fecha instanceof Date ? task.fecha : new Date(task.fecha);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Tarea vencida',
        body: `La tarea "${task.nombre}" vence el ${taskDate.toLocaleDateString()}`,
      },
      trigger: {
        seconds: 2,
        repeats: false,
      },
    });
  }

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
      <Header title="Gestión de Tareas" onBackPress={() => setShowLogoutModal(true)} />

      <FilterBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        sortBy={sortBy}
        setSortBy={handleSortChange}
        sortDirection={sortDirection}
      />
  {/*
    <TouchableOpacity onPress={handleDebugNotification}>
        <Text>Test Notification</Text>
     </TouchableOpacity>
*/}
      <FlatList
        data={sortedAndFilteredTasks}
        renderItem={({ item }) => (
          <TaskItem item={item} editTask={handleEditTask} deleteTask={handleDeleteTask} openNotesModal={handleOpenNotes} />
        )}
        keyExtractor={item => item.id}
        style={styles.list}
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

      <LogoutModal visible={showLogoutModal} onClose={() => setShowLogoutModal(false)} onLogout={handleLogout} />

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
    padding: 10,
    marginBottom: 80,
  },
});

export default Home;