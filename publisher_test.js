const fs = require("fs");
const mqtt = require("mqtt");

// 🔹 Pastikan file sertifikat ada
const caPath = "./emqxsl-ca.crt";
if (!fs.existsSync(caPath)) {
  console.error("❌ Sertifikat Root CA tidak ditemukan! Pastikan file ada di folder proyek.");
  process.exit(1);
}

const caFile = fs.readFileSync(caPath);

// 🔹 Koneksi ke EMQX Cloud (gunakan port 8883 untuk MQTTS)
const mqtt_client = mqtt.connect({
  host: "p18e79b0.ala.asia-southeast1.emqxsl.com",
  port: 8883, // ✅ Port yang benar untuk MQTT over TLS
  protocol: "mqtts",
  username: "admin1",  // Ganti dengan username EMQX Anda
  password: "admin1",  // Ganti dengan password EMQX Anda
  ca: caFile,
  // rejectUnauthorized: false, // Bisa diaktifkan jika sertifikat sudah diverifikasi
  reconnectPeriod: 5000, // Auto-reconnect setiap 5 detik jika putus
  connectTimeout: 30000, // Timeout koneksi 30 detik
});

// 🔹 Ketika berhasil terhubung
mqtt_client.on("connect", () => {
  console.log("✅ Terhubung ke EMQX MQTT!");
  const topic = "koi/kolam"; // Topic MQTT

  setInterval(() => {
    // 🔹 Simulasi data sensor
    const suhu = (Math.random() * (30 - 25) + 25).toFixed(2); // Random antara 25 - 30°C
    const pH = (Math.random() * (8 - 6) + 6).toFixed(2); // Random antara 6 - 8
    const data = JSON.stringify({ suhu, pH });

    // 🔹 Kirim data ke MQTT
    mqtt_client.publish(topic, data);
    console.log(`📡 Data terkirim ke MQTT: ${data}`);
  }, 5000); // Kirim setiap 5 detik
});

// 🔹 Error handling
mqtt_client.on("error", (error) => {
  console.error("❌ MQTT Error:", error);
});

// 🔹 Event jika koneksi putus
mqtt_client.on("close", () => {
  console.warn("⚠️ Koneksi ke MQTT terputus, mencoba reconnect...");
});

// 🔹 Event jika reconnecting
mqtt_client.on("reconnect", () => {
  console.log("🔄 Mencoba reconnect ke MQTT...");
});
