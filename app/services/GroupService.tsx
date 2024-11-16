// services/GroupService.tsx
import { collection, addDoc, doc, updateDoc, getDoc, query, where, getDocs, arrayUnion } from 'firebase/firestore';
import { FIREBASE_DB } from '../../FirebaseConfig';
import { Group } from '../types/social';

export class GroupService {
  static async createGroup(group: Omit<Group, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(FIREBASE_DB, 'groups'), group);
    return docRef.id;
  }

  static async getGroup(groupId: string): Promise<Group | null> {
    const groupDoc = await getDoc(doc(FIREBASE_DB, 'groups', groupId));
    return groupDoc.exists() ? { id: groupDoc.id, ...groupDoc.data() } as Group : null;
  }

  static async getUserGroups(userId: string): Promise<Group[]> {
    const groupsRef = collection(FIREBASE_DB, 'groups');
    const q = query(groupsRef, where('members', 'array-contains', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Group);
  }

  static async addMemberToGroup(groupId: string, userId: string): Promise<void> {
    await updateDoc(doc(FIREBASE_DB, 'groups', groupId), {
      members: arrayUnion(userId)
    });
    
    await updateDoc(doc(FIREBASE_DB, 'users', userId), {
      groups: arrayUnion(groupId)
    });
  }
}