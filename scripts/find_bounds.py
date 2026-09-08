from PIL import Image
import numpy as np

img = Image.open('public/textures/cosmic-eye.jpg').convert('RGB')
arr = np.array(img)

# Print bounds where sclera starts and ends
# Check horizontal row at y = 299
y0 = 299
row = arr[y0, :, :]
# Pupil center is around 496
# Sclera is bright (luma > 80), eye corners end when it transitions to dark background
for x in range(250, 750, 10):
    l = float(row[x].mean())
    u = x / 1024.0
    v = 1.0 - (y0 / 576.0)
    # print sample
# Check vertical column at x = 496
col = arr[:, 496, :]
print('--- Vertical along pupil center (top of image to bottom) ---')
for y in range(180, 420, 8):
    l = float(col[y].mean())
    v = 1.0 - (y / 576.0)
    print(f'y={y:3d}, vUv.y={v:.3f}, luma={l:5.1f}')
