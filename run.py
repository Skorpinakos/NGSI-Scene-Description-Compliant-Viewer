import subprocess
import os
import sys

def main():
    try:
        # Get the current working directory
        cwd = os.getcwd()

        # Run `npm run dev` in a separate terminal process
        npm_process = subprocess.Popen(["npm", "run", "dev"], cwd=cwd, shell=True)

        # Run proxy/proxy.py
        proxy_process = subprocess.Popen([sys.executable, "proxy/proxy.py"], cwd=cwd)

        # Run tracker/tracker_to_fiware.py
        tracker_process = subprocess.Popen([sys.executable, "tracker/tracker_to_fiware.py"], cwd=cwd)

        # Optional: Wait for processes to finish (they might run indefinitely)
        proxy_process.wait()
        tracker_process.wait()
        npm_process.wait()

    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    main()
