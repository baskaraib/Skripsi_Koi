# Gunakan base image Node.js versi terbaru
FROM node:18

# Set working directory di dalam container
WORKDIR /app

# Copy file package.json & package-lock.json, lalu install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy semua file proyek ke dalam container
COPY . .

# Ekspos port yang akan digunakan
EXPOSE 8080

# Jalankan server
CMD ["node", "server.js"]

