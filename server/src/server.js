import { WebSocketServer } from "ws";

const PORT = 8080;

const wss = new WebSocketServer({
  port: PORT,
});

const cityState = {
  traffic: {
    congestion: 58,
    vehicles: 1240,
    averageSpeed: 34,
    incidents: 3,
  },

  airQuality: {
    aqi: 72,
    pm25: 28,
    temperature: 31,
    humidity: 72,
  },

  cameras: [
    {
      id: 1,
      name: "Nguyen Hue",
      status: "online",
      traffic: 68,
    },
    {
      id: 2,
      name: "Le Loi",
      status: "online",
      traffic: 52,
    },
    {
      id: 3,
      name: "Dien Bien Phu",
      status: "warning",
      traffic: 81,
    },
    {
      id: 4,
      name: "Pham Van Dong",
      status: "offline",
      traffic: 0,
    },
  ],

  alerts: [
    {
      id: 1,
      level: "critical",
      title: "Traffic congestion",
      location: "Dien Bien Phu",
      time: "2 min ago",
    },
    {
      id: 2,
      level: "warning",
      title: "Air quality increased",
      location: "District 1",
      time: "5 min ago",
    },
    {
      id: 3,
      level: "info",
      title: "Camera maintenance",
      location: "Pham Van Dong",
      time: "12 min ago",
    },
  ],

  devices: [
    {
      name: "Traffic Sensors",
      total: 124,
      online: 119,
    },
    {
      name: "CCTV Cameras",
      total: 86,
      online: 83,
    },
    {
      name: "Air Sensors",
      total: 42,
      online: 42,
    },
    {
      name: "Smart Lights",
      total: 318,
      online: 307,
    },
  ],
};

function random(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function updateCityData() {
  cityState.traffic = {
    ...cityState.traffic,

    congestion: random(40, 85),

    vehicles: random(900, 1600),

    averageSpeed: random(20, 48),
  };

  cityState.airQuality = {
    ...cityState.airQuality,

    aqi: random(40, 100),

    pm25: random(10, 45),

    temperature: random(28, 35),

    humidity: random(60, 85),
  };

  cityState.cameras = cityState.cameras.map((camera) => ({
    ...camera,

    traffic: camera.status === "offline" ? 0 : random(20, 95),
  }));

  cityState.devices = cityState.devices.map((device) => ({
    ...device,

    online: Math.max(
      0,
      device.total - random(0, Math.ceil(device.total * 0.08)),
    ),
  }));
}

function createMessage() {
  return {
    type: "CITY_UPDATE",

    payload: {
      timestamp: new Date().toISOString(),

      ...cityState,
    },
  };
}

function broadcast() {
  const message = JSON.stringify(createMessage());

  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(message);
    }
  });
}

wss.on("connection", (socket) => {
  console.log("Client connected");

  socket.send(JSON.stringify(createMessage()));

  socket.on("message", (message) => {
    try {
      const data = JSON.parse(message.toString());

      if (data.type === "PING") {
        socket.send(
          JSON.stringify({
            type: "PONG",
            timestamp: new Date().toISOString(),
          }),
        );
      }
    } catch {
      socket.send(
        JSON.stringify({
          type: "ERROR",
          message: "Invalid JSON",
        }),
      );
    }
  });

  socket.on("close", () => {
    console.log("Client disconnected");
  });
});

setInterval(() => {
  updateCityData();

  broadcast();
}, 2000);

console.log(`WebSocket server running at ws://localhost:${PORT}`);
