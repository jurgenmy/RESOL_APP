import React from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Timestamp } from 'firebase/firestore';

interface Task {
  id: string;
  nombre: string;
  descripcion: string;
  resolucion: string;
  estado: string;
  prioridad: string;
  fecha: Date | Timestamp;
  nota?: string;
  notificacion?: {
    tipo: "mismo-dia" | "dias-antes";
    hora: Date;
    diasAntes?: number;
  };
}

interface TaskFormModalProps {
  visible: boolean;
  onClose: () => void;
  task: Task;
  setTask: React.Dispatch<React.SetStateAction<Task>>;
  onSave: () => void;
  editingTaskId: string | null;
  showDatePicker: boolean;
  setShowDatePicker: (show: boolean) => void;
}

const defaultTask: Task = {
  id: '',
  nombre: '',
  descripcion: '',
  resolucion: '',
  estado: 'en proceso',
  prioridad: 'prioridad media',
  fecha: new Date(),
  nota: '',
  notificacion: {
    tipo: 'mismo-dia',
    hora: new Date(),
    diasAntes: 0
  }
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
  const [showTimePicker, setShowTimePicker] = useState(false);
  const currentTask = task || defaultTask;


  // Ensure notification object is properly initialized
  function ensureDate(value: Date | Timestamp | undefined): Date {
    if (!value) return new Date(); // Retorna la fecha actual si `value` es undefined.
    if (value instanceof Date) return value; // Si ya es un `Date`, lo retorna.
    if (typeof (value as Timestamp).toDate === 'function') {
      return (value as Timestamp).toDate(); // Convierte `Timestamp` a `Date`.
    }
    throw new Error('Invalid date format'); // Lanza un error si el formato no es válido.
  }
  

  const ensureNotification = () => {
    if (!currentTask.notificacion) {
      setTask(prevTask => ({
        ...prevTask,
        notificacion: {
          tipo: 'mismo-dia',
          hora: new Date(),
          diasAntes: 0,
        },
      }));
    } else if (!(currentTask.notificacion.hora instanceof Date)) {
      setTask(prevTask => ({
        ...prevTask,
        notificacion: {
          ...(prevTask.notificacion || {}), // Asegurarte de que `notificacion` exista
          tipo: prevTask.notificacion?.tipo || 'mismo-dia',
          hora: ensureDate(currentTask.notificacion?.hora),
        },
      }));
    }
  };
  
  
  const handleSave = () => {
    if (!currentTask.nombre?.trim()) {
      Alert.alert('Error', 'El nombre de la tarea es requerido');
      return;
    }

  ensureNotification();
    const taskToSave = {
      ...currentTask,
      estado: currentTask.estado || 'en proceso',
      prioridad: currentTask.prioridad || 'prioridad media',
      fecha: ensureDate(currentTask.fecha),
      nota: currentTask.nota || '',
      notificacion: {
        tipo: currentTask.notificacion?.tipo || 'mismo-dia',
        hora: ensureDate(currentTask.notificacion?.hora),
        diasAntes: currentTask.notificacion?.diasAntes || 0
      }
    };
    setTask(taskToSave);
    onSave();
  };

  const updateTaskField = (field: keyof Task, value: any) => {
    setTask(prevTask => ({
      ...prevTask,
      [field]: value
    }));
  };

  const updateNotificacion = (
    field: keyof NonNullable<Task['notificacion']>,
    value: any
  ) => {
    ensureNotification();
    setTask(prevTask => ({
      ...prevTask,
      notificacion: {
        ...prevTask.notificacion,
        tipo: prevTask.notificacion?.tipo || 'mismo-dia',
        hora: prevTask.notificacion?.hora || new Date(),
        [field]: value
      }
    }));
  };

  // Format time with a fallback
  const formatTime = (date: Date | undefined): string => {
    const validDate = ensureDate(date);
    return validDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const formatDate = (date: Date | undefined): string => {
    const validDate = ensureDate(date);
    return validDate.toLocaleDateString();
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

        {(currentTask.estado === 'finalizada') && (
            <TextInput
              style={styles.input}
              placeholder="Resolución"
              value={currentTask.resolucion}
              onChangeText={(text) => updateTaskField('resolucion', text)}
            />
          )}

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
               Fecha: {formatDate(currentTask.fecha instanceof Date ? currentTask.fecha : currentTask.fecha.toDate())}
            </Text>


          </TouchableOpacity>

          <View style={styles.notificationSection}>
            <Text style={styles.sectionTitle}>Configurar Notificación</Text>
            
            <Picker
              selectedValue={currentTask.notificacion?.tipo || 'mismo-dia'}
              style={styles.picker}
              onValueChange={(itemValue) => updateNotificacion('tipo', itemValue)}
            >
              <Picker.Item label="El mismo día" value="mismo-dia" />
              <Picker.Item label="Días antes" value="dias-antes" />
            </Picker>

            {currentTask.notificacion?.tipo === 'dias-antes' && (
              <View style={styles.diasAntesContainer}>
                <Text>Días antes:</Text>
                <TextInput
                  style={styles.diasAntesInput}
                  keyboardType="numeric"
                  value={currentTask.notificacion?.diasAntes?.toString() || '0'}
                  onChangeText={(text) => updateNotificacion('diasAntes', parseInt(text) || 0)}
                />
              </View>
            )}

            <TouchableOpacity
              style={[styles.button, { backgroundColor: '#4A90E2', marginTop: 10 }]}
              onPress={() => setShowTimePicker(true)}
            >
              <Text style={styles.buttonText}>
              Hora: {formatTime(ensureDate(currentTask.notificacion?.hora))}
              </Text>
            </TouchableOpacity>
          </View>

          {showDatePicker && (
          <DateTimePicker
          value={ensureDate(currentTask.fecha)}
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

          {showTimePicker && (
            <DateTimePicker
            value={ensureDate(currentTask.notificacion?.hora)}
            mode="time"
            display="default"
            onChange={(event, selectedDate) => {
              setShowTimePicker(false);
              if (selectedDate) {
                updateNotificacion('hora', selectedDate);
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
  notificationSection: {
    width: '100%',
    marginTop: 15,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#008080',
  },
  diasAntesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  diasAntesInput: {
    height: 40,
    width: 60,
    marginLeft: 10,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
  },
});

export default TaskFormModal;