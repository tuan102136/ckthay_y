import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';

const initialHome = {
  id: 'home-1',
  name: 'Minha Casa',
  rooms: [
    {
      id: 'living-room',
      name: 'Sala',
      devices: [
        { id: 'lamp-1', name: 'Luz da Sala', type: 'actuator', state: true, icon: '💡' },
        { id: 'temp-1', name: 'Temperatura', type: 'sensor', value: 24.7, icon: '🌡️' },
      ],
    },
    {
      id: 'bedroom',
      name: 'Quarto',
      devices: [
        { id: 'lamp-2', name: 'Luz do Quarto', type: 'actuator', state: false, icon: '💡' },
        { id: 'sensor-2', name: 'Umidade', type: 'sensor', value: 56, icon: '💧' },
      ],
    },
  ],
};

const emptyHome = { id: 'new-home', name: 'Nova Casa', rooms: [] };

function App() {
  const [user, setUser] = useState(null);
  const [home, setHome] = useState(initialHome);
  const [selectedRoomId, setSelectedRoomId] = useState(initialHome.rooms[0].id);
  const [isLoading, setIsLoading] = useState(false);

  const selectedRoom = useMemo(
    () => home.rooms.find(room => room.id === selectedRoomId) ?? home.rooms[0],
    [home, selectedRoomId],
  );

  const handleLogin = e => {
    e.preventDefault();
    setUser({ name: 'Demo User', email: 'demo@smarthome.test' });
  };

  const handleRegister = e => {
    e.preventDefault();
    setUser({ name: 'New User', email: 'new@smarthome.test' });
  };

  const addRoom = () => {
    const roomName = 'Novo cômodo';
    const newRoom = {
      id: `room-${Date.now()}`,
      name: roomName,
      devices: [],
    };
    setHome(current => ({ ...current, rooms: [...current.rooms, newRoom] }));
    setSelectedRoomId(newRoom.id);
  };

  const addDevice = () => {
    const roomIndex = home.rooms.findIndex(room => room.id === selectedRoomId);
    if (roomIndex === -1) return;

    const newDevice = {
      id: `device-${Date.now()}`,
      name: 'Novo dispositivo',
      type: 'actuator',
      state: true,
      icon: '🔌',
    };

    setHome(current => {
      const rooms = [...current.rooms];
      rooms[roomIndex] = {
        ...rooms[roomIndex],
        devices: [...(rooms[roomIndex].devices || []), newDevice],
      };
      return { ...current, rooms };
    });
  };

  const toggleDevice = deviceId => {
    setHome(current => ({
      ...current,
      rooms: current.rooms.map(room => ({
        ...room,
        devices: (room.devices || []).map(device =>
          device.id === deviceId ? { ...device, state: !device.state } : device,
        ),
      })),
    }));
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <span className="brand">SmartHome</span>
          <small className="sub-brand">Web Test Mode</small>
        </div>
        {user ? (
          <div className="user-box">
            <span>{user.name}</span>
            <button className="secondary" onClick={() => setUser(null)}>Logout</button>
          </div>
        ) : (
          <Link className="secondary" to="/login">Login</Link>
        )}
      </header>

      <Routes>
        <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} />
        <Route
          path="/login"
          element={
            user ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <AuthScreen
                type="login"
                title="Welcome back"
                subtitle="Sign in to access your SmartHome dashboard"
                onSubmit={handleLogin}
              />
            )
          }
        />
        <Route
          path="/register"
          element={
            user ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <AuthScreen
                type="register"
                title="Create account"
                subtitle="Register to set up your smart home"
                onSubmit={handleRegister}
              />
            )
          }
        />
        <Route
          path="/dashboard"
          element={
            user ? (
              <DashboardScreen
                home={home}
                selectedRoom={selectedRoom}
                setSelectedRoomId={setSelectedRoomId}
                addRoom={addRoom}
                addDevice={addDevice}
                toggleDevice={toggleDevice}
                isLoading={isLoading}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/new-home"
          element={
            user ? (
              <NewHomeScreen
                onCreate={() => {
                  setHome(emptyHome);
                  setSelectedRoomId(emptyHome.rooms[0]?.id ?? null);
                }}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/new-device"
          element={
            user ? (
              <NewDeviceScreen
                roomName={selectedRoom?.name || 'Selected room'}
                onCreate={() => alert('Device added to demo home')}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </div>
  );
}

function AuthScreen({ type, title, subtitle, onSubmit }) {
  const navigate = useNavigate();
  const isRegister = type === 'register';

  return (
    <div className="auth-panel">
      <div className="card form-card">
        <h1>{title}</h1>
        <p>{subtitle}</p>
        <form onSubmit={onSubmit}>
          <label>
            Email
            <input type="email" defaultValue="demo@smarthome.test" />
          </label>
          <label>
            Password
            <input type="password" defaultValue="123456" />
          </label>
          {!isRegister ? null : (
            <label>
              Full name
              <input type="text" defaultValue="Demo User" />
            </label>
          )}
          <button type="submit" className="primary">{isRegister ? 'Register' : 'Login'}</button>
        </form>
        <p className="tiny-link">
          {isRegister ? 'Already have an account?' : 'Need an account?'}{' '}
          <button className="link-button" onClick={() => navigate(isRegister ? '/login' : '/register')}>
            {isRegister ? 'Sign in' : 'Create one'}
          </button>
        </p>
      </div>
    </div>
  );
}

function DashboardScreen({ home, selectedRoom, setSelectedRoomId, addRoom, addDevice, toggleDevice, isLoading }) {
  const navigate = useNavigate();
  const [apiState, setApiState] = useState({ status: 'checking', firebase: 'unknown' });
  const [alerts, setAlerts] = useState([]);
  const [alertMessage, setAlertMessage] = useState('');
  const [sendingAlert, setSendingAlert] = useState(false);

  const refreshApi = async () => {
    try {
      const [healthResponse, alertsResponse] = await Promise.all([
        fetch('/api/health'),
        fetch('/api/iot/alerts?limit=10'),
      ]);
      if (!healthResponse.ok || !alertsResponse.ok) {
        throw new Error('API trả về lỗi khi kiểm tra trạng thái.');
      }

      const health = await healthResponse.json();
      const alertResult = await alertsResponse.json();
      setApiState(health);
      setAlerts(alertResult.alerts || []);
    } catch (error) {
      setApiState({ status: 'offline', firebase: 'unknown' });
      setAlertMessage(error.message || 'Không kết nối được API.');
    }
  };

  useEffect(() => {
    refreshApi();
    const timer = window.setInterval(refreshApi, 5000);
    return () => window.clearInterval(timer);
  }, []);

  const sendTestAlert = async () => {
    setSendingAlert(true);
    setAlertMessage('');
    try {
      const response = await fetch('/api/demo/alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: 'web-test',
          type: 'temperature',
          value: 39.5,
          threshold: 35,
          unit: 'C',
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Không gửi được cảnh báo thử.');
      }

      setAlertMessage(`API đã nhận cảnh báo thử. Push: ${result.push.status}.`);
      await refreshApi();
    } catch (error) {
      setAlertMessage(error.message || 'Không gửi được cảnh báo thử.');
    } finally {
      setSendingAlert(false);
    }
  };

  if (isLoading) {
    return <div className="center-panel"><div className="loader">Loading...</div></div>;
  }

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="section-title">Rooms</div>
        {home.rooms.map(room => (
          <button
            key={room.id}
            className={`room-button ${selectedRoom?.id === room.id ? 'selected' : ''}`}
            onClick={() => setSelectedRoomId(room.id)}
          >
            {room.name}
          </button>
        ))}
        <button className="primary full" onClick={addRoom}>+ New room</button>
      </aside>

      <main className="content-panel">
        <div className="toolbar">
          <h2>{selectedRoom?.name || 'No room selected'}</h2>
          <button className="secondary" onClick={() => navigate('/new-device')}>+ New device</button>
        </div>

        <div className="device-grid">
          {(selectedRoom?.devices || []).length === 0 ? (
            <div className="empty-state">
              <p>No devices in this room yet.</p>
              <button className="primary" onClick={addDevice}>Add device</button>
            </div>
          ) : (
            (selectedRoom?.devices || []).map(device => (
              <div key={device.id} className="device-card">
                <div className="device-icon">{device.icon}</div>
                <div className="device-meta">
                  <strong>{device.name}</strong>
                  <span>{device.type === 'sensor' ? 'Sensor' : 'Actuator'}</span>
                </div>
                {device.type === 'sensor' ? (
                  <div className="sensor-value">{device.value}°</div>
                ) : (
                  <button className={`toggle ${device.state ? 'on' : 'off'}`} onClick={() => toggleDevice(device.id)}>
                    {device.state ? 'On' : 'Off'}
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        <section className="api-panel" aria-live="polite">
          <div className="api-heading">
            <div>
              <h3>Kiểm tra IoT / Backend</h3>
              <p>
                API: <strong className={apiState.status === 'ok' ? 'status-online' : 'status-offline'}>
                  {apiState.status === 'ok' ? 'Đang chạy' : apiState.status === 'checking' ? 'Đang kiểm tra...' : 'Chưa kết nối'}
                </strong>
                {' · '}Firebase: <strong>{apiState.firebase}</strong>
                {' · '}Token thiết bị: <strong>{apiState.deviceAuth || '—'}</strong>
              </p>
            </div>
            <button className="primary" onClick={sendTestAlert} disabled={sendingAlert || apiState.status !== 'ok'}>
              {sendingAlert ? 'Đang gửi...' : 'Gửi cảnh báo thử'}
            </button>
          </div>
          {alertMessage ? <p className="api-message">{alertMessage}</p> : null}
          <div className="alert-list">
            {alerts.length === 0 ? (
              <p>Chưa có cảnh báo. Chạy Wokwi hoặc gửi một cảnh báo thử.</p>
            ) : (
              alerts.map(alert => (
                <article className="alert-row" key={alert.id}>
                  <div>
                    <strong>{alert.deviceId}</strong>
                    <span>{alert.type} · {alert.value}{alert.unit ? ` ${alert.unit}` : ''}</span>
                  </div>
                  <time>{new Date(alert.receivedAt).toLocaleTimeString('vi-VN')}</time>
                </article>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function NewHomeScreen({ onCreate }) {
  const navigate = useNavigate();
  return (
    <div className="center-panel">
      <div className="card form-card narrow">
        <h2>Register Home</h2>
        <p>Set up your home to start adding rooms and devices.</p>
        <label>
          Home name
          <input type="text" defaultValue="Minha Casa" />
        </label>
        <button className="primary" onClick={() => { onCreate(); navigate('/dashboard'); }}>
          Create home
        </button>
      </div>
    </div>
  );
}

function NewDeviceScreen({ roomName, onCreate }) {
  const navigate = useNavigate();
  return (
    <div className="center-panel">
      <div className="card form-card narrow">
        <h2>Create Device</h2>
        <p>Room: {roomName}</p>
        <label>
          Device name
          <input type="text" defaultValue="New device" />
        </label>
        <label>
          Type
          <select defaultValue="actuator">
            <option value="actuator">Actuator</option>
            <option value="sensor">Sensor</option>
          </select>
        </label>
        <button className="primary" onClick={() => { onCreate(); navigate('/dashboard'); }}>
          Save device
        </button>
      </div>
    </div>
  );
}

export default App;
