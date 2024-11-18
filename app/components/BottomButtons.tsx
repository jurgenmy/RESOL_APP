//BottomButtons.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  Profile: undefined;
  Groups: undefined;
  CompletedTasks: undefined;
};

interface BottomButtonsProps {
  onCompletedPress: () => void;
  onAddPress: () => void;
}

const BottomButtons = ({ onCompletedPress, onAddPress }: BottomButtonsProps) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        onPress={() => navigation.navigate('Profile')} 
        style={[styles.button, styles.bottomButton]}
      >
        <Text style={styles.buttonText}>Perfil</Text>
      </TouchableOpacity>
      
      {/* <TouchableOpacity 
        onPress={() => navigation.navigate('Groups')} 
        style={[styles.button, styles.bottomButton]}
      >
        <Text style={styles.buttonText}>Grupos</Text>
      </TouchableOpacity> */}

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
