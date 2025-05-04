"""
Meshy AI – text‑to‑.obj + texture
---------------------------------
requirements:  pip install requests tqdm
env var:       export MESHY_API_KEY=msy-xxxxxxxxxxxxxxxx
"""
import os, time, pathlib, requests
from tqdm import tqdm   # for a nicer progress bar in the loop

API_ROOT   = "https://api.meshy.ai/openapi/v2/text-to-3d"
HEADERS    = {"Authorization": f"Bearer msy_AGUsjqJ1Gt0G1LbMLb4vL8hA5ZM5RbRlx2l1"}
PROMPT     = "A simple car"

def wait_for(task_id: str) -> dict:
    """poll the task endpoint until it succeeds (or fails)"""
    url = f"{API_ROOT}/{task_id}"
    while True:
        r = requests.get(url, headers=HEADERS, timeout=30)
        r.raise_for_status()
        task = r.json()
        status, prog = task["status"], task["progress"]
        tqdm.write(f"{status:<11} {prog:>3}%  id={task_id}")
        if status == "SUCCEEDED":
            return task
        if status == "FAILED":
            raise RuntimeError(task.get("task_error", {}).get("message", "Mes hy task failed"))
        time.sleep(5)

def download(url: str, out_path: pathlib.Path):
    with requests.get(url, stream=True) as r:
        r.raise_for_status()
        total = int(r.headers.get("Content-Length", 0))
        with open(out_path, "wb") as f, tqdm(
            total=total, unit="B", unit_scale=True, desc=out_path.name
        ) as bar:
            for chunk in r.iter_content(chunk_size=8192):
                f.write(chunk)
                bar.update(len(chunk))

# 1) preview ──────────────────────────────────────────────────────────────
preview_payload = {"mode": "preview", "prompt": PROMPT}
preview_id = requests.post(API_ROOT, headers=HEADERS, json=preview_payload)\
                      .json()["result"]
print("Preview ID:", preview_id)

# 2) wait for preview to finish
wait_for(preview_id)

# 3) refine ───────────────────────────────────────────────────────────────
refine_payload  = {"mode": "refine", "preview_task_id": preview_id}
refine_id = requests.post(API_ROOT, headers=HEADERS, json=refine_payload)\
                    .json()["result"]
print("Refine  ID:", refine_id)

# 4) wait for refine to finish and grab the assets
refined_task = wait_for(refine_id)

# download .obj + first texture map (base‑color)
model_url   = refined_task["model_urls"]["obj"]
texture_url = refined_task["texture_urls"][0]["base_color"]

out_dir = pathlib.Path("meshy_output"); out_dir.mkdir(exist_ok=True)
download(model_url,   out_dir / f"{refine_id}.obj")
download(texture_url, out_dir / f"{refine_id}_diffuse.png")

print("\nDone!  ➜", out_dir.resolve())
