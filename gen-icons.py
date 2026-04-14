#!/usr/bin/env python3
"""Generate simple PNG icons with black background and white DUEL text using raw PNG encoding."""
import struct
import zlib
import os

def create_png(width, height, pixels):
    """Create a PNG from a flat list of (R,G,B) tuples."""
    def chunk(name, data):
        c = name + data
        return struct.pack('>I', len(data)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)

    # IHDR
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0)
    ihdr = chunk(b'IHDR', ihdr_data)

    # IDAT — raw image data, filter byte 0 per row
    raw = b''
    for y in range(height):
        raw += b'\x00'  # filter type: None
        for x in range(width):
            r, g, b = pixels[y * width + x]
            raw += bytes([r, g, b])
    compressed = zlib.compress(raw, 9)
    idat = chunk(b'IDAT', compressed)

    # IEND
    iend = chunk(b'IEND', b'')

    return b'\x89PNG\r\n\x1a\n' + ihdr + idat + iend


def draw_text_pixels(pixels, width, height, text, scale):
    """Draw blocky pixel text (simple bitmap font) centred on the image."""
    # Minimal 5x7 bitmap font for uppercase letters
    FONT = {
        'D': [0b11110, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b11110],
        'U': [0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01110],
        'E': [0b11111, 0b10000, 0b10000, 0b11110, 0b10000, 0b10000, 0b11111],
        'L': [0b10000, 0b10000, 0b10000, 0b10000, 0b10000, 0b10000, 0b11111],
    }
    char_w = 5
    char_h = 7
    gap = 1  # pixels between chars

    total_w = (char_w * len(text) + gap * (len(text) - 1)) * scale
    total_h = char_h * scale

    start_x = (width - total_w) // 2
    start_y = (height - total_h) // 2

    for ci, ch in enumerate(text):
        rows = FONT.get(ch, [])
        cx = start_x + ci * (char_w + gap) * scale
        for row_idx, row in enumerate(rows):
            for bit_idx in range(char_w):
                if row & (1 << (char_w - 1 - bit_idx)):
                    # Draw scaled pixel
                    for dy in range(scale):
                        for dx in range(scale):
                            px = cx + bit_idx * scale + dx
                            py = start_y + row_idx * scale + dy
                            if 0 <= px < width and 0 <= py < height:
                                pixels[py * width + px] = (255, 255, 255)


def make_icon(size, path):
    pixels = [(10, 10, 10)] * (size * size)  # #0a0a0a background
    scale = max(1, size // 24)
    draw_text_pixels(pixels, size, size, 'DUEL', scale)
    png_data = create_png(size, size, pixels)
    with open(path, 'wb') as f:
        f.write(png_data)
    print(f'Written {path} ({size}x{size}, {len(png_data)} bytes)')


os.makedirs('public/icons', exist_ok=True)
make_icon(192, 'public/icons/icon-192.png')
make_icon(512, 'public/icons/icon-512.png')
print('Done.')
