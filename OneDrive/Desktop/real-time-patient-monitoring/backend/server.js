const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const db = require('./db');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Create Table if not exists
db.run(`
  CREATE TABLE IF NOT EXISTS patients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    heartRate INTEGER,
    temperature REAL,
    oxygenLevel INTEGER
  )
`);

// Insert sample data if table empty
db.get('SELECT COUNT(*) AS count FROM patients', (err, row) => {
  if (err) {
    console.error('Error fetching row count:', err);
  } else if (row && row.count === 0) {
    const stmt = db.prepare(`INSERT INTO patients (name, heartRate, temperature, oxygenLevel) VALUES (?, ?, ?, ?)`);
    stmt.run("John Doe", 72, 37.0, 98);
    stmt.run("Jane Smith", 80, 36.8, 97);
    stmt.run("Alex Johnson", 65, 37.2, 99);
    stmt.finalize();
  }
});

// API: Get All Patients
app.get('/patients', (req, res) => {
  db.all('SELECT * FROM patients', [], (err, rows) => {
    if (err) res.status(500).send(err);
    else res.json(rows);
  });
});

// API: Add New Patient
app.post('/add-patient', (req, res) => {
  const { name, heartRate, temperature, oxygenLevel } = req.body;
  const stmt = db.prepare('INSERT INTO patients (name, heartRate, temperature, oxygenLevel) VALUES (?, ?, ?, ?)');
  stmt.run(name, heartRate, temperature, oxygenLevel, function (err) {
    if (err) {
      res.status(500).send('Error inserting patient');
    } else {
      res.send({ success: true, id: this.lastID });
    }
  });
  stmt.finalize();
});

// API: Patient Health Status
app.get('/patient-status', (req, res) => {
  db.all('SELECT * FROM patients', [], (err, patients) => {
    if (err) return res.status(500).send(err);

    const statusList = patients.map((patient) => {
      let alerts = [];

      if (patient.heartRate < 60 || patient.heartRate > 100) {
        alerts.push('Abnormal Heart Rate');
      }
      if (patient.temperature >= 99) {
        alerts.push('Possible Fever');
      }
      if (patient.oxygenLevel < 90) {
        alerts.push('Low Oxygen Level (Hypoxia)');
      }

      const status = alerts.length === 0
        ? 'Normal - No action needed'
        : `Alert: ${alerts.join(', ')}. Consult Doctor`;

      return {
        id: patient.id,
        name: patient.name,
        status: status
      };
    });

    res.json(statusList);
  });
});

// Real-time vitals updater
setInterval(() => {
  db.all('SELECT * FROM patients', [], (err, patients) => {
    if (!err) {
      patients.forEach((patient) => {
        const newHeartRate = Math.floor(60 + Math.random() * 40);
        const newTemperature = (36 + Math.random() * 2).toFixed(1);
        const newOxygen = Math.floor(90 + Math.random() * 10);

        db.run(
          'UPDATE patients SET heartRate = ?, temperature = ?, oxygenLevel = ? WHERE id = ?',
          [newHeartRate, newTemperature, newOxygen, patient.id]
        );
      });

      db.all('SELECT * FROM patients', [], (err, updatedPatients) => {
        if (!err) io.emit('vitalsUpdate', updatedPatients);
      });
    }
  });
}, 5000);

// Socket.io connection
io.on('connection', (socket) => {
  console.log('Client connected');
  socket.on('disconnect', () => console.log('Client disconnected'));
});

// Start Server
server.listen(5000, () => {
  console.log('Backend server running on port 5000');
});
