import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const Tareas = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Aquí se mostrarán las tareas</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E0FFFF',
  },
  text: {
    fontSize: 18,
    color: '#008080',
  },
});

export default Tareas;
