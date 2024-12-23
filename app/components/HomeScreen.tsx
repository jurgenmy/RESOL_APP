import React from 'react';
import { View, FlatList, StyleSheet, SafeAreaView, Alert, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FIREBASE_AUTH } from '../../FirebaseConfig';
import { Timestamp } from 'firebase/firestore';
import { TaskService } from '../services/TaskService';
import { NotificationService } from '../services/NotificationService';
import { Task, initialTaskState, TaskStatus, TaskPriority } from '../types';
import { SharedTask } from '../types/social';
import { styles } from './styles';

// Components imports
import TaskItem from './TaskItem';
import TaskFormModal from './TaskFormModal';
import NotesModal from './NotesModal';
import LogoutModal from './LogoutModal';
import Header from './Header';
import BottomButtons from './BottomButtons';
import FilterBar from './FilterBar';

type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  CompletedTasks: undefined;
};

interface HomeProps {
  setUser: (user: null) => void;
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
}

type CombinedTask = (Task | SharedTask) & { fecha: Date };

interface HomeState {
  tasks: CombinedTask[];
  showTaskModal: boolean;
  showNotesModal: boolean;
  showLogoutModal: boolean;
  showDatePicker: boolean;
  currentTask: Task;
  editingTaskId: string | null;
  searchQuery: string;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  isLoading: boolean;
  error: string | null;
}

export class HomeScreen extends React.Component<HomeProps, HomeState> {
  private unsubscribeFocus: (() => void) | null = null;

  constructor(props: HomeProps) {
    super(props);
    this.state = {
      tasks: [],
      showTaskModal: false,
      showNotesModal: false,
      showLogoutModal: false,
      showDatePicker: false,
      currentTask: { ...initialTaskState, fecha: new Date() },
      editingTaskId: null,
      searchQuery: '',
      sortBy: 'fecha',
      sortDirection: 'desc',
      isLoading: true,
      error: null
    };
  }

  componentDidMount() {
    this.initializeApp();
    // Set up the focus listener using the navigation prop
    this.unsubscribeFocus = this.props.navigation.addListener('focus', () => {
      this.loadTasks();
    });
  }

  componentWillUnmount() {
    // Clean up the focus listener
    if (this.unsubscribeFocus) {
      this.unsubscribeFocus();
    }
  }

  componentDidUpdate(prevProps: HomeProps, prevState: HomeState) {
    if (prevState.sortBy !== this.state.sortBy || 
        prevState.sortDirection !== this.state.sortDirection) {
      this.filterAndSortTasks();
    }
  }

  initializeApp = async () => {
    try {
      await NotificationService.setupNotifications();
      await this.loadTasks();
    } catch (error) {
      this.setState({ error: 'Error al inicializar la aplicación' });
    } finally {
      this.setState({ isLoading: false });
    }
  };

  loadTasks = async () => {
    try {
      this.setState({ isLoading: true, error: null });
      const userId = FIREBASE_AUTH.currentUser?.uid;
      if (!userId) throw new Error('Usuario no autenticado');

      const [fetchedTasks, fetchedSharedTasks] = await Promise.all([
        TaskService.fetchTasks(userId),
        TaskService.fetchSharedTasks(userId)
      ]);

      const processedTasks = this.processTasks(fetchedTasks, fetchedSharedTasks);
      this.setState({ tasks: processedTasks });
    } catch (error) {
      console.error('Error loading tasks:', error);
      this.setState({ error: 'No se pudieron cargar las tareas' });
      Alert.alert('Error', 'No se pudieron cargar las tareas');
    } finally {
      this.setState({ isLoading: false });
    }
  };

  processTasks = (tasks: Task[], sharedTasks: SharedTask[]): CombinedTask[] => {
    const processedTasks = tasks.map(task => ({
      ...task,
      fecha: task.fecha instanceof Timestamp ? task.fecha.toDate() : new Date(task.fecha)
    }));

    const processedSharedTasks = sharedTasks.map(task => ({
      ...task,
      fecha: task.fecha instanceof Timestamp ? task.fecha.toDate() : new Date(task.fecha),
      isSharedTask: true
    }));

    return [...processedTasks, ...processedSharedTasks]
      .filter(task => task.estado !== 'finalizada') as CombinedTask[];
  };

