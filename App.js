import React, { useEffect, useState } from 'react';
import Favicon from './assets/favicon.jpg'; // Импортируем запасную картинку
import {
  View,
  Text,
  Image,
  Button,
  StyleSheet,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { heightPercentageToDP, widthPercentageToDP } from "react-native-responsive-screen";
import * as Location from 'expo-location';
import WeatherDayCard from './WeatherDayCard'; // Импортируем компонент для прогноза
import { BlurView } from 'expo-blur'; // Импортируем BlurView


const WEATHER_API_KEY = 'S8EZG6Y5NW4URSU4T2PMECRZA';

// ⚠️ Ключи от Fusion Brain (Kandinsky)
const FUSION_BRAIN_API_KEY = 'D266D9D5232651D4B2C3741225BF07A1';
const FUSION_BRAIN_SECRET_KEY = '3B495B4BD738CFFE9DD238F5ACF2211F';

const weatherMapper = {
  clear: 'солнечная погода, ясное небо, без осадков',
  cloudy: 'пасмурная погода, облачное небо',
  rain: 'дождливая погода, лужи и капли дождя',
  snow: 'зимняя погода, снег и сугробы',
  storm: 'гроза, молнии и тучи',
  fog: 'туманная погода, ограниченная видимость',
  default: 'типичная погода, небо и облака',
};

const WeatherImageScreen = () => {
  const [weather, setWeather] = useState(null);     // Текущая погода
  const [forecast, setForecast] = useState([]);     // Прогноз на 5 дней
  const [generatedImage, setGeneratedImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchWeatherByLocation();
  }, []);

  useEffect(() => {
    if (weather) {
      const description = weatherMapper[weather.conditions] || weatherMapper.default;
      generateWeatherImage(description);
    }
  }, [weather]);

  const fetchCityByCoordinates = async (latitude, longitude) => {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat= ${latitude}&lon=${longitude}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.address) {
        const city = data.address.city || data.address.town || data.address.village || 'Неизвестное место';
        return city;
      } else {
        console.error('Ошибка при получении данных о городе:', data);
        return 'Неизвестное место';
      }
    } catch (error) {
      console.error('Ошибка сети при запросе к OpenStreetMap:', error);
      return 'Неизвестное место';
    }
  };

  const fetchWeatherByLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Разрешение на доступ к местоположению не предоставлено');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      // Получаем город через OpenStreetMap Nominatim
      const city = await fetchCityByCoordinates(latitude, longitude);

      const url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/ ${latitude},${longitude}?unitGroup=metric&key=${WEATHER_API_KEY}&contentType=json`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.currentConditions) {
        const current = data.currentConditions;
        setWeather({
          city: city || data.resolvedAddress || 'Неизвестное место',
          temp: current.temp,
          feelsLike: current.feelslike,
          conditions: current.icon,
          windSpeed: current.windspeed,
          humidity: current.humidity,
        });
      }

      if (data.days && Array.isArray(data.days)) {
        const forecastData = data.days.slice(1, 6).map((day) => {
          const date = new Date(day.datetime);
          const dayOfWeek = date.toLocaleDateString('ru-RU', { weekday: 'long' });
          return {
            date: dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1),
            tempMax: day.tempmax,
            tempMin: day.tempmin,
            conditions: day.icon,
          };
        });
        setForecast(forecastData);
      } else {
        setForecast([]);
      }
    } catch (error) {
      console.error('Ошибка при получении погоды:', error);
      setError('Не удалось получить данные о погоде');
    }
  };

  const fetchPipelineId = async () => {
    try {
      const url = 'https://api-key.fusionbrain.ai/key/api/v1/pipelines';
      const response = await fetch(url, {
        headers: {
          'X-Key': `Key ${FUSION_BRAIN_API_KEY}`,
          'X-Secret': `Secret ${FUSION_BRAIN_SECRET_KEY}`,
        },
      });
      const data = await response.json();
      return data[0].id;
    } catch (error) {
      console.error('Ошибка при получении pipeline ID:', error);
      setError('Не удалось подключиться к сервису генерации изображений');
      throw error;
    }
  };

  const generateWeatherImage = async (description) => {
    setIsLoading(true);
    setError(null);
    try {
      const pipelineId = await fetchPipelineId();

      const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
      const contentType = 'multipart/form-data; boundary=' + boundary;

      const body = [
        `--${boundary}`,
        'Content-Disposition: form-data; name="pipeline_id"',
        '',
        pipelineId,
        `--${boundary}`,
        'Content-Disposition: form-data; name="params"',
        'Content-Type: application/json',
        '',
        JSON.stringify({
          type: "GENERATE",
          numImages: 1,
          width: 512,
          height: 512,
          generateParams: {
            query: description,
          },
        }),
        `--${boundary}--`,
      ].join('\r\n');

      const response = await fetch('https://api-key.fusionbrain.ai/key/api/v1/pipeline/run', {
        method: 'POST',
        headers: {
          'X-Key': `Key ${FUSION_BRAIN_API_KEY}`,
          'X-Secret': `Secret ${FUSION_BRAIN_SECRET_KEY}`,
          'Content-Type': contentType,
        },
        body,
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Ошибка генерации изображения:', result);
        setError('Ошибка при генерации изображения');
        return null;
      }

      const imageUrl = await checkGenerationStatus(result.uuid);
      if (imageUrl) {
        // Добавляем base64 префикс для корректного отображения
        setGeneratedImage(`data:image/jpeg;base64,${imageUrl}`);
      }
    } catch (error) {
      console.error('Ошибка при отправке запроса:', error);
      setError('Произошла ошибка при генерации изображения');
    } finally {
      setIsLoading(false);
    }
  };

  const checkGenerationStatus = async (uuid) => {
    const url = `https://api-key.fusionbrain.ai/key/api/v1/pipeline/status/${uuid}`;

    return new Promise((resolve, reject) => {
      const interval = setInterval(async () => {
        try {
          const response = await fetch(url, {
            headers: {
              'X-Key': `Key ${FUSION_BRAIN_API_KEY}`,
              'X-Secret': `Secret ${FUSION_BRAIN_SECRET_KEY}`,
            },
          });
          const data = await response.json();
          console.log('Статус генерации:', data.status);

          if (data.status === 'DONE') {
            clearInterval(interval);
            if (data.result?.files?.[0]) {
              resolve(data.result.files[0]);
            } else {
              reject(new Error('Изображение не найдено в ответе'));
            }
          } else if (data.status === 'FAILED') {
            clearInterval(interval);
            reject(new Error('Генерация изображения не удалась'));
          }
        } catch (err) {
          clearInterval(interval);
          reject(err);
        }
      }, 2000);

      // Таймаут через 30 секунд
      setTimeout(() => {
        clearInterval(interval);
        reject(new Error('Превышено время ожидания генерации изображения'));
      }, 30000);
    });
  };

  const handleRegenerate = () => {
    if (weather) {
      const desc = weatherMapper[weather?.conditions] || weatherMapper.default;
      generateWeatherImage(desc);
    }
  };

