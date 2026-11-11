import React, {useEffect, useState} from 'react';
import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  NativeModules,
  NativeEventEmitter,
  Platform,
  PermissionsAndroid,
  View,
  Image,
  TextInput,
  Alert,
} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import Icon from 'react-native-remix-icon';
import BleManager from 'react-native-ble-manager';
import {Buffer} from 'buffer';
import {stringToBytes} from 'convert-string';
import database from '@react-native-firebase/database';
import LoadingModal from '../../components/LoadingModal';

const boardService = '5617df76-39f3-44b0-aa1b-c8e71e4caeba';
const boardCharacteristic = '564c9b11-b549-4af0-9675-75225dba6db2';

const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

const deviceTypes = [
  {
    type: 'temperature',
    name: 'Temperature Sensor',
    icon: 'ri-temp-cold-line',
    unit: 'ºC',
  },
  {
    type: 'light',
    name: 'Light Level Sensor',
    icon: 'ri-sun-line',
    unit: '%',
  },
  {
    type: 'relay',
    name: 'Relay Actuator',
    icon: 'ri-plug-line',
    unit: null,
  },
];

export default function NewDevice({route, navigation}) {
  const [selectedType, setSelectedType] = useState('');
  const [selectedDevice, setSelectedDevice] = useState();
  const [isScanning, setIsScanning] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isWriting, setIsWriting] = useState(false);
  const [isLoadingSSIDs, setIsLoadingSSIDs] = useState(false);
  const [devicesList, setDevicesList] = useState([]);
  const [availableSsids, setAvailableSsids] = useState([]);
  const [ssid, setSsid] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    BleManager.start({showAlert: false});

    bleManagerEmitter.addListener('BleManagerStopScan', handleStopScan);
    bleManagerEmitter.addListener(
      'BleManagerDiscoverPeripheral',
      handleDiscoverDevice,
    );
    bleManagerEmitter.addListener(
      'BleManagerDisconnectPeripheral',
      handleDisconnectedDevice,
    );

    if (Platform.OS === 'android' && Platform.Version >= 23) {
      PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ).then(hasPermission => {
        if (hasPermission) {
          startScan();
        } else {
          PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          ).then(result => {
            if (result) {
              startScan();
            }
          });
        }
      });
    }

    return () => {
      bleManagerEmitter.removeListener('BleManagerStopScan', handleStopScan);
      bleManagerEmitter.removeListener(
        'BleManagerDiscoverPeripheral',
        handleDiscoverDevice,
      );
      bleManagerEmitter.removeListener(
        'BleManagerDisconnectPeripheral',
        handleDisconnectedDevice,
      );
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedDevice && selectedDevice.name) {
      const deviceTypeName = selectedDevice.name.replace('SmartHome: ', '');
      const deviceType = deviceTypes.find(
        type => type.type === deviceTypeName.toLowerCase(),
      );

      if (deviceType) {
        setSelectedType(deviceType.type);
      }
    }
  }, [selectedDevice]);

  const getDeviceOnList = deviceId => {
    return devicesList.find(({id}) => {
      return deviceId === id;
    });
  };

  const startScan = async () => {
    if (!isScanning) {
      setDevicesList([]);
      setSelectedDevice(null);
      setSelectedType('');

      try {
        await BleManager.scan([], 10, false);
        setIsScanning(true);
      } catch (error) {
        console.error(error);
      }
    }
  };

  const handleStopScan = () => {
    setIsScanning(false);
  };

  const handleDisconnectedDevice = ({peripheral: deviceId}) => {
    setDevicesList(devicesList.filter(({id}) => deviceId !== id));
  };

  const handleDiscoverDevice = device => {
    if (
      !device.name ||
      !device.name.includes('SmartHome:') ||
      !device.advertising.isConnectable
    ) {
      return;
    }

    const deviceOnList = getDeviceOnList(device.id);

    if (!deviceOnList) {
      setDevicesList([...devicesList, device]);
    }
  };

  const connectToDevice = async device => {
    setIsLoadingSSIDs(true);

    await BleManager.connect(device.id);
    const deviceData = await BleManager.retrieveServices(device.id);

    const deviceOnList = getDeviceOnList(device.id);

    const hasService = deviceData.services.find(
      service => service.uuid === boardService,
    );

    const hasCharacteristic = deviceData.characteristics.find(
      characteristic => characteristic.characteristic === boardCharacteristic,
    );

    if (deviceOnList && hasService && hasCharacteristic) {
      setDevicesList(
        devicesList.map(item => {
          if (item.id === device.id) {
            return {
              ...item,
              connected: true,
            };
          } else {
            return item;
          }
        }),
      );

      readDeviceData(device.id);
    } else {
      setIsLoadingSSIDs(false);
    }
  };

  const readDeviceData = async deviceId => {
    try {
      const readData = await BleManager.read(
        deviceId,
        boardService,
        boardCharacteristic,
      );

      const buffer = Buffer.from(readData);
      const response = JSON.parse(buffer.toString().replace(',]', ']'));
      const {error, ssids} = response || {};

      if (error) {
        throw new Error('Error loading available networks.');
      } else if (!ssids || !ssids.length) {
        throw new Error('There is no available networks.');
      }

      setAvailableSsids(ssids);
      setSsid(ssids[0]);
      setIsLoadingSSIDs(false);
    } catch (error) {
      setIsLoadingSSIDs(false);
      console.log(error);

      Alert.alert('Error', error.message, [
        {
          text: 'Try again',
          onPress: () => {},
        },
      ]);
    }
  };

  const writeDeviceData = async () => {
    const deviceId = selectedDevice.id;
    const data = stringToBytes(JSON.stringify({ssid, password}));

    try {
      setIsWriting(true);
      await BleManager.write(
        deviceId,
        boardService,
        boardCharacteristic,
        data,
        512,
      );

      setTimeout(checkSuccessfulConnection, 5000);
    } catch (error) {
      console.log(error);
      setIsWriting(false);

      Alert.alert('Error writing to device', error.message, [
        {
          text: 'Try again',
          onPress: () => {},
        },
      ]);
    }
  };

  const checkSuccessfulConnection = async () => {
    const deviceId = selectedDevice.id;

    let intervalId;
    let tries = 0;

    const checkSuccess = async () => {
      try {
        const readData = await BleManager.read(
          deviceId,
          boardService,
          boardCharacteristic,
        );

        const buffer = Buffer.from(readData);
        const response = JSON.parse(buffer.toString().replace(',]', ']'));
        const {key, connected} = response || {};

        tries += 1;

        if (connected) {
          handleSuccess(key);
          clearInterval(intervalId);
        } else if (tries > 5) {
          clearInterval(intervalId);
          throw new Error('Error connecting to the selected network.');
        }
      } catch (error) {
        setIsWriting(false);
        console.log(error);

        Alert.alert('Error', error.message, [
          {
            text: 'Try again',
            onPress: () => {
              setPassword('');
            },
          },
        ]);
      }
    };

    intervalId = setInterval(checkSuccess, 2000);
  };

  const handleSuccess = async deviceId => {
    setIsWriting(false);
    setIsCreating(true);
    const {room} = route.params;

    const roomRef = database().ref(`/room/${room}`);
    const roomSnap = await roomRef.once('value');
    const {devices} = roomSnap.val();

    if (!devices || !devices.includes(deviceId)) {
      const {name, unit} = deviceTypes.find(type => type.type === selectedType);

      await database().ref(`/device/${deviceId}`).set({
        type: selectedType,
        name,
        unit,
        room,
      });

      await roomRef.update({
        devices: [...(devices || []), deviceId],
      });

      setIsCreating(false);
      navigation.navigate('Dashboard');
    } else {
      setIsCreating(false);

      Alert.alert('Error', 'This device was already added to this room.', [
        {
          text: 'Cancel',
          onPress: () => {
            setIsCreating(false);
            navigation.navigate('Dashboard');
          },
        },
      ]);
    }
  };

  const DevicesList = () => (
    <FlatList
      style={styles.devicesContainer}
      data={devicesList}
      keyExtractor={item => item.id}
      renderItem={({item}) => (
        <TouchableOpacity
          style={[
            styles.device,
            selectedDevice && selectedDevice.id === item.id
              ? styles.deviceActive
              : null,
          ]}
          key={item.id}
          activeOpacity={1}
          onPress={() => {
            setSelectedDevice(item);
            connectToDevice(item);
          }}
          disabled={isLoadingSSIDs}>
          <Text style={styles.deviceName}>{item.name}</Text>
          <Text style={styles.deviceId}>({item.id})</Text>
        </TouchableOpacity>
      )}
    />
  );

  const LoadingDevicesWrapper = () => (
    <View style={styles.loadingContainer}>
      {isScanning ? (
        <Image
          style={styles.animation}
          source={require('../../assets/loading.gif')}
        />
      ) : (
        <>
          <Text style={[styles.text, styles.noDevices]}>
            No devices were found!
          </Text>

          <TouchableOpacity activeOpacity={0.75} onPress={() => startScan()}>
            <Text style={[styles.text, styles.scanButton]}>
              Click to scan again.
            </Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );

  const DeviceTypeIndicator = () => (
    <>
      <View style={styles.contentRow}>
        <Text style={styles.text}>Device type:</Text>
      </View>
      <View style={styles.deviceTypesWrapper}>
        <FlatList
          data={deviceTypes}
          keyExtractor={type => type.type}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.typesList}
          renderItem={({item}) => (
            <View
              style={[
                styles.icon,
                selectedType === item.type ? styles.iconActive : null,
              ]}
              key={item.type}>
              <Icon
                name={item.icon}
                size="36"
                color={selectedType === item.type ? '#fff' : '#555'}
              />
            </View>
          )}
        />
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contentRow}>
        <Text style={styles.text}>Choose a device:</Text>

        {isScanning || devicesList.length === 0 ? null : (
          <TouchableOpacity activeOpacity={0.75} onPress={() => startScan()}>
            <Text style={[styles.text, styles.scanButton]}>Click to scan</Text>
          </TouchableOpacity>
        )}
      </View>

      {devicesList.length > 0 ? <DevicesList /> : <LoadingDevicesWrapper />}

      {isLoadingSSIDs ? (
        <Image
          style={styles.animation}
          source={require('../../assets/loading.gif')}
        />
      ) : null}

      {devicesList.length > 0 &&
      selectedDevice &&
      selectedType &&
      availableSsids.length &&
      ssid ? (
        <>
          <DeviceTypeIndicator />

          <View style={styles.contentRow}>
            <Text style={styles.text}>Connect it to the Wi-Fi network:</Text>
          </View>

          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={ssid}
              onValueChange={value => setSsid(value)}
              style={styles.input}
              itemStyle={styles.input}>
              {availableSsids.map(networkName => (
                <Picker.Item
                  key={networkName}
                  label={networkName}
                  value={networkName}
                  color="white"
                />
              ))}
            </Picker>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Type your network password"
            placeholderTextColor="#868686"
            keyboardType="default"
            secureTextEntry={true}
            autoCapitalize="none"
            autoCorrect={false}
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity
            style={styles.connectButton}
            disabled={isWriting || !ssid || !password}
            onPress={writeDeviceData}>
            <Text style={styles.connectButtonText}>
              {isWriting ? 'Connecting...' : 'Connect'}
            </Text>
          </TouchableOpacity>
        </>
      ) : null}

      <LoadingModal isVisible={isCreating} message="Creating device" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: '#121212',
    alignSelf: 'stretch',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },

  contentRow: {
    marginHorizontal: 17,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },

  deviceTypesWrapper: {
    height: 70,
    marginBottom: 40,
  },

  typesList: {
    width: '100%',
    justifyContent: 'flex-start',
  },

  icon: {
    marginRight: 16,
    height: 70,
    padding: 16,
    borderRadius: 6,
    borderWidth: 2,
    borderStyle: 'solid',
    borderColor: '#343434',
  },

  iconActive: {
    borderColor: '#FFFFFF',
  },

  text: {
    fontSize: 16,
    color: '#ffffff',
    fontFamily: 'Manrope',
  },

  loadingContainer: {
    width: '100%',
    minHeight: 50,
    flexGrow: 0,
    alignItems: 'center',
    padding: 24,
  },

  devicesContainer: {
    width: '100%',
    minHeight: 50,
    flexGrow: 0,
    backgroundColor: '#232323',
    borderRadius: 4,
    marginHorizontal: 16,
    marginBottom: 40,
  },

  device: {
    alignSelf: 'stretch',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },

  deviceActive: {
    borderColor: '#ffffff',
    borderStyle: 'solid',
    borderWidth: 1,
  },

  deviceName: {
    fontFamily: 'Manrope',
    color: '#ffffff',
    fontSize: 18,
  },

  deviceId: {
    fontFamily: 'Manrope',
    color: '#848484',
    fontSize: 14,
  },

  noDevices: {
    textAlign: 'center',
  },

  scanButton: {
    opacity: 0.75,
    textDecorationLine: 'underline',
  },

  animation: {
    height: 50,
    width: 50,
  },

  input: {
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#486581',
    color: '#FFFFFF',
    fontSize: 16,
    padding: 16,
    height: 48,
    width: '100%',
    borderRadius: 4,
    marginBottom: 16,
    fontFamily: 'Roboto',
  },

  pickerWrapper: {
    width: '100%',
    height: 55,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#486581',
    borderRadius: 4,
  },

  connectButton: {
    width: '100%',
    padding: 12,
    backgroundColor: '#102A43',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
    marginTop: 8,
  },

  connectButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: 'Roboto',
  },
});
