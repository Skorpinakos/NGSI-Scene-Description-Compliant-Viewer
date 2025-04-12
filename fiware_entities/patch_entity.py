from init_entity import create_entity, patch_entity
scene_descriptor = {
    # "id": "urn:ngsi-ld:SceneDescriptor:001",
    # "type": "SceneDescriptor",
    "refAssets": {
        "type": "Relationship",
        "value": ["urn:ngsi-ld:Asset:001", "urn:ngsi-ld:Asset:002","urn:ngsi-ld:Asset:003","urn:ngsi-ld:Asset:004"]
    },
    "sceneSpace": {
        #v1 only a Polygon
        #TODO: v2 add MultiPolygon or Holes in Polygon
        "type": "GeoProperty",
        "value": {
            "type": "MultiPolygon",
            "coordinates": [
            [[
                [4.85, 45.76],
                [4.86, 45.76],
                [4.86, 45.77],
                [4.85, 45.77],
                [4.85, 45.76]
            ]],
            [[
                [4.85, 45.76],
                [4.86, 45.76],
                [4.86, 45.77],
                [4.85, 45.77],
                [4.85, 45.76]
            ]]
            ]
        }
    },
    "transformation": {
        "type": "Property",
        "value": {
            "position": [1,1,1],
            "rotation": [0,0,0],
            "scale": [1,1,1]
        }
    },
    "refBackground": {
        "type": "Relationship",
        "value": [
            "urn:ngsi-ld:Bg:001"
            ]
    },
    "refSemanticLayers": {
        "type": "Relationship",
        "value": [
            "urn:ngsi-ld:SemanticLayer:001"
        ]
    }
}

asset_descriptor_ws = {
    # "id": "urn:ngsi-ld:Asset:001",
    # "type": "Asset",
    "refAssetData": {
        "type": "Relationship",
        "value": ["urn:ngsi-ld:AssetData:001"]
    },
    "resourceLink": {
        "type": "Property",
        "value": 
            [   
                {
                    "type": "Mesh",
                    "format": "obj",
                    "model": './virtual_assets/ws/weather_station.obj',
                    "textures": ['./virtual_assets/ws/weather_station.png'],
                    "size": 0.912, #MB
                    "scale": [0.5, 0.5, 0.5],
                }
            ]
    },
    "GeoPose":{
        "type": "Property",
        "value": {
            #geopose protocol 6DOF
            "position": {
                "lat": 38.287829, 
                "lon":  21.787812,
                "h": 68.5
            },
            "angles": {
                "yaw": 90,
                "pitch": 90,
                "roll": 0
            }
        }
    },
    "updateMethodSpatial":{
        "type": "Property",
        "value": {
            "mqtt": {
                "broker": "150.140.186.118",
                "port": 1883,
                "topic": "urn:ngsi-ld:AssetData:001"
            }
    }
    },
   "speed":{
       "type": "Property",
        "value": {
              "speed": 0.5,
              "unit": "m/s"
         }       
   },
  "refSemanticRepresentation": {
        "type": "Relationship",
        "value": ["urn:ngsi-ld:SemanticRepresentation:001"]
  },
  "refParent": {
        "type": "Relationship",
        "value": "urn:ngsi-ld:Asset:000"
  },
    "refChildren": {
        "type": "Relationship",
        "value": [
            "urn:ngsi-ld:Asset:002"
        ]
    },
    "relOffset": {
        "type": "Property",
        "value": {
            "x": 0.0,
            "y": 0.0,
            "z": 0.0
        }
    }
}

