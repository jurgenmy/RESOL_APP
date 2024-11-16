import React from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';

// Definición del tipo de tarea
interface Task {
  id: string;
  nombre: string;
  descripcion: string;
  resolucion: string;
  estado: string;
  prioridad: string;
  fecha: Date;
  nota?: string;
}

// Definición de las propiedades esperadas para el componente
interface TaskFormModalProps {
  visible: boolean;
  onClose: () => void;
  task: Task;
  setTask: (task: Task) => void;
  onSave: () => void;
  editingTaskId: string | null;
  showDatePicker: boolean;
  setShowDatePicker: (show: boolean) => void;
}

// Tarea por defecto para inicializar
const defaultTask: Task = {
  id: '',
  nombre: '',
  descripcion: '',
  resolucion: '',
  estado: 'en proceso',
  prioridad: 'prioridad media',
  fecha: new Date(),
  nota: ''
};

const TaskFormModal: React.FC<TaskFormModalProps> = ({
  visible,
  onClose,
  task,
  setTask,
  onSave,
  editingTaskId,
  showDatePicker,
  setShowDatePicker,
}) => {
  // Asegurarse de que siempre tengamos un objeto task válido
  const currentTask = task || defaultTask;

  const handleSave = () => {
    if (!currentTask.nombre?.trim()) {
      Alert.alert('Error', 'El nombre de la tarea es requerido');
      return;
    }

    // Asegurarse de que todos los campos requeridos tengan valores por defecto
    const taskToSave = {
      ...currentTask,
      estado: currentTask.estado || 'en proceso',
      prioridad: currentTask.prioridad || 'prioridad media',
      fecha: currentTask.fecha || new Date(),
      nota: currentTask.nota || ''
    };

    setTask(taskToSave);
    onSave();
  };

  const updateTaskField = (field: keyof Task, value: any) => {
    setTask({
      ...currentTask,
      [field]: value
    });
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>
            {editingTaskId ? 'Editar Tarea' : 'Nueva Tarea'}
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Nombre"
            value={currentTask.nombre}
            onChangeText={(text) => updateTaskField('nombre', text)}
          />

          <TextInput
            style={styles.input}
            placeholder="Descripción"
            value={currentTask.descripcion}
            onChangeText={(text) => updateTaskField('descripcion', text)}
          />

          <TextInput
            style={styles.input}
            placeholder="Resolución"
            value={currentTask.resolucion}
            onChangeText={(text) => updateTaskField('resolucion', text)}
          />

          <Picker
            selectedValue={currentTask.estado}
            style={styles.picker}
            onValueChange={(itemValue) => updateTaskField('estado', itemValue)}
          >
            <Picker.Item label="En espera" value="en espera" />
            <Picker.Item label="En proceso" value="en proceso" />
            <Picker.Item label="Finalizada" value="finalizada" />
          </Picker>

          <Picker
            selectedValue={currentTask.prioridad}
            style={styles.picker}
            onValueChange={(itemValue) => updateTaskField('prioridad', itemValue)}
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
            <Text style={styles.buttonText}>
              Fecha: {currentTask.fecha.toLocaleDateString()}
            </Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={currentTask.fecha}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) {
                  updateTaskField('fecha', selectedDate);
                }
              }}
            />
          )}

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: '#4A90E2', marginRight: 10 }]}
              onPress={handleSave}
            >
              <Text style={styles.buttonText}>Guardar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: '#FF6347' }]}
              onPress={onClose}
            >
              <Text style={styles.buttonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
    maxHeight: '90%',
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
  picker: {
    height: 50,
    width: '100%',
    marginBottom: 12,
  },
  button: {
    padding: 10,
    borderRadius: 5,
    minWidth: 80,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
  },
});

export default TaskFormModal;
