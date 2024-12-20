import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import PhoneAuthScreen from './src/screens/PhoneAuthScreen';
import OTPVerificationScreen from './src/screens/OTPVerificationScreen';
import SignupScreen from './src/screens/SignupScreen';
import GroupListScreen from './src/screens/GroupListScreen';
import CreateGroupScreen from './src/screens/CreateGroupScreen';
import ChatScreen from './src/screens/ChatScreen';
import ContactSelectionScreen from './src/screens/ContactSelectionScreen';
import {ActivityIndicator, View} from 'react-native';
import {AuthProvider, useAuth} from './src/context/AuthContext';

const Stack = createNativeStackNavigator();

function AppNavigator() {
  const {isLoading, userSession} = useAuth();

  if (isLoading) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <ActivityIndicator size="large" color="#4c669f" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {!userSession ? (
          // Auth Stack
          <>
            <Stack.Screen 
              name="PhoneAuth" 
              component={PhoneAuthScreen}
              options={{headerShown: false}}
            />
            <Stack.Screen 
              name="OTPVerification" 
              component={OTPVerificationScreen}
              options={{headerShown: false}}
            />
            <Stack.Screen 
              name="Signup" 
              component={SignupScreen}
              options={{headerShown: false}}
            />
          </>
        ) : (
          // Main App Stack
          <>
            <Stack.Screen 
              name="GroupList" 
              component={GroupListScreen}
              options={{headerShown: false}}
            />
            <Stack.Screen 
              name="CreateGroup" 
              component={CreateGroupScreen}
              options={{headerShown: false}}
            />
            <Stack.Screen 
              name="Chat" 
              component={ChatScreen}
              options={{headerShown: false}}
            />
            <Stack.Screen 
              name="ContactSelection"
              component={ContactSelectionScreen}
              options={{headerShown: false}}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}

export default App; 