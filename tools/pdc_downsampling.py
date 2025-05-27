import numpy as np

def downsample_ply(input_path, output_path, factor, seed=42):
    """
    Downsample a binary_little_endian .ply by randomly keeping 1/factor of the points.
    
    Parameters:
      input_path  (str):  path to your source .ply
      output_path (str):  path for the downsampled .ply
      factor      (int):  downsampling factor N (keep ~1/N of points)
      seed        (int):  random seed for reproducibility
    """
    # --- 1) Read header + data ---
    with open(input_path, 'rb') as f:
        header = []
        while True:
            line = f.readline()
            if not line:
                raise RuntimeError("EOF before end_header")
            header.append(line)
            if line.strip() == b'end_header':
                break

        # parse original count
        vertex_count = None
        for L in header:
            if L.startswith(b'element vertex'):
                vertex_count = int(L.split()[2])
                break
        if vertex_count is None:
            raise RuntimeError("Couldn't find 'element vertex' in header")

        # dtype matches: x,y,z float32 + r,g,b uint8
        dtype = np.dtype([
            ('x',    '<f4'),
            ('y',    '<f4'),
            ('z',    '<f4'),
            ('red',   'u1'),
            ('green', 'u1'),
            ('blue',  'u1'),
        ])

        # read all points
        data = np.fromfile(f, dtype=dtype, count=vertex_count)

    # --- 2) Compute how many to keep, and pick random indices ---
    np.random.seed(seed)
    keep_count = int(vertex_count // factor)  # ensure integer!
    keep_count = max(1, keep_count)           # at least one
    # force the "population" to be an int too
    down_idx = np.random.choice(int(vertex_count), size=keep_count, replace=False)
    sampled = data[down_idx]

    # --- 3) Write new PLY ---
    with open(output_path, 'wb') as f:
        for L in header:
            if L.startswith(b'element vertex'):
                f.write(b'element vertex ' + str(keep_count).encode() + b'\n')
            else:
                f.write(L)
        # dump binary payload
        sampled.tofile(f)

if __name__ == "__main__":
    src = r"background_assets\parking_whole_improved\output.ply"
    dst = r"background_assets\parking_whole_improved\output_downsampled.ply"
    N = 2.218      # e.g. keep ~1/x of all points
    SEED = 123 
    downsample_ply(src, dst, N, SEED)
    print(f"Kept {int((1/N)*100)}% ({dst})")
