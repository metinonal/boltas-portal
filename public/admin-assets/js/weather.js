document.addEventListener('DOMContentLoaded', async () => {
    const citySelect = document.getElementById('citySelect');
    const weatherInfo = document.getElementById('weather-info');
    const cities = [
      'Istanbul', 'Ankara', 'İzmir', 'Adana', 'Nürnberg', 'Trieste',
      'Willich', 'Bucuresti', 'Akyaka', 'Hamzabeyli', 'Edirne'
    ];
  
    // Sayfa yüklendiğinde veriyi kontrol et ve gerekiyorsa güncelle
    await checkAndUpdateWeatherData();
  
    // Çerezden şehir bilgisi al
    const savedCity = getCookie('selectedCity');
    if (savedCity) {
      citySelect.value = savedCity;
      displayWeather(savedCity);
    }
  
    citySelect.addEventListener('change', function () {
      const city = citySelect.value;
      setCookie('selectedCity', city, 30);
      displayWeather(city);
    });
  
    // LocalStorage'tan hava durumu verisini göster
    function displayWeather(city) {
      const weatherData = JSON.parse(localStorage.getItem('weatherData'));
      if (!weatherData || !weatherData[city]) {
        weatherInfo.innerHTML = "<p class='text-danger'>Hava durumu bilgisi bulunamadı.</p>";
        return;
      }
  
      const data = weatherData[city];
      const iconCode = data.weather[0].icon;
      const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  
      weatherInfo.innerHTML = `
        <div class="d-flex align-items-center">
          <img src="${iconUrl}" alt="Hava Durumu İkonu" class="me-3">
          <div>
            <p class="mb-0"><strong>Sıcaklık:</strong> ${data.main.temp}°C</p>
            <p class="mb-0"><strong>Hissedilen:</strong> ${data.main.feels_like}°C</p>
            <p class="mb-0"><strong>Durum:</strong> ${data.weather[0].description}</p>
          </div>
        </div>
      `;
    }
  
    // Hava durumu verisini kontrol et ve gerekiyorsa API'den çek
    async function checkAndUpdateWeatherData() {
      const lastUpdate = localStorage.getItem('lastUpdate');
      const now = new Date().getTime();
  
      // Eğer veri 1 saatten eskiyse veya hiç yoksa güncelle
      if (!lastUpdate || now - lastUpdate > 60 * 60 * 1000) {
        await fetchAndSaveWeatherData();
        localStorage.setItem('lastUpdate', now);
      }
    }
  
    // Tüm şehirler için hava durumu verisini çek ve localStorage'a kaydet
    async function fetchAndSaveWeatherData() {
      const apiKey = 'aab6b5f43323f1d3590fca07dc1c07f2';
      const weatherData = {};
  
      for (const city of cities) {
        try {
          const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric&lang=tr`;
          const response = await fetch(url);
          if (!response.ok) throw new Error(`Veri alınamadı: ${city}`);
  
          weatherData[city] = await response.json();
        } catch (error) {
          console.error(`Hata: ${error.message}`);
        }
      }
  
      localStorage.setItem('weatherData', JSON.stringify(weatherData));
    }
  
    // Çerez oluşturma fonksiyonu
    function setCookie(name, value, days) {
      const date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      const expires = "expires=" + date.toUTCString();
      document.cookie = `${name}=${value}; ${expires}; path=/`;
    }
  
    // Çerez okuma fonksiyonu
    function getCookie(name) {
      const decodedCookie = decodeURIComponent(document.cookie);
      const cookiesArray = decodedCookie.split(';');
      for (let i = 0; i < cookiesArray.length; i++) {
        let cookie = cookiesArray[i].trim();
        if (cookie.indexOf(name + "=") == 0) {
          return cookie.substring(name.length + 1);
        }
      }
      return "";
    }
  });