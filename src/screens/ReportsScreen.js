import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ScrollView, Dimensions } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getAllSessions, deleteSession, deleteAllSessions } from '../storage/storage';
import { BarChart, PieChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

const formatTimeHHMMSS = (secs) => {
    const totalSeconds = Math.max(0, secs);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const h = hours.toString().padStart(2, '0');
    const m = minutes.toString().padStart(2, '0');
    const s = seconds.toString().padStart(2, '0');

    return `${h}:${m}:${s}`;
}

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

const isToday = (someDate) => {
  const today = new Date();
  const date = new Date(someDate);
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
}

const ReportsScreen = () => {
    const [sessions, setSessions] = useState([]);
    const [stats, setStats] = useState({
        todayFocusSec: 0,
        allTimeFocusSec: 0,
        totalDistractions: 0,
    });
    const [chartData, setChartData] = useState({
        barChart: { labels: [], datasets: [{ data: [] }] },
        pieChart: [],
        pieTotal: 0,
    });

    const isFocused = useIsFocused();

    useEffect(() => {
        if (isFocused) {
            loadSessions();
        }
    }, [isFocused]);

    const calculateStatsAndCharts = (allSessions) => {
        let todayFocusSec = 0;
        let allTimeFocusSec = 0;
        let totalDistractions = 0;

        const msPerDay = 24 * 60 * 60 * 1000;
        const now = Date.now();
        const sevenDaysAgo = now - 7 * msPerDay;

        const dailyFocusMap = new Map(); 
        const categoryFocusMap = new Map();
        let pieTotal = 0;

        for (let i = 0; i < 7; i++) {
            const date = new Date(now - i * msPerDay);
            const label = date.toLocaleDateString('tr-TR', { weekday: 'short' });
            dailyFocusMap.set(label, 0);
        }

        allSessions.forEach(session => {
            const duration = session.durationSec;
            const distractions = session.distractions;
            const sessionTime = new Date(session.date).getTime();

            allTimeFocusSec += duration;
            totalDistractions += distractions;
            pieTotal += duration;

            if (isToday(session.date)) {
                todayFocusSec += duration;
            }

            if (sessionTime > sevenDaysAgo) {
                const date = new Date(session.date);
                const label = date.toLocaleDateString('tr-TR', { weekday: 'short' });
                dailyFocusMap.set(label, dailyFocusMap.get(label) + duration);
            }

            const categoryName = session.category;
            categoryFocusMap.set(categoryName, (categoryFocusMap.get(categoryName) || 0) + duration);
        });
        
        const orderedWeekDays = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

        const barLabels = orderedWeekDays;
        const barData = orderedWeekDays.map(day => dailyFocusMap.get(day) || 0);

        const colorPalette = ['#38A169', '#3182CE', '#E53E3E', '#F6AD55', '#4C51BF', '#333333'];
        let colorIndex = 0;

        const pieData = Array.from(categoryFocusMap).map(([name, value]) => {
            const data = {
                name: name,
                population: value,
                color: colorPalette[colorIndex % colorPalette.length],
                legendFontColor: '#7F7F7F',
                legendFontSize: 11,
            };
            colorIndex++;
            return data;
        });

        setStats({ todayFocusSec, allTimeFocusSec, totalDistractions });
        setChartData({
            barChart: { labels: barLabels, datasets: [{ data: barData }] },
            pieChart: pieData,
            pieTotal: pieTotal,
        });
    };

    const loadSessions = async () => {
        const data = await getAllSessions();
        data.sort((a, b) => new Date(b.date) - new Date(a.date));
        setSessions(data);
        calculateStatsAndCharts(data);
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
              const success = await deleteSession(id); 
              if (success) { loadSessions(); } 
              else { Alert.alert('Hata', 'Seans silinirken bir sorun oluştu.'); }
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

    const StatCard = ({ title, value, isTime = false, iconName, color }) => (
        <View style={[styles.statCard, { borderColor: color }]}>
            <Ionicons name={iconName} size={28} color={color} style={styles.statIcon} />
            <View style={styles.statContent}>
                <Text style={styles.statTitle}>{title}</Text>
                {isTime ? (
                    <View>
                        <Text style={[styles.statValue, { color }]}>{formatTimeHHMMSS(value)}</Text>
                        <Text style={styles.statUnit}>({formatDurationDetail(value)})</Text>
                    </View>
                ) : (
                    <Text style={[styles.statValue, { color }]}>{value}</Text>
                )}
            </View>
        </View>
    );

    const renderItem = ({ item }) => {
        const durationText = formatDurationDetail(item.durationSec);
        const date = new Date(item.date).toLocaleDateString('tr-TR');
        const time = new Date(item.date).toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'});
        const status = item.completed ? 'Tamamlandı' : 'Durduruldu';

        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{item.category}</Text>
                    <Text style={[styles.cardStatus, item.completed ? styles.completed : styles.stopped]}>{status}</Text>
                </View>

                <View style={styles.cardBody}>
                    <View style={styles.detailRow}>
                        <Ionicons name="timer-outline" size={16} color="#38A169" />
                        <Text style={styles.detailText}>{durationText}</Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Ionicons name="alert-circle-outline" size={16} color="#E53E3E" />
                        <Text style={styles.detailText}>Dikkat Dağılımı: {item.distractions}</Text>
                    </View>
                    
                    <View style={styles.detailRow}>
                        <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                        <Text style={styles.detailText}>{date} {time}</Text>
                    </View>
                </View>
                
                <View style={styles.cardFooter}>
                  <View /> 
                  
                  <TouchableOpacity 
                    style={styles.deleteSingleBtn} 
                    onPress={() => handleDeleteSingle(item.id)}
                  >
                    <Ionicons name="trash-outline" size={18} color="white" />
                  </TouchableOpacity>
                </View>
            </View>
        );
    };

    const chartConfig = {
        backgroundGradientFrom: '#f7f7f7',
        backgroundGradientTo: '#f7f7f7',
        color: (opacity = 1) => `rgba(56, 161, 105, ${opacity})`, 
        strokeWidth: 2, 
        barPercentage: 0.5,
        useShadowColorFromDataset: false,
        labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
        decimalPlaces: 0, 
    };

    return (
        <ScrollView style={{ flex: 1, backgroundColor: '#f7f7f7' }}>
            <View style={styles.container}>
                <Text style={styles.title}>Raporlar (Dashboard)</Text>

                <View style={styles.statsContainer}>
                    <StatCard 
                        title="Bugün Odaklanma Süresi" 
                        value={stats.todayFocusSec} 
                        isTime={true}
                        iconName="time-outline"
                        color="#38A169" 
                    />
                    <StatCard 
                        title="Tüm Zamanların Süresi" 
                        value={stats.allTimeFocusSec} 
                        isTime={true} 
                        iconName="analytics-outline"
                        color="#3182CE"
                    />
                    <StatCard 
                        title="Toplam Dikkat Dağınıklığı" 
                        value={stats.totalDistractions} 
                        isTime={false}
                        iconName="alert-circle-outline"
                        color="#E53E3E"
                    />
                </View>

                <Text style={styles.chartTitle}>Son 7 Günlük Odaklanma (Saniye)</Text>
                {chartData.barChart.datasets[0].data.length > 0 && (
                    <BarChart
                        data={chartData.barChart}
                        width={screenWidth - 32} 
                        height={220}
                        yAxisLabel=""
                        chartConfig={chartConfig}
                        verticalLabelRotation={30}
                        style={styles.chart}
                    />
                )}

                {chartData.pieTotal > 0 && (
                    <View>
                        <Text style={styles.chartTitle}>Kategoriye Göre Süre Dağılımı</Text>
                        <PieChart
                            data={chartData.pieChart}
                            width={screenWidth - 32}
                            height={220}
                            chartConfig={chartConfig}
                            accessor={"population"} 
                            backgroundColor={"transparent"}
                            paddingLeft={"15"}
                            center={[72, 0]}
                            hasLegend={false}
                            style={styles.chart}
                        />
                        
                        <View style={styles.customLegend}>
                            {chartData.pieChart.map((item, index) => {
                                const percentage = Math.round((item.population / chartData.pieTotal) * 100);
                                const formattedTime = formatDurationDetail(item.population);
                                
                                return (
                                    <View key={index} style={styles.legendItem}>
                                        <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                                        <View style={styles.legendTextContainer}>
                                            <Text style={styles.legendTitle}>
                                                {item.name} ({percentage}%)
                                            </Text>
                                            <Text style={styles.legendDuration}>{formattedTime}</Text>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                )}
                
                <Text style={styles.subTitle}>Seans Geçmişi</Text>

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
                        scrollEnabled={false} 
                        contentContainerStyle={styles.listContainer}
                    />
                )}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#f7f7f7',
    },
    title: {
        fontSize: 24,
        fontWeight: '900',
        marginBottom: 15,
        alignSelf: 'center',
        color: '#333',
    },
    subTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginTop: 20,
        marginBottom: 10,
        color: '#555',
    },
    statsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    statCard: {
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
        width: '100%', 
        elevation: 3,
        flexDirection: 'row',
        alignItems: 'center',
        borderLeftWidth: 5,
    },
    statIcon: {
        marginRight: 10,
        alignSelf: 'center',
    },
    statContent: {
        flex: 1,
    },
    statValue: {
        fontSize: 18,
        fontWeight: '900',
    },
    statTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: '#666',
    },
    statUnit: {
        fontSize: 10,
        color: '#999',
    },
    chartTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginTop: 20,
        marginBottom: 5,
        color: '#333',
        textAlign: 'center',
    },
    chart: {
        marginVertical: 8,
        borderRadius: 10,
        paddingRight: 0,
        backgroundColor: 'white',
        elevation: 3,
        paddingBottom: 0,
    },
    customLegend: {
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 10,
        marginTop: 10,
        elevation: 2,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    legendColor: {
        width: 16,
        height: 16,
        borderRadius: 8,
        marginRight: 10,
    },
    legendTextContainer: {
        flex: 1,
    },
    legendTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 2,
    },
    legendDuration: {
        fontSize: 12,
        color: '#666',
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
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
    },
    cardStatus: {
        fontSize: 12,
        fontWeight: '600',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 4,
    },
    cardBody: {
        paddingTop: 8,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    detailText: {
        fontSize: 14,
        color: '#555',
        marginLeft: 8,
    },
    cardFooter: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginTop: 10,
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
      padding: 8,
      borderRadius: 4,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 50,
        fontSize: 16,
        color: '#666',
    }
});

export default ReportsScreen;