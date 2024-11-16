// AddFriendModal.tsx

import React, { useState } from "react";
import { Modal, View, Text, TextInput, TouchableOpacity } from "react-native";
import { styles } from "../styles"; // Asegúrate de que la ruta del archivo sea correcta

interface AddFriendModalProps {
  visible: boolean;
  onClose: () => void;
  onAddFriend: (email: string) => Promise<void>;
}

const AddFriendModal: React.FC<AddFriendModalProps> = ({
  visible,
  onClose,
  onAddFriend,
}) => {
  const [email, setEmail] = useState('');

  const handleSubmit = async () => {
    if (email.trim() === '') return; // Evita enviar solicitudes en blanco
    await onAddFriend(email);
    setEmail(''); // Limpia el campo de email después de agregar
    onClose(); // Cierra el modal después de enviar la solicitud
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
          <Text style={styles.modalTitle}>Agregar Amigo</Text>
          
          <TextInput
            style={styles.modalInput}
            placeholder="Correo electrónico"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          
          <View style={styles.modalButtons}>
            <TouchableOpacity 
              style={[styles.modalButton, styles.cancelButton]} 
              onPress={() => {
                setEmail('');
                onClose();
              }}
            >
              <Text style={styles.modalButtonText}>Cancelar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modalButton, styles.saveButton]} 
              onPress={handleSubmit}
            >
              <Text style={styles.modalButtonText}>Enviar Solicitud</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
  
  

};


export default AddFriendModal;
