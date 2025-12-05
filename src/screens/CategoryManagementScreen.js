import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import {
  getCategoryList,
  saveCategory,
  updateCategory,
  deleteCategory,
} from '../storage/storage'; // Doğru dosya yolunu varsayar

const CategoryManagementScreen = () => {
  const [categories, setCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) loadCategories();
  }, [isFocused]);

  const loadCategories = async () => {
    const data = await getCategoryList();
    setCategories(data);
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      Alert.alert('Hata', 'Kategori adı boş olamaz.');
      return;
    }
    await saveCategory({ name: newCategoryName.trim() });
    setNewCategoryName('');
    loadCategories();
  };

  const handleEdit = (item) => {
    Alert.prompt(
      'Kategori Adı Düzenle',
      `"${item.name}" için yeni adı girin:`,
      async (value) => {
        if (!value || value.trim() === '') return;
        
        const success = await updateCategory(item.id, value.trim());
        if (success) {
            loadCategories();
        } else {
            Alert.alert('Hata', 'Kategori güncellenirken bir sorun oluştu.');
        }
      },
      'plain-text',
      item.name
    );
  };

  const handleDelete = (id) => {
    Alert.alert(
      'Kategoriyi Sil',
      'Bu kategoriyi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteCategory(id);
            if (success) {
                loadCategories();
            } else {
                Alert.alert('Hata', 'Kategori silinirken bir sorun oluştu.');
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.cardText}>{item.name}</Text>

      <View style={styles.row}>
        <TouchableOpacity style={styles.editBtn} onPress={() => handleEdit(item)}>
          <Text style={styles.btnText}>Düzenle</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id)}>
          <Text style={styles.btnText}>Sil</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Kategori Yönetimi</Text>

      {/* Yeni Kategori Ekle */}
      <View style={styles.addSection}>
        <TextInput
          style={styles.input}
          placeholder="Yeni Kategori Adı"
          value={newCategoryName}
          onChangeText={setNewCategoryName}
        />
        <TouchableOpacity style={styles.addBtn} onPress={handleAddCategory}>
          <Text style={styles.btnText}>Ekle</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        style={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f7f7f7' },
  header: { fontSize: 22, fontWeight: '700', marginBottom: 15, alignSelf: 'center' },
  addSection: {
    flexDirection: 'row',
    marginBottom: 20,
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 8,
    elevation: 1,
  },
  input: {
    flex: 1,
    height: 40,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    marginRight: 10,
  },
  addBtn: {
    backgroundColor: '#38A169',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 6,
    justifyContent: 'center',
  },
  btnText: { color: 'white', fontWeight: '600' },
  list: { width: '100%' },
  card: {
    backgroundColor: 'white',
    padding: 14,
    borderRadius: 8,
    marginBottom: 10,
    elevation: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardText: { fontSize: 16, fontWeight: '500' },
  row: {
    flexDirection: 'row',
  },
  editBtn: {
    backgroundColor: '#2b6cb0',
    padding: 8,
    borderRadius: 6,
    marginRight: 10,
  },
  deleteBtn: {
    backgroundColor: '#c53030',
    padding: 8,
    borderRadius: 6,
  },
});

export default CategoryManagementScreen;