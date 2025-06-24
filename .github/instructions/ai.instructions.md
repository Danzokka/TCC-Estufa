---
applyTo: "apps/ai/**/*.{py,yml,yaml,json,txt,md}"
---

# AI/ML Development Guidelines - Python & PyTorch

## Links & Documentation

- [PyTorch Documentation](https://pytorch.org/docs/stable/index.html)
- [PyTorch Tutorials](https://pytorch.org/tutorials/)
- [Pandas Documentation](https://pandas.pydata.org/docs/)
- [NumPy Documentation](https://numpy.org/doc/stable/)
- [Scikit-learn Documentation](https://scikit-learn.org/stable/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Pydantic Documentation](https://docs.pydantic.dev/)
- [MLOps Best Practices](https://ml-ops.org/)
- [IoT Time Series Analysis](https://towardsdatascience.com/time-series-analysis-for-iot-data-f3e2e8c7b3f1)

## Tech Stack

- **Python 3.12+** - Core language for AI/ML development
- **PyTorch** - Deep learning framework for LSTM models
- **Pandas** - Data manipulation and analysis
- **NumPy** - Numerical computing
- **Scikit-learn** - Traditional ML algorithms
- **FastAPI** - API framework for serving models
- **Pydantic** - Data validation and serialization
- **Jupyter Notebooks** - Development and experimentation
- **Docker** - Containerization for deployment

## Architecture & Patterns

### Project Structure

```
apps/ai/
├── main.py                    # FastAPI application entry point
├── requirements.txt           # Python dependencies
├── Dockerfile                 # Container configuration
├── config/
│   └── settings.py           # Application settings
├── models/
│   ├── __init__.py
│   ├── lstm_model.py         # LSTM model implementation
│   ├── base_model.py         # Base model class
│   └── model_registry.py     # Model management
├── data_processing/
│   ├── __init__.py
│   ├── preprocessor.py       # Data preprocessing
│   ├── feature_engineering.py # Feature extraction
│   └── data_validator.py     # Data validation
├── analysis/
│   ├── __init__.py
│   ├── insights_generator.py # Generate insights
│   ├── anomaly_detection.py  # Detect anomalies
│   └── forecasting.py        # Time series forecasting
├── api/
│   ├── __init__.py
│   ├── api_service.py        # API routes and handlers
│   ├── schemas.py            # Pydantic models
│   └── dependencies.py       # API dependencies
├── utils/
│   ├── __init__.py
│   ├── utilities.py          # Utility functions
│   ├── logging_config.py     # Logging configuration
│   └── constants.py          # Constants and enums
├── tests/
│   ├── __init__.py
│   ├── test_models.py        # Model tests
│   ├── test_api.py           # API tests
│   └── test_data_processing.py # Data processing tests
└── notebooks/
    ├── data_exploration.ipynb
    ├── model_training.ipynb
    └── model_evaluation.ipynb
```

### Model Development

#### LSTM Model Guidelines

```python
import torch
import torch.nn as nn
from typing import Tuple, Optional
from pydantic import BaseModel

class LSTMConfig(BaseModel):
    """Configuration for LSTM model"""
    input_size: int
    hidden_size: int
    num_layers: int
    output_size: int
    dropout: float = 0.2
    bidirectional: bool = False

class LSTMModel(nn.Module):
    """LSTM model for time series forecasting"""

    def __init__(self, config: LSTMConfig):
        super(LSTMModel, self).__init__()
        self.config = config

        self.lstm = nn.LSTM(
            input_size=config.input_size,
            hidden_size=config.hidden_size,
            num_layers=config.num_layers,
            dropout=config.dropout if config.num_layers > 1 else 0,
            bidirectional=config.bidirectional,
            batch_first=True
        )

        # Calculate output size based on bidirectional setting
        lstm_output_size = config.hidden_size * (2 if config.bidirectional else 1)
        self.fc = nn.Linear(lstm_output_size, config.output_size)
        self.dropout = nn.Dropout(config.dropout)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # x shape: (batch_size, sequence_length, input_size)
        lstm_out, (hidden, cell) = self.lstm(x)

        # Use the last output for prediction
        last_output = lstm_out[:, -1, :]
        output = self.dropout(last_output)
        output = self.fc(output)

        return output
```

#### Data Processing Pipeline

```python
import pandas as pd
import numpy as np
from typing import List, Dict, Any, Tuple
from sklearn.preprocessing import StandardScaler, MinMaxScaler
from sklearn.model_selection import train_test_split

class IoTDataProcessor:
    """Process IoT sensor data for ML models"""

    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.scaler = StandardScaler()
        self.feature_columns = []

    def preprocess_sensor_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Preprocess raw sensor data"""
        # Handle missing values
        df = self._handle_missing_values(df)

        # Feature engineering
        df = self._create_time_features(df)
        df = self._create_sensor_features(df)

        # Outlier detection and handling
        df = self._handle_outliers(df)

        return df

    def _handle_missing_values(self, df: pd.DataFrame) -> pd.DataFrame:
        """Handle missing values in sensor data"""
        # Forward fill for short gaps
        df = df.fillna(method='ffill', limit=3)

        # Interpolate for longer gaps
        numeric_columns = df.select_dtypes(include=[np.number]).columns
        df[numeric_columns] = df[numeric_columns].interpolate(method='linear')

        return df

    def _create_time_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create time-based features"""
        if 'timestamp' in df.columns:
            df['timestamp'] = pd.to_datetime(df['timestamp'])
            df['hour'] = df['timestamp'].dt.hour
            df['day_of_week'] = df['timestamp'].dt.dayofweek
            df['month'] = df['timestamp'].dt.month
            df['is_weekend'] = df['day_of_week'].isin([5, 6]).astype(int)

        return df

    def _create_sensor_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create sensor-specific features"""
        # Rolling averages
        window_sizes = [5, 15, 30]  # minutes
        for col in ['temperature', 'humidity', 'soil_moisture']:
            if col in df.columns:
                for window in window_sizes:
                    df[f'{col}_rolling_{window}min'] = df[col].rolling(
                        window=window, min_periods=1
                    ).mean()

        # Rate of change
        for col in ['temperature', 'humidity']:
            if col in df.columns:
                df[f'{col}_rate_change'] = df[col].diff()

        return df

    def _handle_outliers(self, df: pd.DataFrame) -> pd.DataFrame:
        """Handle outliers using IQR method"""
        numeric_columns = df.select_dtypes(include=[np.number]).columns

        for col in numeric_columns:
            Q1 = df[col].quantile(0.25)
            Q3 = df[col].quantile(0.75)
            IQR = Q3 - Q1

            lower_bound = Q1 - 1.5 * IQR
            upper_bound = Q3 + 1.5 * IQR

            # Cap outliers instead of removing them
            df[col] = df[col].clip(lower=lower_bound, upper=upper_bound)

        return df
```

### API Development

#### FastAPI Implementation

```python
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import torch
import pandas as pd
from datetime import datetime

app = FastAPI(
    title="IoT Greenhouse AI Service",
    description="AI/ML service for greenhouse IoT data analysis",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class SensorData(BaseModel):
    """Sensor data input model"""
    timestamp: datetime
    temperature: float
    humidity: float
    soil_moisture: float
    light_intensity: float
    plant_id: str

class PredictionRequest(BaseModel):
    """Prediction request model"""
    sensor_data: List[SensorData]
    prediction_horizon: int = 24  # hours

class PredictionResponse(BaseModel):
    """Prediction response model"""
    predictions: List[Dict[str, Any]]
    confidence_scores: List[float]
    recommendations: List[str]
    model_version: str

@app.post("/predict", response_model=PredictionResponse)
async def predict_plant_health(
    request: PredictionRequest,
    model_service: ModelService = Depends(get_model_service)
):
    """Predict plant health and provide recommendations"""
    try:
        # Process input data
        df = pd.DataFrame([data.dict() for data in request.sensor_data])

        # Make predictions
        predictions = await model_service.predict(df, request.prediction_horizon)

        # Generate recommendations
        recommendations = await model_service.generate_recommendations(predictions)

        return PredictionResponse(
            predictions=predictions,
            confidence_scores=model_service.get_confidence_scores(),
            recommendations=recommendations,
            model_version=model_service.model_version
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.now()}
```

## Best Practices

### Code Quality

1. **Type Hints**: Use type hints throughout the codebase
2. **Docstrings**: Follow Google-style docstrings
3. **Error Handling**: Implement comprehensive error handling
4. **Logging**: Use structured logging with proper levels
5. **Configuration**: Use environment variables and config files

### Model Development

1. **Reproducibility**: Set random seeds for reproducible results
2. **Versioning**: Version your models and data
3. **Validation**: Implement proper train/validation/test splits
4. **Monitoring**: Monitor model performance in production
5. **Documentation**: Document model architecture and decisions

### Data Processing

1. **Validation**: Validate input data schemas
2. **Preprocessing**: Standardize data preprocessing pipelines
3. **Feature Engineering**: Create meaningful features from raw data
4. **Caching**: Cache processed data for efficiency
5. **Versioning**: Version your data processing pipelines

### Performance Optimization

1. **Batch Processing**: Process data in batches
2. **Caching**: Cache model predictions when appropriate
3. **Async Operations**: Use async/await for I/O operations
4. **Memory Management**: Monitor and optimize memory usage
5. **GPU Utilization**: Use GPU acceleration when available

### Testing

1. **Unit Tests**: Test individual functions and classes
2. **Integration Tests**: Test end-to-end workflows
3. **Model Tests**: Test model predictions and performance
4. **Data Tests**: Test data quality and schemas
5. **Performance Tests**: Test inference speed and memory usage

### Security

1. **Input Validation**: Validate all inputs
2. **API Security**: Implement authentication and rate limiting
3. **Data Privacy**: Protect sensitive data
4. **Model Security**: Protect model files and weights
5. **Logging**: Avoid logging sensitive information

## IoT-Specific Considerations

### Sensor Data Characteristics

1. **Time Series Nature**: Handle temporal dependencies
2. **Missing Data**: Implement robust missing data handling
3. **Sensor Drift**: Account for sensor calibration drift
4. **Sampling Rates**: Handle variable sampling rates
5. **Data Quality**: Implement data quality checks

### Real-time Processing

1. **Streaming Data**: Process data in real-time streams
2. **Low Latency**: Optimize for low-latency predictions
3. **Edge Computing**: Consider edge deployment for ESP32
4. **Batch vs Stream**: Choose appropriate processing method
5. **State Management**: Maintain model state across requests

### Model Deployment

1. **Containerization**: Use Docker for consistent deployment
2. **Model Serving**: Implement efficient model serving
3. **Health Checks**: Implement comprehensive health checks
4. **Rollback Strategy**: Plan for model rollbacks
5. **Monitoring**: Monitor model performance in production

## Example Implementations

### Complete Model Training Pipeline

```python
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, Dataset
import pandas as pd
import numpy as np
from sklearn.metrics import mean_squared_error, mean_absolute_error
import logging

class IoTTimeSeriesDataset(Dataset):
    """Dataset for IoT time series data"""

    def __init__(self, data: pd.DataFrame, sequence_length: int = 24):
        self.data = data
        self.sequence_length = sequence_length

    def __len__(self):
        return len(self.data) - self.sequence_length

    def __getitem__(self, idx):
        # Get sequence of features
        features = self.data.iloc[idx:idx + self.sequence_length][
            ['temperature', 'humidity', 'soil_moisture', 'light_intensity']
        ].values

        # Get target (next value)
        target = self.data.iloc[idx + self.sequence_length]['plant_health_score']

        return torch.FloatTensor(features), torch.FloatTensor([target])

class ModelTrainer:
    """Model training utilities"""

    def __init__(self, model, device='cpu'):
        self.model = model
        self.device = device
        self.model.to(device)

    def train_epoch(self, dataloader, optimizer, criterion):
        """Train model for one epoch"""
        self.model.train()
        total_loss = 0

        for batch_idx, (data, target) in enumerate(dataloader):
            data, target = data.to(self.device), target.to(self.device)

            optimizer.zero_grad()
            output = self.model(data)
            loss = criterion(output, target)
            loss.backward()
            optimizer.step()

            total_loss += loss.item()

        return total_loss / len(dataloader)

    def validate(self, dataloader, criterion):
        """Validate model performance"""
        self.model.eval()
        total_loss = 0
        predictions = []
        actuals = []

        with torch.no_grad():
            for data, target in dataloader:
                data, target = data.to(self.device), target.to(self.device)
                output = self.model(data)
                loss = criterion(output, target)
                total_loss += loss.item()

                predictions.extend(output.cpu().numpy())
                actuals.extend(target.cpu().numpy())

        return total_loss / len(dataloader), predictions, actuals
```

## Monitoring & Logging

### Structured Logging

```python
import logging
import json
from datetime import datetime
from typing import Dict, Any

class IoTMLLogger:
    """Structured logger for IoT ML operations"""

    def __init__(self, name: str):
        self.logger = logging.getLogger(name)
        self.logger.setLevel(logging.INFO)

        # Create console handler with JSON formatter
        handler = logging.StreamHandler()
        handler.setFormatter(self._get_json_formatter())
        self.logger.addHandler(handler)

    def _get_json_formatter(self):
        """Get JSON formatter for structured logging"""
        class JsonFormatter(logging.Formatter):
            def format(self, record):
                log_entry = {
                    'timestamp': datetime.utcnow().isoformat(),
                    'level': record.levelname,
                    'logger': record.name,
                    'message': record.getMessage(),
                    'module': record.module,
                    'function': record.funcName,
                    'line': record.lineno
                }

                # Add extra fields if available
                if hasattr(record, 'extra_fields'):
                    log_entry.update(record.extra_fields)

                return json.dumps(log_entry)

        return JsonFormatter()

    def log_prediction(self, model_name: str, input_shape: tuple,
                      prediction_time: float, confidence: float):
        """Log model prediction details"""
        extra_fields = {
            'model_name': model_name,
            'input_shape': input_shape,
            'prediction_time_ms': prediction_time * 1000,
            'confidence': confidence,
            'event_type': 'model_prediction'
        }

        self.logger.info(
            f"Model prediction completed: {model_name}",
            extra={'extra_fields': extra_fields}
        )
```

## Deployment & DevOps

### Docker Configuration

```dockerfile
FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user
RUN useradd -m -u 1000 aiuser && chown -R aiuser:aiuser /app
USER aiuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8000/health')"

# Expose port
EXPOSE 8000

# Run application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## Testing Strategy

### Unit Testing

```python
import unittest
import torch
import pandas as pd
from unittest.mock import Mock, patch
from models.lstm_model import LSTMModel, LSTMConfig
from data_processing.preprocessor import IoTDataProcessor

class TestLSTMModel(unittest.TestCase):
    """Test LSTM model functionality"""

    def setUp(self):
        self.config = LSTMConfig(
            input_size=4,
            hidden_size=64,
            num_layers=2,
            output_size=1
        )
        self.model = LSTMModel(self.config)

    def test_model_initialization(self):
        """Test model initialization"""
        self.assertIsInstance(self.model, LSTMModel)
        self.assertEqual(self.model.config.input_size, 4)

    def test_model_forward_pass(self):
        """Test model forward pass"""
        batch_size, seq_len, input_size = 2, 10, 4
        x = torch.randn(batch_size, seq_len, input_size)

        output = self.model(x)

        self.assertEqual(output.shape, (batch_size, 1))

    def test_model_prediction_range(self):
        """Test model prediction is in valid range"""
        x = torch.randn(1, 24, 4)
        output = self.model(x)

        # Assuming plant health score is between 0 and 1
        self.assertTrue(0 <= output.item() <= 1)

class TestDataProcessor(unittest.TestCase):
    """Test data processing functionality"""

    def setUp(self):
        self.processor = IoTDataProcessor({})

        # Create sample data
        self.sample_data = pd.DataFrame({
            'timestamp': pd.date_range('2024-01-01', periods=100, freq='H'),
            'temperature': np.random.normal(25, 5, 100),
            'humidity': np.random.normal(60, 10, 100),
            'soil_moisture': np.random.normal(40, 8, 100),
            'light_intensity': np.random.normal(300, 50, 100)
        })

    def test_time_feature_creation(self):
        """Test time feature creation"""
        result = self.processor._create_time_features(self.sample_data.copy())

        self.assertIn('hour', result.columns)
        self.assertIn('day_of_week', result.columns)
        self.assertIn('month', result.columns)
        self.assertIn('is_weekend', result.columns)

    def test_missing_value_handling(self):
        """Test missing value handling"""
        # Introduce missing values
        data_with_missing = self.sample_data.copy()
        data_with_missing.loc[10:15, 'temperature'] = np.nan

        result = self.processor._handle_missing_values(data_with_missing)

        # Check no missing values remain
        self.assertEqual(result.isnull().sum().sum(), 0)
```

## Continuous Integration

### Testing Configuration

```yaml
# .github/workflows/ai-ci.yml
name: AI Service CI

on:
  push:
    paths:
      - "apps/ai/**"
  pull_request:
    paths:
      - "apps/ai/**"

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: "3.9"

      - name: Install dependencies
        run: |
          cd apps/ai
          pip install -r requirements.txt
          pip install pytest pytest-cov

      - name: Run tests
        run: |
          cd apps/ai
          pytest --cov=. --cov-report=xml

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./apps/ai/coverage.xml
```

This comprehensive AI development guide provides the foundation for building robust, scalable, and maintainable AI/ML services for the IoT greenhouse system.
