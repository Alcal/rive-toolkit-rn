/**
 * Example app — uses rive-toolkit-rn from the parent package (file:..)
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { RiveAnimation } from 'rive-toolkit-rn';

// Optional: use a public Rive sample (replace with your own .riv URL or require(localFile))
const SAMPLE_RIVE_URL =
  'https://cdn.rive.app/animations/vehicles.riv';

function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top']}>
        <Text style={styles.title}>rive-toolkit-rn Example</Text>
        <Text style={styles.subtitle}>Local package (file:..)</Text>
        <View style={styles.animationContainer}>
          <RiveAnimation
            source={SAMPLE_RIVE_URL}
            autoPlay
            style={styles.animation}
          />
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#eee',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  animationContainer: {
    flex: 1,
    marginTop: 24,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#16213e',
  },
  animation: {
    flex: 1,
  },
});

export default App;
