import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = 'http://192.1.125.209:8080/api';

const PhoneAuthScreen = ({navigation}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  
  const handleSendOTP = async () => {
    console.log("HJIIUIIHISHAUDHASUDAHD");
    
    if (phoneNumber.length < 10) {  
      setError('Please enter a valid phone number');
      return;
    }
    
    setIsLoading(true);
    setError('');

    //Without Otp
    const userResponse = await fetch(`${API_BASE_URL}/auth/check-user/${phoneNumber}`);
    console.log(userResponse);
    
    const userData = await userResponse.json();
    console.log(userData);
    
    if (userResponse.ok && userData.exists) {
      await login(userData.username);
      navigation.replace('GroupList');
    } 
    else {
      navigation.navigate('Signup', {phoneNumber});
    }
  }
    
  //OTP LOGIN
  //   try {
  //     console.log('Sending OTP request for:', phoneNumber);
  //     const response = await fetch(`${API_BASE_URL}/auth/send-otp`, {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({ phoneNumber }),
  //     });
      
  //     const data = await response.json();
  //     console.log('Response:', data);
      
  //     if (response.ok) {
  //       navigation.navigate('OTPVerification', { phoneNumber });
  //     } else {
  //       setError(data.error || 'Failed to send OTP');
  //       console.error('Error response:', data);
  //     }
  //   } catch (error) {
  //     console.error('Network error:', error);
  //     setError('Network error. Please check your connection and try again.');
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  return (
    <LinearGradient
      colors={['#4c669f', '#3b5998', '#192f6a']}
      style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <Animatable.View
          animation="fadeInUp"
          duration={1000}
          style={styles.content}>
          <Text style={styles.title}>Welcome to Aora</Text>
          <Text style={styles.subtitle}>Enter your phone number to continue</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.prefix}>+91</Text>
            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              maxLength={10}
            />
          </View>

          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : null}
          
          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleSendOTP}
            disabled={isLoading}>
            <Text style={styles.buttonText}>
              {isLoading ? 'Sending...' : 'Send OTP'}
            </Text>
          </TouchableOpacity>
        </Animatable.View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 30,
    opacity: 0.8,
  },
  inputContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  prefix: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 10,
  },
  input: {
    flex: 1,
    padding: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#192f6a',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#ff6b6b',
    textAlign: 'center',
    marginBottom: 10,
  },
});

export default PhoneAuthScreen; 