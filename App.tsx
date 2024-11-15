//App.tsx

import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { User, onAuthStateChanged } from 'firebase/auth';
import { FIREBASE_AUTH } from './FirebaseConfig';

// Screens
import Login from './app/components/Login';
import Home from './app/components/Home';
import RegisterUser from './app/components/RegisterUser';
import CompletedTasks from './app/components/CompletedTasks';
import ProfileScreen from './app/components/profile/ProfileScreen';
import GroupsScreen from './app/components/GroupsScreen';

// Types
export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  RegisterUser: undefined;
  CompletedTasks: undefined;
  Profile: undefined;
  Groups: undefined;
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
              name='Profile' 
              component={ProfileScreen} 
              options={{
                title: 'Perfil',
              }}
            />
            <Stack.Screen 
              name='Groups' 
              component={GroupsScreen} 
              options={{
                title: 'Grupos',
              }}
            />
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