  handleSaveTask = async () => {
    try {
      const userId = FIREBASE_AUTH.currentUser?.uid;
      if (!userId) throw new Error('Usuario no autenticado');

      if (!this.state.currentTask.nombre?.trim()) {
        Alert.alert('Error', 'El nombre de la tarea es requerido');
        return;
      }

      const taskToSave: Task = {
        ...this.state.currentTask,
        estado: this.state.currentTask.estado as TaskStatus,
        prioridad: this.state.currentTask.prioridad as TaskPriority,
        fecha: this.state.currentTask.fecha || new Date(),
        nota: this.state.currentTask.nota || ''
      };

      if (this.state.editingTaskId) {
        const isSharedTask = this.state.tasks.find(t => 
          t.id === this.state.editingTaskId && 'sharedBy' in t
        );
        
        if (isSharedTask) {
          await TaskService.updateSharedTask(this.state.editingTaskId, taskToSave);
        } else {
          await TaskService.updateTask(this.state.editingTaskId, taskToSave);
        }
      } else {
        const newTaskId = await TaskService.addTask(taskToSave, userId);
        taskToSave.id = newTaskId;
      }

      const notificationId = await NotificationService.scheduleNotification(taskToSave);
      if (notificationId) {
        console.log(`Notificación programada con ID: ${notificationId}`);
      }

      this.setState({
        showTaskModal: false,
        currentTask: { ...initialTaskState, fecha: new Date() },
        editingTaskId: null
      });
      
      await this.loadTasks();
      Alert.alert('Éxito', 'Tarea guardada correctamente');
    } catch (error) {
      console.error('Error al guardar tarea:', error);
      Alert.alert('Error', 'No se pudo guardar la tarea');
    }
  };

  handleAddTask = () => {
    this.setState({
      currentTask: { ...initialTaskState, fecha: new Date() },
      editingTaskId: null,
      showTaskModal: true
    });
  };

  handleEditTask = (taskId: string) => {
    const taskToEdit = this.state.tasks.find(task => task.id === taskId);
    if (taskToEdit) {
      const editableTask: Task = {
        ...initialTaskState,
        ...taskToEdit,
        fecha: taskToEdit.fecha,
        notificacion: taskToEdit.notificacion || {
          tipo: 'mismo-dia',
          hora: new Date(),
          diasAntes: 0
        }
      };
      this.setState({
        currentTask: editableTask,
        editingTaskId: taskId,
        showTaskModal: true
      });
    }
  };

  handleDeleteTask = async (taskId: string) => {
    try {
      await TaskService.deleteTask(taskId);
      await NotificationService.cancelExistingNotification(taskId);
      this.setState(prevState => ({
        tasks: prevState.tasks.filter(task => task.id !== taskId)
      }));
      Alert.alert('Éxito', 'Tarea eliminada correctamente');
    } catch (error) {
      Alert.alert('Error', 'No se pudo eliminar la tarea');
    }
  };

  handleCompleteTask = async (taskId: string) => {
    try {
      const task = this.state.tasks.find(t => t.id === taskId);
      if (!task) return;

      const updatedTask = { ...task, estado: 'finalizada' as TaskStatus };
      await TaskService.updateTask(taskId, updatedTask);
      await NotificationService.cancelExistingNotification(taskId);
      
      this.setState(prevState => ({
        tasks: prevState.tasks.filter(t => t.id !== taskId)
      }));
      
      Alert.alert('Éxito', 'Tarea completada');
    } catch (error) {
      Alert.alert('Error', 'No se pudo completar la tarea');
    }
  };

  handleOpenNotes = (taskId: string) => {
    const task = this.state.tasks.find(t => t.id === taskId);
    if (task) {
      this.setState({
        currentTask: task as Task,
        showNotesModal: true
      });
    }
  };

