import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { FIREBASE_AUTH, FIREBASE_DB } from '../../FirebaseConfig';
import { UserService } from '../services/UserService';
import { UserProfile, UserStats } from '../types/social';
import { doc, updateDoc, getDoc, getDocs, query, where, collection } from 'firebase/firestore';

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

      const userProfile = await UserService.getUserProfile(userId);
      if (!userProfile) {
        console.log('No user profile found');
        setIsLoading(false);
        return;
      }

      setProfile(userProfile);

      // Load pending requests and friends in parallel
      const [pendingProfiles, friendProfiles, statsData] = await Promise.all([
        Promise.all(
          (userProfile.pendingFriends || []).map(async (friendId) => {
            const profile = await UserService.getUserProfile(friendId);
            if (profile) {
              const typedProfile: UserProfile = {
                ...profile,
                uid: friendId,
                id: friendId // Ensure id is set to match the type
              };
              return typedProfile;
            }
            return null;
          })
        ),
        Promise.all(
          (userProfile.friends || []).map(async (friendId) => {
            const profile = await UserService.getUserProfile(friendId);
            if (profile) {
              const typedProfile: UserProfile = {
                ...profile,
                uid: friendId,
                id: friendId // Ensure id is set to match the type
              };
              return typedProfile;
            }
            return null;
          })
        ),
        getDoc(doc(FIREBASE_DB, 'userStats', userId))
      ]);

      setPendingRequests(pendingProfiles.filter((p): p is UserProfile => p !== null));
      setFriends(friendProfiles.filter((p): p is UserProfile => p !== null));
      
      if (statsData.exists()) {
        setStats(statsData.data() as UserStats);
      }
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

      const friendData = friendDoc.data() as UserProfile;
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

      const userData = userDoc.data() as UserProfile;
      const friendData = friendDoc.data() as UserProfile;

      if (!userData || !friendData) {
        throw new Error('Datos de usuario no encontrados');
      }

      await Promise.all([
        updateDoc(doc(FIREBASE_DB, 'users', userId), {
          friends: [...new Set([...(userData.friends || []), friendId])],
          pendingFriends: (userData.pendingFriends || []).filter(id => id !== friendId)
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

      const [userDoc, friendDoc] = await Promise.all([
        getDoc(doc(FIREBASE_DB, 'users', userId)),
        getDoc(doc(FIREBASE_DB, 'users', friendId))
      ]);

      const userData = userDoc.data() as UserProfile;
      const friendData = friendDoc.data() as UserProfile;

      if (!userData || !friendData) {
        throw new Error('Datos de usuario no encontrados');
      }

      await Promise.all([
        updateDoc(doc(FIREBASE_DB, 'users', userId), {
          friends: userData.friends.filter(id => id !== friendId)
        }),
        updateDoc(doc(FIREBASE_DB, 'users', friendId), {
          friends: friendData.friends.filter(id => id !== userId)
        })
      ]);

      setFriends(prevFriends => prevFriends.filter(friend => friend.uid !== friendId));

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
    deleteFriend,
  };
};