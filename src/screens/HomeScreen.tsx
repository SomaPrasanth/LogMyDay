import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';
import { useRealm, useQuery } from '../models/Schema';
import { DayMoment, Entry } from '../models/Schema';
import { Realm } from '@realm/react';
import { startRecording, stopRecording, requestPermissions, startPlayback } from '../services/AudioService';
import { transcribeAudio } from '../services/GroqService';
import { getApiKey, getLanguagePreferences } from '../services/StorageService';
import { Mic, MicOff, Settings as SettingsIcon, Play, Calendar } from 'lucide-react-native';

const HomeScreen = ({ navigation }) => {
  const realm = useRealm();
  const dayMoments = useQuery(DayMoment).sorted('date', true);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={{ marginRight: 16 }}>
          <SettingsIcon size={24} color="#f8fafc" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const handleRecord = async () => {
    if (!isRecording) {
      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        const msg = Platform.OS === 'android' && Platform.Version >= 33 
          ? 'Microphone permission is required to record moments.' 
          : 'Microphone and storage permissions are required.';
        Alert.alert('Permission Denied', msg);
        return;
      }
      try {
        await startRecording();
        setIsRecording(true);
      } catch (err) {
        Alert.alert('Error', 'Could not start recording');
      }
    } else {
      try {
        setIsProcessing(true);
        setIsRecording(false);
        const audioPath = await stopRecording();
        
        const apiKey = await getApiKey();
        const prefs = await getLanguagePreferences();
        
        const result = await transcribeAudio(apiKey, audioPath, prefs.spokenLanguage, prefs.outputLanguage);
        
        saveEntry(result, audioPath);
      } catch (err) {
        Alert.alert('Processing Error', err.message || 'Failed to transcribe audio.');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const saveEntry = (result, audioPath) => {
    const today = new Date().toISOString().split('T')[0];
    
    realm.write(() => {
      let dayMoment = realm.objectForPrimaryKey('DayMoment', today);
      if (!dayMoment) {
        dayMoment = realm.create('DayMoment', {
          date: today,
          summary: result.daily_summary,
          entries: [],
        });
      } else if (result.daily_summary) {
        dayMoment.summary = result.daily_summary; // Update with latest summary
      }

      const entry = realm.create('Entry', {
        _id: new Realm.BSON.UUID(),
        timestamp: new Date(),
        transcript: result.transcript,
        audioPath: audioPath,
        mood: result.daily_summary,
      });

      dayMoment.entries.push(entry);
    });
  };

  const renderEntry = ({ item }) => (
    <View style={styles.entryCard}>
      <View style={styles.entryHeader}>
        <Text style={styles.entryTime}>
          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
        <TouchableOpacity onPress={() => startPlayback(item.audioPath)}>
          <Play size={20} color="#38bdf8" />
        </TouchableOpacity>
      </View>
      <Text style={styles.transcript}>{item.transcript}</Text>
    </View>
  );

  const renderDay = ({ item }) => (
    <View style={styles.daySection}>
      <View style={styles.dayHeader}>
        <Calendar size={18} color="#94a3b8" />
        <Text style={styles.dayDate}>{item.date === new Date().toISOString().split('T')[0] ? 'Today' : item.date}</Text>
      </View>
      {item.summary && <Text style={styles.daySummary}>{item.summary}</Text>}
      <FlatList
        data={item.entries}
        renderItem={renderEntry}
        keyExtractor={(entry) => entry._id.toString()}
        scrollEnabled={false}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      {dayMoments.length === 0 ? (
        <View style={styles.emptyState}>
          <Mic size={48} color="#334155" />
          <Text style={styles.emptyText}>No entries yet. Start recording your day!</Text>
        </View>
      ) : (
        <FlatList
          data={dayMoments}
          renderItem={renderDay}
          keyExtractor={(item) => item.date}
          contentContainerStyle={{ padding: 16 }}
        />
      )}

      {isProcessing && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#38bdf8" />
          <Text style={styles.loadingText}>Transcribing with AI...</Text>
        </View>
      )}

      <View style={styles.bottomContainer}>
        <TouchableOpacity 
          style={[styles.recordButton, isRecording && styles.recordingActive]} 
          onPress={handleRecord}
          disabled={isProcessing}
        >
          {isRecording ? <MicOff size={32} color="#fff" /> : <Mic size={32} color="#fff" />}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    color: '#64748b',
    textAlign: 'center',
    marginTop: 16,
    fontSize: 16,
  },
  daySection: {
    marginBottom: 32,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dayDate: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
    textTransform: 'uppercase',
  },
  daySummary: {
    color: '#38bdf8',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  entryCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'between',
    alignItems: 'center',
    marginBottom: 8,
  },
  entryTime: {
    color: '#64748b',
    fontSize: 12,
    flex: 1,
  },
  transcript: {
    color: '#f8fafc',
    fontSize: 15,
    lineHeight: 22,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  recordButton: {
    backgroundColor: '#38bdf8',
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  recordingActive: {
    backgroundColor: '#ef4444',
    shadowColor: '#ef4444',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingText: {
    color: '#f8fafc',
    marginTop: 16,
    fontSize: 16,
  },
});

export default HomeScreen;
