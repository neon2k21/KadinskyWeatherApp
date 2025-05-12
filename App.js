import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Button,
} from 'react-native';
import * as Location from 'expo-location';
import axios from 'axios';
import WeatherDayCard from './WeatherDayCard'; // Импортируем новый компонент

// ⚠️ Вставь сюда свой ключ от Visual Crossing
const API_KEY = 'S8EZG6Y5NW4URSU4T2PMECRZA'; // <-- заменить на свой



export default function App() {
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWeatherByLocation();
  }, []);

  const fetchWeatherByLocation = async () => {
    setLoading(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Разрешение на геолокацию не получено');
        setLoading(false);
        return;
      }

      // Получаем координаты устройства
      let locationData = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = locationData.coords;

      // Формируем URL согласно Timeline API
      const url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${latitude},${longitude}`;

      const params = {
        key: API_KEY,
        unitGroup: 'metric',
        include: 'current,days',
        contentType: 'json',
      };

      const response = await axios.get(url, { params });

      if (response.data) {
        const data = response.data;

        // Текущая погода — currentConditions это ОБЪЕКТ
        if (data.currentConditions) {
          const current = data.currentConditions;

          setWeather({
            city: data.resolvedAddress || 'Неизвестное место',
            temp: current.temp,
            feelsLike: current.feelslike,
            conditions: current.icon, // Преобразуем иконку
            windSpeed: current.windspeed,
            humidity: current.humidity,
          });
        } else {
          setErrorMsg('Нет данных о текущей погоде');
        }

        // Прогноз на дни
        if (data.days && Array.isArray(data.days)) {
          const forecastData = data.days.slice(1, 6).map((day) => {
            // Преобразуем дату в день недели
            const date = new Date(day.datetime);
            const dayOfWeek = date.toLocaleDateString('ru-RU', { weekday: 'long' });

            return {
              date: dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1), // Делаем первую букву заглавной
              tempMax: day.tempmax,
              tempMin: day.tempmin,
              conditions: day.icon, // Преобразуем иконку
            };
          });

          setForecast(forecastData);
        } else {
          setForecast([]);
        }
      }
    } catch (error) {
      console.error('Ошибка при запросе погоды:', error.response?.data || error.message);
      setErrorMsg(`Ошибка: ${error.message}`);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text>Получение данных...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🌤️ Погода сейчас</Text>

      {errorMsg ? (
        <Text style={styles.error}>{errorMsg}</Text>
      ) : weather ? (
        <>
          <Text style={styles.text}>📍 Город: {weather.city}</Text>
          <Text style={styles.text}>🌡️ Температура: {weather.temp}°C</Text>
          <Text style={styles.text}>🧣 Ощущается как: {weather.feelsLike}°C</Text>
          <Text style={styles.text}>☁️ Условия: {weather.conditions}</Text>
          <Text style={styles.text}>🌬️ Ветер: {weather.windSpeed} м/с</Text>
          <Text style={styles.text}>💧 Влажность: {weather.humidity}%</Text>
        </>
      ) : (
        <Text>Нет данных о текущей погоде</Text>
      )}

      <Text style={styles.subtitle}>📅 Прогноз на 5 дней</Text>

      {forecast.length > 0 ? (
        <FlatList
          data={forecast}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => <WeatherDayCard day={item} />}
          horizontal={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.forecastContainer}
        />
      ) : (
        <Text>Прогноз недоступен</Text>
      )}

      <Button title="🔄 Обновить" onPress={fetchWeatherByLocation} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f9f9f9',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 20,
    marginTop: 20,
    marginBottom: 10,
  },
  text: {
    fontSize: 18,
    marginVertical: 4,
  },
  error: {
    fontSize: 18,
    color: 'red',
  },
  forecastContainer: {
    paddingBottom: 20,
  },
});