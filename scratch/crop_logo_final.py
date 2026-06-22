from PIL import Image
import numpy as np

# Load original logo
img = Image.open('ViaGraph _logo_final.png')
data = np.array(img)

# Find bounding box of non-transparent pixels (alpha > 0)
non_transparent_mask = data[:, :, 3] > 0
rows = np.any(non_transparent_mask, axis=1)
cols = np.any(non_transparent_mask, axis=0)
ymin, ymax = np.where(rows)[0][[0, -1]]
xmin, xmax = np.where(cols)[0][[0, -1]]

# Add a tiny 2% padding margin so it doesn't touch the absolute edges of the image canvas
padding = int((xmax - xmin) * 0.02)
ymin = max(0, ymin - padding)
ymax = min(data.shape[0] - 1, ymax + padding)
xmin = max(0, xmin - padding)
xmax = min(data.shape[1] - 1, xmax + padding)

# Crop image
cropped_img = img.crop((xmin, ymin, xmax, ymax))

# Save over destinations
cropped_img.save('public/images/ViaGraph_logo_final.png')
cropped_img.save('public/images/ViaGraph_LOGO.png')

print(f"Original size: {img.size}")
print(f"New cropped size: {cropped_img.size}")
print("Successfully cropped logo to remove transparent margins and saved to public/images.")
