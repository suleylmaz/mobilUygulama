import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSIONS_KEY = 'focus_sessions_v1';
const CATEGORIES_KEY = 'focus_categories_v1';


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

export const deleteSession = async (id) => {
  try {
    const raw = await AsyncStorage.getItem(SESSIONS_KEY);
    const arr = raw ? JSON.parse(raw) : [];

    const filtered = arr.filter(item => item.id !== id);

    await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(filtered));
    return true;
  } catch (e) {
    console.error('deleteSession error', e);
    return false;
  }
};

export const updateSession = async (updated) => {
  try {
    const raw = await AsyncStorage.getItem(SESSIONS_KEY);
    const arr = raw ? JSON.parse(raw) : [];

    const newArr = arr.map(item =>
      item.id === updated.id ? updated : item
    );

    await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(newArr));
    return true;
  } catch (e) {
    console.error('updateSession error', e);
    return false;
  }
};

// --- Kategori Fonksiyonları ---

export const getCategoryList = async () => {
  try {
    const raw = await AsyncStorage.getItem(CATEGORIES_KEY);
    
    // Eğer kategori yoksa, varsayılan bir listeyi oluşturup döndür
    if (!raw) {
      const defaultCategories = [
        { id: '1', name: 'Ders Çalışma' },
        { id: '2', name: 'Kodlama' },
        { id: '3', name: 'Proje' },
        { id: '4', name: 'Kitap Okuma' },
        { id: '5', name: 'Diğer' },
      ];
      await AsyncStorage.setItem(CATEGORIES_KEY, JSON.stringify(defaultCategories));
      return defaultCategories;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('getCategoryList error', e);
    return [];
  }
};

export const saveCategory = async (category) => {
  try {
    const arr = await getCategoryList();
    
    const newId = (Date.now()).toString(); 
    const newCategory = { id: newId, name: category.name };
    
    arr.push(newCategory);
    await AsyncStorage.setItem(CATEGORIES_KEY, JSON.stringify(arr));
    return true;
  } catch (e) {
    console.error('saveCategory error', e);
    return false;
  }
};

export const updateCategory = async (id, newName) => {
  try {
    const arr = await getCategoryList();
    const newArr = arr.map(item =>
      item.id === id ? { ...item, name: newName } : item
    );

    await AsyncStorage.setItem(CATEGORIES_KEY, JSON.stringify(newArr));
    return true;
  } catch (e) {
    console.error('updateCategory error', e);
    return false;
  }
};

export const deleteCategory = async (id) => {
  try {
    const raw = await AsyncStorage.getItem(CATEGORIES_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    
    const filtered = arr.filter(item => item.id !== id);

    await AsyncStorage.setItem(CATEGORIES_KEY, JSON.stringify(filtered));
    return true;
  } catch (e) {
    console.error('deleteCategory error', e);
    return false;
  }
};