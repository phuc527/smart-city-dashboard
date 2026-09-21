import { useEffect, useMemo, useState } from "react";

import {
  Activity,
  AlertTriangle,
  Bell,
  Camera,
  Car,
  CheckCircle2,
  Cloud,
  Cpu,
  Gauge,
  MapPin,
  Radio,
  Search,
  Settings,
  Thermometer,
  Wifi,
  WifiOff,
  Wind,
  X,
} from "lucide-react";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8080";

const INITIAL_DATA = {
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

function App() {
  const [city, setCity] = useState(INITIAL_DATA);

  const [connected, setConnected] = useState(false);

  const [history, setHistory] = useState([]);

  const [selectedCamera, setSelectedCamera] = useState(null);

  useEffect(() => {
    let socket;

    let reconnectTimer;

    function connect() {
      socket = new WebSocket(WS_URL);

      socket.onopen = () => {
        console.log("WebSocket connected");

        setConnected(true);
      };

      socket.onmessage = (event) => {
        const message = JSON.parse(event.data);

        if (message.type !== "CITY_UPDATE") {
          return;
        }

        const data = message.payload;

        setCity(data);

        setHistory((current) => [
          ...current.slice(-19),

          {
            time: new Date(data.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            }),

            traffic: data.traffic.congestion,

            aqi: data.airQuality.aqi,
          },
        ]);
      };

      socket.onclose = () => {
        console.log("WebSocket disconnected");

        setConnected(false);

        reconnectTimer = setTimeout(connect, 2000);
      };

      socket.onerror = () => {
        setConnected(false);
      };
    }

    connect();

    return () => {
      clearTimeout(reconnectTimer);

      socket?.close();
    };
  }, []);

  const totalDevices = useMemo(() => {
    return city.devices.reduce((total, device) => total + device.total, 0);
  }, [city.devices]);

  const onlineDevices = useMemo(() => {
    return city.devices.reduce((total, device) => total + device.online, 0);
  }, [city.devices]);

  return (
    <div className="app">
      <Sidebar />

      <main className="main">
        <Header connected={connected} />

        <div className="content">
          <Stats
            city={city}
            onlineDevices={onlineDevices}
            totalDevices={totalDevices}
          />

          <div className="grid">
            <TrafficChart history={history} />

            <Environment data={city.airQuality} />
          </div>

          <div className="grid">
            <CityMap cameras={city.cameras} onCameraClick={setSelectedCamera} />

            <Alerts alerts={city.alerts} />
          </div>

          <div className="grid">
            <Cameras cameras={city.cameras} onCameraClick={setSelectedCamera} />

            <Devices devices={city.devices} />
          </div>
        </div>
      </main>

      {selectedCamera && (
        <CameraModal
          camera={selectedCamera}
          onClose={() => setSelectedCamera(null)}
        />
      )}
    </div>
  );
}

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="logo">
        <div className="logo-icon">
          <Radio size={20} />
        </div>

        <div>
          <strong>SMART CITY</strong>

          <span>CONTROL CENTER</span>
        </div>
      </div>

      <div className="menu">
        <div className="menu-title">OVERVIEW</div>

        <MenuItem icon={<Activity />} text="Dashboard" active />

        <MenuItem icon={<MapPin />} text="City Map" />

        <MenuItem icon={<Camera />} text="CCTV" />

        <div className="menu-title">MONITORING</div>

        <MenuItem icon={<Car />} text="Traffic" />

        <MenuItem icon={<Cloud />} text="Environment" />

        <MenuItem icon={<Cpu />} text="IoT Devices" />

        <div className="menu-title">SYSTEM</div>

        <MenuItem icon={<Bell />} text="Alerts" />

        <MenuItem icon={<Settings />} text="Settings" />
      </div>

      <div className="sidebar-bottom">
        <div className="live-dot" />

        <div>
          <strong>System Online</strong>

          <span>WebSocket realtime</span>
        </div>
      </div>
    </aside>
  );
}

function MenuItem({ icon, text, active }) {
  return (
    <div className={`menu-item ${active ? "active" : ""}`}>
      {icon}

      <span>{text}</span>
    </div>
  );
}

function Header({ connected }) {
  return (
    <header className="header">
      <div>
        <h1>City Overview</h1>

        <p>Real-time urban operations monitoring</p>
      </div>

      <div className="header-actions">
        <div className={`connection ${connected ? "connected" : ""}`}>
          {connected ? <Wifi size={15} /> : <WifiOff size={15} />}

          {connected ? "LIVE" : "OFFLINE"}
        </div>

        <button>
          <Search size={18} />
        </button>

        <button>
          <Bell size={18} />
        </button>

        <div className="avatar">AD</div>
      </div>
    </header>
  );
}

function Stats({ city, onlineDevices, totalDevices }) {
  return (
    <div className="stats">
      <Stat
        icon={<Car />}
        title="Traffic Congestion"
        value={`${city.traffic.congestion}%`}
        subtitle="City average"
      />

      <Stat
        icon={<Gauge />}
        title="Vehicles Detected"
        value={city.traffic.vehicles.toLocaleString()}
        subtitle="Active sensors"
      />

      <Stat
        icon={<Wind />}
        title="Air Quality Index"
        value={city.airQuality.aqi}
        subtitle="Current AQI"
      />

      <Stat
        icon={<Cpu />}
        title="Active Devices"
        value={`${onlineDevices}/${totalDevices}`}
        subtitle="Connected"
      />
    </div>
  );
}

