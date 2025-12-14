import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  AppState,
  Alert,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { saveSession, getCategoryList } from '../storage/storage';
import ModalSelector from 'react-native-modal-selector';

const STORAGE_KEYS = {
  POMODORO_DURATION: '@pomodoroDuration',
};

const DEFAULT_MINUTES = 25;
const DEFAULT_SECONDS = DEFAULT_MINUTES * 60;

const HomeScreen = () => {
  const navigation = useNavigation();
  const [sessionDurationSec, setSessionDurationSec] = useState(DEFAULT_SECONDS);
  const [secondsLeft, setSecondsLeft] = useState(DEFAULT_SECONDS);
  const [isRunning, setIsRunning] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCategoryName, setSelectedCategoryName] = useState('');

  const [durationInput, setDurationInput] = useState(String(DEFAULT_MINUTES));

  const [distractionCount, setDistractionCount] = useState(0); 
  const [categories, setCategories] = useState([]);
  const intervalRef = useRef(null);
  const appState = useRef(AppState.currentState);

  const startedAtRef = useRef(null); 

  const isFocused = useIsFocused();

  const loadDuration = async () => {
    try {
      const storedDurationMin = await AsyncStorage.getItem(
        STORAGE_KEYS.POMODORO_DURATION,
      );
      const durationMin = storedDurationMin
        ? parseInt(storedDurationMin, 10)
        : DEFAULT_MINUTES;

      setDurationInput(String(durationMin));
      setSessionDurationSec(durationMin * 60);
      setSecondsLeft(durationMin * 60);
    } catch (e) {
      console.error('Süre yüklenirken hata:', e);
      setDurationInput(String(DEFAULT_MINUTES));
      setSessionDurationSec(DEFAULT_SECONDS);
      setSecondsLeft(DEFAULT_SECONDS);
    }
  };

  const saveDuration = async minutes => {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.POMODORO_DURATION,
        String(minutes),
      );
    } catch (e) {
      console.error('Süre kaydedilirken hata:', e);
    }
  };

  const loadCategories = async () => {
    const data = await getCategoryList();
    setCategories(data);
  };

  const goToCategoryManagement = () => {
    navigation.navigate('KategoriYonetimi');
  };

  useEffect(() => {
    loadDuration();
  }, []);

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
    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange,
    );
    return () => subscription.remove();
  }, [isRunning]);

  const handleAppStateChange = nextAppState => {
    if (!isRunning) {
      appState.current = nextAppState;
      return;
    }

    if (
      appState.current === 'active' &&
      (nextAppState === 'background' || nextAppState === 'inactive')
    ) {
      setIsRunning(false); 
      
      setDistractionCount(c => c + 1); 
      
      Alert.alert(
        'Dikkat Dağılımı! Oturum Duraklatıldı',
        `Uygulamadan çıktığınız için sayaç duraklatıldı.\n\nKaldığınız yerden devam etmek için tekrar Başlat'a basın.`,
        [{ text: 'Tamam', onPress: () => { } }]
      );
    }

    appState.current = nextAppState;
  };

  const startTimer = () => {
    if (isRunning) return;

    Keyboard.dismiss();

    const minutes = parseInt(durationInput, 10);

    if (isNaN(minutes) || minutes <= 0) {
      Alert.alert('Hata', 'Lütfen geçerli bir süre (dakika) giriniz.');
      return;
    }

    if (!selectedCategory) {
      Alert.alert('Hata', 'Lütfen bir kategori seçiniz.');
      return;
    }

    if (secondsLeft === sessionDurationSec) {
        const newDurationSec = minutes * 60;
        setSessionDurationSec(newDurationSec);
        setSecondsLeft(newDurationSec);
        saveDuration(minutes);
    }
    
    setIsRunning(true);
  };

  const pauseTimer = () => {
    if (!isRunning) return;
    setIsRunning(false);
    endSession(false);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setSecondsLeft(sessionDurationSec);
    setDistractionCount(0); 
    startedAtRef.current = null; 
    
    Keyboard.dismiss();
  };

  
  const endSession = async (completed = false) => {
    setIsRunning(false);
    Keyboard.dismiss();
    
    const focusedDurationSec = sessionDurationSec - secondsLeft;
    
    const durationSec = completed ? sessionDurationSec : focusedDurationSec;
    
    const safeDurationSec = Math.max(0, durationSec);

    const formattedDuration = formatDurationDetail(safeDurationSec);
    const categoryName = selectedCategoryName || 'Belirtilmedi';

    const session = {
      id: `${Date.now()}`,
      category: categoryName,
      durationSec: safeDurationSec,
      distractions: distractionCount, 
      date: new Date().toISOString(),
      completed: completed,
    };

    await saveSession(session);

    Alert.alert(
      'Seans Özeti',
      `Kategori: ${session.category}\nSüre: ${formattedDuration}\nDikkat Dağılımı: ${session.distractions}\n\nSeans otomatik olarak kaydedilmiştir.`,
      [{ text: 'Tamam', onPress: resetTimer }] 
    );
  };

  const formatTime = secs => {
    const totalSeconds = Math.max(0, secs); 
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const h = hours.toString().padStart(2, '0');
    const m = minutes.toString().padStart(2, '0');
    const s = seconds.toString().padStart(2, '0');

    if (hours > 0) {
      return `${h}:${m}:${s}`;
    }
    return `${m}:${s}`;
  };

  const formatDurationDetail = (secs) => {
    const totalSeconds = Math.max(0, secs);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    let parts = [];
    if (hours > 0) {
      parts.push(`${hours} saat`);
    }
    if (minutes > 0 || (hours === 0 && seconds === 0)) {
      parts.push(`${minutes} dakika`);
    }
    if (seconds > 0) {
      parts.push(`${seconds} saniye`);
    }

    if (parts.length === 0) return '0 saniye';
    return parts.join(' ');
  }

  const handleDurationChange = text => {
    const newText = text.replace(/[^0-9]/g, '');
    setDurationInput(newText);

    const minutes = parseInt(newText, 10);
    if (!isRunning) {
        if (!isNaN(minutes) && minutes > 0) {
            const newDurationSec = minutes * 60;
            setSessionDurationSec(newDurationSec);
            setSecondsLeft(newDurationSec);
        } else if (newText === '') {
            setSessionDurationSec(0);
            setSecondsLeft(0);
        }
    }
  };
  
  const formattedTime = formatTime(secondsLeft);
  const isLongFormat = formattedTime.length > 5;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        <Text style={styles.title}>Ana Sayfa (Zamanlayıcı)</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Pomodoro Süresi (Dakika):</Text>
          <TextInput
            style={isRunning ? styles.textInputDisabled : styles.textInput}
            onChangeText={handleDurationChange}
            value={durationInput}
            keyboardType="numeric"
            maxLength={3}
            editable={!isRunning}
            placeholder="Dakika giriniz (örn: 25)"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.timerBox}>
          <Text 
            style={[
                styles.timerTextDefault, 
                isLongFormat && styles.timerTextSmall 
            ]}
          >
            {formattedTime}
          </Text>
        </View>

        <View style={styles.row}>
          <TouchableOpacity
            style={[
              styles.button,
              !selectedCategory || sessionDurationSec === 0 || isRunning
                ? styles.buttonDisabled
                : null,
            ]}
            onPress={startTimer}
            disabled={!selectedCategory || sessionDurationSec === 0 || isRunning}
          >
            <Text style={styles.buttonText}>Başlat</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, !isRunning ? styles.buttonDisabled : null]}
            onPress={pauseTimer}
            disabled={!isRunning}
          >
            <Text style={styles.buttonText}>Duraklat & Kaydet</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={resetTimer}>
            <Text style={styles.buttonText}>Sıfırla</Text>
          </TouchableOpacity>
        </View>

        <View style={{ width: '90%', marginTop: 20 }}>
          <ModalSelector
            data={categories.map((c, index) => ({
              key: index,
              label: c.name,
              value: c.id,
            }))}
            initValue="Lütfen Kategori Seçiniz"
            onChange={option => {
              setSelectedCategory(option.value);
              setSelectedCategoryName(option.label);
            }}
            disabled={isRunning}
          >
            <Text
              style={
                isRunning ? styles.selectorTextDisabled : styles.selectorText
              }
            >
              Kategori: {selectedCategoryName || 'Lütfen Kategori Seçiniz'}
            </Text>
          </ModalSelector>
        </View>

        <TouchableOpacity
          style={styles.editCategoryButton}
          onPress={goToCategoryManagement}
        >
          <Text style={styles.editCategoryButtonText}>
            Kategorileri Düzenle 
          </Text>
        </TouchableOpacity>

        <View style={styles.summary}>
          <Text>Geçerli Dikkat Dağılımı Sayısı: {distractionCount}</Text>
        </View>

        <View style={{ height: 40 }} />
        <Text style={{ fontSize: 12, color: 'gray', textAlign: 'center' }}>
          (Uygulamadan çıktığınızda sayaç duraklar ve kaldığınız yerde bekler. Kaydetmek için 'Duraklat & Kaydet'e basın.)
        </Text>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#f7f7f7',
    paddingTop: 50,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  timerBox: {
    marginTop: 20,
    marginBottom: 12,
    padding: 24,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'white',
    elevation: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerTextDefault: { 
    fontSize: 48, 
    fontWeight: '700',
  },
  timerTextSmall: {
    fontSize: 36,
    fontWeight: '700',
  },
  row: { flexDirection: 'row', marginTop: 18, alignItems: 'center' },
  button: {
    marginHorizontal: 8,
    backgroundColor: '#1EAD5D',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonDisabled: {
    backgroundColor: '#95CBA8',
  },
  buttonText: { color: 'white', fontWeight: '600' },

  inputContainer: {
    width: '90%',
    marginTop: 10,
    alignItems: 'center',
  },
  inputLabel: {
    marginBottom: 5,
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  textInput: {
    width: '100%',
    padding: 14,
    backgroundColor: 'white',
    borderRadius: 8,
    elevation: 2,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '500',
    borderColor: '#ccc',
    borderWidth: 1,
  },
  textInputDisabled: {
    width: '100%',
    padding: 14,
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    elevation: 2,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '500',
    color: '#888',
    borderColor: '#ccc',
    borderWidth: 1,
  },

  selectorText: {
    padding: 14,
    backgroundColor: 'white',
    borderRadius: 8,
    elevation: 2,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '500',
  },
  selectorTextDisabled: {
    padding: 14,
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    elevation: 2,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '500',
    color: '#888',
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