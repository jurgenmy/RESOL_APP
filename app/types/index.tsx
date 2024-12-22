// types/index.tsx
import { Timestamp } from "firebase/firestore";
export interface Task {
    id: string;
    nombre: string;
    descripcion: string;
    resolucion: string;
    estado: string;
    prioridad: string;
     fecha: Date | Timestamp;
    nota?: string;
    notificacion?: {
      tipo: 'mismo-dia' | 'dias-antes';
      hora: Date;
      diasAntes?: number;
    };
  }
  
  export type TaskStatus = 'en espera' | 'en proceso' | 'finalizada';
  export type TaskPriority = 'sin prioridad' | 'prioridad baja' | 'prioridad media' | 'prioridad alta';
  
  // utils/taskUtils.ts
  export const getPriorityColor = (prioridad: TaskPriority) => {
    switch (prioridad) {
      case 'prioridad alta':
        return '#FF6B6B';
      case 'prioridad media':
        return '#FFD93D';
      case 'prioridad baja':
        return '#6BCB77';
      default:
        return '#B2B2B2';
    }
  };
  
  export const initialTaskState: Task = {
    id: '',
    nombre: '',
    descripcion: '',
    resolucion: '',
    estado: 'en espera',
    prioridad: 'sin prioridad',
    fecha: new Date(),
    nota: ''
  };