//RegisterUser.tsx

import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, Image, TouchableOpacity } from 'react-native';
import { FIREBASE_AUTH, FIREBASE_DB } from '../../FirebaseConfig';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { collection, addDoc } from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { UserService } from '../services/UserService';

const RegisterUser = ({ navigation }: any) => {
  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      Alert.alert("Error", "Las contraseñas no coinciden");
      return;
    }
    if (!name || !lastName || !email || !birthdate || !password) {
      Alert.alert("Error", "Por favor complete todos los campos");
      return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(FIREBASE_AUTH, email, password);
      const user = userCredential.user;

      if (profileImage) {
        await updateProfile(user, { photoURL: profileImage });
      }

      await addDoc(collection(FIREBASE_DB, "users"), {
        name,
        lastName,
        email,
        birthdate,
        photoURL: profileImage || null,
      });

      Alert.alert("Registro exitoso", "Usuario registrado correctamente");
      navigation.navigate('Login');
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  const handlePickImage = async () => {
    try {
      // Solicitar permisos
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Error', 'Se requiere permiso de acceso a la galería');
        return;
      }
  
      // Lanzar selector de imágenes
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
  
      if (!result.canceled) { // Nota: ahora es 'canceled' en lugar de 'cancelled'
        // Crear el objeto blob desde la URI
        const response = await fetch(result.assets[0].uri);
        const blob = await response.blob();
  
        // Crear FormData
        const formData = new FormData();
        formData.append('image', {
          uri: result.assets[0].uri,
          type: 'image/jpeg',
          name: 'profile.jpg',
        });
  
        // Configurar la petición
        const config = {
          method: 'post',
          url: 'https://api.imgbb.com/1/upload',
          params: {
            key: process.env.EXPO_PUBLIC_IMGBB_API_KEY, // Usar variable de entorno
          },
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'multipart/form-data',
          },
          data: formData,
        };
  
        // Realizar la petición
        const uploadResponse = await axios(config);
  
        if (uploadResponse.data && uploadResponse.data.data.url) {
          setProfileImage(uploadResponse.data.data.url);
          Alert.alert('Éxito', 'Imagen cargada exitosamente');
        } else {
          throw new Error('No se recibió URL de la imagen');
        }
      }
    } catch (error) {
      console.error('Error detallado:', error);
      Alert.alert(
        'Error',
        'No se pudo cargar la imagen. Por favor, intenta nuevamente.'
      );
    }
    const handleRegister = async () => {
      try {
        const userCredential = await createUserWithEmailAndPassword(
          FIREBASE_AUTH,
          email,
          password
        );
        
        if (userCredential.user) {
          await UserService.createUserProfile(
            userCredential.user.uid,
            userCredential.user.email || ''
          );
        }
      } catch (error) {
        console.error(error);
        Alert.alert('Error', 'No se pudo crear el usuario');
      }
    };
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Registro de Usuario</Text>

      {profileImage ? (
        <Image source={{ uri: profileImage }} style={styles.profileImage} />
      ) : (
        <TouchableOpacity onPress={handlePickImage}>
          <Image source={require('../../assets/default-profile.png')} style={styles.profileImage} />
          <Text style={styles.uploadText}>Seleccionar foto de perfil</Text>
        </TouchableOpacity>
      )}

      <TextInput style={styles.input} placeholder="Nombre" value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="Apellido" value={lastName} onChangeText={setLastName} />
      <TextInput style={styles.input} placeholder="Correo Electrónico" value={email} onChangeText={setEmail} />
      <TextInput style={styles.input} placeholder="Fecha de Nacimiento (DD/MM/AAAA)" value={birthdate} onChangeText={setBirthdate} />
      <TextInput style={styles.input} placeholder="Contraseña" secureTextEntry value={password} onChangeText={setPassword} />
      <TextInput style={styles.input} placeholder="Confirmar Contraseña" secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} />
      <View style={styles.buttonContainer}>
        <Button title="Registrar" onPress={handleRegister} color='#007aff' />
        <Button title="Volver al Login" onPress={() => navigation.navigate('Login')} color='#007aff' />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    padding: 20 
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    marginBottom: 20, 
    textAlign: 'center' 
  },
  input: { 
    height: 40, 
    borderColor: 'gray', 
    borderWidth: 1, 
    marginBottom: 10, 
    paddingHorizontal: 10, 
    backgroundColor: '#fff',
    borderRadius: 5
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignSelf: 'center',
    marginBottom: 20,
  },
  uploadText: {
    textAlign: 'center',
    color: '#4682B4',
    marginTop: 5,
  },
});

export default RegisterUser;
