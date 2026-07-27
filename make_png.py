import zlib
import struct

def make_png(width, height, raw_rgba_pixels):
    def chunk(two_bytes_type, data):
        return struct.pack('>I', len(data)) + two_bytes_type + data + struct.pack('>I', zlib.crc32(two_bytes_type + data) & 0xffffffff)

    # PNG Signature
    png = b'\x89PNG\r\n\x1a\n'
    # IHDR
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    png += chunk(b'IHDR', ihdr_data)

    # IDAT (Raw RGBA rows with filter byte 0 at start of each row)
    raw_data = bytearray()
    for y in range(height):
        raw_data.append(0) # Filter type 0 (None)
        start = y * width * 4
        raw_data.extend(raw_rgba_pixels[start:start + width * 4])

    compressed = zlib.compress(bytes(raw_data), 9)
    png += chunk(b'IDAT', compressed)
    # IEND
    png += chunk(b'IEND', b'')
    return png

# Create a 256x256 high quality badge image
W, H = 256, 256
pixels = bytearray(W * H * 4)

import math

for y in range(H):
    for x in range(W):
        idx = (y * W + x) * 4
        # Distance from center
        dx = x - W / 2
        dy = y - H / 2
        dist = math.sqrt(dx*dx + dy*dy)
        
        # Shield outline
        in_shield = False
        # Shield equation
        nx = dx / (W / 2)
        ny = dy / (H / 2)
        if abs(nx) <= (1.0 - 0.2 * (ny + 0.8)**2) and ny <= 0.85 and ny >= -0.85:
            in_shield = True

        if in_shield:
            if abs(nx) > (0.9 - 0.2 * (ny + 0.8)**2) or ny > 0.75 or ny < -0.78:
                # Gold border
                pixels[idx] = 245     # R
                pixels[idx+1] = 158   # G
                pixels[idx+2] = 11    # B
                pixels[idx+3] = 255   # A
            else:
                # Burgundy fill
                pixels[idx] = 128     # R (#800020)
                pixels[idx+1] = 0     # G
                pixels[idx+2] = 32    # B
                pixels[idx+3] = 255   # A

                # Add crown in center
                if -30 <= dy <= 10 and -40 <= dx <= 40:
                    # Gold crown
                    pixels[idx] = 251
                    pixels[idx+1] = 191
                    pixels[idx+2] = 36
                    pixels[idx+3] = 255

                # Add lion/star detail
                if -60 <= dy <= -40 and -10 <= dx <= 10:
                    pixels[idx] = 255
                    pixels[idx+1] = 255
                    pixels[idx+2] = 255
                    pixels[idx+3] = 255
        else:
            # Transparent
            pixels[idx] = 0
            pixels[idx+1] = 0
            pixels[idx+2] = 0
            pixels[idx+3] = 0

png_bytes = make_png(W, H, pixels)

with open('public/logo.png', 'wb') as f:
    f.write(png_bytes)

with open('public/logo.jpg', 'wb') as f:
    f.write(png_bytes)

print("PNG generated successfully! Size:", len(png_bytes))
