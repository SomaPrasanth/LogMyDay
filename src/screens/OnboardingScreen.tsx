import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { saveApiKey } from '../services/StorageService';
import { Key, ShieldCheck, ArrowRight } from 'lucide-react-native';

const OnboardingScreen = ({ navigation }) => {
  const [apiKey, setApiKey] = useState('');

  const [isValidating, setIsValidating] = useState(false);

  const handleStart = async () => {
    const trimmedKey = apiKey.trim();
    if (!trimmedKey) {
      Alert.alert('Error', 'Please enter your Gemini API Key');
      return;
    }

    setIsValidating(true);
    try {
      // Validate key with a simple request to Groq
      const response = await fetch('https://api.groq.com/openai/v1/models', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${trimmedKey}` },
      });

      const data = await response.json();

      console.log('Groq Validation Response:', JSON.stringify(data, null, 2));

      if (!response.ok) {
        let errorMsg = 'Your API key is invalid or suspended.';
        
        if (response.status === 401) {
          errorMsg = 'API key not valid. Please check for typos or regenerate the key in Groq Console.';
        } else if (response.status === 403) {
          errorMsg = 'Access Denied (403): Your API key is restricted.';
        } else if (data.error?.message) {
          errorMsg = `Groq Error: ${data.error.message}`;
        }
        
        console.warn('API VALIDATION FAILED:', data.error);

        Alert.alert(
          'Validation Failed',
          errorMsg + '\n\nDo you want to save this key and proceed anyway?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Save Anyway',
              style: 'destructive',
              onPress: async () => {
                const success = await saveApiKey(trimmedKey);
                if (success) {
                  navigation.replace('Home');
                } else {
                  Alert.alert('Error', 'Failed to save API key securely.');
                }
              }
            }
          ]
        );
        return; // Wait for user choice
      }

      const success = await saveApiKey(trimmedKey);
      if (success) {
        navigation.replace('Home');
      } else {
        throw new Error('Failed to save API key securely.');
      }
    } catch (err) {
      Alert.alert('Validation Error', err.message);
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <ShieldCheck size={64} color="#38bdf8" />
        </View>
        <Text style={styles.title}>Welcome to Audio Diary</Text>
        <Text style={styles.subtitle}>
          Your thoughts are private. We use your Groq API key to transcribe locally. No data ever leaves your device except to the Groq API.
        </Text>

        <View style={styles.inputContainer}>
          <Key size={20} color="#94a3b8" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Enter Groq API Key"
            placeholderTextColor="#64748b"
            value={apiKey}
            onChangeText={setApiKey}
            secureTextEntry
          />
        </View>

        <TouchableOpacity
          style={[styles.button, isValidating && styles.buttonDisabled]}
          onPress={handleStart}
          disabled={isValidating}
        >
          {isValidating ? (
            <ActivityIndicator color="#0f172a" />
          ) : (
            <>
              <Text style={styles.buttonText}>Get Started</Text>
              <ArrowRight size={20} color="#0f172a" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  iconContainer: {
    marginBottom: 32,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    padding: 20,
    borderRadius: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 48,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 24,
    width: '100%',
    borderWidth: 1,
    borderColor: '#334155',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#f8fafc',
    height: 50,
    fontSize: 16,
  },
  button: {
    flexDirection: 'row',
    backgroundColor: '#38bdf8',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  buttonText: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  buttonDisabled: {
    backgroundColor: '#64748b',
    opacity: 0.7,
  },
});

export default OnboardingScreen;