function Stat({ icon, title, value, subtitle }) {
  return (
    <div className="stat">
      <div className="stat-icon">{icon}</div>

      <div>
        <span>{title}</span>

        <strong>{value}</strong>

        <small>{subtitle}</small>
      </div>
    </div>
  );
}

function Panel({ title, subtitle, icon, children }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div className="panel-title">
          <div className="panel-icon">{icon}</div>

          <div>
            <h2>{title}</h2>

            <p>{subtitle}</p>
          </div>
        </div>
      </div>

      {children}
    </section>
  );
}

function TrafficChart({ history }) {
  return (
    <Panel
      title="Traffic Flow"
      subtitle="Realtime traffic congestion"
      icon={<Activity size={18} />}
    >
      <div className="chart">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={history}>
            <defs>
              <linearGradient id="trafficGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopOpacity={0.3} />

                <stop offset="100%" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" vertical={false} />

            <XAxis
              dataKey="time"
              tick={{
                fontSize: 10,
              }}
            />

            <YAxis
              tick={{
                fontSize: 10,
              }}
            />

            <Tooltip />

            <Area
              type="monotone"
              dataKey="traffic"
              stroke="#2563eb"
              fill="url(#trafficGradient)"
              strokeWidth={3}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  );
}

function Environment({ data }) {
  return (
    <Panel
      title="Environment"
      subtitle="Live environmental sensors"
      icon={<Cloud size={18} />}
    >
      <div className="aqi">
        <div className="aqi-circle">
          <strong>{data.aqi}</strong>

          <span>AQI</span>
        </div>

        <div>
          <h3>Moderate</h3>

          <p>Air quality is acceptable for most people.</p>
        </div>
      </div>

      <div className="environment">
        <Metric icon={<Wind />} label="PM2.5" value={`${data.pm25} µg/m³`} />

        <Metric
          icon={<Thermometer />}
          label="Temperature"
          value={`${data.temperature}°C`}
        />

        <Metric icon={<Cloud />} label="Humidity" value={`${data.humidity}%`} />
      </div>
    </Panel>
  );
}

function Metric({ icon, label, value }) {
  return (
    <div className="metric">
      <div>{icon}</div>

      <div>
        <span>{label}</span>

        <strong>{value}</strong>
      </div>
    </div>
  );
}

function CityMap({ cameras, onCameraClick }) {
  return (
    <Panel
      title="City Traffic Map"
      subtitle="Live traffic sensor network"
      icon={<MapPin size={18} />}
    >
      <div className="city-map">
        <div className="road road-1" />

        <div className="road road-2" />

        <div className="road road-3" />

        <div className="water" />

        {cameras.map((camera, index) => (
          <button
            key={camera.id}
            className={`marker marker-${index + 1}`}
            onClick={() => onCameraClick(camera)}
          >
            <Camera size={14} />
          </button>
        ))}

        <span className="district district-1">DISTRICT 1</span>

        <span className="district district-3">DISTRICT 3</span>

        <span className="district district-bt">BINH THANH</span>
      </div>
    </Panel>
  );
}

function Alerts({ alerts }) {
  return (
    <Panel
      title="Live Alerts"
      subtitle="Latest city incidents"
      icon={<AlertTriangle size={18} />}
    >
      <div className="alerts">
        {alerts.map((alert) => (
          <div className="alert" key={alert.id}>
            <div className={`alert-icon ${alert.level}`}>
              <AlertTriangle size={16} />
            </div>

            <div>
              <strong>{alert.title}</strong>

              <span>{alert.location}</span>
            </div>

            <time>{alert.time}</time>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function Cameras({ cameras, onCameraClick }) {
  return (
    <Panel
      title="CCTV Network"
      subtitle="Camera health and traffic level"
      icon={<Camera size={18} />}
    >
      <div className="cameras">
        {cameras.map((camera) => (
          <div className="camera" key={camera.id}>
            <div className="camera-preview">
              <Camera size={20} />
            </div>

            <div className="camera-name">
              <strong>{camera.name}</strong>

              <span>
                <i className={camera.status} />

                {camera.status}
              </span>
            </div>

            <div className="traffic">
              <span>Traffic {camera.traffic}%</span>

              <div>
                <i
                  style={{
                    width: `${camera.traffic}%`,
                  }}
                />
              </div>
            </div>

            <button onClick={() => onCameraClick(camera)}>View</button>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function Devices({ devices }) {
  return (
    <Panel
      title="IoT Infrastructure"
      subtitle="Connected device health"
      icon={<Cpu size={18} />}
    >
      <div className="devices">
        {devices.map((device) => {
          const percent = Math.round((device.online / device.total) * 100);

          return (
            <div className="device" key={device.name}>
              <div>
                <span>{device.name}</span>

                <strong>{percent}%</strong>
              </div>

              <div className="progress">
                <i
                  style={{
                    width: `${percent}%`,
                  }}
                />
              </div>

              <small>
                {device.online} online / {device.total} total
              </small>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function CameraModal({ camera, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <small>LIVE CCTV</small>

            <h2>{camera.name}</h2>
          </div>

          <button onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="video">
          <Camera size={50} />

          <span>Camera stream simulation</span>

          <small>WebSocket telemetry is live</small>
        </div>

        <div className="modal-info">
          <Metric
            icon={<CheckCircle2 />}
            label="Status"
            value={camera.status}
          />

          <Metric icon={<Car />} label="Traffic" value={`${camera.traffic}%`} />
        </div>
      </div>
    </div>
  );
}

export default App;
