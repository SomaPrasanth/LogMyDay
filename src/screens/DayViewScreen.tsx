import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { useRealm, useQuery } from '../models/Schema';
import { DayMoment } from '../models/Schema';
import { startPlayback } from '../services/AudioService';
import { Play, Calendar, Image as ImageIcon } from 'lucide-react-native';

const DayViewScreen = ({ route, navigation }) => {
  const { date } = route.params;
  
  // Use a query to get live updates for this day
  const dayMoment = useQuery(DayMoment).filtered(`date == "${date}"`)[0];

  React.useEffect(() => {
    navigation.setOptions({
      title: date,
    });
  }, [navigation, date]);

  const renderEntry = ({ item }) => (
    <View style={styles.entryCard}>
      <View style={styles.entryHeader}>
        <Text style={styles.entryTime}>
          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
        {item.audioPath && (
          <TouchableOpacity onPress={() => startPlayback(item.audioPath)} style={styles.playButton}>
            <Play size={18} color="#0f172a" fill="#0f172a" />
            <Text style={styles.playText}>Play</Text>
          </TouchableOpacity>
        )}
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
