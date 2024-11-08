import React from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';

interface TaskFormModalProps {
  visible: boolean;
  onClose: () => void;
  task: {
    id: string;
    nombre: string;
    descripcion: string;
    resolucion: string;
    estado: string;
    prioridad: string;
    fecha: Date;
    nota?: string;
  };
  setTask: (task: any) => void;
  onSave: () => void;
  editingTaskId: string | null;
  showDatePicker: boolean;
  setShowDatePicker: (show: boolean) => void;
}

const TaskFormModal = ({
  visible,
  onClose,
  task,
  setTask,
  onSave,
  editingTaskId,
  showDatePicker,
  setShowDatePicker,
}: TaskFormModalProps) => {
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
              onPress={onSave}
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