asset_descriptor_ws_aircraft_mod = {
    # "id": "urn:ngsi-ld:Asset:001",
    # "type": "Asset",
    "refAssetData": {
        "type": "Relationship",
        "value": ["urn:ngsi-ld:AssetData:001"]
    },
    "resourceLink": {
        "type": "Property",
        "value": 
            [   
                {
                    "type": "Mesh",
                    "format": "obj",
                    # "model": './virtual_assets/ws/weather_station.obj',
                    # "textures": ['./virtual_assets/ws/weather_station.png'],
                    "model": './virtual_assets/aircraft/aircraft.obj',
                    "textures": ['./virtual_assets/aircraft/steel.jpg','./virtual_assets/aircraft/E-45_col3.jpg','./virtual_assets/aircraft/E-45_col2.jpg','./virtual_assets/aircraft/E-45_col.jpg','./virtual_assets/aircraft/E-45_glass_nor_.jpg','./virtual_assets/aircraft/E-45-nor_1.jpg','./virtual_assets/aircraft/E-45_REF 1.jpg'],
                    "size": 0.912, #MB
                    "scale": [0.5, 0.5, 0.5],
                }
            ]
    },
    "GeoPose":{
        "type": "Property",
        "value": {
            #geopose protocol 6DOF
            "position": {
                "lat": 38.287829, 
                "lon":  21.787812,
                "h": 68.5
            },
            "angles": {
                "yaw": 90,
                "pitch": 90,
                "roll": 0
            }
        }
    },
    "updateMethodSpatial":{
        "type": "Property",
        "value": {
            "mqtt": {
                "broker": "150.140.186.118",
                "port": 1883,
                "topic": "urn:ngsi-ld:AssetData:001"
            }
    }
    },
   "speed":{
       "type": "Property",
        "value": {
              "speed": 0.5,
              "unit": "m/s"
         }       
   },
  "refSemanticRepresentation": {
        "type": "Relationship",
        "value": ["urn:ngsi-ld:SemanticRepresentation:001"]
  },
  "refParent": {
        "type": "Relationship",
        "value": "urn:ngsi-ld:Asset:000"
  },
    "refChildren": {
        "type": "Relationship",
        "value": [
            "urn:ngsi-ld:Asset:002"
        ]
    },
    "relOffset": {
        "type": "Property",
        "value": {
            "x": 0.0,
            "y": 0.0,
            "z": 0.0
        }
    }
}


background_descriptor={
    "id": "urn:ngsi-ld:Bg:001",
    "type": "Background",
    "resourceLink": {
        "type": "Property",
        "value": [
            {
                "type": "mesh", 
                "format": "pcd",
                "url": "https://example.com/backgrounds/bg001.jpg"
            }
        ]
    },
    "resourceFormat": {
        "type": "Property",
        "value": "Ply"
    },
    "resourceParams": {
        "type": "Property",
        "value": [
            {
            "opactiy": "0.4"
            }
        ]
    },
    "resourceProperties": {
        "type": "Property",
        "value": [
            #fiels based on the Format field
            {
                "pointCount": "1000"
            },
            {
                "triangleCount": "2000"
            },
            {
                "harmonicsCount": "1000"
            }
        ]
    },
     "scale": {
        "type": "Property",
        "value": [1,1,1]
    },
    "geopose": {
        "type": "Property",
        "value": {
            #geopose protocol 6DOF
            "position": {
                "lat": 38.245258,
                "lon":  21.731860,
                "h": 1
            },
            "angles": {
                "yaw": 5.514456741060452,
                "pitch": -0.43610515937237904,
                "roll": 0.0
            }
        }
    },
    "reprOptions": {
        # eg renderer/viewer
        "type": "Property",
        "value": [
            {
                "animate": False
            },
            {
                "showLoadingUI": False
            }
        ]
    }
}

asset_data={
    # "id": "urn:ngsi-ld:AssetData:001",
    # "type": "AssetData",
    "refSource": {
        "type": "Relationship",
        "value": ["urn:ngsi-ld:Source:001"]
    },
    "refValue": {
        "type": "Property",
        "value": "http://localhost:5000/v2/entities/urn:ngsi-ld:Source:001/attrs/temperature/value"
    },
    "description": {
        "type": "Property",
        "value": "Temperature dumpy sensor"
    },
    "valueRepr": {
        "type": "Property",
        "value": [
            {
                "type": "singularValue",
                "unit": "Celsius",
                "threshold": {
                    "min": 0,
                    "max": 45
                }
            }
        ]
    },
    "updateSrc": {
      "type": "Property",
      "value": {
          "http": {
              "url": "http://labserver.sense-campus.gr:1026/v2/entities/urn:ngsi-ld:Source:001/attrs/temperature/value",
              "method": "GET",
              "headers": {
                  "Content-Type": "application/json"
              },
              "samplingPeriod": 1000 #ms
          },
            "mqtt": {
                "broker": "150.140.186.118",
                "port": 1883,
                "topic": "urn:ngsi-ld:Source:001" 
            },
            "ws": {
                "url": "ws://labserver.sense-campus.gr:1026/v2/entities/urn:ngsi-ld:Source:001/attrs/location/value",
                "headers": {
                    "Content-Type": "application/json"
                }
            }
      }
  }
}

