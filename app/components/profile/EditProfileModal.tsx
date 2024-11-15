// EditProfileModal.tsx

import React, { useState } from "react";
import { Modal, View, Text, TextInput, TouchableOpacity } from "react-native";
import { styles } from "../styles";
import { UserProfile } from "../../types/social";

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: Partial<UserProfile>) => void;
  currentProfile: UserProfile | null;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({
  visible,
  onClose,
  onSave,
  currentProfile,
}) => {
  const [displayName, setDisplayName] = useState(currentProfile?.displayName || '');
  const [bio, setBio] = useState(currentProfile?.bio || '');

  const handleSave = () => {
    onSave({
      displayName,
      bio,
    });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Editar Perfil</Text>

          <TextInput
            style={styles.modalInput}
            placeholder="Nombre de usuario"
            value={displayName}
            onChangeText={setDisplayName}
          />

          <TextInput
            style={[styles.modalInput, styles.bioInput]}
            placeholder="Biografía"
            value={bio}
            onChangeText={setBio}
            multiline
            numberOfLines={4}
          />

          <View style={styles.modalButtons}>
            <TouchableOpacity 
              style={[styles.modalButton, styles.cancelButton]} 
              onPress={onClose}
            >
              <Text style={styles.modalButtonText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.modalButton, styles.saveButton]} 
              onPress={handleSave}
            >
              <Text style={styles.modalButtonText}>Guardar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default EditProfileModal;
