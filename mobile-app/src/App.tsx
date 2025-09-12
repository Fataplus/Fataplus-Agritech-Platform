/**
 * Fataplus Mobile App
 * Multi-context SaaS platform for African agriculture
 */

import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  TouchableOpacity,
} from 'react-native';

import {
  Colors,
} from 'react-native/Libraries/NewAppScreen';
import LocalLLMView from './components/LocalLLMView';

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  const [showLocalLLM, setShowLocalLLM] = useState(false);

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

  if (showLocalLLM) {
    return <LocalLLMView onBack={() => setShowLocalLLM(false)} />;
  }

  return (
    <SafeAreaView style={backgroundStyle}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={backgroundStyle}>
        <View
          style={{
            backgroundColor: isDarkMode ? Colors.black : Colors.white,
          }}>
          <Text style={styles.sectionTitle}>Fataplus Mobile</Text>
          <Text style={styles.sectionDescription}>
            Multi-context SaaS platform for African agriculture
          </Text>
          
          <View style={styles.featureContainer}>
            <Text style={styles.featureTitle}>Offline AI Assistant</Text>
            <Text style={styles.featureDescription}>
              Access agricultural AI assistance even without internet connectivity
            </Text>
            <TouchableOpacity 
              style={styles.featureButton}
              onPress={() => setShowLocalLLM(true)}
            >
              <Text style={styles.featureButtonText}>Try Offline AI</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.featureContainer}>
            <Text style={styles.featureTitle}>Farm Management</Text>
            <Text style={styles.featureDescription}>
              Track crops, livestock, and farm operations
            </Text>
          </View>
          
          <View style={styles.featureContainer}>
            <Text style={styles.featureTitle}>Market Intelligence</Text>
            <Text style={styles.featureDescription}>
              Get real-time market prices and trading opportunities
            </Text>
          </View>
          
          <View style={styles.featureContainer}>
            <Text style={styles.featureTitle}>Weather Forecasting</Text>
            <Text style={styles.featureDescription}>
              Receive weather alerts and farming recommendations
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 32,
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: 32,
  },
  featureContainer: {
    padding: 24,
    margin: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  featureButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  featureButtonText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 16,
  },
});

export default App;