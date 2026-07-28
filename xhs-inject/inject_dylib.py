#!/usr/bin/env python3
"""Inject LC_LOAD_DYLIB into a Mach-O binary"""
import struct, sys, os

def align(x, a):
    return (x + a - 1) & ~(a - 1)

def inject(macho_path, dylib_path, weak=False):
    with open(macho_path, 'rb') as f:
        data = bytearray(f.read())
    
    magic = struct.unpack_from('<I', data, 0)[0]
    
    if magic == 0xFEEDFACF:  # MH_MAGIC_64
        is64 = True
        hdr_size = 32
        ncmds_off = 16
        cmdsize_off = 20
    elif magic == 0xFEEDFACE:  # MH_MAGIC
        is64 = False
        hdr_size = 28
        ncmds_off = 16
        cmdsize_off = 20
    else:
        print(f"Unknown magic: 0x{magic:08X}")
        return False
    
    ncmds = struct.unpack_from('<I', data, ncmds_off)[0]
    cmdsize = struct.unpack_from('<I', data, cmdsize_off)[0]
    
    # Build LC_LOAD_DYLIB / LC_LOAD_WEAK_DYLIB
    dylib_bytes = dylib_path.encode('utf-8') + b'\x00'
    
    # dylib_command size = 16 (dylib_command header) + padding + string
    dylib_cmd_size = align(16 + len(dylib_bytes), 8)
    
    cmd_type = 0x34 if not weak else 0x80000018  # LC_LOAD_DYLIB or LC_LOAD_WEAK_DYLIB
    
    cmd = struct.pack('<II', cmd_type, dylib_cmd_size)
    cmd += struct.pack('<I', 16)  # dylib.name.offset (from start of dylib_command)
    cmd += struct.pack('<I', 0x10000000)  # timestamp
    cmd += struct.pack('<I', 0x10000000)  # current_version
    cmd += struct.pack('<I', 0x10000000)  # compatibility_version
    cmd += dylib_bytes + b'\x00' * (dylib_cmd_size - 16 - len(dylib_bytes))
    
    # Insert the command after the header but before existing commands
    new_data = data[:hdr_size] + cmd + data[hdr_size:]
    
    # Update header
    struct.pack_into('<I', new_data, ncmds_off, ncmds + 1)
    struct.pack_into('<I', new_data, cmdsize_off, cmdsize + dylib_cmd_size)
    
    # Write back
    with open(macho_path, 'wb') as f:
        f.write(new_data)
    
    print(f"Injected LC_LOAD_DYLIB: {dylib_path}")
    print(f"Offset: {hdr_size}, Size: {dylib_cmd_size}")
    return True

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print(f"Usage: {sys.argv[0]} <macho_binary> <dylib_path>")
        sys.exit(1)
    inject(sys.argv[1], sys.argv[2])
