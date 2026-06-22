from PIL import Image
import numpy as np

img = Image.open('ViaGraph _logo_final.png')
w, h = img.size
print(f"Original image size: {w}x{h}")

data = np.array(img)

# Print a grid of 10x10 points across the image to see what colors/alphas are there
for y in range(0, h, h // 10):
    row_str = []
    for x in range(0, w, w // 10):
        pixel = data[y, x]
        # Summarize color
        if pixel[3] == 0:
            row_str.append("TRANS ")
        elif pixel[0] > 240 and pixel[1] > 240 and pixel[2] > 240:
            row_str.append("WHITE ")
        elif pixel[0] < 50 and pixel[1] > 100 and pixel[2] > 100:
            row_str.append("TEAL  ")
        else:
            row_str.append("OTHER ")
    print(f"y={y:4d}: " + "".join(row_str))
