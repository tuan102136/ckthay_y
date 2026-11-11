import React, {useState} from 'react';
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
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

export default function NewHome({navigation}) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [country, setCountry] = useState('');
  const [county, setCounty] = useState('');
  const [city, setCity] = useState('');
  const [hasError, setHasError] = useState(false);

  const isMissingData = () => {
    return !name || !address || !country || !county || !city;
  };

  const handleSubmit = async () => {
    if (isMissingData()) {
      setHasError(true);
      return;
    }

    setHasError(false);

    try {
      const {uid: userId} = auth().currentUser;

      const homeId = database().ref('/home').push({
        name,
        address,
        country,
        county,
        city,
        owner: userId,
      }).key;

      await database().ref(`/user/${userId}`).update({home: homeId});

      navigation.navigate('Dashboard');
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
          placeholder="Type a name"
          placeholderTextColor="#868686"
          keyboardType="default"
          autoCapitalize="words"
          autoCorrect={false}
          value={name}
          onChangeText={setName}
        />

        <TextInput
          style={styles.input}
          placeholder="Type the address"
          placeholderTextColor="#868686"
          keyboardType="default"
          autoCapitalize="words"
          autoCorrect={false}
          value={address}
          onChangeText={setAddress}
        />

        <TextInput
          style={styles.input}
          placeholder="Type your country name"
          placeholderTextColor="#868686"
          keyboardType="default"
          autoCapitalize="words"
          autoCorrect={false}
          value={country}
          onChangeText={setCountry}
        />

        <TextInput
          style={styles.input}
          placeholder="Type your county/state name"
          placeholderTextColor="#868686"
          keyboardType="default"
          autoCapitalize="words"
          autoCorrect={false}
          value={county}
          onChangeText={setCounty}
        />

        <TextInput
          style={styles.input}
          placeholder="Type your city name"
          placeholderTextColor="#868686"
          keyboardType="default"
          autoCapitalize="words"
          autoCorrect={false}
          value={city}
          onChangeText={setCity}
        />

        {hasError ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              Please, fill in all the fields above.
            </Text>
          </View>
        ) : null}

        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}> Create </Text>
        </TouchableOpacity>
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
    marginTop: 36,
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
});