asset_descriptor_2 = {
    # "id": "urn:ngsi-ld:Asset:002",
    # "type": "Asset",
    "refAssetData": {
        "type": "Relationship",
        "value": ["urn:ngsi-ld:AssetData:001"]
    },
    "resourceLink": {
        "type": "Property",
        "value": [
            [   
                {
                    "type": "Mesh",
                    "format": "obj",
                    "model": './virtual_assets/aircraft/aircraft.obj',
                    "textures": ['./virtual_assets/aircraft/steel.jpg','./virtual_assets/aircraft/E-45_col3.jpg','./virtual_assets/aircraft/E-45_col2.jpg','./virtual_assets/aircraft/E-45_col.jpg','./virtual_assets/aircraft/E-45_glass_nor_.jpg','./virtual_assets/aircraft/E-45-nor_1.jpg','./virtual_assets/aircraft/E-45_REF 1.jpg'],
                    "size": 1.3, #MB
                    "scale": [0.5, 0.5, 0.5],
                }
            ]
        ]
    },
    "geoPose": {
        "type": "Property",
        "value": {
            #geopose protocol 6DOF
            "position": {
                "lat": 38.245105, 
                "lon":  21.731640,
                "h": 10
            },
            "angles": {
                "yaw": 90,
                "pitch": 0,
                "roll": 0
            }
        }
  },
  "updateSrc": {
      "type": "Property",
      "value": {
          "http": {
              "url": "http://labserver.sense-campus.gr:1026/v2/entities/urn:ngsi-ld:Source:001/attrs/location/value",
              "method": "GET",
              "headers": {
                  "Content-Type": "application/json"
              },
              "samplingPeriod": 1000 #ms
          },
            "mqtt": {
                "broker": "150.140.186.118",
                "port": 1883,
                "topic": "urn:ngsi-ld:AssetData:001"
            },
            "ws": {
                "url": "ws://labserver.sense-campus.gr:1026/v2/entities/urn:ngsi-ld:Source:001/attrs/location/value",
                "headers": {
                    "Content-Type": "application/json"
                }
            }
      }
  },
  "refSemanticRepresentation": {
    "type": "Relationship",
    "value": ["urn:ngsi-ld:SemanticRepresentation:001"]
  },
  "refParent": {
    "type": "Relationship",
    "value": "urn:ngsi-ld:Asset:000"
  },
    "refChildren": {
        "type": "Relationship",
        "value": [
        ]
    }
}

asset_parking_sensor = {
    # "id": "urn:ngsi-ld:Asset:003",
    # "type": "Asset",
    "refAssetData": {
        "type": "Relationship",
        "value": ["urn:ngsi-ld:AssetData:002"]
    },
    "resourceLink": {
        "type": "Property",
        "value": [
            [   
                {
                    "type": "Mesh",
                    "format": "obj",
                    "model": './virtual_assets/parking_sensor_draft/parking_sensor_draft.obj',
                    "textures": ['./virtual_assets/parking_sensor_draft/parking_sensor_draft.png'],
                    "size": 9.8, #MB
                    "scale": [0.1, 0.1, 0.1],
                }
            ]
        ]
    },
    "geoPose": {
        "type": "Property",
        "value": {
            #geopose protocol 6DOF
            "position": {
                "lat": 38.287813, 
                "lon":  21.788504,
                "h": 68.4
            },
            "angles": {
                "yaw": 180,
                "pitch": 0,
                "roll": 0
            }
        }
  },
  "updateSrc": {
      "type": "Property",
      "value": {
          "http": {
              "url": "http://labserver.sense-campus.gr:1026/v2/entities/urn:ngsi-ld:Source:001/attrs/location/value",
              "method": "GET",
              "headers": {
                  "Content-Type": "application/json"
              },
              "samplingPeriod": 1000 #ms
          },
            "mqtt": {
                "broker": "150.140.186.118",
                "port": 1883,
                "topic": "urn:ngsi-ld:AssetData:001"
            },
            "ws": {
                "url": "ws://labserver.sense-campus.gr:1026/v2/entities/urn:ngsi-ld:Source:001/attrs/location/value",
                "headers": {
                    "Content-Type": "application/json"
                }
            }
      }
  },
  "refSemanticRepresentation": {
    "type": "Relationship",
    "value": ["urn:ngsi-ld:SemanticRepresentation:001"]
  },
  "refParent": {
    "type": "Relationship",
    "value": "urn:ngsi-ld:Asset:000"
  },
    "refChildren": {
        "type": "Relationship",
        "value": [
        ]
    }
}

