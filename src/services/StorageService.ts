import * as Keychain from 'react-native-keychain';

const API_KEY_SERVICE = 'groq_api_key';

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
