import { 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  getDoc, 
  arrayUnion, 
  setDoc,
  Timestamp 
} from 'firebase/firestore';
import { FIREBASE_DB } from '../../FirebaseConfig';
import { writeBatch } from 'firebase/firestore';

// Definición de interfaces
interface Task {
  id: string;
  nombre: string;
  descripcion: string;
  resolucion: string;
  estado: string;
  prioridad: string;
  fecha: Date | Timestamp;
  nota?: string;
  userId: string;
  isShared?: boolean;
  sharedWith?: string[];
  sharedWithGroup?: string;
  notificacion?: {
    tipo: 'mismo-dia' | 'dias-antes';
    hora: Date;
    diasAntes?: number;
  };
}

interface SharedTask extends Omit<Task, 'userId'> {
  id: string;
  sharedBy: string;
  sharedWith: string[];
  isGroupTask: boolean;
  groupId?: string;
  assignedTo?: string;
  originalTaskId: string;
}

interface Notification {
  type: 'taskCompleted' | 'taskShared' | 'taskUpdated';
  taskId: string;
  completedBy?: string;
  timestamp: Date | Timestamp;
  message?: string;
}

// Función auxiliar para convertir Timestamp a Date
function convertTimestampToDate(timestamp: Timestamp | Date): Date {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  return timestamp;
}

// Función auxiliar para agregar notificaciones
async function addNotification(userId: string, notification: Notification): Promise<void> {
  try {
    const notificationRef = collection(FIREBASE_DB, 'notifications');
    await addDoc(notificationRef, {
      ...notification,
      userId,
      read: false,
      timestamp: notification.timestamp instanceof Date ? Timestamp.fromDate(notification.timestamp) : notification.timestamp
    });
  } catch (error) {
    console.error('Error adding notification:', error);
    throw error;
  }
}

