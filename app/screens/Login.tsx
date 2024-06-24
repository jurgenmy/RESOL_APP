import {View, KeyboardAvoidingView , Text, StyleSheet, TextInput, Button, ActivityIndicator} from 'react-native'
import React, {useState} from 'react'
import { FIREBASE_AUTH } from '../../FirebaseConfig';
import { signInWithEmailAndPassword , createUserWithEmailAndPassword } from 'firebase/auth'

const Login = () => {
    const[email,setEmail]= useState('');
    const[password,setPassword]= useState('');
    const[loading,setLoading]= useState(false);
    const auth= FIREBASE_AUTH;

    const signIn = async () => {
        setLoading(true);
        try {
            const response = await signInWithEmailAndPassword(auth, email, password)
            console.log(response);
        } catch (error: any) {
            console.log(error);
            alert('el reguistro fallo por' + error.message);
        } finally{
            setLoading(false);
        }
    }
    const signUp = async () => {
        setLoading(true);
        try {
            const response = await createUserWithEmailAndPassword(auth, email, password)
            console.log(response);
            alert('revisa el mail')
        } catch (error: any) {
            console.log(error);
            alert('el reguistro fallo por' + error.message);
        } finally{
            setLoading(false);
        }
    }

    return (
        <View style={styles.container}>
            <KeyboardAvoidingView behavior='padding'>
            {/* <Button title="Atrás" onPress={onBack} /> */}
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
            { loading ? <ActivityIndicator size='large' color='#0000ff'/>
                : <>
                    <Button title="Iniciar sesión" onPress={signIn} />
                    <Button title="reguistra usuario" onPress={signUp} />
                </>
            }
            </KeyboardAvoidingView>
            {/* <Button title="Iniciar sesión" onPress={handleSignIn} /> */}
        </View>
    );
};
const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#fff',
      alignItems: 'center',
      justifyContent: 'center',
    },
    input: {
      width: '80%',
      height: 40,
      borderColor: 'gray',
      borderWidth: 1,
      marginBottom: 10,
      paddingHorizontal: 10,
    },
  });

export default Login