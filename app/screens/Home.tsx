import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, FlatList } from 'react-native';
import React, { useState, useEffect } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { NavigationProp } from '@react-navigation/native';
import { FIREBASE_AUTH, FIREBASE_DB } from '../../FirebaseConfig';
import { Picker } from '@react-native-picker/picker';
import { User } from 'firebase/auth';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import * as Notifications from 'expo-notifications';
import { Ionicons } from '@expo/vector-icons';
import { CommonActions } from '@react-navigation/native';
import { signOut } from 'firebase/auth';

interface RouterProps {
  navigation: NavigationProp<any, any>;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const Home = ({ navigation, setUser }: RouterProps) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [notesModalVisible, setNotesModalVisible] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [editingTaskIndex, setEditingTaskIndex] = useState<number | null>(null);
  const [task, setTask] = useState({ 
    nombre: '', 
    descripcion: '', 
    resolucion: '', 
    estado: 'en espera', 
    prioridad: 'sin prioridad', 
    fecha: new Date(), 
    nota: '' 
  });
  const [tasks, setTasks] = useState<Array<{
    id: string;
    nombre: string;
    descripcion: string;
    resolucion: string;
    estado: string;
    prioridad: string;
    fecha: Date;
    nota?: string;
  }>>([]);

  const user = FIREBASE_AUTH.currentUser;

  useEffect(() => {
    if (user) fetchTasks();
  }, [user]);

