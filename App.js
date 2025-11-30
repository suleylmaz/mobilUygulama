import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons'; 

import HomeScreen from './src/screens/HomeScreen';
import ReportsScreen from './src/screens/ReportsScreen';

const Tab = createBottomTabNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;
            
            if (route.name === 'Ana Sayfa') {
              iconName = focused ? 'timer' : 'timer-outline';
            } else if (route.name === 'Raporlar') {
              iconName = focused ? 'bar-chart' : 'bar-chart-outline';
            }
            
            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#38A169', 
          tabBarInactiveTintColor: 'gray', 
        })}
      >
        <Tab.Screen 
            name="Ana Sayfa" 
            component={HomeScreen} 
            options={{ title: 'Odaklanma' }} 
        />
        <Tab.Screen 
            name="Raporlar" 
            component={ReportsScreen} 
            options={{ title: 'Raporlar' }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

export default App;