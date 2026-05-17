import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import RNFS from 'react-native-fs';
import { Platform, PermissionsAndroid } from 'react-native';

const audioRecorderPlayer = new AudioRecorderPlayer();

export const requestPermissions = async () => {
  if (Platform.OS === 'android') {
    try {
      const permissions = [];
      
      // On Android 13+ (API 33), we don't need WRITE_EXTERNAL_STORAGE for app-specific directories
      // and the permission itself is deprecated/split into media permissions.
      if (Platform.Version < 33) {
        permissions.push(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE);
        permissions.push(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE);
      }
      
      permissions.push(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);

      const grants = await PermissionsAndroid.requestMultiple(permissions);

      const recordGranted = grants[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED;
      
      if (Platform.Version >= 33) {
        return recordGranted;
      }

      const storageGranted = 
        grants[PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE] === PermissionsAndroid.RESULTS.GRANTED &&
        grants[PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE] === PermissionsAndroid.RESULTS.GRANTED;

      return recordGranted && storageGranted;
    } catch (err) {
      console.warn(err);
      return false;
    }
  }
  return true;
};

export const startRecording = async () => {
  const fileName = `recording_${Date.now()}.m4a`;
  const path = `${RNFS.DocumentDirectoryPath}/${fileName}`;
  
  const audioSet = {
    AudioEncoderAndroid: 3, // AAC
    AudioSourceAndroid: 1, // MIC
    AVEncoderAudioQualityKeyIOS: 96, // High
    AVNumberOfChannelsKeyIOS: 1,
    AVFormatIDKeyIOS: 1952804451, // m4a
  };
  
  await audioRecorderPlayer.startRecorder(path, audioSet);
  audioRecorderPlayer.addRecordBackListener((e) => {
    return;
  });
  return path;
};

export const stopRecording = async () => {
  const result = await audioRecorderPlayer.stopRecorder();
  audioRecorderPlayer.removeRecordBackListener();
  return result;
};

export const startPlayback = async (path) => {
  await audioRecorderPlayer.startPlayer(path);
  audioRecorderPlayer.addPlayBackListener((e) => {
    if (e.currentPosition === e.duration) {
      audioRecorderPlayer.stopPlayer();
    }
  });
};

export const stopPlayback = async () => {
  await audioRecorderPlayer.stopPlayer();
  audioRecorderPlayer.removePlayBackListener();
};
