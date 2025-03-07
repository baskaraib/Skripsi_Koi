require("dotenv").config();
const fs = require("fs");
const express = require("express");
const mqtt = require("mqtt");
const admin = require("firebase-admin");
const cors = require("cors");

// 🔹 Load sertifikat Root CA
const caPath = "./emqxsl-ca.crt";
const caFile = fs.readFileSync(caPath);

// 🔹 Inisialisasi Firebase
const serviceAccount = require("./firebase-key.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://kolam-koi-27f35-default-rtdb.firebaseio.com/", // URL Firebase HARUS HTTPS
});
const db = admin.database();

// 🔹 Inisialisasi Express (REST API)
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;

// 🔹 Koneksi ke MQTT Broker (EMQX Cloud)
const mqtt_client = mqtt.connect(process.env.MQTT_BROKER_URL, {
  port: 8883,
  username: process.env.MQTT_USERNAME,
  password: process.env.MQTT_PASSWORD,
  ca: caFile,
});

mqtt_client.on("connect", () => {
  console.log("✅ Terhubung ke MQTT!");
  mqtt_client.subscribe("koi/kolam", (err) => {
    if (!err) {
      console.log("📡 Berhasil subscribe ke topic: koi/kolam");
    } else {
      console.error("❌ Gagal subscribe ke topic!", err);
    }
  });
});

mqtt_client.on("message", async (topic, message) => {
  try {
    const data = JSON.parse(message.toString());

    if (data.suhu && data.pH) {
      const newData = {
        suhu: data.suhu,
        pH: data.pH,
        waktu: new Date().toISOString(),
      };

      await db.ref("sensor_data").push(newData);
      console.log("📡 Data tersimpan ke Firebase:", newData);
    } else {
      console.warn("⚠️ Data tidak valid:", data);
    }
  } catch (error) {
    console.error("❌ ERROR: Gagal parsing JSON!", error);
  }
});

// 🔹 REST API: Ambil 10 Data Terbaru dari Firebase
app.get("/api/sensor", async (req, res) => {
  try {
    const snapshot = await db.ref("sensor_data").limitToLast(10).once("value");
    if (!snapshot.exists()) return res.status(404).json({ message: "Tidak ada data sensor!" });

    const data = snapshot.val();
    const formattedData = Object.keys(data).map((key) => ({
      id: key,
      suhu: data[key].suhu,
      pH: data[key].pH,
      waktu: data[key].waktu,
    }));

    res.json({ success: true, data: formattedData });
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// 🔹 REST API: Ambil 1 Data Terbaru
app.get("/api/sensor/latest", async (req, res) => {
  try {
    const snapshot = await db.ref("sensor_data").limitToLast(1).once("value");
    if (!snapshot.exists()) return res.status(404).json({ message: "Tidak ada data sensor!" });

    const data = snapshot.val();
    const latestKey = Object.keys(data)[0];
    const latestData = data[latestKey];

    res.json({ success: true, data: latestData });
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// 🔹 Jalankan server
app.listen(PORT, () => {
  console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
});
