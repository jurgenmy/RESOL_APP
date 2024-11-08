import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FIREBASE_AUTH } from '../../FirebaseConfig';

// Components
import TaskItem from '../components/TaskItem';
import TaskFormModal from '../components/TaskFormModal';
import NotesModal from '../components/NotesModal';
import LogoutModal from '../components/LogoutModal';
import Header from './Header';
import BottomButtons from '../components/BottomButtons';

// Services and Utils
import { TaskService } from '../services/taskService';
import { Task, initialTaskState } from '../types';

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
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task>(initialTaskState);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const userId = FIREBASE_AUTH.currentUser?.uid;
      if (userId) {
        const fetchedTasks = await TaskService.fetchTasks(userId);
        const activeTasks = fetchedTasks.filter(task => task.estado !== 'finalizada');
        setTasks(activeTasks);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar las tareas');
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
      setTasks(tasks.filter(task => task.id !== taskId));
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

  const handleSaveTask = async () => {
    try {
      const userId = FIREBASE_AUTH.currentUser?.uid;
      if (!userId) throw new Error('Usuario no autenticado');

      if (editingTaskId) {
        await TaskService.updateTask(editingTaskId, currentTask);
        setTasks(tasks.map(task => 
          task.id === editingTaskId ? { ...currentTask, id: editingTaskId } : task
        ));
      } else {
        const newTaskId = await TaskService.addTask(currentTask, userId);
        setTasks([...tasks, { ...currentTask, id: newTaskId }]);
      }

      setShowTaskModal(false);
      setCurrentTask(initialTaskState);
      setEditingTaskId(null);
      Alert.alert('Éxito', 'Tarea guardada correctamente');
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar la tarea');
    }
  };

  const handleSaveNotes = async () => {
    try {
      if (currentTask.id) {
        await TaskService.updateTask(currentTask.id, { nota: currentTask.nota });
        setTasks(tasks.map(task => 
          task.id === currentTask.id ? { ...task, nota: currentTask.nota } : task
        ));
      }
      setShowNotesModal(false);
      Alert.alert('Éxito', 'Nota guardada correctamente');
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar la nota');
    }
  };

  const handleLogout = () => {
    FIREBASE_AUTH.signOut();
    setUser(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Gestión de Tareas" 
        onBackPress={() => setShowLogoutModal(true)} 
      />

      <FlatList
        data={tasks}
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
    padding: 10,
    marginBottom: 80, // Space for bottom buttons
  },
});

export default Home;