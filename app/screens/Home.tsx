// Home.tsx
import { View, Text, Button, StyleSheet, Modal, TextInput, TouchableOpacity, FlatList } from 'react-native';
import React, { useState } from 'react';
import { NavigationProp } from '@react-navigation/native';
import { FIREBASE_AUTH } from '../../FirebaseConfig';
import { Picker } from '@react-native-picker/picker';

interface RouterProps {
  navigation: NavigationProp<any, any>;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const Home = ({ navigation, setUser }: RouterProps) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [editingTaskIndex, setEditingTaskIndex] = useState<number | null>(null);
  const [task, setTask] = useState({ nombre: '', descripcion: '', resolucion: '', estado: 'en espera' });
  const [tasks, setTasks] = useState<{ nombre: string; descripcion: string; resolucion: string; estado: string }[]>([]);

  const addOrUpdateTask = () => {
    if (editingTaskIndex !== null) {
      const updatedTasks = [...tasks];
      updatedTasks[editingTaskIndex] = task;
      setTasks(updatedTasks);
    } else {
      setTasks([...tasks, task]);
    }
    setTask({ nombre: '', descripcion: '', resolucion: '', estado: 'en espera' });
    setEditingTaskIndex(null);
    setModalVisible(false);
  };

  const editTask = (index: number) => {
    setTask(tasks[index]);
    setEditingTaskIndex(index);
    setModalVisible(true);
  };

  const deleteTask = (index: number) => {
    const updatedTasks = tasks.filter((_, i) => i !== index);
    setTasks(updatedTasks);
  };

  const signOut = () => {
    FIREBASE_AUTH.signOut().then(() => {
      setUser(null);
    });
  };

  return (
    <View style={styles.container}>
      <Button onPress={() => setLogoutModalVisible(true)} title="Volver" color='#008080' />
      <Text style={styles.title}>Mis tareas</Text>
      <FlatList
        data={tasks}
        renderItem={({ item, index }) => (
          <View style={styles.taskItem}>
            <Text style={styles.taskText}>Nombre: {item.nombre}</Text>
            <Text style={styles.taskText}>Descripción: {item.descripcion}</Text>
            <Text style={styles.taskText}>Resolución: {item.resolucion}</Text>
            <Text style={styles.taskText}>Estado: {item.estado}</Text>
            <View style={styles.taskButtons}>
              <Button title="Editar" onPress={() => editTask(index)} color="#008080" />
              <Button title="Eliminar" onPress={() => deleteTask(index)} color="#FF6347" />
            </View>
          </View>
        )}
        keyExtractor={(item, index) => index.toString()}
      />
      <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addButton}>
        <Text style={styles.addButtonText}>Agregar Tarea</Text>
      </TouchableOpacity>

      {/* Modal for adding/editing tasks */}
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalView}>
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
          <Button title="Guardar" onPress={addOrUpdateTask} color='#008080' />
        </View>
      </Modal>

      {/* Modal for logout confirmation */}
      <Modal animationType="slide" transparent={true} visible={logoutModalVisible} onRequestClose={() => setLogoutModalVisible(false)}>
        <View style={styles.modalView}>
          <Text style={styles.modalText}>¿Estás seguro? Esto cerrará sesión</Text>
          <View style={styles.logoutButtons}>
            <Button title="Cancelar" onPress={() => setLogoutModalVisible(false)} color='#808080' />
            <Button title="Confirmar" onPress={signOut} color='#FF6347' />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E0FFFF',
    padding: 20,
  },
  addButton: {
    position: 'absolute',
    bottom: 30,
    backgroundColor: '#008080',
    padding: 15,
    borderRadius: 30,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modalView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
  },
  input: {
    width: '80%',
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
  },
  picker: {
    height: 50,
    width: '80%',
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#008080',
  },
  taskItem: {
    backgroundColor: '#fff',
    padding: 10,
    marginVertical: 8,
    borderRadius: 10,
    width: '100%',
  },
  taskText: {
    color: '#008080',
  },
  taskButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalText: {
    fontSize: 18,
    marginBottom: 20,
  },
  logoutButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
  },
});

export default Home;
