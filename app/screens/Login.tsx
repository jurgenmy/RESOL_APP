import { View, KeyboardAvoidingView, Text, StyleSheet, TextInput, Button, ActivityIndicator, Image } from 'react-native';
import React, { useState, useEffect } from 'react';
import { FIREBASE_AUTH } from '../../FirebaseConfig';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';

const Login = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  const auth = FIREBASE_AUTH;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        navigation.navigate('Home'); // Navegar a Home si el usuario está autenticado
      } else {
        setUser(null);
      }
    });
    return unsubscribe;
  }, [auth, navigation]);

  const signIn = async () => {
    setLoading(true);
    try {
      const response = await signInWithEmailAndPassword(auth, email, password);
      console.log(response);
    } catch (error: any) {
      console.log(error);
      alert('El inicio de sesión falló por: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async () => {
    setLoading(true);
    try {
      const response = await createUserWithEmailAndPassword(auth, email, password);
      console.log(response);
      alert('Usuario creado con éxito');
    } catch (error: any) {
      console.log(error);
      alert('El registro falló por: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const signOut = () => {
    FIREBASE_AUTH.signOut();
  };

  return (
    <View style={styles.container}>
      <Image source={require('../../applogo.png')} style={styles.logo} />
      <KeyboardAvoidingView behavior='padding'>
        {user ? (
          <>
            <Text>Sesión iniciada como: {user.email}</Text>
            <Button title="Cerrar sesión" onPress={signOut} />
          </>
        ) : (
          <>
            <Text>Iniciar sesión</Text>
            <TextInput
              style={styles.input}
              placeholder="Correo electrónico"
              value={email}
              onChangeText={setEmail}
            />
            <TextInput
              style={styles.input}
              placeholder="Contraseña"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            {loading ? (
              <ActivityIndicator size='large' color='#0000ff' />
            ) : (
              <>
                <Button title="Iniciar sesión" onPress={signIn} />
                <Button title="Registrar usuario" onPress={signUp} />
              </>
            )}
          </>
        )}
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E0FFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 354,
    height: 171,
    marginBottom: 20,
  },
  input: {
    width: '80%',
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
  },
});

export default Login;
