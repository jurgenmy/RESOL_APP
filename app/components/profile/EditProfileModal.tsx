import React, { useState, useEffect } from "react";
import { Modal, View, Text, TextInput, TouchableOpacity, ScrollView, Alert, StyleSheet } from "react-native";
import { styles } from "../styles";
import { UserProfile } from "../../types/social";
import { FIREBASE_AUTH } from "../../../FirebaseConfig";
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: Partial<UserProfile>) => void;
  currentProfile: UserProfile | null;
}

interface FormErrors {
  displayName?: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({
  visible,
  onClose,
  onSave,
  currentProfile,
}) => {
  // Form state
  const [displayName, setDisplayName] = useState(currentProfile?.displayName || '');
  const [firstName, setFirstName] = useState(currentProfile?.firstName || '');
  const [lastName, setLastName] = useState(currentProfile?.lastName || '');
  const [bio, setBio] = useState(currentProfile?.bio || '');
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  
  // Validation state
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      resetForm();
    }
  }, [visible, currentProfile]);

  const resetForm = () => {
    setDisplayName(currentProfile?.displayName || '');
    setFirstName(currentProfile?.firstName || '');
    setLastName(currentProfile?.lastName || '');
    setBio(currentProfile?.bio || '');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setErrors({});
    setShowPasswordFields(false);
    setIsSubmitting(false);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!displayName.trim()) {
      newErrors.displayName = 'El nombre de usuario es requerido';
    }

    if (!firstName.trim()) {
      newErrors.firstName = 'El nombre es requerido';
    }

    if (!lastName.trim()) {
      newErrors.lastName = 'El apellido es requerido';
    }

    if (showPasswordFields) {
      if (!currentPassword) {
        newErrors.currentPassword = 'La contraseña actual es requerida';
      }

      if (newPassword) {
        if (newPassword.length < 6) {
          newErrors.newPassword = 'La nueva contraseña debe tener al menos 6 caracteres';
        }

        if (newPassword !== confirmPassword) {
          newErrors.confirmPassword = 'Las contraseñas no coinciden';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePasswordChange = async () => {
    try {
      const user = FIREBASE_AUTH.currentUser;
      if (!user || !user.email) throw new Error('Usuario no autenticado');

      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      
      Alert.alert('Éxito', 'Contraseña actualizada correctamente');
      setShowPasswordFields(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      Alert.alert('Error', 
        error.code === 'auth/wrong-password' 
          ? 'La contraseña actual es incorrecta' 
          : 'Error al actualizar la contraseña'
      );
    }
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setIsSubmitting(true);

    try {
      if (showPasswordFields && newPassword) {
        await handlePasswordChange();
      }

      onSave({
        displayName,
        firstName,
        lastName,
        bio,
      });

      onClose();
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'No se pudo actualizar el perfil');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInputStyle = (fieldName: keyof FormErrors) => {
    return StyleSheet.flatten([
      localStyles.input,
      errors[fieldName] ? localStyles.inputError : null
    ]);
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
          <ScrollView>
            <Text style={styles.modalTitle}>Editar Perfil</Text>

            <TextInput
              style={getInputStyle('displayName')}
              placeholder="Nombre de usuario"
              value={displayName}
              onChangeText={setDisplayName}
            />
            {errors.displayName && (
              <Text style={localStyles.errorText}>{errors.displayName}</Text>
            )}

            <TextInput
              style={getInputStyle('firstName')}
              placeholder="Nombre"
              value={firstName}
              onChangeText={setFirstName}
            />
            {errors.firstName && (
              <Text style={localStyles.errorText}>{errors.firstName}</Text>
            )}

            <TextInput
              style={getInputStyle('lastName')}
              placeholder="Apellido"
              value={lastName}
              onChangeText={setLastName}
            />
            {errors.lastName && (
              <Text style={localStyles.errorText}>{errors.lastName}</Text>
            )}

            <TextInput
              style={[localStyles.input, localStyles.bioInput]}
              placeholder="Biografía"
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={4}
            />

            <TouchableOpacity
              style={localStyles.toggleButton}
              onPress={() => setShowPasswordFields(!showPasswordFields)}
            >
              <Text style={localStyles.toggleButtonText}>
                {showPasswordFields ? 'Cancelar cambio de contraseña' : 'Cambiar contraseña'}
              </Text>
            </TouchableOpacity>

            {showPasswordFields && (
              <>
                <TextInput
                  style={getInputStyle('currentPassword')}
                  placeholder="Contraseña actual"
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  secureTextEntry
                />
                {errors.currentPassword && (
                  <Text style={localStyles.errorText}>{errors.currentPassword}</Text>
                )}

                <TextInput
                  style={getInputStyle('newPassword')}
                  placeholder="Nueva contraseña"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                />
                {errors.newPassword && (
                  <Text style={localStyles.errorText}>{errors.newPassword}</Text>
                )}

                <TextInput
                  style={getInputStyle('confirmPassword')}
                  placeholder="Confirmar nueva contraseña"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />
                {errors.confirmPassword && (
                  <Text style={localStyles.errorText}>{errors.confirmPassword}</Text>
                )}
              </>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={onClose}
                disabled={isSubmitting}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[
                  styles.modalButton, 
                  styles.saveButton,
                  isSubmitting && localStyles.disabledButton
                ]} 
                onPress={handleSave}
                disabled={isSubmitting}
              >
                <Text style={styles.modalButtonText}>
                  {isSubmitting ? 'Guardando...' : 'Guardar'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const localStyles = StyleSheet.create({
  input: {
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#ff0000',
  },
  bioInput: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 8,
  },
  errorText: {
    color: '#ff0000',
    fontSize: 12,
    marginBottom: 8,
    marginTop: -4,
  },
  toggleButton: {
    padding: 12,
    alignItems: 'center',
    marginVertical: 8,
  },
  toggleButtonText: {
    color: '#4A90E2',
    fontWeight: '500',
  },
  disabledButton: {
    opacity: 0.5,
  },
});

export default EditProfileModal;