// CompletedTasks.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { FIREBASE_AUTH, FIREBASE_DB } from '../../FirebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';

const CompletedTasks = () => {
  const [completedTasks, setCompletedTasks] = useState([]);
  const user = FIREBASE_AUTH.currentUser;

  useEffect(() => {
    fetchCompletedTasks();
  }, []);

  const fetchCompletedTasks = async () => {
    if (user) {
      const tasksRef = collection(FIREBASE_DB, 'tasks');
      const q = query(
        tasksRef, 
        where('userId', '==', user.uid),
        where('estado', '==', 'finalizada')
      );
      
      const querySnapshot = await getDocs(q);
      const tasks = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        fecha: doc.data().fecha.toDate()
      }));
      
      setCompletedTasks(tasks);
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={completedTasks}
        contentContainerStyle={styles.tasksList}
        renderItem={({ item }) => (
          <View style={styles.taskItem}>
            <Text style={styles.taskTitle}>{item.nombre}</Text>
            <Text style={styles.taskText}>Descripción: {item.descripcion}</Text>
            <Text style={styles.taskText}>Resolución: {item.resolucion}</Text>
            <Text style={styles.taskText}>Prioridad: {item.prioridad}</Text>
            <Text style={styles.taskText}>Fecha de finalización: {item.fecha.toLocaleDateString()}</Text>
            {item.nota && (
              <Text style={styles.taskText}>Nota: {item.nota}</Text>
            )}
          </View>
        )}
        keyExtractor={item => item.id}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 10,
  },
  tasksList: {
    paddingHorizontal: 10,
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
    color: '#008080',
  },
  taskText: {
    fontSize: 16,
    marginBottom: 5,
    color: '#333',
  },
});

export default CompletedTasks;