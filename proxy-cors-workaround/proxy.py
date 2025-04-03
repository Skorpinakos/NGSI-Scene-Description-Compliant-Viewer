from flask import Flask, request, Response
import requests

app = Flask(__name__)

# Set the base URL of your context broker
CONTEXT_BROKER_URL = 'http://150.140.186.118:1026'

@app.route('/<path:path>', methods=['GET', 'POST', 'PUT', 'DELETE', 'PATCH'])
def proxy(path):
    # Build the full URL
    target_url = f"{CONTEXT_BROKER_URL}/{path}"

    # Forward the request with method, headers, and data
    response = requests.request(
        method=request.method,
        url=target_url,
        headers={key: value for key, value in request.headers if key.lower() != 'host'},
        params=request.args,
        data=request.get_data(),
        cookies=request.cookies,
    )

    # Build the response and add CORS headers
    proxy_response = Response(response.content, response.status_code)
    proxy_response.headers = dict(response.headers)
    proxy_response.headers['Access-Control-Allow-Origin'] = '*'
    proxy_response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS, PATCH'
    proxy_response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'

    return proxy_response

@app.after_request
def add_cors_headers(response):
    # Ensures preflight OPTIONS requests also get CORS headers
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS, PATCH'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    return response

if __name__ == '__main__':
    app.run(debug=True, port=5000)
