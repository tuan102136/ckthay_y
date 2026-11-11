import React, {useState} from 'react';
import auth from '@react-native-firebase/auth';
import {
  StyleSheet,
  KeyboardAvoidingView,
  SafeAreaView,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import logo from '../../assets/logo.png';

export default function Login({navigation}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [hasError, setHasError] = useState();

  const handleSubmit = async () => {
    if (!email || !password) {
      return;
    }

    setHasError(false);

    try {
      await auth().signInWithEmailAndPassword(email, password);
    } catch (err) {
      console.log(err.message);
      setHasError(true);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior="padding" style={styles.form}>
        <Image source={logo} style={styles.logo} />

        <TextInput
          style={styles.input}
          placeholder="Type your email"
          placeholderTextColor="#868686"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          style={styles.input}
          placeholder="Type your password"
          placeholderTextColor="#868686"
          keyboardType="default"
          secureTextEntry={true}
          autoCapitalize="none"
          autoCorrect={false}
          value={password}
          onChangeText={setPassword}
        />

        {hasError ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              Error on login. Check your credentials!
            </Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={styles.button}
          disabled={!email || !password}
          onPress={handleSubmit}>
          <Text style={styles.buttonText}> Login </Text>
        </TouchableOpacity>

        <View style={styles.signUpContainer}>
          <Text style={styles.signUpText}>Don't have an account?</Text>
          <TouchableOpacity
            style={styles.signUpButton}
            onPress={() => navigation.navigate('Sign Up')}>
            <Text style={styles.signUpButtonText}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
    alignSelf: 'stretch',
  },

  form: {
    alignSelf: 'stretch',
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
  },

  logo: {
    marginBottom: 56,
  },

  input: {
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#486581',
    color: '#FFFFFF',
    fontSize: 16,
    padding: 16,
    height: 48,
    width: 320,
    borderRadius: 4,
    marginBottom: 24,
    fontFamily: 'Roboto',
  },

  button: {
    width: 320,
    padding: 16,
    backgroundColor: '#102A43',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
    marginTop: 64,
  },

  buttonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 18,
    fontFamily: 'Roboto',
  },

  errorContainer: {
    width: 320,
    padding: 16,
    backgroundColor: '#B00020',
    justifyContent: 'center',
    alignItems: 'center',
  },

  errorText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
    fontFamily: 'Roboto',
  },

  signUpContainer: {
    marginTop: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  signUpText: {
    color: '#fff',
    fontSize: 14,
  },

  signUpButton: {
    backgroundColor: 'transparent',
    marginLeft: 8,
  },

  signUpButtonText: {
    color: '#1e88d4',
    fontSize: 15,
  },
});
