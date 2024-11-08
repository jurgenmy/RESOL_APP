import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface BottomButtonsProps {
  onCompletedPress: () => void;
  onAddPress: () => void;
}

const BottomButtons = ({ onCompletedPress, onAddPress }: BottomButtonsProps) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity 
        onPress={onCompletedPress} 
        style={[styles.button, styles.bottomButton]}
      >
        <Text style={styles.buttonText}>Tareas Finalizadas</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        onPress={onAddPress} 
        style={[styles.button, styles.bottomButton]}
      >
        <Text style={styles.buttonText}>Agregar Tarea [+]</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 10,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  button: {
    padding: 10,
    borderRadius: 5,
    minWidth: 80,
    alignItems: 'center',
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
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default BottomButtons;