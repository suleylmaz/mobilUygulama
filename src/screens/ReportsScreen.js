import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ReportsScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Raporlar (Dashboard)</Text>
      <Text>Burada istatistikler ve grafikler yer alacak.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 10,
  }
});

export default ReportsScreen;