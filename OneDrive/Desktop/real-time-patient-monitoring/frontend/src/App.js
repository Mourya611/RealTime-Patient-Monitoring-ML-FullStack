import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import AddPatientForm from './AddPatientForm';

const socket = io('http://localhost:5000');

function App() {
  const [patients, setPatients] = useState([]);
  const [statusList, setStatusList] = useState([]);

  const fetchPatients = () => {
    axios.get('http://localhost:5000/patients')
      .then((response) => setPatients(response.data))
      .catch((error) => console.error('Error fetching patients:', error));
  };

  const fetchStatus = () => {
    axios.get('http://localhost:5000/patient-status')
      .then((response) => setStatusList(response.data))
      .catch((error) => console.error('Error fetching patient status:', error));
  };

  useEffect(() => {
    fetchPatients();
    fetchStatus();

    socket.on('vitalsUpdate', (updatedPatients) => {
      setPatients(updatedPatients);
      fetchStatus();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>🚑 Real-Time Patient Monitoring Dashboard (SQLite)</h1>

      {/* Add Patient Form */}
      <AddPatientForm onPatientAdded={() => { fetchPatients(); fetchStatus(); }} />

      {/* Health Status */}
      <h2 style={{ marginTop: '30px' }}>🩺 Patient Health Status:</h2>
      <ul>
        {statusList.map((patient) => (
          <li key={patient.id} style={{ 
              color: patient.status.includes('Alert') ? 'red' : 'green', 
              marginBottom: '10px' 
            }}>
            <strong>{patient.name}:</strong> {patient.status}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
