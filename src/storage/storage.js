import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSIONS_KEY = 'focus_sessions_v1';

export const saveSession = async (session) => {
  try {
    const raw = await AsyncStorage.getItem(SESSIONS_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    arr.push(session);
    await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(arr));
    return true;
  } catch (e) {
    console.error('saveSession error', e);
    return false;
  }
};

export const getAllSessions = async () => {
  try {
    const raw = await AsyncStorage.getItem(SESSIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('getAllSessions error', e);
    return [];
  }
};

export const clearAllSessions = async () => {
  try {
    await AsyncStorage.removeItem(SESSIONS_KEY);
    return true;
  } catch (e) {
    console.error('clearAllSessions error', e);
    return false;
  }
};
