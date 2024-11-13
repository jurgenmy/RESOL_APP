//TaskService.tsx
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where, getDoc } from 'firebase/firestore';
import { FIREBASE_DB } from '../../FirebaseConfig';

interface Task {
  id: string;
  nombre: string;
  descripcion: string;
  resolucion: string;
  estado: string;
  prioridad: string;
  fecha: Date;
  nota?: string;
  userId: string;
}

export class TaskService {
  static async fetchTasks(userId: string): Promise<Task[]> {
    try {
      const tasksRef = collection(FIREBASE_DB, 'tasks');
      const q = query(tasksRef, where('userId', '==', userId));
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          nombre: data.nombre || '',
          descripcion: data.descripcion || '',
          resolucion: data.resolucion || '',
          estado: data.estado || 'en proceso',
          prioridad: data.prioridad || 'prioridad media',
          fecha: data.fecha?.toDate() || new Date(),
          nota: data.nota || '',
          userId: data.userId
        };
      });
    } catch (error) {
      console.error('Error fetching tasks:', error);
      throw error;
    }
  }

  static async addTask(taskData: Partial<Task>, userId: string): Promise<string> {
    try {
      const task = {
        nombre: taskData.nombre || '',
        descripcion: taskData.descripcion || '',
        resolucion: taskData.resolucion || '',
        estado: taskData.estado || 'en proceso',
        prioridad: taskData.prioridad || 'prioridad media',
        fecha: taskData.fecha || new Date(),
        nota: taskData.nota || '',
        userId: userId
      };

      const docRef = await addDoc(collection(FIREBASE_DB, 'tasks'), task);
      return docRef.id;
    } catch (error) {
      console.error('Error adding task:', error);
      throw error;
    }
  }

  static async updateTask(taskId: string, taskData: Partial<Task>): Promise<void> {
    try {
      const taskRef = doc(FIREBASE_DB, 'tasks', taskId);
      const taskDoc = await getDoc(taskRef);
      
      if (!taskDoc.exists()) {
        throw new Error('Task not found');
      }

      const currentData = taskDoc.data();
      const updatedTask = {
        ...currentData,
        ...taskData,
        fecha: taskData.fecha || currentData.fecha,
        estado: taskData.estado || currentData.estado,
        nota: taskData.nota ?? currentData.nota // Usar el operador ?? para mantener notas vacías
      };

      await updateDoc(taskRef, updatedTask);
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  }

  static async deleteTask(taskId: string): Promise<void> {
    try {
      await deleteDoc(doc(FIREBASE_DB, 'tasks', taskId));
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  }
}