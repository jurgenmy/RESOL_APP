import * as Notifications from 'expo-notifications';
import { Alert } from 'react-native';
import { FIREBASE_AUTH, FIREBASE_DB } from '../../FirebaseConfig';
import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { Task } from '../types';
import { Timestamp } from 'firebase/firestore';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export class NotificationService {
  static async setupNotifications(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        Alert.alert(
          'Notificaciones',
          'Las notificaciones son importantes para recordarte tus tareas. Por favor, habilítalas en la configuración de tu dispositivo.',
          [{ text: 'OK' }]
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error setting up notifications:', error);
      return false;
    }
  }

  static async scheduleNotification(task: Task): Promise<string | null> {
    try {
      const hasPermission = await this.setupNotifications();
      if (!hasPermission) return null;

      if (task.id) {
        await this.cancelExistingNotification(task.id);
      }

      const taskDate = task.fecha instanceof Timestamp ? task.fecha.toDate() : new Date(task.fecha);
      const notificationDate = this.calculateNotificationDate(taskDate, task.notificacion);

      if (notificationDate.getTime() <= Date.now()) {
        console.log('Fecha de notificación ya pasada:', notificationDate);
        return null;
      }

const notificationId = await Notifications.scheduleNotificationAsync({
  content: {
    title: '📅 Tarea Pendiente',
    body: `${task.nombre} vence ${this.formatRelativeDate(taskDate)}`,
    data: { taskId: task.id },
    sound: true,
    priority: Notifications.AndroidNotificationPriority.HIGH,
  },
  trigger: {
    type: Notifications.SchedulableTriggerInputTypes.DATE, // Tipo requerido
    date: notificationDate, // Fecha programada
  },
});

if (task.id) {
  await this.saveNotificationToFirebase(task.id, {
    notificationId,
    scheduledFor: notificationDate.toISOString(),
    taskName: task.nombre,
    taskId: task.id,
  });
}

console.log('Notificación programada:', {
  id: notificationId,
  taskName: task.nombre,
  notificationDate: notificationDate.toLocaleString(),
});

return notificationId;

} catch (error) {
    console.error('Error scheduling notification:', error);
    return null;
  }
}

  private static async saveNotificationToFirebase(
    taskId: string,
    notificationInfo: {
      notificationId: string;
      scheduledFor: string;
      taskName: string;
      taskId: string;
    }
  ): Promise<void> {
    try {
      const userId = FIREBASE_AUTH.currentUser?.uid;
      if (!userId) throw new Error('Usuario no autenticado');

      const notificationRef = doc(FIREBASE_DB, 'users', userId, 'notifications', taskId);
      await setDoc(notificationRef, {
        ...notificationInfo,
        createdAt: new Date().toISOString(),
        userId,
        status: 'scheduled',
      });
    } catch (error) {
      console.error('Error saving notification to Firebase:', error);
    }
  }

  static async cancelExistingNotification(taskId: string): Promise<void> {
    try {
      const userId = FIREBASE_AUTH.currentUser?.uid;
      if (!userId) return;

      const notificationRef = doc(FIREBASE_DB, 'users', userId, 'notifications', taskId);
      const notificationDoc = await getDoc(notificationRef);

      if (notificationDoc.exists()) {
        const notificationData = notificationDoc.data();
        if (notificationData.notificationId) {
          await Notifications.cancelScheduledNotificationAsync(notificationData.notificationId);
        }

        await updateDoc(notificationRef, {
          canceledAt: new Date().toISOString(),
          status: 'canceled',
        });
      }

      // Also check for any scheduled notifications on the device
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      const existingNotification = scheduledNotifications.find(
        (n) => n.content.data?.taskId === taskId
      );

      if (existingNotification) {
        await Notifications.cancelScheduledNotificationAsync(existingNotification.identifier);
      }
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  }

  private static calculateNotificationDate(taskDate: Date, notificationConfig?: Task['notificacion']): Date {
    const notificationDate = new Date(taskDate);

    if (notificationConfig?.tipo === 'dias-antes' && notificationConfig.diasAntes) {
      notificationDate.setDate(notificationDate.getDate() - notificationConfig.diasAntes);
    }

    if (notificationConfig?.hora) {
      const hora = new Date(notificationConfig.hora);
      notificationDate.setHours(hora.getHours(), hora.getMinutes(), 0, 0);
    } else {
      // If no specific time is set, default to 9:00 AM
      notificationDate.setHours(9, 0, 0, 0);
    }

    return notificationDate;
  }

  private static formatRelativeDate(date: Date): string {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'hoy';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'mañana';
    } else {
      return `el ${date.toLocaleDateString()}`;
    }
  }
}
