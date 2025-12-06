require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

const CWA_API_KEY = process.env.CWA_API_KEY;
const CWA_API_BASE_URL = "https://opendata.cwa.gov.tw/api/v1/rest/datastore";

app.use(cors());
app.use(express.json());

// ⚠ 一週預報 API（F-D0047 系列）
const getWeekWeather = async (req, res) => {
  try {
    if (!CWA_API_KEY)
      return res.status(500).json({ error: "APIKEY 缺失" });

    const city = req.query.city || "屏東縣"; // 可由前端傳入 ?city=高雄市

    const response = await axios.get(`${CWA_API_BASE_URL}/F-D0047-089`, {
      params: { Authorization: CWA_API_KEY, locationName: city }
    });

    const location = response.data.records.locations[0].location[0];
    const weatherElements = location.weatherElement;

    // 你想的簡版一週資料整理
    let week = [];

    for (let i = 0; i < 14; i++) { // API 每12H一筆，7天=14筆
      week.push({
        start: weatherElements[0].time[i].startTime,
        end: weatherElements[0].time[i].endTime,
        weather: weatherElements[6].time[i].elementValue[0].value, // 天氣現象描述
        minTemp: weatherElements[8].time[i].elementValue[0].value + "°C",
        maxTemp: weatherElements[12].time[i].elementValue[0].value + "°C",
        rainProbability: weatherElements[0].time[i].elementValue[1]?.value + "%" || "無資料"
      });
    }

    res.json({
      success: true,
      city,
      week
    });

  } catch (err) {
    console.error("一週天氣錯誤:", err.message);
    res.status(500).json({ error: "API 取得失敗" });
  }
};

// Routes
app.get("/", (req, res) => {
  res.json({
    msg: "氣象 API 已啟動",
    endpoints: {
      weekly: "/api/weather/week?city=屏東縣",
    }
  });
});

app.get("/api/weather/week", getWeekWeather);

app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
