import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  AppState,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { saveSession } from '../storage/storage'; 

const DEFAULT_SECONDS = 25 * 60; 

const HomeScreen = () => {
  const [secondsLeft, setSecondsLeft] = useState(DEFAULT_SECONDS);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [distractionCount, setDistractionCount] = useState(0);
  const intervalRef = useRef(null);
  const appState = useRef(AppState.currentState);
  const startedAtRef = useRef(null);

  useEffect(() => {
    if (isRunning) {
      if (!startedAtRef.current) startedAtRef.current = Date.now();

      intervalRef.current = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            endSession(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning]);

 
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [isRunning]);

  const handleAppStateChange = nextAppState => {
    if (!isRunning) {
      appState.current = nextAppState;
      return;
    }

    if (appState.current === 'active' && (nextAppState === 'background' || nextAppState === 'inactive')) {
      setDistractionCount(c => c + 1);
      pauseTimer();
      Alert.alert('Dikkat dağıldı', 'Uygulamadan çıktığınız için sayaç duraklatıldı.');
    }

    appState.current = nextAppState;
  };

  const startTimer = () => {
    if (isRunning) return;
    setIsRunning(true);
  };

  const pauseTimer = () => {
    setIsRunning(false);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setSecondsLeft(DEFAULT_SECONDS);
    setDistractionCount(0);
    startedAtRef.current = null;
  };

  const endSession = async (completed = false) => {
    setIsRunning(false);
    const startedAt = startedAtRef.current || Date.now();
    const elapsedMs = Date.now() - startedAt;
    const elapsedSec = Math.round(elapsedMs / 1000);
    const durationSec = completed ? DEFAULT_SECONDS : elapsedSec;
    const minutes = Math.floor(durationSec / 60);
    const seconds = durationSec % 60;

    const session = {
      id: `${Date.now()}`,
      category: selectedCategory,
      durationSec: durationSec,
      distractions: distractionCount,
      date: new Date().toISOString(),
      completed: completed,
    };

    Alert.alert(
      'Seans Özeti',
      `Kategori: ${session.category}\nSüre: ${minutes} dakika ${seconds} saniye\nDikkat Dağınıklığı: ${session.distractions}`,
      [
        {
          text: 'Kaydet',
          onPress: async () => {
            await saveSession(session);
            resetTimer();
          },
        },
        {
          text: 'İptal (kaydetme)',
          onPress: () => {
            resetTimer();
          },
          style: 'cancel',
        },
      ],
      { cancelable: false }
    );
  };

  const formatTime = secs => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ana Sayfa (Zamanlayıcı)</Text>

      <View style={styles.timerBox}>
        <Text style={styles.timerText}>{formatTime(secondsLeft)}</Text>
      </View>

      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.button, isRunning ? styles.buttonDisabled : null]}
          onPress={startTimer}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>Başlat</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, !isRunning ? styles.buttonDisabled : null]}
          onPress={pauseTimer}
          disabled={!isRunning}
        >
          <Text style={styles.buttonText}>Duraklat</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={resetTimer}>
          <Text style={styles.buttonText}>Sıfırla</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.pickerRow}>
        <Text style={styles.label}>Kategori:</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedCategory}
            onValueChange={(itemValue) => setSelectedCategory(itemValue)}
            mode="dropdown"
          > 
            <Picker.Item label="Lütfen Kategori Seçiniz" value="" enabled={false} style={{ color: 'gray' }} />
            <Picker.Item label="Ders Çalışma" value="Ders Çalışma" />
            <Picker.Item label="Kodlama" value="Kodlama" />
            <Picker.Item label="Proje" value="Proje" />
            <Picker.Item label="Kitap Okuma" value="Kitap Okuma" />
            <Picker.Item label="Diğer" value="Diğer" />
          </Picker>
        </View>
      </View>

      <View style={styles.summary}>
        <Text>Geçerli Dikkat Dağınıklığı Sayısı: {distractionCount}</Text>
      </View>

      <View style={{ height: 40 }} />
      <Text style={{ fontSize: 12, color: 'gray' }}>
        (Uygulamadan çıktığınızda sayaç otomatik duraklar ve bir dikkat dağılımı
        sayılır.)
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, alignItems: 'center', backgroundColor: '#f7f7f7' },
  title: { fontSize: 18, fontWeight: '700', marginVertical: 8 },
  timerBox: {
    marginTop: 20,
    marginBottom: 12,
    padding: 24,
    borderRadius: 12,
    backgroundColor: 'white',
    elevation: 2,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 180,
  },
  timerText: { fontSize: 40, fontWeight: '700' },
  row: { flexDirection: 'row', marginTop: 18, alignItems: 'center' },
  button: {
    marginHorizontal: 8,
    backgroundColor: '#38A169',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: 'white', fontWeight: '600' },
  
  pickerRow: { 
    marginTop: 20, 
    width: '90%', 
    maxWidth: 350,
  },
  label: { marginBottom: 6 },
  pickerContainer: { 
    backgroundColor: 'white', 
    borderRadius: 8, 
    overflow: 'hidden', 
    width: '100%', 
    borderWidth: 2,           
    borderColor: '#000'
  },
  
  
  summary: { marginTop: 18, alignItems: 'center' },
});

export default HomeScreen;