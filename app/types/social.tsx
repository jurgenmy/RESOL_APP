//Social.tsx

import { Task } from '../types'; // Asegúrate de importar correctamente el tipo Task

export interface UserProfile {
  id: string;
  uid:string;
  friendId:string;
  email: string;
  displayName: string;
  photoURL?: string;
  bio?: string;
  friends: string[];
  pendingFriends: string[];
  createdAt: number;
  lastActive?: number;
  firstName?: string; 
  lastName?: string;  
  birthdate?: string; 
}

export interface UserStats {
  totalTasks: number;
  completedTasks: number;
  totalGroups: number;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  owner: string; // ID del creador
  members: string[]; // Array de IDs de miembros
  tasks: string[]; // Array de IDs de tareas compartidas
  createdAt: Date;
}

export interface SharedTask extends Task {
  sharedBy: string; // ID del usuario que compartió
  sharedWith: string[]; // IDs de usuarios o ID del grupo
  assignedTo?: string; // ID del usuario asignado
  isGroupTask: boolean;
  groupId?: string;
}