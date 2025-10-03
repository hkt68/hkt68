#!/usr/bin/env python3
"""
Elite Medya POS - Executable Builder
PyInstaller ile .exe dosyası oluşturmak için kullanın
"""

import PyInstaller.__main__
import os
import sys

def create_exe():
    """Portable .exe dosyası oluştur"""
    
    # PyInstaller arguments
    args = [
        'main.py',                    # Ana dosya
        '--onefile',                  # Tek dosya olarak
        '--windowed',                 # Console penceresi açmasın
        '--name=Elite_Medya_POS',     # Exe dosya adı
        '--icon=icon.ico',            # İkon (varsa)
        '--add-data=data;data',       # Veri klasörü dahil et
        '--clean',                    # Önceki build'leri temizle
        '--noconfirm',                # Onay isteme
    ]
    
    print("🔨 Elite Medya POS .exe dosyası oluşturuluyor...")
    print(f"📁 Çalışma dizini: {os.getcwd()}")
    
    try:
        PyInstaller.__main__.run(args)
        print("✅ .exe dosyası başarıyla oluşturuldu!")
        print("📂 Dosya konumu: dist/Elite_Medya_POS.exe")
        
    except Exception as e:
        print(f"❌ Hata: {e}")
        
if __name__ == "__main__":
    create_exe()