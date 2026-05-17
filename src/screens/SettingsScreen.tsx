import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView, Modal, FlatList } from 'react-native';
import { getApiKey, saveApiKey, deleteApiKey, getLanguagePreferences, saveLanguagePreferences } from '../services/StorageService';
import { zip } from 'react-native-zip-archive';
import RNFS from 'react-native-fs';
import { Key, Trash2, Download, Shield, Info, Languages, ChevronDown, Check } from 'lucide-react-native';

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'hi', name: 'Hindi' },
  { code: 'ta', name: 'Tamil' },
  { code: 'ja', name: 'Japanese' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ar', name: 'Arabic' },
  { code: 'ru', name: 'Russian' },
];

const SettingsScreen = ({ navigation }) => {
  const [apiKey, setApiKey] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [spokenLang, setSpokenLang] = useState('en');
  const [outputLang, setOutputLang] = useState('English');
  const [modalVisible, setModalVisible] = useState(false);
  const [activePicker, setActivePicker] = useState<'spoken' | 'output' | null>(null);

  useEffect(() => {
    loadKeyAndPrefs();
  }, []);

  const loadKeyAndPrefs = async () => {
    const key = await getApiKey();
    if (key) setApiKey(key);
    
    const prefs = await getLanguagePreferences();
    setSpokenLang(prefs.spokenLanguage);
    setOutputLang(prefs.outputLanguage);
  };

  const handleLanguageSelect = async (lang: typeof LANGUAGES[0]) => {
    if (activePicker === 'spoken') {
      setSpokenLang(lang.code);
      await saveLanguagePreferences(lang.code, outputLang);
    } else if (activePicker === 'output') {
      setOutputLang(lang.name);
      await saveLanguagePreferences(spokenLang, lang.name);
    }
    setModalVisible(false);
  };

  const handleUpdateKey = async () => {
    if (!apiKey.trim()) {
      Alert.alert('Error', 'API Key cannot be empty');
      return;
    }
    const success = await saveApiKey(apiKey);
    if (success) {
      setIsEditing(false);
      Alert.alert('Success', 'API Key updated securely');
    }
  };

  const handleDeleteKey = () => {
    Alert.alert(
      'Delete API Key',
      'Are you sure you want to delete your API key? You will need to re-enter it to record new entries.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            await deleteApiKey();
            navigation.replace('Onboarding');
          }
        }
      ]
    );
  };

  const handleExportData = async () => {
    try {
      const exportPath = `${RNFS.ExternalDirectoryPath}/AudioDiaryExport_${Date.now()}.zip`;
      const dbPath = `${RNFS.DocumentDirectoryPath}/default.realm`; // Default Realm path
      const mediaPath = RNFS.DocumentDirectoryPath;
      
      // We want to zip the database and all recordings
      // In a real app, we should be careful about path structures
      // For this demo, we zip the entire document directory
      const targetZipPath = `${RNFS.DownloadDirectoryPath}/AudioDiary_Backup_${Date.now()}.zip`;
      
      Alert.alert('Exporting', 'Creating backup archive...');
      
      await zip(RNFS.DocumentDirectoryPath, targetZipPath);
      
      Alert.alert('Success', `Backup saved to Downloads folder:\n${targetZipPath}`);
    } catch (err) {
      console.error(err);
      Alert.alert('Export Failed', 'An error occurred while creating the backup.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Groq API Configuration</Text>
        <View style={styles.card}>
          <View style={styles.inputHeader}>
            <Key size={18} color="#94a3b8" />
            <Text style={styles.label}>API Key</Text>
          </View>
          <TextInput
            style={[styles.input, !isEditing && styles.inputDisabled]}
            value={apiKey}
            onChangeText={setApiKey}
            secureTextEntry={!isEditing}
            editable={isEditing}
            placeholder="Enter API Key"
            placeholderTextColor="#64748b"
          />
          <View style={styles.buttonRow}>
            {isEditing ? (
              <>
                <TouchableOpacity style={styles.secondaryButton} onPress={() => setIsEditing(false)}>
                  <Text style={styles.secondaryButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.primaryButton} onPress={handleUpdateKey}>
                  <Text style={styles.primaryButtonText}>Save</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity style={styles.secondaryButton} onPress={() => setIsEditing(true)}>
                <Text style={styles.secondaryButtonText}>Update Key</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteKey}>
          <Trash2 size={20} color="#ef4444" />
          <Text style={styles.deleteButtonText}>Delete API Key</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Language Preferences</Text>
        <View style={styles.card}>
          <TouchableOpacity 
            style={styles.dropdownButton}
            onPress={() => { setActivePicker('spoken'); setModalVisible(true); }}
          >
            <View style={styles.dropdownHeader}>
              <Languages size={18} color="#94a3b8" />
              <Text style={styles.label}>I will speak in</Text>
            </View>
            <View style={styles.dropdownValue}>
              <Text style={styles.dropdownText}>
                {LANGUAGES.find(l => l.code === spokenLang)?.name || 'English'}
              </Text>
              <ChevronDown size={18} color="#94a3b8" />
            </View>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity 
            style={styles.dropdownButton}
            onPress={() => { setActivePicker('output'); setModalVisible(true); }}
          >
            <View style={styles.dropdownHeader}>
              <Languages size={18} color="#94a3b8" />
              <Text style={styles.label}>Save diary in</Text>
            </View>
            <View style={styles.dropdownValue}>
              <Text style={styles.dropdownText}>{outputLang}</Text>
              <ChevronDown size={18} color="#94a3b8" />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Management</Text>
        <TouchableOpacity style={styles.actionCard} onPress={handleExportData}>
          <View style={styles.actionIcon}>
            <Download size={24} color="#38bdf8" />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Export All Data</Text>
            <Text style={styles.actionSubtitle}>Backup database and recordings to ZIP</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Privacy & Security</Text>
        <View style={styles.infoCard}>
          <Shield size={20} color="#10b981" />
          <Text style={styles.infoText}>
            All your audio files and transcripts are stored locally on your device. We use your Groq API key directly to provide privacy-first AI features.
          </Text>
        </View>
        <View style={styles.infoCard}>
          <Info size={20} color="#38bdf8" />
          <Text style={styles.infoText}>
            Audio Diary v1.0.0 (Serverless)
          </Text>
        </View>
      </View>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Select {activePicker === 'spoken' ? 'Spoken Language' : 'Output Language'}
            </Text>
            <FlatList
              data={LANGUAGES}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => {
                const isSelected = activePicker === 'spoken' ? spokenLang === item.code : outputLang === item.name;
                return (
                  <TouchableOpacity 
                    style={styles.languageItem}
                    onPress={() => handleLanguageSelect(item)}
                  >
                    <Text style={[styles.languageItemText, isSelected && styles.languageItemTextSelected]}>
                      {item.name}
                    </Text>
                    {isSelected && <Check size={20} color="#38bdf8" />}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    padding: 16,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 12,
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  input: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 12,
    color: '#f8fafc',
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  inputDisabled: {
    opacity: 0.6,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  primaryButton: {
    backgroundColor: '#38bdf8',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginLeft: 12,
  },
  primaryButtonText: {
    color: '#0f172a',
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  secondaryButtonText: {
    color: '#f8fafc',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    padding: 12,
  },
  deleteButtonText: {
    color: '#ef4444',
    fontWeight: '600',
    marginLeft: 8,
  },
  actionCard: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  actionIcon: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    padding: 12,
    borderRadius: 12,
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionSubtitle: {
    color: '#94a3b8',
    fontSize: 13,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  infoText: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 18,
    marginLeft: 12,
    flex: 1,
  },
  dropdownButton: {
    paddingVertical: 8,
  },
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dropdownValue: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  dropdownText: {
    color: '#f8fafc',
    fontSize: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#334155',
    marginVertical: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '70%',
  },
  modalTitle: {
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  languageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  languageItemText: {
    color: '#94a3b8',
    fontSize: 16,
  },
  languageItemTextSelected: {
    color: '#38bdf8',
    fontWeight: 'bold',
  },
});

export default SettingsScreen;
