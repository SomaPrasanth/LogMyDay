import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Alert } from 'react-native';
import { useRealm, useQuery } from '../models/Schema';
import { DayMoment } from '../models/Schema';
import { startPlayback } from '../services/AudioService';
import RNFS from 'react-native-fs';
import { Play, Calendar, Image as ImageIcon, Trash2 } from 'lucide-react-native';

const DayViewScreen = ({ route, navigation }) => {
  const { date } = route.params;
  const realm = useRealm();
  
  // Use a query to get live updates for this day
  const dayMoment = useQuery(DayMoment).filtered(`date == "${date}"`)[0];

  React.useEffect(() => {
    navigation.setOptions({
      title: date,
    });
  }, [navigation, date]);

  const handleDeleteEntry = (entry) => {
    Alert.alert(
      'Delete Moment',
      'Are you sure you want to delete this moment? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete audio file if exists
              if (entry.audioPath) {
                const path = entry.audioPath.replace('file://', '');
                const exists = await RNFS.exists(path);
                if (exists) {
                  await RNFS.unlink(path);
                }
              }
              // Delete image file if exists
              if (entry.imagePath) {
                const path = entry.imagePath.replace('file://', '');
                const exists = await RNFS.exists(path);
                if (exists) {
                  await RNFS.unlink(path);
                }
              }
              
              // Delete from Realm
              realm.write(() => {
                realm.delete(entry);
              });
              
              // If no entries left, maybe we should delete the DayMoment too or just leave it empty.
              // Leaving it empty is fine, or we could delete it if dayMoment.entries.length === 0.
              if (dayMoment && dayMoment.entries.length === 0) {
                  realm.write(() => {
                      realm.delete(dayMoment);
                  });
                  navigation.goBack();
              }
            } catch (error) {
              console.error('Error deleting entry:', error);
              Alert.alert('Error', 'Failed to delete the moment.');
            }
          }
        }
      ]
    );
  };

  const renderEntry = ({ item }) => (
    <View style={styles.entryCard}>
      <View style={styles.entryHeader}>
        <Text style={styles.entryTime}>
          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
        <View style={styles.headerActions}>
          {item.audioPath && (
            <TouchableOpacity onPress={() => startPlayback(item.audioPath)} style={styles.playButton}>
              <Play size={16} color="#0f172a" fill="#0f172a" />
              <Text style={styles.playText}>Play</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => handleDeleteEntry(item)} style={styles.deleteButton}>
            <Trash2 size={18} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>
      
      <Text style={styles.transcript}>{item.transcript}</Text>
      
      {item.imagePath && (
        <View style={styles.imageContainer}>
          <Image source={{ uri: item.imagePath }} style={styles.image} />
        </View>
      )}
    </View>
  );

  if (!dayMoment) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No entries found for this day.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.dayHeader}>
        <Calendar size={20} color="#38bdf8" />
        <Text style={styles.daySummary}>{dayMoment.summary}</Text>
      </View>

      <FlatList
        data={dayMoment.entries}
        renderItem={renderEntry}
        keyExtractor={(entry) => entry._id.toString()}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748b',
    fontSize: 16,
  },
  dayHeader: {
    padding: 16,
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  daySummary: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
    lineHeight: 24,
  },
  listContent: {
    padding: 16,
  },
  entryCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  entryTime: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteButton: {
    marginLeft: 12,
    padding: 4,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#38bdf8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  playText: {
    color: '#0f172a',
    fontWeight: 'bold',
    marginLeft: 4,
    fontSize: 13,
  },
  transcript: {
    color: '#f8fafc',
    fontSize: 16,
    lineHeight: 24,
  },
  imageContainer: {
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
  },
  image: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
});

export default DayViewScreen;
