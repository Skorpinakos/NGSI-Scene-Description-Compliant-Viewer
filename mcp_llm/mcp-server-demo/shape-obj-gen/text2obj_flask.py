from flask import Flask, request, jsonify, send_file
import torch
import os
from shap_e.diffusion.sample import sample_latents
from shap_e.diffusion.gaussian_diffusion import diffusion_from_config
from shap_e.models.download import load_model, load_config
from shap_e.util.notebooks import decode_latent_mesh
import uuid

# === Init ===
app = Flask(__name__)
device = "cuda" if torch.cuda.is_available() else "cpu"

# Load models once on server start
xm = load_model('transmitter', device=device)
model = load_model('text300M', device=device)
diffusion = diffusion_from_config(load_config('diffusion'))

OUTPUT_DIR = "generated_objs"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# === Routes ===

@app.route('/generate', methods=['POST'])
def generate_obj():
    print("Received request to generate object")
    data = request.get_json()
    prompt = data.get("prompt", "")

    if not prompt:
        return jsonify({"error": "Prompt is required"}), 400

    try:
       # Sampling latents
        latents = sample_latents(
            batch_size=1,
            model=model,
            diffusion=diffusion,
            guidance_scale=8,
            model_kwargs=dict(texts=[prompt]),
            progress=False,
            clip_denoised=True,
            use_fp16=True,
            use_karras=True,
            karras_steps=16,
            sigma_min=1e-3,
            sigma_max=160,
            s_churn=0,
        )
        

        # Decode and save .obj
        unique_id = str(uuid.uuid4())[:8]
        filename = f"{unique_id}.obj"
        path = os.path.join(OUTPUT_DIR, filename)

        t = decode_latent_mesh(xm, latents[0]).tri_mesh()
        with open(path, 'w') as f:
            t.write_obj(f)
        
        return jsonify({"status": "success", "filename": filename})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/download/<filename>', methods=['GET'])
def download_file(filename):
    path = os.path.join(OUTPUT_DIR, filename)
    if not os.path.exists(path):
        return jsonify({"error": "File not found"}), 404
    return send_file(path, as_attachment=True)

@app.route('/', methods=['GET'])
def home():
    return jsonify({"message": "Shape-E API running", "endpoints": ["/generate", "/download/<filename>"]})


# === Run ===
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
