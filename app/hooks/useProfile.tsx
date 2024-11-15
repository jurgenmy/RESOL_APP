// hooks/useProfile.ts
import { useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { FIREBASE_AUTH, FIREBASE_DB } from '../../FirebaseConfig';
import { UserService } from '../services/UserService';
import { UserProfile, UserStats } from '../types/social';
import { doc, updateDoc, getDoc, getDocs, query, where, collection } from 'firebase/firestore';
import { useFocusEffect } from '@react-navigation/native';

export const useProfile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [friends, setFriends] = useState<UserProfile[]>([]);
  const [pendingRequests, setPendingRequests] = useState<UserProfile[]>([]);
  const [stats, setStats] = useState<UserStats>({
    totalTasks: 0,
    completedTasks: 0,
    totalGroups: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    try {
      const userId = FIREBASE_AUTH.currentUser?.uid;
      if (!userId) {
        console.log('No user ID found');
        setIsLoading(false);
        return;
      }

      console.log('Loading profile for user:', userId);

      const userProfile = await UserService.getUserProfile(userId);
      if (!userProfile) {
        console.log('No user profile found');
        setIsLoading(false);
        return;
      }

      console.log('User profile loaded:', userProfile);

      setProfile(userProfile);

      // Load pending requests and friends in parallel
      const [pendingProfiles, friendProfiles, statsData] = await Promise.all([
        Promise.all(
          (userProfile.pendingFriends || []).map(async (friendId) => {
            const profile = await UserService.getUserProfile(friendId);
            return profile ? { ...profile, uid: friendId, friendId } : null;
          })
        ),
        Promise.all(
          (userProfile.friends || []).map(friendId => UserService.getUserProfile(friendId))
        ),
        getDoc(doc(FIREBASE_DB, 'userStats', userId))
      ]);

      setPendingRequests(pendingProfiles.filter((p): p is UserProfile => p !== null));
      setFriends(friendProfiles.filter((p): p is UserProfile => p !== null));
      
      if (statsData.exists()) {
        setStats(statsData.data() as UserStats);
      }

      console.log('Profile data loaded successfully');
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'No se pudo cargar el perfil');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateProfile = async (data: Partial<UserProfile>) => {
    try {
      setIsLoading(true);
      const userId = FIREBASE_AUTH.currentUser?.uid;
      if (!userId) throw new Error('No user ID');

      const userRef = doc(FIREBASE_DB, 'users', userId);
      await updateDoc(userRef, data);
      setProfile(prev => prev ? {...prev, ...data} : null);
      Alert.alert('Éxito', 'Perfil actualizado');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'No se pudo actualizar el perfil');
    } finally {
      setIsLoading(false);
    }
  };

  const addFriend = async (friendEmail: string) => {
    try {
      setIsLoading(true);
      const currentUserId = FIREBASE_AUTH.currentUser?.uid;
      if (!currentUserId || !friendEmail) {
        throw new Error('Datos inválidos');
      }

      const usersRef = collection(FIREBASE_DB, 'users');
      const emailQuery = query(usersRef, where('email', '==', friendEmail.toLowerCase().trim()));
      const querySnapshot = await getDocs(emailQuery);

      if (querySnapshot.empty) {
        throw new Error('Usuario no encontrado');
      }

      const friendDoc = querySnapshot.docs[0];
      const friendId = friendDoc.id;

      if (friendId === currentUserId) {
        throw new Error('No puedes agregarte a ti mismo');
      }

      const friendData = friendDoc.data();
      await updateDoc(doc(FIREBASE_DB, 'users', friendId), {
        pendingFriends: [...(friendData.pendingFriends || []), currentUserId]
      });

      Alert.alert('Éxito', 'Solicitud enviada');
      await loadProfile();
    } catch (error) {
      console.error('Error adding friend:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'No se pudo enviar la solicitud');
    } finally {
      setIsLoading(false);
    }
  };

  const acceptFriend = async (friendId: string) => {
    try {
      setIsLoading(true);
      const userId = FIREBASE_AUTH.currentUser?.uid;
      if (!userId || !friendId) {
        throw new Error('ID de usuario inválido');
      }

      const [userDoc, friendDoc] = await Promise.all([
        getDoc(doc(FIREBASE_DB, 'users', userId)),
        getDoc(doc(FIREBASE_DB, 'users', friendId))
      ]);

      const userData = userDoc.data();
      const friendData = friendDoc.data();

      if (!userData || !friendData) {
        throw new Error('Datos de usuario no encontrados');
      }

      await Promise.all([
        updateDoc(doc(FIREBASE_DB, 'users', userId), {
          friends: [...new Set([...(userData.friends || []), friendId])],
          pendingFriends: (userData.pendingFriends || []).filter((id:string) => id !== friendId)
        }),
        updateDoc(doc(FIREBASE_DB, 'users', friendId), {
          friends: [...new Set([...(friendData.friends || []), userId])]
        })
      ]);

      await loadProfile();
      Alert.alert('Éxito', 'Solicitud aceptada');
    } catch (error) {
      console.error('Error accepting friend:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'No se pudo aceptar la solicitud');
    } finally {
      setIsLoading(false);
    }
  };
  const deleteFriend = async (friendId: string) => {
    try {
      setIsLoading(true);
      const userId = FIREBASE_AUTH.currentUser?.uid;
      if (!userId || !friendId) {
        throw new Error('ID de usuario inválido');
      }

      // Get both user documents
      const [userDoc, friendDoc] = await Promise.all([
        getDoc(doc(FIREBASE_DB, 'users', userId)),
        getDoc(doc(FIREBASE_DB, 'users', friendId))
      ]);

      const userData = userDoc.data();
      const friendData = friendDoc.data();

      if (!userData || !friendData) {
        throw new Error('Datos de usuario no encontrados');
      }

      // Remove friend from both users' friend lists
      await Promise.all([
        updateDoc(doc(FIREBASE_DB, 'users', userId), {
          friends: (userData.friends || []).filter((id: string) => id !== friendId)
        }),
        updateDoc(doc(FIREBASE_DB, 'users', friendId), {
          friends: (friendData.friends || []).filter((id: string) => id !== userId)
        })
      ]);

      // Update local state
      setFriends(prevFriends => 
        prevFriends.filter(friend => friend.uid !== friendId)
      );

      console.log('Friend deleted successfully');
    } catch (error) {
      console.error('Error deleting friend:', error);
      throw new Error('No se pudo eliminar al amigo');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    profile,
    friends,
    pendingRequests,
    stats,
    isLoading,
    loadProfile,
    updateProfile,
    addFriend,
    acceptFriend,
    deleteFriend, // Add the new function to the return object
  };
};