asset_data_parking={
    # "id": "urn:ngsi-ld:AssetData:002",
    # "type": "AssetData",
    "refSource": {
        "type": "Relationship",
        "value": ["uni_parking_001"]
    },
    "refValue": {
        "type": "Property",
        "value": "http://localhost:5000/v2/entities/uni_parking_001/attrs/status/value"
    },
    "description": {
        "type": "Property",
        "value": "Parking Sensor ECE - handicapped"
    },
    "valueRepr": {
        "type": "Property",
        "value": [
            {
                "type": "boolean",
                "states": ["occupied", "free"],
                "unit": "boolean"
            }
        ]
    },
    "updateSrc": {
      "type": "Property",
      "value": {
          "http": {
              "url": "http://labserver.sense-campus.gr:1026/v2/entities/urn:ngsi-ld:Source:001/attrs/temperature/value",
              "method": "GET",
              "headers": {
                  "Content-Type": "application/json"
              },
              "samplingPeriod": 1000 #ms
          },
            "mqtt": {
                "broker": "150.140.186.118",
                "port": 1883,
                "topic": "urn:ngsi-ld:Source:001" 
            },
            "ws": {
                "url": "ws://labserver.sense-campus.gr:1026/v2/entities/urn:ngsi-ld:Source:001/attrs/location/value",
                "headers": {
                    "Content-Type": "application/json"
                }
            }
      }
  }
}

asset_car_descriptor = {
    # "id": "urn:ngsi-ld:Asset:004",
    # "type": "Asset",
    "refAssetData": {
        "type": "Relationship",
        "value": ["urn:ngsi-ld:AssetData:003"]
    },
    "resourceLink": {
        "type": "Property",
        "value": [
            [   
                {
                    "type": "Mesh",
                    "format": "obj",
                    "model": './virtual_assets/car/audi_car.obj',
                    "textures": [''],
                    "size": 98.6, #MB
                    "scale": [0.8, 0.8, 0.8],
                }
            ]
        ]
    },
    "spatialInfo": {
        "type": "Property",
        "value": {
            "geoPose":
            {
                #geopose protocol 6DOF
                "position": {
                    "lat": 38.245268,
                    "lon":  21.731840,
                    "h": 68
                },
                "angles": {
                    "yaw": 90,
                    "pitch": 90,
                    "roll": 0
                }
            },
            "updateMethod":
            {
                "ws": {
                    "url": "ws://localhost:6789/"
            }
        }
  }
},
  "updateSrc": {
      "type": "Property",
      "value": {
          "http": {
              "url": "http://labserver.sense-campus.gr:1026/v2/entities/urn:ngsi-ld:Source:001/attrs/location/value",
              "method": "GET",
              "headers": {
                  "Content-Type": "application/json"
              },
              "samplingPeriod": 1000 #ms
          },
            "mqtt": {
                "broker": "150.140.186.118",
                "port": 1883,
                "topic": "urn:ngsi-ld:AssetData:001"
            },
            "ws": {
                "url": "ws://labserver.sense-campus.gr:1026/v2/entities/urn:ngsi-ld:Source:001/attrs/location/value",
                "headers": {
                    "Content-Type": "application/json"
                }
            }
      }
  },
  "refSemanticRepresentation": {
    "type": "Relationship",
    "value": ["urn:ngsi-ld:SemanticRepresentation:001"]
  },
  "refParent": {
    "type": "Relationship",
    "value": "urn:ngsi-ld:Asset:000"
  },
    "refChildren": {
        "type": "Relationship",
        "value": [
        ]
    }
}

sensor={
    "id": "urn:ngsi-ld:Source:001",
    "type": "TempSensor",
    "temperature": {
        "type": "Property",
        "value": 23.0
    },
    "location": {
        "type": "GeoProperty",
        "value": {
            "type": "Point",
            "coordinates": [4.85, 45.76]
        }
    },
    "timestamp": {
        "type": "DateTime",
        "value": "2021-06-01T00:00:00Z"
    }
}

parking_sensor={
        "category": {
        "type": "Text",
        "value": "OffStreet",
        "metadata": {}
        },
        "dateModified": {
        "type": "DateTime",
        "value": "2025-04-04T08:02:22.000Z",
        "metadata": {}
        },
        "location": {
        "type": "geo:json",
        "value": {
        "type": "Point",
        "coordinates": [
        21.788438498,
        38.287755788
        ]
        },
        "metadata": {}
        },
        "refParkingSite": {
        "type": "URL",
        "value": "http://labserver.sense-campus.gr:1026/v2/entities/parkingsite_upatras_001",
        "metadata": {}
        },
        "status": {
        "type": "Number",
        "value": 1,
        "metadata": {}
        }
        }

