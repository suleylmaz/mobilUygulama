import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const HomeScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ana Sayfa (Zamanlayıcı)</Text>
      <Text>Burada sayaç ve butonlar yer alacak.</Text>
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

export default HomeScreen;