  const fetchTasks = async () => {
    const tasksRef = collection(FIREBASE_DB, 'tasks');
    const q = query(tasksRef, where('userId', '==', user?.uid));
    const querySnapshot = await getDocs(q);
    const userTasks = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        fecha: data.fecha && data.fecha.seconds ? new Date(data.fecha.seconds * 1000) : new Date(),
      };
    }) as typeof tasks;
    setTasks(userTasks);
  };

  const addOrUpdateTask = async () => {
    if (editingTaskIndex !== null) {
      const taskToUpdate = tasks[editingTaskIndex];
      const taskRef = doc(FIREBASE_DB, 'tasks', taskToUpdate.id);
      await updateDoc(taskRef, { ...task, userId: user?.uid });
      const updatedTasks = [...tasks];
      updatedTasks[editingTaskIndex] = { ...taskToUpdate, ...task };
      setTasks(updatedTasks);
    } else {
      const newTaskRef = await addDoc(collection(FIREBASE_DB, 'tasks'), { ...task, userId: user?.uid });
      setTasks([...tasks, { ...task, id: newTaskRef.id }]);
    }
    scheduleNotification(task.fecha);
    setTask({ 
      nombre: '', 
      descripcion: '', 
      resolucion: '', 
      estado: 'en espera', 
      prioridad: 'sin prioridad', 
      fecha: new Date(), 
      nota: '' 
    });
    setEditingTaskIndex(null);
    setModalVisible(false);
  };

  const scheduleNotification = async (fecha: Date) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Recordatorio de Tarea",
        body: `No olvides la tarea: ${task.nombre}`,
      },
      trigger: { date: fecha },
    });
  };

  const editTask = (index: number) => {
    setTask(tasks[index]);
    setEditingTaskIndex(index);
    setModalVisible(true);
  };

  const deleteTask = async (index: number) => {
    const taskToDelete = tasks[index];
    await deleteDoc(doc(FIREBASE_DB, 'tasks', taskToDelete.id));
    setTasks(tasks.filter((_, i) => i !== index));
  };

  const openNotesModal = (index: number) => {
    setTask(tasks[index]);
    setEditingTaskIndex(index);
    setNotesModalVisible(true);
  };

  const saveNote = async () => {
    if (editingTaskIndex !== null) {
      const taskToUpdate = tasks[editingTaskIndex];
      const taskRef = doc(FIREBASE_DB, 'tasks', taskToUpdate.id);
      await updateDoc(taskRef, { nota: task.nota });
      const updatedTasks = [...tasks];
      updatedTasks[editingTaskIndex] = { ...taskToUpdate, nota: task.nota };
      setTasks(updatedTasks);
    }
    setNotesModalVisible(false);
  };

  const filterTasks = (status: string[]) => tasks.filter(task => status.includes(task.estado));

  const handleLogout = async () => {
    try {
      // Cierra sesión en Firebase
      await signOut(FIREBASE_AUTH);
  
      // Limpia el estado de usuario local y navega a la pantalla de Login
      setUser(null);
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        })
      );
      console.log("Sesión cerrada y redirigido al login.");
    } catch (error) {
      console.error("Error al cerrar sesión: ", error);
    }
  }
  

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => setLogoutModalVisible(true)}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#4A90E2" />
        </TouchableOpacity>
        <Text style={styles.title}>Mis tareas</Text>
      </View>

      <FlatList
        data={filterTasks(['en espera', 'en proceso'])}
        contentContainerStyle={styles.tasksList}
        renderItem={({ item, index }) => (
          <View style={styles.taskItem}>
            <Text style={styles.taskTitle}>{item.nombre}</Text>
            <Text style={styles.taskText}>Descripción: {item.descripcion}</Text>
            <Text style={styles.taskText}>Resolución: {item.resolucion}</Text>
            <Text style={styles.taskText}>Estado: {item.estado}</Text>
            <Text style={styles.taskText}>Prioridad: {item.prioridad}</Text>
            <Text style={styles.taskText}>Fecha: {item.fecha.toLocaleDateString()}</Text>
            {item.nota && (
              <Text style={styles.taskText}>Nota: {item.nota}</Text>
            )}
            <View style={styles.taskButtons}>
              <TouchableOpacity style={[styles.button, styles.editButton]} onPress={() => editTask(index)}>
                <Text style={styles.buttonText}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.deleteButton]} onPress={() => deleteTask(index)}>
                <Text style={styles.buttonText}>Eliminar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.notesButton]} onPress={() => openNotesModal(index)}>
                <Text style={styles.buttonText}>Notas</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        keyExtractor={(item) => item.id}
      />

      <View style={styles.bottomButtons}>
        <TouchableOpacity 
          onPress={() => navigation.navigate('CompletedTasks')} 
          style={[styles.button, styles.bottomButton]}
        >
          <Text style={styles.buttonText}>Tareas Finalizadas</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => setModalVisible(true)} 
          style={[styles.button, styles.bottomButton]}
        >
          <Text style={styles.buttonText}>Agregar Tarea [+]</Text>
        </TouchableOpacity>
      </View>

      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>
              {editingTaskIndex !== null ? 'Editar Tarea' : 'Nueva Tarea'}
            </Text>
            <TextInput 
              style={styles.input} 
              placeholder="Nombre" 
              value={task.nombre} 
              onChangeText={(text) => setTask({ ...task, nombre: text })} 
            />
            <TextInput 
              style={styles.input} 
              placeholder="Descripción" 
              value={task.descripcion} 
              onChangeText={(text) => setTask({ ...task, descripcion: text })} 
            />
            <TextInput 
              style={styles.input} 
              placeholder="Resolución" 
              value={task.resolucion} 
              onChangeText={(text) => setTask({ ...task, resolucion: text })} 
            />
            <Picker
              selectedValue={task.estado}
              style={styles.picker}
              onValueChange={(itemValue) => setTask({ ...task, estado: itemValue })}
            >
              <Picker.Item label="En espera" value="en espera" />
              <Picker.Item label="En proceso" value="en proceso" />
              <Picker.Item label="Finalizada" value="finalizada" />
            </Picker>
            <Picker
              selectedValue={task.prioridad}
              style={styles.picker}
              onValueChange={(itemValue) => setTask({ ...task, prioridad: itemValue })}
            >
              <Picker.Item label="Sin prioridad" value="sin prioridad" />
              <Picker.Item label="Prioridad baja" value="prioridad baja" />
              <Picker.Item label="Prioridad media" value="prioridad media" />
              <Picker.Item label="Prioridad alta" value="prioridad alta" />
            </Picker>
            <TouchableOpacity 
              style={[styles.button, { backgroundColor: '#4A90E2' }]} 
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.buttonText}>Seleccionar Fecha</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={task.fecha}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) setTask({ ...task, fecha: selectedDate });
                }}
              />
            )}
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.button, { backgroundColor: '#4A90E2', marginRight: 10 }]} 
                onPress={addOrUpdateTask}
              >
                <Text style={styles.buttonText}>Guardar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.button, { backgroundColor: '#FF6347' }]} 
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.buttonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal 
        animationType="slide" 
        transparent={true} 
        visible={notesModalVisible} 
        onRequestClose={() => setNotesModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Notas de la Tarea</Text>
            <TextInput
              style={[styles.input, styles.notesInput]}
              placeholder="Escribe una nota..."
              value={task.nota}
              onChangeText={(text) => setTask({ ...task, nota: text })}
              multiline
              numberOfLines={4}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.button, { backgroundColor: '#4A90E2', marginRight: 10 }]} 
                onPress={saveNote}
              >
                <Text style={styles.buttonText}>Guardar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.button, { backgroundColor: '#FF6347' }]} 
                onPress={() => setNotesModalVisible(false)}
              >
                <Text style={styles.buttonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal 
        animationType="slide" 
        transparent={true} 
        visible={logoutModalVisible} 
        onRequestClose={() => setLogoutModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>¿Deseas salir de tu cuenta?</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.button, { backgroundColor: '#4A90E2', marginRight: 10 }]} 
                onPress={() => {handleLogout()}}
              >
                <Text style={styles.buttonText}>Sí</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.button, { backgroundColor: '#FF6347' }]} 
                onPress={() => setLogoutModalVisible(false)}
              >
                <Text style={styles.buttonText}>No</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 40,
    paddingHorizontal: 10,
  },
  backButton: {
    padding: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4A90E2',
    marginLeft: 20,
  },
  tasksList: {
    paddingHorizontal: 10,
    paddingBottom: 150, // Espacio para los botones inferiores
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
  taskTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#4A90E2',
  },
  taskText: {
    fontSize: 16,
    marginBottom: 5,
    color: '#333',
  },
  taskButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  button: {
    padding: 10,
    borderRadius: 5,
    minWidth: 80,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#008080',
  },
  deleteButton: {
    backgroundColor: '#FF6347',
  },
  notesButton: {
    backgroundColor: '#4682B4',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#008080',
    padding: 15,
    borderRadius: 10,
    margin: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  bottomButton: {
    backgroundColor: '#008080',
    padding: 7,
    borderRadius: 10,
    margin: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#008080',
  },
  input: {
    height: 40,
    width: '100%',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 12,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
  },
  notesInput: {
    height: 120,
    textAlignVertical: 'top',
    padding: 10,
  },
  picker: {
    height: 50,
    width: '100%',
    marginBottom: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
  },
});

export default Home;
