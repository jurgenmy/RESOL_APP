import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  Image,
  Dimensions
} from 'react-native';
import { FIREBASE_AUTH, FIREBASE_DB } from '../../FirebaseConfig';
import { 
  signInWithEmailAndPassword, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const LoginForm = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [lastEmail, setLastEmail] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    // Recuperar datos almacenados en AsyncStorage
    (async () => {
      const savedEmail = await AsyncStorage.getItem('lastEmail');
      const savedPassword = await AsyncStorage.getItem('lastPassword');
      const rememberValue = await AsyncStorage.getItem('rememberMe');
      
      if (savedEmail && savedPassword && rememberValue === 'true') {
        setEmail(savedEmail);
        setPassword(savedPassword);
      }
      setRememberMe(rememberValue === 'true');
    })();

    // Verificar si hay una sesión activa
    const unsubscribe = onAuthStateChanged(FIREBASE_AUTH, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(FIREBASE_DB, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setProfileImage(userData.photoURL || null);
          }
        } catch (err) {
          console.error('Error fetching user data:', err);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const userCredential = await signInWithEmailAndPassword(FIREBASE_AUTH, email, password);
      
      // Guardar preferencias en AsyncStorage
      if (rememberMe) {
        await AsyncStorage.setItem('lastEmail', email);
        await AsyncStorage.setItem('lastPassword', password);
        await AsyncStorage.setItem('rememberMe', 'true');
      } else {
        await AsyncStorage.removeItem('lastEmail');
        await AsyncStorage.removeItem('lastPassword');
        await AsyncStorage.setItem('rememberMe', 'false');
      }
      
      // Obtener datos del usuario después del login
      const userDoc = await getDoc(doc(FIREBASE_DB, 'users', userCredential.user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setProfileImage(userData.photoURL || null);
      }

      navigation.navigate('Home');
    } catch (err: any) {
      let errorMessage = 'An error occurred during login';
      switch (err.code) {
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed attempts. Please try again later';
          break;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  const handleRememberMeToggle = async () => {
    const newRememberMeValue = !rememberMe;
    setRememberMe(newRememberMeValue);
  
    if (!newRememberMeValue) {
      // Limpiar los campos y mostrar el logo
      setEmail('');
      setPassword('');
      setProfileImage(null);
  
      // Remover los datos almacenados en AsyncStorage
      await AsyncStorage.removeItem('lastEmail');
      await AsyncStorage.removeItem('lastPassword');
      await AsyncStorage.setItem('rememberMe', 'false');
    } else {
      await AsyncStorage.setItem('rememberMe', 'true');
    }
  };
  const handleForgotPassword = () => {
    if (!email.trim()) {
      setError('Please enter your email first');
      return;
    }
    navigation.navigate('ForgotPassword', { email });
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        {profileImage ? (
          <Image 
            source={{ uri: profileImage }} 
            style={styles.profileImage} 
          />
        ) : (
          <Image 
            source={require('../../applogo.png')} 
            style={styles.logo}
          />
        )}
      </View>

      {lastEmail && (
        <Text style={styles.welcomeBack}>
          Welcome back!
        </Text>
      )}

      <View style={styles.formContainer}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            setError('');
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />
        
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            setError('');
          }}
          secureTextEntry
          autoComplete="password"
        />

        <View style={styles.rememberMeContainer}>
          <TouchableOpacity 
            style={styles.checkbox} 
            onPress={handleRememberMeToggle}
          >
            <View style={[
              styles.checkboxInner, 
              rememberMe && styles.checkboxChecked
            ]} />
          </TouchableOpacity>
          <Text style={styles.rememberMeText}>Recuérdame</Text>
        </View>

        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : null}

        {loading ? (
          <ActivityIndicator size="large" color="#0000ff" />
        ) : (
          <>
            <TouchableOpacity 
              style={styles.button} 
              onPress={handleLogin}
            >
              <Text style={styles.buttonText}>Iniciar sesión</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.forgotPassword}
              onPress={handleForgotPassword}
            >
              <Text style={styles.forgotPasswordText}>
                Olvidé mi contraseña
              </Text>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.line} />
              <Text style={styles.orText}>O</Text>
              <View style={styles.line} />
            </View>

            <TouchableOpacity
              style={styles.registerButton}
              onPress={() => navigation.navigate('RegisterUser')}
            >
              <Text style={styles.registerText}>Crear Usuario</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    marginBottom: 30,
    alignItems: 'center',
  },
  logo: {
    width: width * 0.8,
    height: (width * 0.8) * (171/354),
    resizeMode: 'contain',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#007aff',
  },
  welcomeBack: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#007aff',
    borderRadius: 4,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxInner: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  checkboxChecked: {
    backgroundColor: '#007aff',
  },
  rememberMeText: {
    fontSize: 14,
    color: '#666',
  },
  button: {
    backgroundColor: '#007aff',
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  forgotPassword: {
    alignItems: 'center',
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: '#007aff',
    fontSize: 14,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  orText: {
    marginHorizontal: 10,
    color: '#666',
    fontSize: 14,
  },
  registerButton: {
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#007aff',
  },
  registerText: {
    color: '#007aff',
    fontSize: 16,
    fontWeight: '500',
  },
  errorText: {
    color: '#ff3b30',
    marginBottom: 15,
    textAlign: 'center',
  },
});

export default LoginForm;