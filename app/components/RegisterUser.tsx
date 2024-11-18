//RegisterUser.tsx

import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  Button, 
  StyleSheet, 
  Alert, 
  Image, 
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { FIREBASE_AUTH, FIREBASE_DB } from '../../FirebaseConfig';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';

// Tipos para validación
interface UserData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  birthdate: string;
}

interface ValidationErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  firstName?: string;
  lastName?: string;
  birthdate?: string;
}

const RegisterUser = ({ navigation }: any) => {
  // Estados para el formulario
  const [formData, setFormData] = useState<UserData>({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    birthdate: ''
  });
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});

  // Validadores
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): boolean => {
    // Mínimo 8 caracteres, al menos una letra mayúscula, una minúscula y un número
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
    return passwordRegex.test(password);
  };

  const validateBirthdate = (birthdate: string): boolean => {
    const birthdateRegex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[012])\/(19|20)\d\d$/;
    if (!birthdateRegex.test(birthdate)) return false;
    
    const [day, month, year] = birthdate.split('/').map(Number);
    const date = new Date(year, month - 1, day);
    const now = new Date();
    
    return date < now && (now.getFullYear() - year) >= 13;
  };

  // Manejador de cambios en el formulario
  const handleChange = (field: keyof UserData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpiar error del campo cuando se modifica
    setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  // Validación del formulario completo
  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'El nombre es requerido';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'El apellido es requerido';
    }

    if (!validateEmail(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!validatePassword(formData.password)) {
      newErrors.password = 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    if (!validateBirthdate(formData.birthdate)) {
      newErrors.birthdate = 'Fecha inválida o debe ser mayor de 13 años';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Subida de imagen optimizada
  const uploadImageToImgBB = async (imageUri: string): Promise<string> => {
    const response = await fetch(imageUri);
    const blob = await response.blob();
    
    const formData = new FormData();
    formData.append('image', blob, 'profile.jpg');

    try {
      const { data } = await axios.post('https://api.imgbb.com/1/upload', formData, {
        params: { key: process.env.EXPO_PUBLIC_IMGBB_API_KEY },
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      return data.data.url;
    } catch (error) {
      throw new Error('Error al subir la imagen');
    }
  };

  // Selector de imagen mejorado
  const handlePickImage = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Error', 'Se requiere permiso para acceder a la galería');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7, // Controla la calidad de la imagen.
      });
      

      if (!result.canceled && result.assets[0].uri) {
        setLoading(true);
        const imageUrl = await uploadImageToImgBB(result.assets[0].uri);
        setProfileImage(imageUrl);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo cargar la imagen');
    } finally {
      setLoading(false);
    }
  }, []);

  // Registro de usuario mejorado
  const handleRegister = async () => {
    if (!validateForm()) {
      Alert.alert('Error', 'Por favor corrija los errores en el formulario');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        FIREBASE_AUTH,
        formData.email,
        formData.password
      );

      const user = userCredential.user;
      const displayName = `${formData.firstName} ${formData.lastName}`;

      // Actualizar perfil de autenticación
      await updateProfile(user, {
        displayName,
        photoURL: profileImage
      });

      // Crear documento en Firestore
      await setDoc(doc(FIREBASE_DB, "users", user.uid), {
        uid: user.uid,
        email: formData.email,
        displayName,
        firstName: formData.firstName,
        lastName: formData.lastName,
        birthdate: formData.birthdate,
        photoURL: profileImage,
        bio: '',
        friends: [],
        pendingFriends: [],
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        isOnline: true,
        settings: {
          notifications: true,
          privacy: 'public'
        }
      });

      Alert.alert(
        'Registro exitoso',
        'Tu cuenta ha sido creada correctamente',
        [{ text: 'OK', onPress: () => navigation.navigate('Home') }]
      );
    } catch (error: any) {
      let errorMessage = 'Error al crear la cuenta';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Este email ya está registrado';
      }
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Registro de Usuario</Text>

        <TouchableOpacity 
          onPress={handlePickImage}
          disabled={loading}
          style={styles.imageContainer}
        >
          {loading ? (
            <ActivityIndicator size="large" color="#007aff" />
          ) : (
            <>
              <Image 
                source={profileImage ? { uri: profileImage } : require('../../default-profile.png')} 
                style={styles.profileImage} 
              />
              <Text style={styles.uploadText}>
                {profileImage ? 'Cambiar foto' : 'Seleccionar foto de perfil'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.form}>
  <TextInput
    style={[styles.input, errors.firstName ? styles.inputError : null]}
    placeholder="Nombre"
    value={formData.firstName}
    onChangeText={(value) => handleChange('firstName', value)}
    editable={!loading}
  />
  {errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}

  <TextInput
    style={[styles.input, errors.lastName ? styles.inputError : null]}
    placeholder="Apellido"
    value={formData.lastName}
    onChangeText={(value) => handleChange('lastName', value)}
    editable={!loading}
  />
  {errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}

  <TextInput
    style={[styles.input, errors.email ? styles.inputError : null]}
    placeholder="Correo Electrónico"
    value={formData.email}
    onChangeText={(value) => handleChange('email', value)}
    keyboardType="email-address"
    autoCapitalize="none"
    editable={!loading}
  />
  {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

  <TextInput
  style={[styles.input, errors.birthdate ? styles.inputError : null]}
  placeholder="Fecha de Nacimiento (DD/MM/AAAA)"
  value={formData.birthdate}
  onChangeText={(value) => handleChange('birthdate', value)}
  keyboardType="default"
  editable={!loading}
/>

  {errors.birthdate && <Text style={styles.errorText}>{errors.birthdate}</Text>}

  <TextInput
    style={[styles.input, errors.password ? styles.inputError : null]}
    placeholder="Contraseña"
    value={formData.password}
    onChangeText={(value) => handleChange('password', value)}
    secureTextEntry
    editable={!loading}
  />
  {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

  <TextInput
    style={[styles.input, errors.confirmPassword ? styles.inputError : null]}
    placeholder="Confirmar Contraseña"
    value={formData.confirmPassword}
    onChangeText={(value) => handleChange('confirmPassword', value)}
    secureTextEntry
    editable={!loading}
  />
  {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
</View>

<View style={styles.buttonContainer}>
  <Button
    title={loading ? 'Registrando...' : 'Registrar'}
    onPress={handleRegister}
    disabled={loading}
    color="#007aff"
  />
  <Button
    title="Volver al Login"
    onPress={() => navigation.navigate('Login')}
    disabled={loading}
    color="#007aff"
  />
</View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 40
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 20,
    textAlign: 'center',
    color: '#333'
  },
  form: {
    width: '100%'
  },
  input: {
    height: 45,
    borderColor: '#ddd',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    fontSize: 16
  },
  inputError: {
    borderColor: '#ff3b30'
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 12,
    marginBottom: 10,
    marginLeft: 5
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 20
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#ddd'
  },
  uploadText: {
    marginTop: 8,
    color: '#007aff',
    fontSize: 16
  }
});

export default RegisterUser;