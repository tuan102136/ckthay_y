import React, {useState} from 'react';
import database from '@react-native-firebase/database';
import auth from '@react-native-firebase/auth';
import {
  StyleSheet,
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
} from 'react-native';

export default function RoomModal({isVisible, setIsVisible, handleNewRoom}) {
  const [name, setName] = useState('');

  const handleSubmit = async () => {
    handleNewRoom('LOADING');

    const {uid: userId} = auth().currentUser;

    const userSnap = await database().ref(`/user/${userId}`).once('value');
    const {home} = userSnap.val();

    const roomId = database().ref('/room').push({name, home}).key;

    const roomsSnap = await database().ref(`/home/${home}/rooms`).once('value');
    const rooms = roomsSnap.val() || [];

    await database()
      .ref(`/home/${home}/rooms`)
      .set([...rooms, roomId]);

    handleNewRoom('DONE');
    setIsVisible(false);
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={() => {}}>
      <View style={styles.background}>
        <View style={styles.container}>
          <Text style={styles.title}>Room</Text>

          <TextInput
            style={styles.input}
            placeholder="Type the room name"
            placeholderTextColor="#868686"
            keyboardType="default"
            autoCapitalize="words"
            autoCorrect={true}
            value={name}
            onChangeText={setName}
          />

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={{...styles.button, ...styles.confirm}}
              onPress={handleSubmit}>
              <Text style={styles.buttonText}> Create </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{...styles.button, ...styles.cancel}}
              onPress={() => setIsVisible(false)}>
              <Text style={styles.buttonText}> Cancel </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  background: {
    backgroundColor: '#000000DD',
    height: '100%',
    width: '100%',

    justifyContent: 'center',
    alignItems: 'center',
  },

  container: {
    backgroundColor: '#242424',
    borderRadius: 4,
    width: '90%',
    maxHeight: 500,
    position: 'relative',
    padding: 24,
  },

  title: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
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
    marginVertical: 24,
    fontFamily: 'Roboto',
  },

  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  button: {
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },

  confirm: {
    backgroundColor: '#102A43',
  },

  cancel: {
    backgroundColor: 'transparent',
  },

  buttonText: {
    fontWeight: 'bold',
    fontSize: 18,
    fontFamily: 'Roboto',
    color: '#FFF',
  },
});
