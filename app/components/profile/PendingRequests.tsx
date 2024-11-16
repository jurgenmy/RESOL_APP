// components/profile/PendingRequests.tsx
import React from 'react';
import { View, Text, FlatList, Image, TouchableOpacity } from 'react-native';
import { UserProfile } from '../../types/social';
import { styles } from '../styles';

interface PendingRequestsProps {
  requests: UserProfile[];
  onAcceptRequest: (friendId: string) => Promise<void>; // Cambiado de onAccept a onAcceptRequest
}

export const PendingRequests: React.FC<PendingRequestsProps> = ({
  requests,
  onAcceptRequest, // Actualizado para coincidir con el nombre en ProfileScreen
}) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>
      Solicitudes Pendientes ({requests.length})
    </Text>
    {requests.length > 0 ? (
      <FlatList
        data={requests}
        renderItem={({ item }) => (
          <View style={styles.requestItem}>
            <View style={styles.userInfo}>
              <Image 
                source={{ uri: item.photoURL || 'https://via.placeholder.com/50' }} 
                style={styles.smallProfileImage}
              />
              <View>
                <Text style={styles.userName}>{item.displayName}</Text>
                <Text style={styles.userEmail}>{item.email}</Text>
              </View>
            </View>
            <TouchableOpacity 
              style={styles.acceptButton}
              onPress={() => onAcceptRequest(item.uid || item.id)}
            >
              <Text style={styles.buttonText}>Aceptar</Text>
            </TouchableOpacity>
          </View>
        )}
        keyExtractor={item => item.uid || item.id || Math.random().toString()}
        scrollEnabled={false}
      />
    ) : (
      <Text style={styles.emptyText}>No hay solicitudes pendientes</Text>
    )}
  </View>
);