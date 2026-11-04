import zlib
import struct
import math

W, H = 512, 512
pixels = bytearray(W * H * 4)

def blend(r1, g1, b1, a1, r2, g2, b2, a2):
    # Alpha blending
    fa1 = a1 / 255.0
    fa2 = (a2 / 255.0) * (1.0 - fa1)
    out_a = fa1 + fa2
    if out_a <= 0:
        return 0, 0, 0, 0
    out_r = int((r1 * fa1 + r2 * fa2) / out_a)
    out_g = int((g1 * fa1 + g2 * fa2) / out_a)
    out_b = int((b1 * fa1 + b2 * fa2) / out_a)
    return out_r, out_g, out_b, int(out_a * 255)

for y in range(H):
    for x in range(W):
        idx = (y * W + x) * 4
        cx = x - 256
        cy = y - 240

        # Shield Geometry: top width ~220, sides taper down to (0, 210)
        nx = cx / 210.0
        ny = cy / 210.0

        # Shield function
        # Top boundary: y > -1.0
        # Curved side boundaries
        is_shield_outer = False
        is_shield_inner = False
        is_gold_border = False

        if cy >= -200 and cy <= 210:
            # Shield curve profile
            t = (cy + 200) / 410.0  # 0 to 1
            max_x = 210 * (1.0 - 0.75 * (t ** 2.2))
            if abs(cx) <= max_x:
                is_shield_outer = True
                if abs(cx) >= max_x - 16 or cy <= -184 or cy >= 194:
                    is_gold_border = True
                else:
                    is_shield_inner = True

        if is_gold_border:
            # Gold Metallic Gradient
            grad = (x + y) / 1024.0
            r = int(245 + 10 * math.sin(grad * 6.28))
            g = int(180 + 40 * math.cos(grad * 6.28))
            b = int(20 + 20 * math.sin(grad * 3.14))
            pixels[idx] = min(255, max(0, r))
            pixels[idx+1] = min(255, max(0, g))
            pixels[idx+2] = min(255, max(0, b))
            pixels[idx+3] = 255

            # Inner subtle highlight
            if abs(cx) <= max_x - 12 and cy >= -180 and cy <= 190:
                pixels[idx] = 254
                pixels[idx+1] = 240
                pixels[idx+2] = 138
                pixels[idx+3] = 255

        elif is_shield_inner:
            # Deep Royal Burgundy Background with radial gradient
            dist_center = math.sqrt(cx*cx + (cy+30)*(cy+30)) / 250.0
            r = int(160 - 70 * dist_center)
            g = int(0)
            b = int(40 - 25 * dist_center)
            pixels[idx] = min(255, max(0, r))
            pixels[idx+1] = min(255, max(0, g))
            pixels[idx+2] = min(255, max(0, b))
            pixels[idx+3] = 255

            # Crown at top: y around -160 to -80
            if -160 <= cy <= -80 and abs(cx) <= 100:
                # Crown peaks
                crown_y = -80 - (160 - abs(cy + 120))
                if cy >= -130 or (abs(cx) <= 15 and cy >= -160) or (35 <= abs(cx) <= 65 and cy >= -145) or (abs(cx) >= 80 and cy >= -130):
                    # Gold Crown fill
                    pixels[idx] = 251
                    pixels[idx+1] = 191
                    pixels[idx+2] = 36
                    pixels[idx+3] = 255

            # Lion Face Center: cy -40 to +60
            if -50 <= cy <= 70 and abs(cx) <= 90:
                lion_dist = math.sqrt(cx*cx + (cy-10)*(cy-10))
                if lion_dist <= 75:
                    # Gold Lion Face
                    pixels[idx] = 245
                    pixels[idx+1] = 158
                    pixels[idx+2] = 11
                    pixels[idx+3] = 255
                    
                    # Eyes
                    if -15 <= cy <= -5 and (20 <= abs(cx) <= 35):
                        pixels[idx] = 15
                        pixels[idx+1] = 23
                        pixels[idx+2] = 42
                        pixels[idx+3] = 255

                    # Nose
                    if 15 <= cy <= 30 and abs(cx) <= 12:
                        pixels[idx] = 120
                        pixels[idx+1] = 53
                        pixels[idx+2] = 15
                        pixels[idx+3] = 255

            # Soccer Ball at bottom: cy 90 to 160
            if 90 <= cy <= 160 and abs(cx) <= 35:
                ball_dist = math.sqrt(cx*cx + (cy-125)*(cy-125))
                if ball_dist <= 32:
                    pixels[idx] = 255
                    pixels[idx+1] = 255
                    pixels[idx+2] = 255
                    pixels[idx+3] = 255
                    if ball_dist <= 12 or (abs(cx) <= 4 and cy >= 120):
                        pixels[idx] = 30
                        pixels[idx+1] = 41
                        pixels[idx+2] = 59

        else:
            pixels[idx] = 0
            pixels[idx+1] = 0
            pixels[idx+2] = 0
            pixels[idx+3] = 0

def make_png(width, height, raw_rgba_pixels):
    def chunk(two_bytes_type, data):
        return struct.pack('>I', len(data)) + two_bytes_type + data + struct.pack('>I', zlib.crc32(two_bytes_type + data) & 0xffffffff)

    png = b'\x89PNG\r\n\x1a\n'
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    png += chunk(b'IHDR', ihdr_data)

    raw_data = bytearray()
    for y in range(height):
        raw_data.append(0)
        start = y * width * 4
        raw_data.extend(raw_rgba_pixels[start:start + width * 4])

    compressed = zlib.compress(bytes(raw_data), 9)
    png += chunk(b'IDAT', compressed)
    png += chunk(b'IEND', b'')
    return png

png_data = make_png(W, H, pixels)

with open('public/logo.png', 'wb') as f:
    f.write(png_data)

with open('public/logo.jpg', 'wb') as f:
    f.write(png_data)

import shutil
shutil.copy('public/logo.png', 'dist/logo.png')
shutil.copy('public/logo.jpg', 'dist/logo.jpg')

print("512x512 HD PNG created successfully! File size:", len(png_data))
