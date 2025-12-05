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
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { saveSession, getCategoryList } from '../storage/storage'; 

const DEFAULT_SECONDS = 25 * 60; 

const HomeScreen = () => {
  const navigation = useNavigation();
  const [secondsLeft, setSecondsLeft] = useState(DEFAULT_SECONDS);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [distractionCount, setDistractionCount] = useState(0);
  const [categories, setCategories] = useState([]); 
  const intervalRef = useRef(null);
  const appState = useRef(AppState.currentState);
  const startedAtRef = useRef(null);
  
  const isFocused = useIsFocused(); 

  const loadCategories = async () => {
    const data = await getCategoryList();
    setCategories(data);
    if (!selectedCategory) {
        setSelectedCategory(''); 
    }
  };
  
  const goToCategoryManagement = () => {
      navigation.navigate('KategoriYonetimi'); 
  };


  useEffect(() => {
    if (isFocused) {
        loadCategories();
    }
  }, [isFocused]);

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
    if (!selectedCategory) {
        Alert.alert("Hata", "Lütfen bir kategori seçiniz.");
        return;
    }
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
    const totalMinutes = Math.floor(durationSec / 60);
    const totalSeconds = durationSec % 60;

    const categoryName = selectedCategory 
        ? selectedCategory 
        : 'Belirtilmedi'; 

    const session = {
      id: `${Date.now()}`,
      category: categoryName,
      durationSec: durationSec,
      distractions: distractionCount,
      date: new Date().toISOString(),
      completed: completed,
    };

    Alert.alert(
      'Seans Özeti',
      `Kategori: ${session.category}\nSüre: ${totalMinutes} dakika ${totalSeconds} saniye\nDikkat Dağılımı: ${session.distractions}`,
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
          style={[styles.button, (isRunning || !selectedCategory) ? styles.buttonDisabled : null]}
          onPress={startTimer}
          disabled={isRunning || !selectedCategory}
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
            {/* Varsayılan Seçenek */}
            <Picker.Item 
                label="Lütfen Kategori Seçiniz" 
                value="" 
                enabled={false} 
                style={{ color: 'gray' }} 
            />
            {/* Dinamik Kategoriler Listesi */}
            {categories.map((c) => (
                <Picker.Item key={c.id} label={c.name} value={c.name} />
            ))}
          </Picker>
        </View>
      </View>
      
      {/* Kategori Seçici'nin hemen altında bulunan yeni buton */}
      <TouchableOpacity 
        style={styles.editCategoryButton}
        onPress={goToCategoryManagement}
      >
        <Text style={styles.editCategoryButtonText}>Kategorileri Düzenle 📝</Text>
      </TouchableOpacity>

      <View style={styles.summary}>
        <Text>Geçerli Dikkat Dağılımı Sayısı: {distractionCount}</Text>
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
  settingsButton: { 
    position: 'absolute', 
    top: 20, 
    right: 20, 
    padding: 10, 
    zIndex: 10, 
  },
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
  
  editCategoryButton: {
    marginTop: 15,
    backgroundColor: '#6c757d', 
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  editCategoryButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  
  summary: { marginTop: 18, alignItems: 'center' },
});

export default HomeScreen;