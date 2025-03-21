import requests

url = "http://150.140.186.118:1026/v2/entities"

headers = {
    "Content-Type": "application/json", 
    
    "FIWARE-ServicePath": "/ster/DT/tests"
}

data = {
  "id": "urn:ngsi-ld:Sensor:MultiSensor001",
  "type": "temp-sensor",
  "monitoredProperties": {
    "type": "Property",
    "value": ["temperature", "humidity", "pressure"]
  },

  "values": {
    "type": "Property",
    "value": {
      "temperature": {
        "type": "Property",
        "value": 25.3,
        "unitCode": {
          "type": "Property",
          "value": "CEL"
        },
        "timestamp": {
          "type": "Property",
          "value": "2025-03-19T12:00:00Z"
        }
      },
      "humidity": {
        "type": "Property",
        "value": 60,
        "unitCode": {
          "type": "Property",
          "value": "PCT"
        },
        "timestamp": {
          "type": "Property",
          "value": "2025-03-19T12:00:00Z"
        }
      },
      "pressure": {
        "type": "Property",
        "value": 1013,
        "unitCode": {
          "type": "Property",
          "value": "hPa"
        },
        "timestamp": {
          "type": "Property",
          "value": "2025-03-19T12:00:00Z"
        }
      }
    }
  },

  "geoPose": {
    "type": "GeoProperty",
    "value": {
      "position": {
        "lat": 47.7,
        "lon": -122.3,
        "h": 11.5
      },
      "angles": {
        "yaw": 5.514456741060452,
        "pitch": -0.43610515937237904,
        "roll": 0.0
      }
    }
  },

  "activeMonitoring": {
    "type": "Property",
    "value": ["temperature", "pressure"]
  },

  "refDevice": {
    "type": "Relationship",
    "object": "urn:ngsi-ld:Device:HVAC001"
  },

  "status": {
    "type": "Property",
    "value": "active"
  },

  "communicationProtocol": {
    "type": "Property",
    "value": "MQTT"
  },

  "samplingFrequency": {
    "type": "Property",
    "value": "1Hz"
  },

  "dataSource": {
    "type": "Property",
    "value": {
      "api": {
        "type": "Property",
        "value": "https://example.com/api/sensor-data"
      },
      "mqttTopic": {
        "type": "Property",
        "value": "sensor/temperature"
      },
      "protocol": {
        "type": "Property",
        "value": "MQTT"
      },
      "dataFormat": {
        "type": "Property",
        "value": "JSON"
      }
    }
  }
}


response = requests.post(url, json=data, headers=headers)

if response.status_code == 201:
    print("Entity created successfully with service and path!")
else:
    print(f"Failed to create entity: {response.status_code}")
    print(response.json())
