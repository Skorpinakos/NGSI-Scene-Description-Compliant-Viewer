import numpy as np

def load_ply_vertices(filename):
    with open(filename, 'rb') as f:
        # Read header lines until we find "end_header"
        header_lines = []
        while True:
            line = f.readline()
            header_lines.append(line.decode('utf-8').strip())
            if line.strip() == b"end_header":
                break

        # Parse header to get the number of vertices.
        vertex_count = 0
        for line in header_lines:
            if line.startswith("element vertex"):
                vertex_count = int(line.split()[-1])
                break

        if vertex_count == 0:
            raise ValueError("Vertex count not found in PLY header.")

        # Define the structured dtype for one vertex record:
        # Three 32-bit floats (little-endian) for x, y, z
        # and three unsigned 8-bit integers for red, green, blue.
        vertex_dtype = np.dtype([
            ('x', '<f4'),
            ('y', '<f4'),
            ('z', '<f4'),
            ('red', 'u1'),
            ('green', 'u1'),
            ('blue', 'u1')
        ])

        # Calculate how many bytes to read for the vertex data.
        vertex_data_bytes = vertex_dtype.itemsize * vertex_count

        # Read vertex data from the file.
        vertex_data = np.frombuffer(f.read(vertex_data_bytes), dtype=vertex_dtype, count=vertex_count)

    return vertex_data

def save_ply(filename, vertices):
    """
    Save a colored point cloud (vertices) into a binary little-endian PLY file.
    
    Parameters:
        filename (str): Output file name.
        vertices (np.ndarray): A structured numpy array with fields x, y, z, red, green, blue.
    """
    vertex_count = vertices.shape[0]
    header = (
        "ply\n"
        "format binary_little_endian 1.0\n"
        f"element vertex {vertex_count}\n"
        "property float x\n"
        "property float y\n"
        "property float z\n"
        "property uchar red\n"
        "property uchar green\n"
        "property uchar blue\n"
        "end_header\n"
    )

    with open(filename, 'wb') as f:
        # Write header as ascii text.
        f.write(header.encode('utf-8'))
        # Write the binary vertex data.
        f.write(vertices.tobytes())

# Usage example:
if __name__ == "__main__":
    input_filename = 'background_assets/10M_parking_mesh.ply'   # Replace with your input file name
    output_filename = 'output.ply'  # Replace with your desired output file name

    # Load vertices from the input PLY file.
    vertices = load_ply_vertices(input_filename)
    
    # Optional: Extract coordinates and colors for further processing.
    coords = np.vstack((vertices['x'], vertices['y'], vertices['z'])).T
    colors = np.vstack((vertices['red'], vertices['green'], vertices['blue'])).T

    print("Coordinates shape:", coords.shape)
    print("Colors shape:", colors.shape)
    print("First 5 vertices:\n", coords[:5])
    print("First 5 colors:\n", colors[:5])
    
    # Save the colored point cloud to a new PLY file.
    save_ply(output_filename, vertices)
    print(f"Saved the colored point cloud to {output_filename}")
