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
        
        navigation.navigate('ReviewEntry', {
          transcript: result.transcript,
          summary: result.daily_summary,
          audioPath: audioPath
        });
      } catch (err) {
        Alert.alert('Processing Error', err.message || 'Failed to transcribe audio.');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const renderDay = ({ item }) => (
    <TouchableOpacity 
      style={styles.dayCard}
      onPress={() => navigation.navigate('DayView', { date: item.date })}
    >
      <View style={styles.dayHeader}>
        <Calendar size={18} color="#94a3b8" />
        <Text style={styles.dayDate}>{item.date === new Date().toISOString().split('T')[0] ? 'Today' : item.date}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{item.entries.length}</Text>
        </View>
      </View>
      {item.summary && <Text style={styles.daySummary} numberOfLines={2}>{item.summary}</Text>}
    </TouchableOpacity>
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
  dayCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dayDate: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
    textTransform: 'uppercase',
    flex: 1,
  },
  badge: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeText: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: 'bold',
  },
  daySummary: {
    color: '#f8fafc',
    fontSize: 16,
    lineHeight: 24,
    fontStyle: 'italic',
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
