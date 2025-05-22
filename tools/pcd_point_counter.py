import open3d as o3d

def print_pointcloud_count(ply_file):
    pcd = o3d.io.read_point_cloud(ply_file)
    points = len(pcd.points)
    print(f"Point count: {points}")

if __name__ == "__main__":
    ply_file = "background_assets/parking_whole_improved/output.ply"
    print_pointcloud_count(ply_file)
