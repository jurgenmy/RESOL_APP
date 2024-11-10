import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import { FIREBASE_DB } from '../../FirebaseConfig';
import { Task } from '../types';

export class TaskService {
  static async fetchTasks(userId: string): Promise<Task[]> {
    const tasksRef = collection(FIREBASE_DB, 'tasks');
    const q = query(tasksRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        fecha: data.fecha && data.fecha.seconds ? new Date(data.fecha.seconds * 1000) : new Date(),
      } as Task;
    });
  }

  static async fetchTasksByStatus(userId: string, status: string): Promise<Task[]> {
    const tasksRef = collection(FIREBASE_DB, 'tasks');
    const q = query(
      tasksRef, 
      where('userId', '==', userId),
      where('estado', '==', status)
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        fecha: data.fecha && data.fecha.seconds ? new Date(data.fecha.seconds * 1000) : new Date(),
      } as Task;
    });
  }

  static async addTask(task: Task, userId: string): Promise<string> {
    const newTaskRef = await addDoc(collection(FIREBASE_DB, 'tasks'), { ...task, userId });
    return newTaskRef.id;
  }

  static async updateTask(taskId: string, task: Partial<Task>): Promise<void> {
    const taskRef = doc(FIREBASE_DB, 'tasks', taskId);
    await updateDoc(taskRef, task);
  }

  static async updateTaskStatus(taskId: string, newStatus: string): Promise<void> {
    const taskRef = doc(FIREBASE_DB, 'tasks', taskId);
    await updateDoc(taskRef, { estado: newStatus });
  }

  static async deleteTask(taskId: string): Promise<void> {
    await deleteDoc(doc(FIREBASE_DB, 'tasks', taskId));
  }
}