return (
  <View style={styles.container}>
    {/* Фоновое изображение */}
      <Image
      source={generatedImage ? { uri: generatedImage } : Favicon} // Условный выбор источника
      style={styles.backgroundImage}
      resizeMode="cover"
      onError={(e) => {
        console.error('Ошибка загрузки изображения:', e.nativeEvent.error);
        setError('Не удалось загрузить изображение');
      }}
    />

    {/* Контент поверх фона */}
    <View style={styles.foregroundContent}>
    {isLoading ? (
        <View style={styles.loadingContainer}>
          <Image source={require('./assets/favicon.jpg')} style={{height:heightPercentageToDP(5), width:heightPercentageToDP(5),alignSelf:'center'}}/>
          {/* <ActivityIndicator size="large" color="#0000ff" /> */}
          <Text>Генерация изображения...</Text>
        </View>
      ) : !generatedImage ? (
        <Text style={styles.noImageText}>Изображение не сгенерировано</Text>
      ) : null}
      <Text style={styles.header}>🌤️ Погода сейчас</Text>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {weather ? (
        <>
          <Text style={styles.text}>📍 Город: {weather.city}</Text>
          <Text style={styles.text}>🌡️ Температура: {weather.temp}°C</Text>
          <Text style={styles.text}>🧣 Ощущается как: {weather.feelsLike}°C</Text>
          <Text style={styles.text}>🌬️ Ветер: {weather.windSpeed} км/ч</Text>
          <Text style={styles.text}>💧 Влажность: {weather.humidity}%</Text>
        </>
      ) : (
        <Text>Нет данных о текущей погоде</Text>
      )}

      <Text style={styles.subtitle}>📅 Прогноз на 5 дней</Text>

      {/* Контейнер под прогноз с glass-стилем */}
      <BlurView
      intensity={30} // Сила размытия (чем больше значение, тем сильнее размытие)
      tint="default"   // Тип размытия: 'light', 'dark', 'default'
      style={styles.glassForecastContainer}
    >
        {forecast.length > 0 ? (
          <FlatList
            data={forecast}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => <WeatherDayCard day={item} />}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.forecastContainer}
          />
        ) : (
          <Text style={styles.noDataText}>Прогноз недоступен</Text>
        )}
</BlurView>
    

      <Button style={styles.appButtonContainer} title="🔄 Сгенерировать снова" onPress={handleRegenerate} disabled={isLoading || !weather} />
    </View>
  </View>
);
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: -1,
  },
  foregroundContent: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    marginTop: heightPercentageToDP(6)
  },
  glassForecastContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // стеклянный эффект
    borderRadius: 15,
    padding: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  forecastContainer: {
    paddingBottom: 10,
  },
  noDataText: {
    textAlign: 'center',
    color: '#ddd',
    marginVertical: 10,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    alignSelf: 'center',
  },
  subtitle: {
    fontSize: 20,
    marginTop: 20,
    marginBottom: 10,
    alignSelf: 'flex-start',
    color: '#fff',
  },
  text: {
    fontSize: 18,
    marginVertical: 4,
    color: '#000',
  },
  loadingContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  noImageText: {
    textAlign: 'center',
    marginBottom: 20,
    color: '#888',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 10,
    borderRadius: 5,
    marginBottom: 20,
  },
  errorText: {
    color: '#d32f2f',
    textAlign: 'center',
  },
  appButtonContainer: {
    elevation: 8,
    backgroundColor: "#009688",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12
  },
  loadingContainer:{
    marginTop:heightPercentageToDP(4),
    alignSelf:'center'
  }
});

export default WeatherImageScreen;