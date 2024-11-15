import React from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, TextInput, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { UserProfile } from '../../types/social';
import { styles } from '../styles';

interface FriendsListProps {
  friends: UserProfile[];
  onRefreshFriends?: () => Promise<void>;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onFriendPress?: (friend: UserProfile) => void;
  onDeleteFriend?: (friendId: string) => Promise<void>;
}

export const FriendsList: React.FC<FriendsListProps> = ({
  friends,
  onRefreshFriends,
  searchQuery = '',
  onSearchChange = () => {},
  onFriendPress = () => {},
  onDeleteFriend,
}) => {
  const handleDeletePress = (friend: UserProfile) => {
    Alert.alert(
      'Eliminar amigo',
      `¿Estás seguro que deseas eliminar a ${friend.displayName} de tu lista de amigos?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              if (onDeleteFriend && friend.uid) {
                await onDeleteFriend(friend.uid);
                if (onRefreshFriends) {
                  await onRefreshFriends();
                }
              }
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar al amigo');
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>
        Mis Amigos ({friends.length})
      </Text>
      <TextInput
        style={styles.searchInput}
        placeholder="Buscar amigos..."
        value={searchQuery}
        onChangeText={onSearchChange}
      />
      {friends.length > 0 ? (
        <FlatList
          data={friends}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.friendItem}
              onPress={() => onFriendPress(item)}
            >
              <Image 
                source={{ uri: item.photoURL || 'https://via.placeholder.com/50' }} 
                style={styles.smallProfileImage}
              />
              <View style={styles.friendInfo}>
                <Text style={styles.userName}>{item.displayName}</Text>
                <Text style={styles.userEmail}>{item.email}</Text>
                {item.bio && (
                  <Text style={styles.userBio} numberOfLines={1}>
                    {item.bio}
                  </Text>
                )}
              </View>
              <View style={styles.actionButtons}>
                {onDeleteFriend && (
                  <TouchableOpacity
                    onPress={() => handleDeletePress(item)}
                    style={styles.deleteButton}
                  >
                    <MaterialIcons name="delete" size={24} color="#FF4444" />
                  </TouchableOpacity>
                )}
                <MaterialIcons name="chevron-right" size={24} color="#666" />
              </View>
            </TouchableOpacity>
          )}
          keyExtractor={item => item.id}
          scrollEnabled={false}
        />
      ) : (
        <Text style={styles.emptyText}>
          {searchQuery ? 'No se encontraron amigos' : 'No tienes amigos agregados'}
        </Text>
      )}
    </View>
  );
};