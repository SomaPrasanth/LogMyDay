import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Switch, Image, ScrollView, Alert } from 'react-native';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import RNFS from 'react-native-fs';
import { useRealm } from '../models/Schema';
import { Realm } from '@realm/react';
import { Camera, Image as ImageIcon, Save, Trash2 } from 'lucide-react-native';

const ReviewEntryScreen = ({ route, navigation }) => {
  const { transcript, summary, audioPath } = route.params;
  const realm = useRealm();
  
  const [editedTranscript, setEditedTranscript] = useState(transcript);
  const [keepAudio, setKeepAudio] = useState(true);
  const [imagePath, setImagePath] = useState<string | null>(null);

  const handleAttachImage = () => {
    Alert.alert('Attach Photo', 'Choose an option', [
      {
        text: 'Camera',
        onPress: () => {
          launchCamera({ mediaType: 'photo' }, handleImagePickerResponse);
        }
      },
      {
        text: 'Gallery',
        onPress: () => {
          launchImageLibrary({ mediaType: 'photo' }, handleImagePickerResponse);
        }
      },
      { text: 'Cancel', style: 'cancel' }
    ]);
  };

  const handleImagePickerResponse = async (response: any) => {
    if (response.didCancel || response.errorCode || !response.assets) {
      return;
    }
    
    const asset = response.assets[0];
    try {
      const fileName = `image_${Date.now()}.jpg`;
      const newPath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
      
      // If it's a content URI, we might need to use RNFS.copyFile (for Android) or copyAssets (iOS)
      // Usually copyFile works if the path starts with file://
      let sourcePath = asset.uri;
      if (sourcePath.startsWith('content://')) {
          sourcePath = await RNFS.stat(asset.uri).then(stat => stat.originalFilepath);
          // Fallback if originalFilepath is not available, we can just use the uri directly with copyFile
          sourcePath = asset.uri; 
      }
      
      await RNFS.copyFile(sourcePath, newPath);
      setImagePath(`file://${newPath}`);
    } catch (error) {
      console.error('Error copying image:', error);
      Alert.alert('Error', 'Failed to attach image.');
    }
  };

  const handleSave = async () => {
    try {
      let finalAudioPath = audioPath;
      
      if (!keepAudio && audioPath) {
        try {
          const pathToDelete = audioPath.replace('file://', '');
          await RNFS.unlink(pathToDelete);
          finalAudioPath = null;
        } catch (e) {
          console.error('Failed to delete audio:', e);
        }
      }

      const today = new Date().toISOString().split('T')[0];
      
      realm.write(() => {
        let dayMoment = realm.objectForPrimaryKey('DayMoment', today);
        if (!dayMoment) {
          dayMoment = realm.create('DayMoment', {
            date: today,
            summary: summary,
            entries: [],
          });
        } else if (summary) {
          dayMoment.summary = summary; // Update with latest summary
        }

        const entry = realm.create('Entry', {
          _id: new Realm.BSON.UUID(),
          timestamp: new Date(),
          transcript: editedTranscript,
          audioPath: finalAudioPath,
          imagePath: imagePath,
          mood: summary,
        });

        dayMoment.entries.push(entry);
      });

      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    } catch (error) {
      Alert.alert('Save Error', 'Failed to save the entry.');
      console.error(error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.headerTitle}>Review & Edit Entry</Text>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          multiline
          value={editedTranscript}
          onChangeText={setEditedTranscript}
          placeholder="Write your entry here..."
          placeholderTextColor="#64748b"
        />
      </View>

      <View style={styles.attachmentSection}>
        <Text style={styles.sectionTitle}>Attachments</Text>
        
        {imagePath ? (
          <View style={styles.imageContainer}>
            <Image source={{ uri: imagePath }} style={styles.image} />
            <TouchableOpacity 
              style={styles.removeImageBtn} 
              onPress={() => setImagePath(null)}
            >
              <Trash2 size={20} color="#ef4444" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.attachButton} onPress={handleAttachImage}>
            <ImageIcon size={24} color="#38bdf8" />
            <Text style={styles.attachButtonText}>Attach Photo</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.toggleSection}>
        <View style={styles.toggleInfo}>
          <Text style={styles.toggleTitle}>Keep original audio file</Text>
          <Text style={styles.toggleSubtitle}>Save storage by discarding the recording</Text>
        </View>
        <Switch
          value={keepAudio}
          onValueChange={setKeepAudio}
          trackColor={{ false: '#334155', true: '#38bdf8' }}
          thumbColor={keepAudio ? '#f8fafc' : '#94a3b8'}
        />
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Save size={20} color="#0f172a" />
        <Text style={styles.saveButtonText}>Save Entry</Text>
      </TouchableOpacity>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    padding: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 20,
  },
  inputContainer: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    minHeight: 200,
    padding: 16,
    marginBottom: 24,
  },
  textInput: {
    color: '#f8fafc',
    fontSize: 16,
    lineHeight: 24,
    textAlignVertical: 'top',
  },
  attachmentSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  attachButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#38bdf8',
    borderStyle: 'dashed',
  },
  attachButtonText: {
    color: '#38bdf8',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 16,
  },
  imageContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
  },
  image: {
    width: '100%',
    height: 250,
    resizeMode: 'cover',
  },
  removeImageBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    padding: 8,
    borderRadius: 8,
  },
  toggleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 16,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#334155',
  },
  toggleInfo: {
    flex: 1,
    paddingRight: 16,
  },
  toggleTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: 'bold',
  },
  toggleSubtitle: {
    color: '#94a3b8',
    fontSize: 13,
    marginTop: 4,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#38bdf8',
    padding: 16,
    borderRadius: 12,
  },
  saveButtonText: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default ReviewEntryScreen;
