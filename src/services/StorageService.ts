import * as Keychain from 'react-native-keychain';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_KEY_SERVICE = 'groq_api_key';
const LANG_PREFS_KEY = '@language_prefs';

export const saveLanguagePreferences = async (spokenLanguage: string, outputLanguage: string) => {
  try {
    const prefs = JSON.stringify({ spokenLanguage, outputLanguage });
    await AsyncStorage.setItem(LANG_PREFS_KEY, prefs);
    return true;
  } catch (error) {
    console.error('Error saving language preferences:', error);
    return false;
  }
};

export const getLanguagePreferences = async () => {
  try {
    const prefsString = await AsyncStorage.getItem(LANG_PREFS_KEY);
    if (prefsString) {
      return JSON.parse(prefsString);
    }
    // Default fallback
    return { spokenLanguage: 'en', outputLanguage: 'English' };
  } catch (error) {
    console.error('Error retrieving language preferences:', error);
    return { spokenLanguage: 'en', outputLanguage: 'English' };
  }
};

export const saveApiKey = async (key) => {
  try {
    await Keychain.setGenericPassword('groq_user', key, { service: API_KEY_SERVICE });
    return true;
  } catch (error) {
    console.error('Error saving API key:', error);
    return false;
  }
};

export const getApiKey = async () => {
  try {
    const credentials = await Keychain.getGenericPassword({ service: API_KEY_SERVICE });
    if (credentials) {
      return credentials.password;
    }
    return null;
  } catch (error) {
    console.error('Error retrieving API key:', error);
    return null;
  }
};

export const deleteApiKey = async () => {
  try {
    await Keychain.resetGenericPassword({ service: API_KEY_SERVICE });
    return true;
  } catch (error) {
    console.error('Error deleting API key:', error);
    return false;
  }
};
