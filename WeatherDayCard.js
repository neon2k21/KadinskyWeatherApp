import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { LinearGradient, Rect, Defs, Stop } from 'react-native-svg';

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

  // Расчёт ширины заполнения прогресс-бара
  const progressWidth = ((day.temp - day.tempMin) / (day.tempMax - day.tempMin)) * 100;

  return (
    <View style={styles.cardContainer}>
      {/* День недели */}
      <Text style={styles.date}>{day.date}</Text>

      {/* Иконка погоды */}
      <Text style={styles.weatherIcon}>{icon}</Text>

      {/* Прогресс-бар с температурой */}
      <View style={styles.temperatureContainer}>
        <Text style={styles.tempMin}>{day.tempMin}°</Text>

        {/* Прогресс-бар */}
        <View style={styles.progressBarContainer}>
          <Svg width="100%" height="8">
            <Defs>
              <LinearGradient id="gradient" x1="0" y1="0" x2="100%" y2="0">
                <Stop offset="0%" stopColor="#2196F3" />
                <Stop offset="100%" stopColor="#FF5722" />
              </LinearGradient>
            </Defs>
            <Rect
              x="0"
              y="0"
              width={`${progressWidth}%`} // Ширина зависит от текущей температуры
              height="8"
              rx="4"
              fill="url(#gradient)"
            />
          </Svg>
        </View>

        <Text style={styles.tempMax}>{day.tempMax}°</Text>
      </View>
    </View>
  );
};

export default WeatherDayCard;

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  cardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#282C34',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginBottom: 10,
    width
  },
  date: {
    fontSize: 16,
    color: '#fff',
    marginRight: 10,
  },
  weatherIcon: {
    fontSize: 24,
    color: '#fff',
    marginRight: 10,
  },
  temperatureContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tempMin: {
    fontSize: 16,
    color: '#fff',
  },
  tempMax: {
    fontSize: 16,
    color: '#fff',
  },
  progressBarContainer: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#FF0000', // Серый фон для прогресс-бара
  },
});