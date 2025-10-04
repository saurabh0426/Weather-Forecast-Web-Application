// ...existing code...
document.addEventListener("DOMContentLoaded", () => {
  const tempEl = document.getElementById("tempValue");
  const cityEl = document.getElementById("cityValue");
  const weatherEl = document.getElementById("weatherValue");
  const dateEl = document.getElementById("dateValue");
  const timeEl = document.getElementById("timeValue");
  const form = document.getElementById("searchForm");
  const input = document.getElementById("cityInput");
  const statusEl = document.getElementById("status");

  // welcome banner logic
  const welcome = document.getElementById("welcome");
  const closeWelcome = document.getElementById("closeWelcome");
  function showWelcome(){ if(!welcome) return; welcome.classList.add("show"); setTimeout(()=>hideWelcome(),4500); }
  function hideWelcome(){ if(!welcome) return; welcome.classList.remove("show"); }
  if (closeWelcome) closeWelcome.addEventListener("click", (e)=>{ e.preventDefault(); hideWelcome(); });
  showWelcome();

  function updateDateTime(ms = Date.now()) {
    const d = new Date(ms);
    dateEl.textContent = d.toLocaleDateString();
    timeEl.textContent = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  const weatherCodeMap = {
    0: "Clear",1: "Mainly clear",2: "Partly cloudy",3: "Overcast",
    45: "Fog",48: "Depositing rime fog",51: "Light drizzle",53: "Moderate drizzle",
    55: "Dense drizzle",56: "Light freezing drizzle",57: "Dense freezing drizzle",
    61: "Slight rain",63: "Moderate rain",65: "Heavy rain",66: "Light freezing rain",
    67: "Heavy freezing rain",71: "Slight snow",73: "Moderate snow",75: "Heavy snow",
    77: "Snow grains",80: "Slight rain showers",81: "Moderate rain showers",82: "Violent rain showers",
    85: "Slight snow showers",86: "Heavy snow showers",95: "Thunderstorm",96: "Thunderstorm with slight hail",99: "Thunderstorm with heavy hail"
  };

  async function geocodeCity(name) {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=en&format=json`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Geocoding API error");
    const data = await res.json();
    if (!data.results || data.results.length === 0) throw new Error("City not found");
    const r = data.results[0];
    return { name: r.name, country: r.country ?? "", lat: r.latitude, lon: r.longitude };
  }

  async function fetchOpenMeteo(lat, lon) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=auto`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Weather API error");
    return await res.json();
  }

  async function fetchWeather(city) {
    statusEl.textContent = "Searching...";
    try {
      const loc = await geocodeCity(city);
      statusEl.textContent = `Getting weather for ${loc.name}${loc.country ? ", " + loc.country : ""}...`;
      const weatherData = await fetchOpenMeteo(loc.lat, loc.lon);
      const cw = weatherData.current_weather;
      if (!cw) throw new Error("No current weather available");

      const tempC = typeof cw.temperature === "number" ? Math.round(cw.temperature) : "N/A";
      const code = typeof cw.weathercode === "number" ? cw.weathercode : null;
      const desc = code !== null && weatherCodeMap[code] ? weatherCodeMap[code] : "Unknown";

      tempEl.textContent = typeof tempC === "number" ? `${tempC}°C` : tempC;
      cityEl.textContent = `${loc.name}${loc.country ? ", " + loc.country : ""}`;
      weatherEl.textContent = desc;
      updateDateTime(cw.time ? new Date(cw.time).getTime() : Date.now());
      statusEl.textContent = "Last updated";
    } catch (err) {
      statusEl.textContent = err.message || "Error fetching weather";
    }
  }

  // initial clock and periodic update
  updateDateTime();
  setInterval(() => updateDateTime(), 60 * 1000);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const q = input.value.trim();
    if (!q) { statusEl.textContent = "Enter a city name"; return; }
    fetchWeather(q);
    input.value = "";
  });

  // optional: load a default city
  fetchWeather("New York");
});