export class TaskService {
  // Método para obtener las tareas de un usuario
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
          fecha: data.fecha ? convertTimestampToDate(data.fecha) : new Date(),
          nota: data.nota || '',
          userId: data.userId,
          isShared: data.isShared || false,
          sharedWith: data.sharedWith || [],
          sharedWithGroup: data.sharedWithGroup || null
        };
      });
    } catch (error) {
      console.error('Error fetching tasks:', error);
      throw error;
    }
  }

  // Método para agregar una tarea
  static async addTask(taskData: Partial<Task>, userId: string): Promise<string> {
    try {
      const task: Omit<Task, 'id'> = {
        nombre: taskData.nombre || '',
        descripcion: taskData.descripcion || '',
        resolucion: taskData.resolucion || '',
        estado: taskData.estado || 'en proceso',
        prioridad: taskData.prioridad || 'prioridad media',
        fecha: taskData.fecha instanceof Date ? Timestamp.fromDate(taskData.fecha) : Timestamp.fromDate(new Date()),
        nota: taskData.nota || '',
        userId: userId,
        isShared: false,
        sharedWith: []
      };

      const docRef = await addDoc(collection(FIREBASE_DB, 'tasks'), task);
      return docRef.id;
    } catch (error) {
      console.error('Error adding task:', error);
      throw error;
    }
  }

  // Método para actualizar una tarea
  static async updateTask(taskId: string, taskData: Partial<Task>): Promise<void> {
    try {
      const taskRef = doc(FIREBASE_DB, 'tasks', taskId);
      const taskDoc = await getDoc(taskRef);
      
      if (!taskDoc.exists()) {
        throw new Error('Task not found');
      }

      const currentData = taskDoc.data() as Task;
      const updatedTask = {
        ...currentData,
        ...taskData,
        fecha: taskData.fecha ? 
          (taskData.fecha instanceof Date ? Timestamp.fromDate(taskData.fecha) : taskData.fecha) 
          : currentData.fecha,
        estado: taskData.estado || currentData.estado,
        nota: taskData.nota ?? currentData.nota
      };

      await updateDoc(taskRef, updatedTask);

      if (currentData.isShared && (taskData.estado || taskData.prioridad)) {
        const sharedUsers = currentData.sharedWith || [];
        await Promise.all(sharedUsers.map(userId =>
          addNotification(userId, {
            type: 'taskUpdated',
            taskId,
            timestamp: Timestamp.fromDate(new Date()),
            message: `La tarea "${currentData.nombre}" ha sido actualizada`
          })
        ));
      }
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  }

  // Método para eliminar una tarea
  static async deleteTask(taskId: string): Promise<void> {
    try {
      await deleteDoc(doc(FIREBASE_DB, 'tasks', taskId));
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  }

  // Método para compartir una tarea con un usuario
  static async shareTaskWithUser(taskId: string, userId: string, friendId: string): Promise<void> {
    try {
      // 1. Verificación inicial mejorada
      if (!taskId || !userId || !friendId) {
        throw new Error('taskId, userId y friendId son requeridos');
      }
  
      // 2. Obtener la tarea original y verificar que existe
      const taskRef = doc(FIREBASE_DB, 'tasks', taskId);
      const taskDoc = await getDoc(taskRef);
  
      if (!taskDoc.exists()) {
        throw new Error('Tarea no encontrada');
      }
  
      const taskData = taskDoc.data() as Task;
  
      // 3. Verificar que el usuario es el dueño de la tarea
      if (taskData.userId !== userId) {
        throw new Error('No tienes permiso para compartir esta tarea');
      }
  
      // 4. Verificar que el amigo existe
      const friendRef = doc(FIREBASE_DB, 'users', friendId);
      const friendDoc = await getDoc(friendRef);
  
      if (!friendDoc.exists()) {
        throw new Error('Usuario destino no encontrado');
      }
  
      // 5. Crear ID único para la tarea compartida
      const sharedTaskId = `${taskId}_shared_${friendId}_${Date.now()}`;
  
      // 6. Crear objeto de tarea compartida con todos los campos necesarios
      const sharedTask: SharedTask = {
        id: sharedTaskId,
        sharedBy: userId,
        sharedWith: [friendId],
        isGroupTask: false,
        assignedTo: friendId,
        originalTaskId: taskId,
        nombre: taskData.nombre,
        descripcion: taskData.descripcion || '',
        resolucion: taskData.resolucion || '',
        estado: taskData.estado,
        prioridad: taskData.prioridad,
        fecha: taskData.fecha instanceof Timestamp ? 
          taskData.fecha : 
          Timestamp.fromDate(taskData.fecha as Date),
        nota: taskData.nota || ''
      };
  
      // 7. Realizar todas las operaciones en una transacción
      const batch = writeBatch(FIREBASE_DB);
  
      // 7.1 Guardar la tarea compartida
      const sharedTaskRef = doc(FIREBASE_DB, 'sharedTasks', sharedTaskId);
      batch.set(sharedTaskRef, sharedTask);
  
      // 7.2 Actualizar la tarea original
      batch.update(taskRef, {
        sharedWith: arrayUnion(friendId),
        isShared: true
      });
  
      // 7.3 Actualizar el documento del usuario destino
      batch.update(friendRef, {
        sharedTasks: arrayUnion(sharedTaskId)
      });
  
      // 8. Ejecutar la transacción
      await batch.commit();
  
      // 9. Crear notificación después de la transacción exitosa
      await addNotification(friendId, {
        type: 'taskShared',
        taskId: sharedTaskId,
        timestamp: Timestamp.fromDate(new Date()),
        message: `${userId} ha compartido una tarea contigo`
      });
  
      console.log('Tarea compartida exitosamente:', sharedTaskId);
  
    } catch (error) {
      console.error('Error en shareTaskWithUser:', error);
      throw error;
    }
  }
  
  // Método para compartir una tarea con un grupo
  static async shareTaskWithGroup(taskId: string, userId: string, groupId: string): Promise<void> {
    try {
      const taskRef = doc(FIREBASE_DB, 'tasks', taskId);
      const groupRef = doc(FIREBASE_DB, 'groups', groupId);

      const [taskDoc, groupDoc] = await Promise.all([
        getDoc(taskRef),
        getDoc(groupRef)
      ]);

      if (!taskDoc.exists() || !groupDoc.exists()) {
        throw new Error('Tarea o grupo no encontrado');
      }

      const taskData = taskDoc.data() as Task;
      const groupData = groupDoc.data();

      const sharedTask: SharedTask = {
        id: `${taskId}_group_${groupId}`,
        sharedBy: userId,
        sharedWith: groupData.members,
        isGroupTask: true,
        groupId: groupId,
        originalTaskId: taskId,
        nombre: taskData.nombre,
        descripcion: taskData.descripcion,
        resolucion: taskData.resolucion,
        estado: taskData.estado,
        prioridad: taskData.prioridad,
        fecha: taskData.fecha instanceof Timestamp ? taskData.fecha : Timestamp.fromDate(taskData.fecha as Date),
        nota: taskData.nota || ''
      };

      await setDoc(doc(FIREBASE_DB, 'sharedTasks', sharedTask.id), sharedTask);

      await updateDoc(taskRef, {
        isShared: true,
        sharedWithGroup: groupId
      });

      await updateDoc(groupRef, {
        tasks: arrayUnion(sharedTask.id)
      });

      await Promise.all(groupData.members.map(async (memberId: string) => {
        const memberRef = doc(FIREBASE_DB, 'users', memberId);
        await updateDoc(memberRef, {
          sharedTasks: arrayUnion(sharedTask.id)
        });

        if (memberId !== userId) {
          await addNotification(memberId, {
            type: 'taskShared',
            taskId: sharedTask.id,
            timestamp: Timestamp.fromDate(new Date()),
            message: `${userId} ha compartido una tarea con el grupo`
          });
        }
      }));
    } catch (error) {
      console.error('Error sharing task with group:', error);
      throw error;
    }
  }

  // Método para obtener tareas compartidas

  static async fetchSharedTasks(userId: string): Promise<SharedTask[]> {
    try {
      // Query for tasks shared directly with the user
      const sharedTasksQuery = query(
        collection(FIREBASE_DB, 'sharedTasks'),
        where('sharedWith', 'array-contains', userId)
      );

      // Query for tasks assigned specifically to the user
      const assignedTasksQuery = query(
        collection(FIREBASE_DB, 'sharedTasks'),
        where('assignedTo', '==', userId)
      );

      // Execute both queries
      const [sharedTasksSnapshot, assignedTasksSnapshot] = await Promise.all([
        getDocs(sharedTasksQuery),
        getDocs(assignedTasksQuery)
      ]);

      // Combine results from both queries
      const sharedTasks = sharedTasksSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SharedTask[];

      const assignedTasks = assignedTasksSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SharedTask[];

      // Combine and remove duplicates based on task ID
      const allTasks = [...sharedTasks, ...assignedTasks];
      const uniqueTasks = Array.from(
        new Map(allTasks.map(task => [task.id, task])).values()
      );

      // Fetch user information for each task
      const tasksWithUserInfo = await Promise.all(
        uniqueTasks.map(async task => {
          try {
            // Obtener info del usuario que compartió
            const sharedByUserRef = doc(FIREBASE_DB, 'users', task.sharedBy);
            const sharedByUserDoc = await getDoc(sharedByUserRef);
            const sharedByUserData = sharedByUserDoc.data();
      
            // Obtener info del usuario asignado si existe
            let assignedToName = task.assignedTo;
            if (task.assignedTo) {
              const assignedToUserRef = doc(FIREBASE_DB, 'users', task.assignedTo);
              const assignedToUserDoc = await getDoc(assignedToUserRef);
              const assignedToUserData = assignedToUserDoc.data();
              assignedToName = assignedToUserData?.displayName || assignedToUserData?.email || task.assignedTo;
              
              
            }
      
            return {
              ...task,
              fecha: task.fecha instanceof Timestamp ? task.fecha.toDate() : task.fecha,
              sharedByName: sharedByUserData?.displayName || sharedByUserData?.email || task.sharedBy,
              assignedToName: assignedToName
            };
          } catch (error) {
            console.error('Error fetching user info for task:', task.id, error);
            return {
              ...task,
              fecha: task.fecha instanceof Timestamp ? task.fecha.toDate() : task.fecha,
              sharedByName: task.sharedBy,
              assignedToName: task.assignedTo
            };
          }
        })
      );

      return tasksWithUserInfo;
    } catch (error) {
      console.error('Error fetching shared tasks:', error);
      throw new Error('Error al obtener tareas compartidas');
    }
  }

  // Método para actualizar una tarea compartida
  static async updateSharedTask(taskId: string, updates: Partial<SharedTask>): Promise<void> {
    try {
      const taskRef = doc(FIREBASE_DB, 'sharedTasks', taskId);
      const taskDoc = await getDoc(taskRef);

      if (!taskDoc.exists()) {
        throw new Error('Tarea compartida no encontrada');
      }

      const currentTask = taskDoc.data() as SharedTask;
      
      // Convertir fecha si existe en las actualizaciones
      if (updates.fecha && updates.fecha instanceof Date) {
        updates.fecha = Timestamp.fromDate(updates.fecha);
      }

      await updateDoc(taskRef, updates);

      if (updates.estado === 'finalizada' && currentTask.sharedBy) {
        await addNotification(currentTask.sharedBy, {
          type: 'taskCompleted',
          taskId: taskId,
          completedBy: updates.assignedTo || '',
          timestamp: Timestamp.fromDate(new Date()),
          message: `La tarea "${currentTask.nombre}" ha sido completada`
        });
      }

      if (updates.estado || updates.prioridad) {
        await Promise.all(currentTask.sharedWith.map(userId =>
          userId !== updates.assignedTo ? 
          addNotification(userId, {
            type: 'taskUpdated',
            taskId: taskId,
            timestamp: Timestamp.fromDate(new Date()),
            message: `La tarea compartida "${currentTask.nombre}" ha sido actualizada`
          }) : Promise.resolve()
        ));
      }
    } catch (error) {
      console.error('Error updating shared task:', error);
      throw error;
    }
  }static async deleteSharedTask(taskId: string): Promise<void> {
    try {
      const taskRef = doc(FIREBASE_DB, 'sharedTasks', taskId);
      const taskDoc = await getDoc(taskRef);

      if (!taskDoc.exists()) {
        throw new Error('Tarea compartida no encontrada');
      }

      const taskData = taskDoc.data() as SharedTask;
      const batch = writeBatch(FIREBASE_DB);

      // Eliminar la tarea compartida
      batch.delete(taskRef);

      // Actualizar referencias en usuarios
      const promises = taskData.sharedWith.map(async (userId) => {
        const userRef = doc(FIREBASE_DB, 'users', userId);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.sharedTasks && userData.sharedTasks.includes(taskId)) {
            batch.update(userRef, {
              sharedTasks: userData.sharedTasks.filter((id: string) => id !== taskId)
            });
          }
        }
      });

      // Esperar a que se actualicen todas las referencias
      await Promise.all(promises);

      // Ejecutar el batch
      await batch.commit();
    } catch (error) {
      console.error('Error deleting shared task:', error);
      throw new Error('Error al eliminar tarea compartida');
    }
  }

  // Método helper para verificar si una tarea es compartida
  static isSharedTask(task: any): task is SharedTask {
    return 'sharedBy' in task && 'sharedWith' in task;
  }

  
}
