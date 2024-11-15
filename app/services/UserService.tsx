// services/UserService.tsx

import { doc, getDoc, setDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { FIREBASE_DB } from '../../FirebaseConfig';
import { UserProfile } from '../types/social';

export class UserService {
  static async createUserProfile(userId: string, email: string, firstName?: string, lastName?: string, birthdate?: string): Promise<void> {
    const userRef = doc(FIREBASE_DB, 'users', userId);
    const newUser: UserProfile = {
      id: userId,
      uid: userId,
      friendId: "",
      email,
      displayName: email.split('@')[0],
      friends: [],
      pendingFriends: [],
      createdAt: Date.now(),
      firstName: firstName || '', // Default vacío si no se proporciona
      lastName: lastName || '',
      birthdate: birthdate || '',
    };
    await setDoc(userRef, newUser);
  }
  

  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const userRef = doc(FIREBASE_DB, 'users', userId);
      const snapshot = await getDoc(userRef);
      if (snapshot.exists()) {
        return snapshot.data() as UserProfile;
      }
      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  static async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
    const userRef = doc(FIREBASE_DB, 'users', userId);
    await updateDoc(userRef, {
      ...updates,
      lastActive: Date.now(),
    });
  }
  

  static async acceptFriendRequest(userId: string, friendId: string): Promise<void> {
    const userRef = doc(FIREBASE_DB, 'users', userId);
    const friendRef = doc(FIREBASE_DB, 'users', friendId);

    const [userSnapshot, friendSnapshot] = await Promise.all([
      getDoc(userRef),
      getDoc(friendRef),
    ]);

    if (!userSnapshot.exists() || !friendSnapshot.exists()) {
      throw new Error('Usuario no encontrado');
    }

    const userProfile = userSnapshot.data() as UserProfile;
    const friendProfile = friendSnapshot.data() as UserProfile;

    // Eliminar de pendientes y añadir a amigos
    const userPendingFriends = userProfile.pendingFriends.filter(id => id !== friendId);
    const userFriends = [...(userProfile.friends || []), friendId];
    const friendFriends = [...(friendProfile.friends || []), userId];

    await Promise.all([
      updateDoc(userRef, {
        pendingFriends: userPendingFriends,
        friends: userFriends,
      }),
      updateDoc(friendRef, {
        friends: friendFriends,
      }),
    ]);
  }

  static async removeFriend(userId: string, friendId: string): Promise<void> {
    const userRef = doc(FIREBASE_DB, 'users', userId);
    const friendRef = doc(FIREBASE_DB, 'users', friendId);

    const [userSnapshot, friendSnapshot] = await Promise.all([
      getDoc(userRef),
      getDoc(friendRef),
    ]);

    if (!userSnapshot.exists() || !friendSnapshot.exists()) {
      throw new Error('Usuario no encontrado');
    }

    const userProfile = userSnapshot.data() as UserProfile;
    const friendProfile = friendSnapshot.data() as UserProfile;

    const userFriends = userProfile.friends.filter(id => id !== friendId);
    const friendFriends = friendProfile.friends.filter(id => id !== userId);

    await Promise.all([
      updateDoc(userRef, { friends: userFriends }),
      updateDoc(friendRef, { friends: friendFriends }),
    ]);
  }

  static async searchUsers(query: string): Promise<UserProfile[]> {
    try {
      const usersRef = collection(FIREBASE_DB, 'users');
      const snapshot = await getDocs(usersRef);

      const users = snapshot.docs.map(doc => doc.data() as UserProfile);
      return users.filter(user => 
        user.email.toLowerCase().includes(query.toLowerCase()) ||
        user.displayName.toLowerCase().includes(query.toLowerCase())
      );
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  }
}