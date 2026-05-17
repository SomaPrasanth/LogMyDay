import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RealmProvider } from './src/models/Schema';
import AppNavigator from './src/navigation/AppNavigator';
import 'react-native-gesture-handler';

function App() {
  return (
    <SafeAreaProvider>
      <RealmProvider>
        <StatusBar barStyle="light-content" backgroundColor="#1e293b" />
        <AppNavigator />
      </RealmProvider>
    </SafeAreaProvider>
  );
}

export default App;