  handleSaveNotes = async () => {
    try {
      if (!this.state.currentTask.id) {
        throw new Error('ID de tarea no válido');
      }

      const noteUpdate = {
        nota: this.state.currentTask.nota ?? ''
      };

      await TaskService.updateTask(this.state.currentTask.id, noteUpdate);
      
      this.setState(prevState => ({
        tasks: prevState.tasks.map(task =>
          task.id === this.state.currentTask.id
            ? { ...task, nota: this.state.currentTask.nota }
            : task
        ),
        showNotesModal: false
      }));

      Alert.alert('Éxito', 'Nota guardada correctamente');
    } catch (error) {
      console.error('Error al guardar nota:', error);
      Alert.alert('Error', 'No se pudo guardar la nota');
    }
  };

  handleSortChange = (newSortBy: string) => {
    this.setState(prevState => ({
      sortBy: newSortBy,
      sortDirection: prevState.sortBy === newSortBy 
        ? (prevState.sortDirection === 'asc' ? 'desc' : 'asc')
        : 'desc'
    }));
  };

  handleLogout = () => {
    FIREBASE_AUTH.signOut();
    this.props.setUser(null);
  };

  filterAndSortTasks = () => {
    const { tasks, searchQuery, sortBy, sortDirection } = this.state;
    
    return [...tasks]
      .filter(task => {
        const searchLower = searchQuery.toLowerCase();
        return (
          task.nombre.toLowerCase().includes(searchLower) ||
          task.fecha.toLocaleDateString().includes(searchQuery)
        );
      })
      .sort((a, b) => {
        const getSortValue = (task: CombinedTask) => {
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
              return task.fecha.getTime();
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
  };

  renderEmptyState = () => {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>
          No hay tareas pendientes
        </Text>
        <TouchableOpacity 
          style={styles.emptyStateButton}
          onPress={this.handleAddTask}
        >
          <Text style={styles.emptyStateButtonText}>
            Crear nueva tarea
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  render() {
    const { 
      isLoading, 
      error,
      showTaskModal,
      showNotesModal,
      showLogoutModal,
      showDatePicker,
      currentTask,
      editingTaskId,
      searchQuery,
      sortBy,
      sortDirection
    } = this.state;
  
    const filteredTasks = this.filterAndSortTasks();
  
    return (
      <SafeAreaView style={styles.container}>
        <Header 
          title="Mis Tareas" 
          onBackPress={() => this.setState({ showLogoutModal: true })} 
        />
  
        <FilterBar
          searchQuery={searchQuery}
          setSearchQuery={(query) => this.setState({ searchQuery: query })}
          sortBy={sortBy}
          setSortBy={this.handleSortChange}
          sortDirection={sortDirection}
        />
  
        <FlatList
          data={filteredTasks}
          renderItem={({ item }) => (
            <TaskItem
              item={item}
              editTask={this.handleEditTask}
              deleteTask={this.handleDeleteTask}
              openNotesModal={this.handleOpenNotes}
            />
          )}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={this.renderEmptyState}
        />
  
        <TaskFormModal
          visible={showTaskModal}
          onClose={() => this.setState({ showTaskModal: false })}
          task={currentTask}
          setTask={(updatedTask) => 
            this.setState((prevState) => ({
              currentTask: typeof updatedTask === 'function' ? updatedTask(prevState.currentTask) : updatedTask,
            }))
          }
          onSave={this.handleSaveTask}
          editingTaskId={editingTaskId}
          showDatePicker={showDatePicker}
          setShowDatePicker={(show) => this.setState({ showDatePicker: show })}
        />
  
        <NotesModal
          visible={showNotesModal}
          onClose={() => this.setState({ showNotesModal: false })}
          task={currentTask}
          setTask={(task) => this.setState({ currentTask: task })}
          onSave={this.handleSaveNotes}
        />
  
        <LogoutModal
          visible={showLogoutModal}
          onClose={() => this.setState({ showLogoutModal: false })}
          onLogout={this.handleLogout}
        />
  
        <BottomButtons
          onCompletedPress={() => this.props.navigation.navigate('CompletedTasks')}
          onAddPress={this.handleAddTask}
        />
  
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        )}
      </SafeAreaView>
    );
  }
}

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

export default HomeScreen;