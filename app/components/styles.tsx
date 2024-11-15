//styles.tsx

import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
      },
      loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
      },
      header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
      },
      title: {
        fontSize: 24,
        fontWeight: 'bold',
      },
      editButton: {
        padding: 8,
      },
      profileInfo: {
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
      },
      profileImage: {
        width: 150,
        height: 150,
        borderRadius: 75,
        marginBottom: 8,
      },
      smallProfileImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 12,
      },
      changePhotoText: {
        color: '#4A90E2',
        textAlign: 'center',
        marginBottom: 8,
      },
      displayName: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 4,
      },
      email: {
        fontSize: 16,
        color: '#666',
        marginBottom: 8,
      },
      bio: {
        fontSize: 16,
        color: '#444',
        textAlign: 'center',
        marginBottom: 8,
        paddingHorizontal: 32,
      },
      idContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        padding: 8,
        borderRadius: 8,
        marginBottom: 16,
      },
      idText: {
        fontSize: 14,
        color: '#666',
        marginRight: 8,
      },
      statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        paddingHorizontal: 16,
      },
      statItem: {
        alignItems: 'center',
      },
      statNumber: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#4A90E2',
      },
      statLabel: {
        fontSize: 14,
        color: '#666',
      },
      section: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
      },
      sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 12,
      },
      searchInput: {
        backgroundColor: '#f5f5f5',
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
      },
      requestItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
        marginBottom: 8,
      },
      userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
      },
      friendInfo: {
        flex: 1,
      },
      friendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
        marginBottom: 8,
      },
      userName: {
        fontSize: 16,
        fontWeight: '600',
      },
      userEmail: {
        fontSize: 14,
        color: '#666',
      },
      userBio: {
        fontSize: 14,
        color: '#888',
        marginTop: 2,
      },
      acceptButton: {
        backgroundColor: '#4A90E2',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 4,
      },
      buttonText: {
        color: 'white',
        fontWeight: 'bold',
      },
      emptyText: {
        textAlign: 'center',
        color: '#666',
        fontStyle: 'italic',
        padding: 16,
      },
      modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
      },
      modalContent: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 24,
        width: '90%',
        maxWidth: 400,
      },
      modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
      },
      modalInput: {
        backgroundColor: '#f5f5f5',
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
      },
      bioInput: {
        height: 100,
        textAlignVertical: 'top',
      },
      modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 16,
      },
      modalButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
        minWidth: 120,
        alignItems: 'center',
      },
      saveButton: {
        backgroundColor: '#4A90E2',
      },
      cancelButton: {
        backgroundColor: '#666',
      },
      modalButtonText: {
        color: 'white',
        fontWeight: 'bold',
        
      },
      birthdate: {
        fontSize: 16,
        color: '#666',
        marginBottom: 8,
      },
      addFriendButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#4A90E2',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginTop: 16,
      },
      addFriendButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        marginLeft: 8,
        
      },actionButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
      },
      deleteButton: {
        padding: 4,
      },
      
});