import React, { useState } from 'react';
import axios from 'axios';

function AddPatientForm({ onPatientAdded }) {
  const [formData, setFormData] = useState({
    name: '',
    heartRate: '',
    temperature: '',
    oxygenLevel: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Step 1: Add patient to backend database
    axios.post('http://localhost:5000/add-patient', formData)
      .then(() => {
        alert('Patient added successfully!');
        onPatientAdded();

        // Step 2: Immediately send vitals to ML API for prediction
        axios.post('http://localhost:5001/predict', {
          heartRate: parseFloat(formData.heartRate),
          temperature: parseFloat(formData.temperature),
          oxygenLevel: parseFloat(formData.oxygenLevel)
        })
        .then(response => {
          const result = response.data.prediction;
          alert(`Health Status Prediction: ${result}`);
        })
        .catch(error => {
          console.error('Error in ML Prediction:', error);
        });

        // Clear form
        setFormData({
          name: '',
          heartRate: '',
          temperature: '',
          oxygenLevel: ''
        });
      })
      .catch(error => {
        console.error('Error adding patient:', error);
      });
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
      <h2>Add New Patient</h2>
      <input
        type="text"
        name="name"
        placeholder="Name"
        value={formData.name}
        onChange={handleChange}
        required
      /><br /><br />

      <input
        type="number"
        name="heartRate"
        placeholder="Heart Rate"
        value={formData.heartRate}
        onChange={handleChange}
        required
      /><br /><br />

      <input
        type="number"
        name="temperature"
        placeholder="Temperature"
        value={formData.temperature}
        onChange={handleChange}
        required
      /><br /><br />

      <input
        type="number"
        name="oxygenLevel"
        placeholder="Oxygen Level"
        value={formData.oxygenLevel}
        onChange={handleChange}
        required
      /><br /><br />

      <button type="submit">Add Patient</button>
    </form>
  );
}

export default AddPatientForm;
