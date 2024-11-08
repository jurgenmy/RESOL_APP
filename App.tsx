//App.tsx

import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { User, onAuthStateChanged } from 'firebase/auth';
import { FIREBASE_AUTH } from './FirebaseConfig';

// Screens
import Login from './app/screens/Login';
import Home from './app/screens/Home';
import RegisterUser from './app/screens/RegisterUser';
import CompletedTasks from './app/screens/CompletedTasks';

// Types
type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  RegisterUser: undefined;
  CompletedTasks: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(FIREBASE_AUTH, (user) => {
      setUser(user);
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName='Login'
        screenOptions={{
          headerStyle: {
            backgroundColor: '#008080',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        {user ? (
          <>
            <Stack.Screen 
              name='Home' 
              options={{ headerShown: false }}
            >
              {(props) => <Home {...props} setUser={setUser} />}
            </Stack.Screen>
            <Stack.Screen 
              name='CompletedTasks' 
              component={CompletedTasks}
              options={{
                title: 'Tareas Finalizadas'
              }}
            />
          </>
        ) : (
          <>
            <Stack.Screen 
              name='Login' 
              component={Login} 
              options={{ headerShown: false }} 
            />
            <Stack.Screen 
              name='RegisterUser' 
              component={RegisterUser}
              options={{
                title: 'Registro de Usuario',
                headerStyle: {
                  backgroundColor: '#008080',
                },
                headerTintColor: '#fff',
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}