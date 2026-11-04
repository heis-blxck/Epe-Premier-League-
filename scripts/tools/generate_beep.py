import wave
import struct
import math

# Audio settings
sample_rate = 44100
duration = 0.5 # seconds
frequency = 800.0 # Hz

# Create WAV file
with wave.open('public/epe_alert.mp3', 'w') as wav_file:
    # Set parameters: 1 channel, 2 bytes (16-bit), sample rate, number of frames, no compression
    wav_file.setparams((1, 2, sample_rate, int(sample_rate * duration), 'NONE', 'not compressed'))
    
    # Generate audio samples
    for i in range(int(sample_rate * duration)):
        # Sine wave formula
        value = int(32767.0 * math.sin(2.0 * math.pi * frequency * i / sample_rate))
        
        # Pack the value as a 16-bit short integer
        data = struct.pack('<h', value)
        wav_file.writeframesraw(data)

