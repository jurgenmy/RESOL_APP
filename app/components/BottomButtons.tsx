import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';

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
        style={styles.button}
      >
        <Feather name="user" size={24} color="#FFFFFF" />
        <Text style={styles.buttonText}>Perfil</Text>
      </TouchableOpacity>

      <TouchableOpacity 
  onPress={() => navigation.navigate('CompletedTasks')} 
  style={styles.button}
>
  <Feather name="check-circle" size={24} color="#FFFFFF" />
  <Text style={styles.buttonText}>Finalizadas</Text>
</TouchableOpacity>

      
      <TouchableOpacity 
        onPress={onAddPress} 
        style={styles.addButton}
      >
        <Feather name="plus" size={28} color="#FFFFFF" />
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
    alignItems: 'center',
    backgroundColor: '#2D9CDB',
    paddingVertical: 2,
    paddingHorizontal: 16,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: -3,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
      },
    }),
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  addButton: {
    backgroundColor: '#1E90FF', 
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#2B8CA3',
        shadowOffset: {
          width: 0,
          height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 6,
      },
    }),
    marginBottom: Platform.OS === 'ios' ? 20 : 0,
  },
  buttonText: {
    fontSize: 12,
    color: '#FFFFFF',
    marginTop: 4,
    fontWeight: '500',
  },
});

export default BottomButtons;