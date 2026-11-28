# Builds the source images for the Android launcher icon from the app icon.
# The truck is scaled to 80% so Android's round and squircle masks do not cut it.
from PIL import Image
src = Image.open('icon-maskable-512.png').convert('RGBA').resize((1024, 1024), Image.LANCZOS)
bg = src.getpixel((8, 8))
Image.new('RGBA', (1024, 1024), bg).save('assets/icon-background.png')
fg = Image.new('RGBA', (1024, 1024), (0, 0, 0, 0))
s = src.resize((820, 820), Image.LANCZOS)
fg.paste(s, (102, 102), s)
fg.save('assets/icon-foreground.png')
full = Image.new('RGBA', (1024, 1024), bg); full.paste(s, (102, 102), s); full.save('assets/icon-only.png')
print('icon sources ready, background', bg)
