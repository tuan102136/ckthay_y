import React from 'react';
import {StatusBar} from 'react-native';
import AuthNavigator from './navigators/AuthNavigator';

const App = () => {
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#38383800" />
      <AuthNavigator />
    </>
  );
};

export default App;
