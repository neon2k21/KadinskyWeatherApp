import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { LinearGradient, Rect, Defs, Stop } from 'react-native-svg';
import { BlurView } from 'expo-blur'; // Импортируем BlurView

// Словарь для преобразования условий погоды в эмодзи
const weatherIcons = {
  'partly-cloudy-day': '🌤️',
  'partly-cloudy-night': '🌙',
  'clear-day': '☀️',
  'clear-night': '🌌',
  'rain': '🌧️',
  'snow': '❄️',
  'thunderstorm': '⛈️',
  'cloudy': '☁️',
  'fog': '🌫️',
  'wind': '🌬️',
  'default': '❓',
};

// Функция для получения эмодзи по условию погоды
const getWeatherIcon = (conditions) => {
  const key = conditions.toLowerCase().replace(/ /g, '-');
  return weatherIcons[key] || weatherIcons['default'];
};

const WeatherDayCard = ({ day }) => {
  const icon = getWeatherIcon(day.conditions);

  // Округляем среднюю температуру для прогресс-бара
  const avgTemp = Math.round((day.tempMax + day.tempMin) / 2);
  const progressWidth = ((avgTemp - day.tempMin) / (day.tempMax - day.tempMin)) * 100;

  return (
    <View style={styles.cardContainer}>
      {/* День недели */}
      <Text style={styles.date}>{day.date}</Text>

      {/* Иконка и температура в отдельной строке */}
      <View style={styles.weatherRow}>
        <Text style={styles.weatherIcon}>{icon}</Text>
        <View style={styles.temperatureContainer}>
          <Text style={styles.tempMin}>{Math.round(day.tempMin)}°</Text>

          {/* Прогресс-бар с glass-дизайном */}
          <View style={styles.progressBarGlassContainer}>
            <Svg width="100%" height="8">
              <Defs>
                <LinearGradient id="gradient" x1="0" y1="0" x2="100%" y2="0">
                  <Stop offset="0%" stopColor="#4fc3f7" />
                  <Stop offset="100%" stopColor="#f44336" />
                </LinearGradient>
              </Defs>
              <Rect
                x="0"
                y="0"
                width={`${progressWidth}%`}
                height="8"
                rx="4"
                fill="url(#gradient)"
              />
            </Svg>
          </View>

          <Text style={styles.tempMax}>{Math.round(day.tempMax)}°</Text>
        </View>
      </View>
    </View>
  );
};

export default WeatherDayCard;

const styles = StyleSheet.create({
  cardContainer: {
    flexDirection: 'column',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
    marginHorizontal: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    backdropFilter: 'blur(10px)', // Работает только на iOS или через специальные либы на Android
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
  },
  date: {
    fontSize: 16,
    color: '#ffffffcc',
    fontWeight: '500',
    marginBottom: 8,
  },
  weatherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  weatherIcon: {
    fontSize: 26,
    color: '#fff',
    marginRight: 12,
  },
  temperatureContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tempMin: {
    fontSize: 16,
    color: '#aeeaff',
    fontWeight: '500',
    minWidth: 30,
    textAlign: 'left',
  },
  tempMax: {
    fontSize: 16,
    color: '#ff9a9a',
    fontWeight: '500',
    minWidth: 30,
    textAlign: 'right',
  },
  progressBarGlassContainer: {
    flex: 1,
    height: 8,
    marginHorizontal: 8,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.2)', // полупрозрачный фон
  },
});