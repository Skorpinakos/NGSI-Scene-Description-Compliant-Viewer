from init_entity import create_entity

scene_descriptor = {
    "id": "urn:ngsi-ld:SceneDescriptor:001",
    "type": "SceneDescriptor",
    "refAssets": {
        "type": "Relationship",
        "value": ["urn:ngsi-ld:Asset:001", "urn:ngsi-ld:Asset:002"]
    },
    "sceneSpace": {
        #v1 only a Polygon
        #TODO: v2 add MultiPolygon or Holes in Polygon
        "type": "GeoProperty",
        "value": {
            "type": "Polygon",
            "coordinates": [
            [
                [4.85, 45.76],
                [4.86, 45.76],
                [4.86, 45.77],
                [4.85, 45.77],
                [4.85, 45.76]
            ]
            ]
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

asset_descriptor = {
    "id": "urn:ngsi-ld:Asset:001",
    "type": "Asset",
    "refAssetData": {
        "type": "Relationship",
        "value": ["urn:ngsi-ld:AssetData:001"]
    },
    "resourceLink": {
        "type": "Property",
        "value": [
            {
                "type": "model", 
                "format": "obj",
                "url": "https://example.com/models/asset001.obj"
            },
            {
                "type": "texture",
                "format": "jpg",
                "url": "https://example.com/textures/asset001.jpg"
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
  "refSemanticRepresentation": {
    "type": "Relationship",
    "value": ["urn:ngsi-ld:SemanticRepresentation:001"]
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
    "id": "urn:ngsi-ld:AssetData:001",
    "type": "AssetData",
    "refSource": {
        "type": "Relationship",
        "value": ["urn:ngsi-ld:Source:001"]
    },
    "refValue": {
        "type": "Property",
        "value": "http://labserver.sense-campus.gr:1026/v2/entities/4G_Measurement/attrs/rssi/value"
    },
    "description": {
        "type": "Property",
        "value": "RSSI values from 4G measurements"
    },
    "valueRepr": {
        "type": "Property",
        "value": [
            {
                "type": "singularValue",
                "unit": "dBm",
                "threshold": {
                    "min": -120,
                    "max": -50
                }
            }
        ]
    }
}

create_entity(asset_data)

