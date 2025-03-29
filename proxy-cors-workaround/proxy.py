import flask_cors
from flask import Flask, request, jsonify
import requests

app = Flask(__name__)
flask_cors.CORS(app)

@app.route('/proxy/scene', methods=['GET'])
def proxy_request():
    target_url = "http://150.140.186.118:1026/v2/entities/urn:ngsi-ld:SceneDescriptor:001"
    response = requests.get(target_url)
    return (response.text, response.status_code, response.headers.items())

@app.route('/proxy/urn:ngsi-ld:Asset:001', methods=['GET'])
def proxy_asset():
    target_url="http://150.140.186.118:1026/v2/entities/urn:ngsi-ld:Asset:001/attrs"
    response = requests.get(target_url)
    return (response.text, response.status_code, response.headers.items())

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)