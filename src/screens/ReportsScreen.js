import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { getAllSessions, deleteSession, deleteAllSessions } from '../storage/storage';

const formatDurationDetail = (secs) => {
    const totalSeconds = Math.max(0, secs);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    let parts = [];
    if (hours > 0) {
      parts.push(`${hours} saat`);
    }
    if (minutes > 0 || (hours === 0 && seconds === 0 && totalSeconds > 0)) { 
      parts.push(`${minutes} dakika`);
    }
    if (seconds > 0) {
      parts.push(`${seconds} saniye`);
    }

    if (parts.length === 0 && totalSeconds === 0) return '0 saniye';
    return parts.join(' ');
}


const ReportsScreen = () => {
    const [sessions, setSessions] = useState([]);
    const isFocused = useIsFocused();

    useEffect(() => {
        if (isFocused) {
            loadSessions();
        }
    }, [isFocused]);

    const loadSessions = async () => {
        const data = await getAllSessions();
        data.sort((a, b) => new Date(b.date) - new Date(a.date));
        setSessions(data);
    };

    const handleDeleteSingle = (id) => {
      Alert.alert(
        'Seansı Sil',
        'Bu seansı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.',
        [
          { text: 'İptal', style: 'cancel' },
          {
            text: 'Sil',
            style: 'destructive',
            onPress: async () => {
              const success = await deleteSession(id); // Tekil silme
              if (success) {
                  loadSessions();
              } else {
                  Alert.alert('Hata', 'Seans silinirken bir sorun oluştu.');
              }
            },
          },
        ]
      );
    };

    const handleDeleteAll = () => {
        if (sessions.length === 0) {
            Alert.alert('Hata', 'Silinecek herhangi bir seans bulunmamaktadır.');
            return;
        }

        Alert.alert(
            'Tüm Seansları Sil',
            `Tüm ${sessions.length} seansı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`,
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Hepsini Sil',
                    style: 'destructive',
                    onPress: async () => {
                        const success = await deleteAllSessions(); 
                        if (success) {
                            loadSessions();
                            Alert.alert('Başarılı', 'Tüm seans geçmişi başarıyla silindi.');
                        } else {
                            Alert.alert('Hata', 'Seanslar silinirken bir sorun oluştu.');
                        }
                    },
                },
            ]
        );
    };

    const renderItem = ({ item }) => {
        const durationText = formatDurationDetail(item.durationSec);
        const date = new Date(item.date).toLocaleDateString('tr-TR');
        const time = new Date(item.date).toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'});
        const status = item.completed ? ' Tamamlandı' : 'Durduruldu';

        return (
            <View style={styles.card}>
                <View style={styles.row}>
                    <Text style={styles.cardTitle}>{item.category}</Text>
                    <Text style={[styles.cardStatus, item.completed ? styles.completed : styles.stopped]}>{status}</Text>
                </View>
                <Text style={styles.cardDetail}>Süre: {durationText}</Text>
                <Text style={styles.cardDetail}>Dikkat Dağılımı: {item.distractions}</Text>
                
                <View style={styles.cardFooter}>
                  <Text style={styles.cardDate}>{date} {time}</Text>
                  
                
                  <TouchableOpacity 
                    style={styles.deleteSingleBtn} 
                    onPress={() => handleDeleteSingle(item.id)}
                  >
                    <Text style={styles.deleteSingleText}>Sil</Text>
                  </TouchableOpacity>
                </View>

            </View>
        );
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Raporlar (Seans Geçmişi)</Text>
            
            {sessions.length > 0 && (
                <TouchableOpacity 
                  style={styles.deleteAllBtn} 
                  onPress={handleDeleteAll}
                >
                    <Text style={styles.deleteAllText}>Tüm Seansları Sil</Text>
                </TouchableOpacity>
            )}

            {sessions.length === 0 ? (
                <Text style={styles.emptyText}>Henüz kaydedilmiş bir seansınız yok.</Text>
            ) : (
                <FlatList
                    data={sessions}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContainer}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#f7f7f7',
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 15,
        alignSelf: 'center',
    },
    deleteAllBtn: {
        backgroundColor: '#C53030', 
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 15,
    },
    deleteAllText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 16,
    },
    listContainer: {
        paddingBottom: 20,
    },
    card: {
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 8,
        marginBottom: 10,
        elevation: 2,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 5,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
    },
    cardDetail: {
        fontSize: 14,
        color: '#555',
        marginBottom: 2,
    },
    cardFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 8,
    },
    cardDate: {
        fontSize: 12,
        color: '#999',
    },
    cardStatus: {
        fontSize: 14,
        fontWeight: '600',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 4,
    },
    completed: {
        backgroundColor: '#D1FAE5',
        color: '#065F46',
    },
    stopped: {
        backgroundColor: '#FEE2E2',
        color: '#991B1B',
    },
    deleteSingleBtn: {
      backgroundColor: '#EF4444',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 4,
    },
    deleteSingleText: {
      color: 'white',
      fontWeight: '600',
      fontSize: 14,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 50,
        fontSize: 16,
        color: '#666',
    }
});

export default ReportsScreen;