ws_descriptor={
    # "id": "urn:ngsi-ld:Asset:001",
    # "type": "Asset",
    "refAssetData": {
        "type": "Relationship",
        "value": ["urn:ngsi-ld:AssetData:001"]
    },
    "resourceLink": {
        "type": "Property",
        "value": 
            [   
                {
                    "type": "Mesh",
                    "format": "obj",
                    "model": "./virtual_assets/ws/weather_station.obj",
                    "textures": ["./virtual_assets/ws/weather_station.png"],
                    "size": 0.912, 
                    "scale": [0.5, 0.5, 0.5]
                }
            ]
    },
    "GeoPose":{
        "type": "Property",
        "value": {
            "position": {
                "lat": 38.287829, 
                "lon":  21.787812,
                "h": 68.5
            },
            "angles": {
                "yaw": 90,
                "pitch": 0,
                "roll": 0
            }
        }
    },
    "updateMethodSpatial":{
        "type": "Property",
        "value": {
            "mqtt": {
                "broker": "150.140.186.118",
                "port": 1883,
                "topic": "urn:ngsi-ld:AssetData:001"
            }
    }
    },
   "updateMethod": {
      "type": "Property",
      "value": {
          "http": {
              "url": "http://labserver.sense-campus.gr:1026/v2/entities/urn:ngsi-ld:Source:001/attrs/location/value",
              "method": "GET",
              "headers": {
                  "Content-Type": "application/json"
              },
              "samplingPeriod": 1000 
          },
            "mqtt": {
                "broker": "150.140.186.118",
                "port": 1883,
                "topic": "urn:ngsi-ld:AssetData:001"
            },
            "ws": {
                "url": "ws://labserver.sense-campus.gr:1026/v2/entities/urn:ngsi-ld:Source:001/attrs/location/value",
                "headers": {
                    "Content-Type": "application/json"
                }
            }
      }
  },
  "refSemanticRepresentation": {
    "type": "Relationship",
    "value": ["urn:ngsi-ld:SemanticRepresentation:001"]
  },
  "refParent": {
    "type": "Relationship",
    "value": "urn:ngsi-ld:Asset:000"
  },
    "refChildren": {
        "type": "Relationship",
        "value": [
            "urn:ngsi-ld:Asset:002"
        ]
    }
}

asset_descriptor_2 = {
    # "id": "urn:ngsi-ld:Asset:002",
    # "type": "Asset",
    "refAssetData": {
        "type": "Relationship",
        "value": ["urn:ngsi-ld:AssetData:002"]
    },
    "resourceLink": {
        "type": "Property",
        "value": [
                {
                    "type": "Mesh",
                    "format": "obj",
                    "model": './virtual_assets/parking_sensor_draft/parking_sensor_draft.obj',
                    "textures": ['./virtual_assets/parking_sensor_draft/parking_sensor_draft.png'],
                    "size": 9.8, #MB
                    "scale": [0.1, 0.1, 0.1],
                }
        ]
    },
    "GeoPose": {
        "type": "Property",
        "value": {
            #geopose protocol 6DOF
            "position": {
                "lat": 38.287813, 
                "lon":  21.788504,
                "h": 68.4
            },
            "angles": {
                "yaw": 180,
                "pitch": 0,
                "roll": 0
            }
        }
  },
  "updateMethodSpatial":{
        "type": "Property",
        "value": {
            "mqtt": {
                "broker": "150.140.186.118",
                "port": 1883,
                "topic": "urn:ngsi-ld:AssetData:002"
            }
    }
    },
   "updateMethod": {
      "type": "Property",
      "value": {
          "http": {
              "url": "http://labserver.sense-campus.gr:1026/v2/entities/urn:ngsi-ld:Source:001/attrs/location/value",
              "method": "GET",
              "headers": {
                  "Content-Type": "application/json"
              },
              "samplingPeriod": 1000 
          },
            "mqtt": {
                "broker": "150.140.186.118",
                "port": 1883,
                "topic": "urn:ngsi-ld:AssetData:001"
            },
            "ws": {
                "url": "ws://labserver.sense-campus.gr:1026/v2/entities/urn:ngsi-ld:Source:001/attrs/location/value",
                "headers": {
                    "Content-Type": "application/json"
                }
            }
      }
  },
  "refSemanticRepresentation": {
    "type": "Relationship",
    "value": ["urn:ngsi-ld:SemanticRepresentation:001"]
  },
  "refParent": {
    "type": "Relationship",
    "value": "urn:ngsi-ld:Asset:000"
  },
    "refChildren": {
        "type": "Relationship",
        "value": [
        ]
    }
}
# entities = [scene_descriptor, asset_descriptor, background_descriptor, asset_data, sensor]
# for entity in entities:
#     create_entity(entity)
# create_entity(asset_descriptor)

patch_entity("urn:ngsi-ld:SceneDescriptor:001",scene_descriptor)
# patch_entity("urn:ngsi-ld:Asset:001",asset_descriptor_ws_aircraft_mod)