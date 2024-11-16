//Social.tsx

import { Task } from '../types'; // Asegúrate de importar correctamente el tipo Task

export interface UserProfile {
  id: string;
  uid: string;  // Este es el ID único del usuario, no necesitamos friendId
  email: string;
  displayName: string;
  photoURL?: string;
  bio?: string;
  friends: string[];  // Array de UIDs de amigos
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

export interface SharedTask extends Omit<Task, 'userId'> {
  sharedBy: string;
  sharedByName?: string;
  sharedWith: string[];
  originalTaskId: string;
  isGroupTask: boolean;
  assignedTo?: string;
  groupId?: string;
}