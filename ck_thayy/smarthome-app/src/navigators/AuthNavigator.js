import React, {useState, useEffect} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import auth from '@react-native-firebase/auth';

import AuthContext from '../contexts/auth';

import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import Register from '../pages/Register';
import NewHome from '../pages/NewHome';
import NewDevice from '../pages/NewDevice';

const Stack = createStackNavigator();

function AuthNavigator() {
  const [initializing, setInitializing] = useState(true);
  const [userAuth, setUserAuth] = useState();
  const [isSigningOut, setIsSigningOut] = useState();

  // Handle user state changes
  function onAuthStateChanged(user) {
    setIsSigningOut(!user);

    setUserAuth(user);

    if (initializing) {
      setInitializing(false);
    }
  }

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(onAuthStateChanged);
    return subscriber;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (initializing) {
    return null;
  }

  return (
    <NavigationContainer>
      <AuthContext.Provider value={{user: userAuth}}>
        <Stack.Navigator
          screenOptions={{
            headerStyle: {
              backgroundColor: '#383838',
            },
            headerTitleAlign: 'center',
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}>
          {userAuth === null ? (
            <>
              <Stack.Screen
                name="Sign In"
                component={Login}
                options={{
                  animationTypeForReplace: isSigningOut ? 'pop' : 'push',
                }}
              />
              <Stack.Screen
                name="Sign Up"
                component={Register}
                options={{
                  animationTypeForReplace: 'push',
                }}
              />
            </>
          ) : (
            <>
              <Stack.Screen name="Dashboard" component={Dashboard} />
              <Stack.Screen
                name="Register Home"
                options={{
                  headerLeft: () => null,
                }}
                component={NewHome}
              />
              <Stack.Screen name="Create Device" component={NewDevice} />
            </>
          )}
        </Stack.Navigator>
      </AuthContext.Provider>
    </NavigationContainer>
  );
}

export default AuthNavigator;
