from flask import Flask, request, jsonify
import joblib
import numpy as np
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # To allow Node.js to make requests here

# Load trained model
model = joblib.load('ml_model/health_model.pkl')  # Give correct relative path

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json
    heart_rate = data.get('heartRate')
    temperature = data.get('temperature')
    oxygen_level = data.get('oxygenLevel')

    features = np.array([[heart_rate, temperature, oxygen_level]])
    prediction = model.predict(features)[0]

    result = "Consult Doctor" if prediction == 1 else "Normal - No action needed"
    return jsonify({'prediction': result})

if __name__ == '__main__':
    app.run(port=5001, debug=True)
