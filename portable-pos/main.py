#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Elite Medya Bilişim POS - Portable Windows Application
Modern arayüz, kurulum gerektirmez
"""

import customtkinter as ctk
import tkinter as tk
from tkinter import messagebox, filedialog, ttk
import json
import os
import sys
from datetime import datetime, date, timedelta
import uuid
from decimal import Decimal
import requests
import threading
from typing import Dict, List, Optional

class ElitePOS:
    def __init__(self):
        # CustomTkinter ayarları
        ctk.set_appearance_mode("light")  # "light" veya "dark"
        ctk.set_default_color_theme("blue")  # "blue", "green", "dark-blue"
        
        self.root = ctk.CTk()
        self.setup_window()
        self.setup_data()
        self.create_widgets()
        
    def setup_window(self):
        """Ana pencere ayarları"""
        self.root.title("🏪 Elite Medya Bilişim POS v2.0")
        self.root.geometry("1400x800")
        self.root.minsize(1200, 700)
        
        # Icon (opsiyonel)
        try:
            if getattr(sys, 'frozen', False):
                base_path = sys._MEIPASS
            else:
                base_path = os.path.dirname(__file__)
            icon_path = os.path.join(base_path, 'icon.ico')
            if os.path.exists(icon_path):
                self.root.iconbitmap(icon_path)
        except:
            pass
        
        # Pencere kapatma eventi
        self.root.protocol("WM_DELETE_WINDOW", self.on_closing)
        
    def setup_data(self):
        """Veri dosyalarını hazırla"""
        # Executable'ın bulunduğu klasörde data klasörü oluştur
        if getattr(sys, 'frozen', False):
            # PyInstaller bundle
            self.app_path = os.path.dirname(sys.executable)
        else:
            self.app_path = os.path.dirname(__file__)
            
        self.data_path = os.path.join(self.app_path, 'data')
        
        # Data klasörü yoksa oluştur
        if not os.path.exists(self.data_path):
            os.makedirs(self.data_path)
            
        # Data dosyaları
        self.files = {
            'customers': os.path.join(self.data_path, 'customers.json'),
            'products': os.path.join(self.data_path, 'products.json'),
            'credit_sales': os.path.join(self.data_path, 'credit_sales.json'),
            'payments': os.path.join(self.data_path, 'payments.json'),
            'settings': os.path.join(self.data_path, 'settings.json')
        }
        
        # İlk çalıştırmada örnek veri oluştur
        self.init_sample_data()
        
    def load_data(self, data_type):
        """JSON dosyasından veri yükle"""
        try:
            with open(self.files[data_type], 'r', encoding='utf-8') as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            return []
            
    def save_data(self, data_type, data):
        """JSON dosyasına veri kaydet"""
        try:
            with open(self.files[data_type], 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2, default=str)
            return True
        except Exception as e:
            messagebox.showerror("Hata", f"Veri kaydedilemedi: {e}")
            return False
            
    def init_sample_data(self):
        """İlk çalıştırmada örnek veri oluştur"""
        # Customers
        if not os.path.exists(self.files['customers']):
            sample_customers = [
                {
                    "id": "cust_001",
                    "name": "Ahmet Yılmaz",
                    "phone": "0532 123 4567",
                    "email": "ahmet@example.com",
                    "address": "İstanbul",
                    "credit_limit": 10000.0,
                    "notes": "Güvenilir müşteri",
                    "created_at": datetime.now().isoformat()
                },
                {
                    "id": "cust_002", 
                    "name": "Fatma Kaya",
                    "phone": "0533 234 5678",
                    "email": "fatma@example.com",
                    "address": "Ankara",
                    "credit_limit": 5000.0,
                    "notes": "Düzenli müşteri",
                    "created_at": datetime.now().isoformat()
                }
            ]
            self.save_data('customers', sample_customers)
            
        # Products
        if not os.path.exists(self.files['products']):
            sample_products = [
                {
                    "id": "prod_001",
                    "name": "Kalem (Mavi)",
                    "barcode": "1234567890123",
                    "price": 5.50,
                    "stock": 100,
                    "created_at": datetime.now().isoformat()
                },
                {
                    "id": "prod_002",
                    "name": "Defter A4", 
                    "barcode": "2345678901234",
                    "price": 12.00,
                    "stock": 50,
                    "created_at": datetime.now().isoformat()
                }
            ]
            self.save_data('products', sample_products)
            
        # Diğer dosyalar için boş listeler
        for data_type in ['credit_sales', 'payments']:
            if not os.path.exists(self.files[data_type]):
                self.save_data(data_type, [])
                
        # Settings
        if not os.path.exists(self.files['settings']):
            settings = {
                "company_name": "Elite Medya Bilişim",
                "currency": "TRY",
                "version": "2.0",
                "web_api_url": "https://pos-crm-elite.preview.emergentagent.com/api"
            }
            self.save_data('settings', settings)
            
    def create_widgets(self):
        """Modern arayüzü oluştur"""
        # Ana başlık
        header_frame = ctk.CTkFrame(self.root, height=70)
        header_frame.pack(fill="x", padx=20, pady=(20, 10))
        header_frame.pack_propagate(False)
        
        # Sol taraf - başlık
        title_label = ctk.CTkLabel(
            header_frame, 
            text="🏪 Elite Medya Bilişim POS", 
            font=ctk.CTkFont(size=24, weight="bold")
        )
        title_label.pack(side="left", padx=20, pady=20)
        
        # Sağ taraf - web sync butonu
        sync_frame = ctk.CTkFrame(header_frame, fg_color="transparent")
        sync_frame.pack(side="right", padx=20, pady=15)
        
        self.sync_button = ctk.CTkButton(
            sync_frame,
            text="🔄 Web'den Veri Çek",
            command=self.sync_from_web,
            width=140,
            height=32
        )
        self.sync_button.pack(side="right", padx=10)
        
        version_label = ctk.CTkLabel(
            sync_frame,
            text="v2.0 Portable",
            font=ctk.CTkFont(size=12),
            text_color="gray"
        )
        version_label.pack(side="right", padx=10)
        
        # Ana içerik alanı
        content_frame = ctk.CTkFrame(self.root)
        content_frame.pack(fill="both", expand=True, padx=20, pady=(0, 10))
        
        # Sekme sistemi
        self.tabview = ctk.CTkTabview(content_frame, width=1350, height=650)
        self.tabview.pack(fill="both", expand=True, padx=20, pady=20)
        
        # Sekmeleri oluştur
        self.create_customers_tab()
        self.create_sales_tab() 
        self.create_products_tab()
        self.create_reports_tab()
        self.create_backup_tab()
        
        # Alt durum çubuğu
        status_frame = ctk.CTkFrame(self.root, height=40)
        status_frame.pack(fill="x", padx=20, pady=(0, 20))
        status_frame.pack_propagate(False)
        
        self.status_label = ctk.CTkLabel(
            status_frame,
            text=f"📅 {datetime.now().strftime('%d.%m.%Y %H:%M')} | 💾 Veri Klasörü: {self.data_path}",
            font=ctk.CTkFont(size=11)
        )
        self.status_label.pack(side="left", padx=20, pady=10)
        
    def create_customers_tab(self):
        """Müşteriler sekmesi"""
        self.tabview.add("👥 Müşteriler")
        customers_frame = self.tabview.tab("👥 Müşteriler")
        
        # Üst kontrol paneli
        control_frame = ctk.CTkFrame(customers_frame)
        control_frame.pack(fill="x", padx=10, pady=(10, 5))
        
        # Sol butonlar
        left_buttons = ctk.CTkFrame(control_frame, fg_color="transparent")
        left_buttons.pack(side="left", padx=10, pady=10)
        
        ctk.CTkButton(
            left_buttons,
            text="➕ Yeni Müşteri",
            command=self.new_customer_dialog,
            width=120,
            height=32
        ).pack(side="left", padx=(0, 10))
        
        ctk.CTkButton(
            left_buttons,
            text="🔄 Yenile",
            command=self.refresh_customers,
            width=80,
            height=32
        ).pack(side="left")
        
        # Sağ arama
        search_frame = ctk.CTkFrame(control_frame, fg_color="transparent")
        search_frame.pack(side="right", padx=10, pady=10)
        
        ctk.CTkLabel(search_frame, text="🔍 Müşteri Ara:", font=ctk.CTkFont(size=12)).pack(side="left", padx=(0, 5))
        self.customer_search = ctk.CTkEntry(search_frame, placeholder_text="İsim veya telefon...", width=200)
        self.customer_search.pack(side="left")
        self.customer_search.bind('<KeyRelease>', self.filter_customers)
        
        # Müşteri listesi frame
        list_frame = ctk.CTkFrame(customers_frame)
        list_frame.pack(fill="both", expand=True, padx=10, pady=5)
        
        # Treeview için frame (modern görünüm için)
        tree_frame = tk.Frame(list_frame, bg='#212121' if ctk.get_appearance_mode() == "Dark" else '#f0f0f0')
        tree_frame.pack(fill="both", expand=True, padx=20, pady=20)
        
        # Müşteri listesi
        columns = ("ID", "İsim", "Telefon", "Email", "Borç", "Durum")
        self.customers_tree = tk.ttk.Treeview(tree_frame, columns=columns, show="headings", height=20)
        
        # Kolon başlıkları ve genişlikleri
        headers = {
            "ID": ("ID", 80),
            "İsim": ("Müşteri Adı", 200), 
            "Telefon": ("Telefon", 120),
            "Email": ("E-posta", 180),
            "Borç": ("Toplam Borç", 120),
            "Durum": ("Durum", 150)
        }
        
        for col, (header, width) in headers.items():
            self.customers_tree.heading(col, text=header)
            self.customers_tree.column(col, width=width)
        
        # Scrollbar
        scrollbar = tk.ttk.Scrollbar(tree_frame, orient="vertical", command=self.customers_tree.yview)
        self.customers_tree.configure(yscrollcommand=scrollbar.set)
        
        self.customers_tree.pack(side="left", fill="both", expand=True)
        scrollbar.pack(side="right", fill="y")
        
        # Events
        self.customers_tree.bind("<Button-3>", self.customer_context_menu)
        self.customers_tree.bind("<Double-1>", self.customer_account_details)
        
        # Veriyi yükle
        self.refresh_customers()
        
    def create_sales_tab(self):
        """Modern satış sekmesi"""
        self.tabview.add("🛒 Satış")
        sales_frame = self.tabview.tab("🛒 Satış")
        
        # Ana satış formu
        form_frame = ctk.CTkFrame(sales_frame)
        form_frame.pack(fill="x", padx=20, pady=20)
        
        # Başlık
        title = ctk.CTkLabel(form_frame, text="🛒 Hızlı Satış İşlemi", font=ctk.CTkFont(size=20, weight="bold"))
        title.pack(pady=15)
        
        # Form içeriği
        content_frame = ctk.CTkFrame(form_frame)
        content_frame.pack(fill="x", padx=20, pady=(0, 20))
        
        # Sol taraf - Müşteri ve Ürün
        left_frame = ctk.CTkFrame(content_frame)
        left_frame.pack(side="left", fill="both", expand=True, padx=(10, 5), pady=10)
        
        # Müşteri seçimi
        ctk.CTkLabel(left_frame, text="👤 Müşteri Seçin:", font=ctk.CTkFont(size=14, weight="bold")).pack(anchor="w", padx=15, pady=(15, 5))
        self.sale_customer = ctk.CTkComboBox(left_frame, width=350, height=35, font=ctk.CTkFont(size=12))
        self.sale_customer.pack(padx=15, pady=(0, 15))
        
        # Barkod/Ürün seçimi
        ctk.CTkLabel(left_frame, text="📦 Ürün/Barkod:", font=ctk.CTkFont(size=14, weight="bold")).pack(anchor="w", padx=15, pady=(0, 5))
        
        # Barkod entry
        barcode_frame = ctk.CTkFrame(left_frame, fg_color="transparent")
        barcode_frame.pack(fill="x", padx=15, pady=(0, 10))
        
        self.barcode_entry = ctk.CTkEntry(barcode_frame, placeholder_text="Barkod numarasını girin...", width=250, height=35, font=ctk.CTkFont(size=12))
        self.barcode_entry.pack(side="left", padx=(0, 10))
        self.barcode_entry.bind('<Return>', self.search_product_by_barcode)
        
        ctk.CTkButton(barcode_frame, text="🔍", command=self.search_product_by_barcode, width=40, height=35).pack(side="left")
        
        # VEYA
        ctk.CTkLabel(left_frame, text="veya", font=ctk.CTkFont(size=10)).pack(pady=5)
        
        # Ürün dropdown
        self.sale_product = ctk.CTkComboBox(left_frame, width=350, height=35, font=ctk.CTkFont(size=12))
        self.sale_product.pack(padx=15, pady=(0, 15))
        
        # Sağ taraf - Miktar ve Ödeme
        right_frame = ctk.CTkFrame(content_frame)
        right_frame.pack(side="right", fill="both", expand=True, padx=(5, 10), pady=10)
        
        # Miktar
        ctk.CTkLabel(right_frame, text="📊 Adet:", font=ctk.CTkFont(size=14, weight="bold")).pack(anchor="w", padx=15, pady=(15, 5))
        quantity_frame = ctk.CTkFrame(right_frame, fg_color="transparent")
        quantity_frame.pack(fill="x", padx=15, pady=(0, 15))
        
        self.quantity_var = tk.StringVar(value="1")
        self.sale_quantity = ctk.CTkEntry(quantity_frame, textvariable=self.quantity_var, width=100, height=35, font=ctk.CTkFont(size=14))
        self.sale_quantity.pack(side="left", padx=(0, 10))
        
        # Miktar butonları
        for i, qty in enumerate([1, 5, 10]):
            ctk.CTkButton(quantity_frame, text=str(qty), command=lambda q=qty: self.quantity_var.set(str(q)), width=40, height=35).pack(side="left", padx=2)
        
        # Ödeme türü
        ctk.CTkLabel(right_frame, text="💳 Ödeme Türü:", font=ctk.CTkFont(size=14, weight="bold")).pack(anchor="w", padx=15, pady=(0, 5))
        self.payment_type = ctk.CTkComboBox(right_frame, values=["Nakit", "Kart", "Veresiye"], width=200, height=35, font=ctk.CTkFont(size=12))
        self.payment_type.pack(padx=15, pady=(0, 15))
        self.payment_type.set("Nakit")
        
        # Tutar gösterimi
        self.total_frame = ctk.CTkFrame(right_frame, fg_color=("gray80", "gray20"))
        self.total_frame.pack(fill="x", padx=15, pady=(0, 15))
        
        self.total_label = ctk.CTkLabel(self.total_frame, text="Toplam: ₺0.00", font=ctk.CTkFont(size=16, weight="bold"))
        self.total_label.pack(pady=10)
        
        # Satış butonu
        sale_button = ctk.CTkButton(
            sales_frame,
            text="💰 SATIŞ YAP",
            command=self.process_sale,
            width=300,
            height=50,
            font=ctk.CTkFont(size=18, weight="bold"),
            fg_color=("green", "darkgreen"),
            hover_color=("lightgreen", "green")
        )
        sale_button.pack(pady=20)
        
        # Event bindings
        self.sale_product.bind('<<ComboboxSelected>>', self.update_total)
        self.sale_quantity.bind('<KeyRelease>', self.update_total)
        
        # Combobox verilerini yükle
        self.refresh_sale_combos()
    
    def search_product_by_barcode(self, event=None):
        """Barkod ile ürün ara"""
        barcode = self.barcode_entry.get().strip()
        if not barcode:
            return
            
        products = self.load_data('products')
        found_product = None
        
        for product in products:
            if product.get('barcode', '') == barcode:
                found_product = product
                break
        
        if found_product:
            # Ürünü dropdown'da seç
            product_text = f"{found_product['name']} - ₺{found_product['price']:.2f}"
            self.sale_product.set(product_text)
            self.update_total()
            messagebox.showinfo("Ürün Bulundu", f"✅ {found_product['name']}")
        else:
            messagebox.showwarning("Ürün Bulunamadı", f"❌ Barkod '{barcode}' ile eşleşen ürün yok")
            
    def update_total(self, event=None):
        """Toplam tutarı güncelle"""
        try:
            product_text = self.sale_product.get()
            if not product_text or '₺' not in product_text:
                self.total_label.configure(text="Toplam: ₺0.00")
                return
                
            # Fiyatı çıkar
            price_text = product_text.split('₺')[-1]
            unit_price = float(price_text)
            
            # Miktar
            quantity = int(self.quantity_var.get() or 1)
            
            total = unit_price * quantity
            self.total_label.configure(text=f"Toplam: ₺{total:.2f}")
            
        except (ValueError, IndexError):
            self.total_label.configure(text="Toplam: ₺0.00")
        
    def create_reports_tab(self):
        """Modern raporlar sekmesi"""
        self.tabview.add("📊 Raporlar")
        reports_frame = self.tabview.tab("📊 Raporlar")
        
        # Başlık
        title = ctk.CTkLabel(reports_frame, text="📊 Raporlar ve Analizler", font=ctk.CTkFont(size=24, weight="bold"))
        title.pack(pady=30)
        
        # Ana içerik frame'i
        main_frame = ctk.CTkFrame(reports_frame)
        main_frame.pack(fill="both", expand=True, padx=40, pady=20)
        
        # Rapor butonları
        buttons_section = ctk.CTkFrame(main_frame)
        buttons_section.pack(fill="x", padx=20, pady=(20, 10))
        
        ctk.CTkLabel(buttons_section, text="📈 Rapor Türleri", font=ctk.CTkFont(size=18, weight="bold")).pack(pady=15)
        
        button_frame = ctk.CTkFrame(buttons_section, fg_color="transparent")
        button_frame.pack(pady=10)
        
        ctk.CTkButton(
            button_frame,
            text="👥 Müşteri Borç Raporu",
            command=self.customer_debt_report,
            width=200,
            height=40,
            font=ctk.CTkFont(size=14)
        ).pack(side="left", padx=10)
        
        ctk.CTkButton(
            button_frame,
            text="💰 Ödeme Geçmişi",
            command=self.payment_history_report,
            width=200,
            height=40,
            font=ctk.CTkFont(size=14)
        ).pack(side="left", padx=10)
        
        ctk.CTkButton(
            button_frame,
            text="📈 Özet Rapor",
            command=self.summary_report,
            width=200,
            height=40,
            font=ctk.CTkFont(size=14)
        ).pack(side="left", padx=10)
        
        ctk.CTkButton(
            button_frame,
            text="🖨️ Raporu Yazdır",
            command=self.print_report,
            width=200,
            height=40,
            font=ctk.CTkFont(size=14)
        ).pack(side="left", padx=10)
        
        # Rapor gösterim alanı
        report_section = ctk.CTkFrame(main_frame)
        report_section.pack(fill="both", expand=True, padx=20, pady=(10, 20))
        
        ctk.CTkLabel(report_section, text="📄 Rapor Sonuçları", font=ctk.CTkFont(size=16, weight="bold")).pack(pady=(15, 5))
        
        self.report_text = ctk.CTkTextbox(report_section, width=800, height=400, font=ctk.CTkFont(family="Courier", size=12))
        self.report_text.pack(fill="both", expand=True, padx=20, pady=(0, 20))
        
        # İlk raporu yükle
        self.summary_report()
    
    def print_report(self):
        """Raporu yazdırma özelliği"""
        report_content = self.report_text.get("1.0", "end-1c")
        if not report_content.strip():
            messagebox.showwarning("Uyarı", "Yazdırılacak rapor bulunamadı!")
            return
            
        # Basit txt dosyası olarak kaydet ve varsayılan program ile aç
        try:
            filename = filedialog.asksaveasfilename(
                title="Raporu Kaydet",
                defaultextension=".txt",
                filetypes=[("Metin Dosyası", "*.txt")],
                initialname=f"elite-pos-rapor-{datetime.now().strftime('%Y%m%d-%H%M')}.txt"
            )
            
            if filename:
                with open(filename, 'w', encoding='utf-8') as f:
                    f.write(report_content)
                    
                messagebox.showinfo("Başarılı", f"Rapor kaydedildi:\n{filename}")
                
                # Dosyayı varsayılan programla aç
                import subprocess, platform
                if platform.system() == 'Windows':
                    os.startfile(filename)
                    
        except Exception as e:
            messagebox.showerror("Hata", f"Rapor kaydedilemedi: {e}")
        
    def create_backup_tab(self):
        """Modern yedekleme sekmesi"""
        self.tabview.add("💾 Yedekleme")
        backup_frame = self.tabview.tab("💾 Yedekleme")
        
        # Başlık
        title = ctk.CTkLabel(backup_frame, text="💾 Veri Yönetimi", font=ctk.CTkFont(size=24, weight="bold"))
        title.pack(pady=30)
        
        # Ana işlemler frame'i
        main_frame = ctk.CTkFrame(backup_frame)
        main_frame.pack(fill="both", expand=True, padx=40, pady=20)
        
        # Yedekleme işlemleri
        backup_section = ctk.CTkFrame(main_frame)
        backup_section.pack(fill="x", padx=20, pady=(20, 10))
        
        ctk.CTkLabel(backup_section, text="📤 Yerel Yedekleme", font=ctk.CTkFont(size=18, weight="bold")).pack(pady=15)
        
        button_frame1 = ctk.CTkFrame(backup_section, fg_color="transparent")
        button_frame1.pack(pady=10)
        
        ctk.CTkButton(
            button_frame1,
            text="📤 Verileri Dışa Aktar",
            command=self.export_data,
            width=200,
            height=40,
            font=ctk.CTkFont(size=14)
        ).pack(side="left", padx=10)
        
        ctk.CTkButton(
            button_frame1,
            text="📥 Verileri İçe Aktar",
            command=self.import_data,
            width=200,
            height=40,
            font=ctk.CTkFont(size=14)
        ).pack(side="left", padx=10)
        
        # Web sync işlemleri
        web_section = ctk.CTkFrame(main_frame)
        web_section.pack(fill="x", padx=20, pady=10)
        
        ctk.CTkLabel(web_section, text="🌐 Web Senkronizasyonu", font=ctk.CTkFont(size=18, weight="bold")).pack(pady=15)
        
        button_frame2 = ctk.CTkFrame(web_section, fg_color="transparent")
        button_frame2.pack(pady=10)
        
        ctk.CTkButton(
            button_frame2,
            text="📥 Web'den Veri Al",
            command=self.sync_from_web,
            width=200,
            height=40,
            font=ctk.CTkFont(size=14)
        ).pack(side="left", padx=10)
        
        ctk.CTkButton(
            button_frame2,
            text="⚙️ Web Ayarları",
            command=self.web_settings_dialog,
            width=200,
            height=40,
            font=ctk.CTkFont(size=14)
        ).pack(side="left", padx=10)
        
        # Bilgi paneli
        info_section = ctk.CTkFrame(main_frame)
        info_section.pack(fill="x", padx=20, pady=(10, 20))
        
        ctk.CTkLabel(info_section, text="ℹ️ Bilgiler", font=ctk.CTkFont(size=16, weight="bold")).pack(pady=(15, 5))
        
        info_text = f"""
💾 Veri Klasörü: {self.data_path}

📤 Dışa Aktar: Tüm verilerinizi JSON dosyası olarak kaydeder
📥 İçe Aktar: Önceden kaydedilmiş verileri geri yükler  
🌐 Web Sync: Web uygulamanızdan gerçek zamanlı veri alır
⚠️ İçe aktarma mevcut tüm verileri siler!
"""
        
        info_label = ctk.CTkLabel(
            info_section,
            text=info_text,
            justify="left",
            font=ctk.CTkFont(size=12)
        )
        info_label.pack(padx=20, pady=(0, 15))
    
    def web_settings_dialog(self):
        """Web ayarları dialogu"""
        dialog = ctk.CTkToplevel(self.root)
        dialog.title("Web Ayarları")
        dialog.geometry("500x300")
        dialog.transient(self.root)
        dialog.grab_set()
        
        settings = self.load_data('settings')
        current_url = settings.get('web_api_url', 'https://pos-crm-elite.preview.emergentagent.com/api')
        
        # Başlık
        title = ctk.CTkLabel(dialog, text="🌐 Web API Ayarları", font=ctk.CTkFont(size=18, weight="bold"))
        title.pack(pady=20)
        
        # Form
        form_frame = ctk.CTkFrame(dialog)
        form_frame.pack(fill="both", expand=True, padx=20, pady=10)
        
        ctk.CTkLabel(form_frame, text="Web API URL:", font=ctk.CTkFont(size=14)).pack(anchor="w", padx=15, pady=(20, 5))
        
        url_entry = ctk.CTkEntry(form_frame, width=450, height=35, font=ctk.CTkFont(size=12))
        url_entry.pack(padx=15, pady=(0, 20))
        url_entry.insert(0, current_url)
        
        # Test bağlantısı
        def test_connection():
            test_url = url_entry.get().strip()
            if not test_url:
                messagebox.showerror("Hata", "URL boş olamaz!")
                return
                
            try:
                # Test isteği gönder
                response = requests.get(f"{test_url.rstrip('/')}/backup/export", timeout=10)
                if response.status_code == 200:
                    messagebox.showinfo("Başarılı", "✅ Bağlantı başarılı!")
                else:
                    messagebox.showerror("Hata", f"❌ HTTP {response.status_code}")
            except Exception as e:
                messagebox.showerror("Bağlantı Hatası", f"❌ Bağlanamadı:\n{str(e)}")
        
        def save_settings():
            new_url = url_entry.get().strip()
            if not new_url:
                messagebox.showerror("Hata", "URL boş olamaz!")
                return
                
            settings['web_api_url'] = new_url
            if self.save_data('settings', settings):
                messagebox.showinfo("Başarılı", "Ayarlar kaydedildi!")
                dialog.destroy()
        
        # Butonlar
        button_frame = ctk.CTkFrame(dialog)
        button_frame.pack(fill="x", padx=20, pady=(0, 20))
        
        ctk.CTkButton(button_frame, text="🔧 Bağlantıyı Test Et", command=test_connection, width=150).pack(side="left", padx=10, pady=10)
        ctk.CTkButton(button_frame, text="💾 Kaydet", command=save_settings, width=100).pack(side="right", padx=10, pady=10)
        ctk.CTkButton(button_frame, text="❌ İptal", command=dialog.destroy, width=80).pack(side="right", padx=(0, 10), pady=10)
    
    # === Web Sync İşlemleri ===
    
    def sync_from_web(self):
        """Web uygulamasından verileri çek"""
        settings = self.load_data('settings')
        web_url = settings.get('web_api_url', 'https://pos-crm-elite.preview.emergentagent.com/api')
        
        # Sync dialogu
        sync_window = ctk.CTkToplevel(self.root)
        sync_window.title("Web'den Veri Çekme")
        sync_window.geometry("500x400")
        sync_window.transient(self.root)
        sync_window.grab_set()
        
        # Başlık
        title_label = ctk.CTkLabel(
            sync_window, 
            text="🔄 Web Uygulamasından Veri Çekme",
            font=ctk.CTkFont(size=18, weight="bold")
        )
        title_label.pack(pady=20)
        
        # URL ayarı
        url_frame = ctk.CTkFrame(sync_window)
        url_frame.pack(fill="x", padx=20, pady=10)
        
        ctk.CTkLabel(url_frame, text="Web API URL:", font=ctk.CTkFont(size=12)).pack(anchor="w", padx=10, pady=(10, 5))
        url_entry = ctk.CTkEntry(url_frame, width=450, placeholder_text="https://...")
        url_entry.pack(padx=10, pady=(0, 10))
        url_entry.insert(0, web_url)
        
        # İlerleme çubuğu
        progress = ctk.CTkProgressBar(sync_window, width=450)
        progress.pack(pady=20)
        progress.set(0)
        
        # Durum yazısı
        status_label = ctk.CTkLabel(sync_window, text="Hazır", font=ctk.CTkFont(size=12))
        status_label.pack(pady=10)
        
        # Log alanı
        log_frame = ctk.CTkFrame(sync_window)
        log_frame.pack(fill="both", expand=True, padx=20, pady=(0, 10))
        
        log_text = ctk.CTkTextbox(log_frame, width=450, height=150, font=ctk.CTkFont(family="Courier"))
        log_text.pack(padx=10, pady=10)
        
        def update_log(message):
            log_text.insert("end", f"{datetime.now().strftime('%H:%M:%S')} - {message}\n")
            log_text.see("end")
            sync_window.update()
        
        def sync_data():
            try:
                url = url_entry.get().strip()
                if not url:
                    messagebox.showerror("Hata", "URL boş olamaz!")
                    return
                
                # URL'yi settings'e kaydet
                settings['web_api_url'] = url
                self.save_data('settings', settings)
                
                self.sync_button.configure(state="disabled", text="⏳ Çekiliyor...")
                progress.set(0)
                
                update_log("Web API'ye bağlanıyor...")
                
                # Backup endpoint'inden tüm verileri çek
                backup_url = f"{url.rstrip('/')}/backup/export"
                
                update_log(f"İstek gönderiliyor: {backup_url}")
                progress.set(0.2)
                
                response = requests.get(backup_url, timeout=30)
                response.raise_for_status()
                
                update_log("Veri başarıyla alındı!")
                progress.set(0.5)
                
                backup_data = response.json()
                
                if 'data' not in backup_data:
                    raise ValueError("Geçersiz veri formatı!")
                
                update_log("Veriler işleniyor...")
                progress.set(0.7)
                
                # Veri mapping ve convert
                web_data = backup_data['data']
                imported_counts = {}
                
                # Customers
                if 'customers' in web_data:
                    customers = []
                    for c in web_data['customers']:
                        customer = {
                            "id": c.get('id', str(uuid.uuid4())),
                            "name": c.get('name', ''),
                            "phone": c.get('phone', ''),
                            "email": c.get('email', ''),
                            "address": c.get('address', ''),
                            "credit_limit": c.get('credit_limit', 0.0),
                            "notes": c.get('notes', ''),
                            "created_at": c.get('created_at', datetime.now().isoformat())
                        }
                        customers.append(customer)
                    
                    self.save_data('customers', customers)
                    imported_counts['customers'] = len(customers)
                    update_log(f"✓ Müşteriler: {len(customers)} kayıt")
                
                progress.set(0.8)
                
                # Credit Sales
                if 'credit_sales' in web_data:
                    credit_sales = []
                    for cs in web_data['credit_sales']:
                        credit_sale = {
                            "id": cs.get('id', str(uuid.uuid4())),
                            "customer_id": cs.get('customer_id', ''),
                            "total_amount": cs.get('total_amount', 0.0),
                            "remaining_amount": cs.get('remaining_amount', 0.0),
                            "due_date": cs.get('due_date', ''),
                            "payment_status": cs.get('payment_status', 'unpaid'),
                            "notes": cs.get('notes', ''),
                            "created_at": cs.get('created_at', datetime.now().isoformat())
                        }
                        credit_sales.append(credit_sale)
                    
                    self.save_data('credit_sales', credit_sales)
                    imported_counts['credit_sales'] = len(credit_sales)
                    update_log(f"✓ Borçlar: {len(credit_sales)} kayıt")
                
                # Payments  
                if 'payments' in web_data:
                    payments = []
                    for p in web_data['payments']:
                        payment = {
                            "id": p.get('id', str(uuid.uuid4())),
                            "customer_id": p.get('customer_id', ''),
                            "amount": p.get('amount', 0.0),
                            "payment_method": p.get('payment_method', 'cash'),
                            "notes": p.get('notes', ''),
                            "created_at": p.get('created_at', datetime.now().isoformat())
                        }
                        payments.append(payment)
                    
                    self.save_data('payments', payments)
                    imported_counts['payments'] = len(payments)
                    update_log(f"✓ Ödemeler: {len(payments)} kayıt")
                
                # Products
                if 'products' in web_data:
                    products = []
                    for p in web_data['products']:
                        product = {
                            "id": p.get('id', str(uuid.uuid4())),
                            "name": p.get('name', ''),
                            "barcode": p.get('barcode', ''),
                            "price": p.get('selling_price', p.get('price', 0.0)),
                            "stock": p.get('current_stock', p.get('stock', 0)),
                            "created_at": p.get('created_at', datetime.now().isoformat())
                        }
                        products.append(product)
                    
                    self.save_data('products', products)
                    imported_counts['products'] = len(products)
                    update_log(f"✓ Ürünler: {len(products)} kayıt")
                
                progress.set(1.0)
                
                total_records = sum(imported_counts.values())
                update_log(f"\n🎉 BAŞARILI! Toplam {total_records} kayıt içe aktarıldı")
                
                # Arayüzü yenile
                self.refresh_customers()
                self.refresh_sale_combos()
                
                messagebox.showinfo(
                    "Başarılı", 
                    f"Web'den veri çekme tamamlandı!\n\nTopam {total_records} kayıt güncellendi:\n" +
                    "\n".join([f"• {k.title()}: {v} kayıt" for k, v in imported_counts.items()])
                )
                
            except requests.exceptions.RequestException as e:
                update_log(f"❌ Bağlantı hatası: {str(e)}")
                messagebox.showerror("Bağlantı Hatası", f"Web API'ye bağlanılamadı:\n{str(e)}")
            except Exception as e:
                update_log(f"❌ Hata: {str(e)}")
                messagebox.showerror("Hata", f"Veri çekme sırasında hata:\n{str(e)}")
            finally:
                self.sync_button.configure(state="normal", text="🔄 Web'den Veri Çek")
                progress.set(0)
        
        # Butonlar
        button_frame = ctk.CTkFrame(sync_window)
        button_frame.pack(fill="x", padx=20, pady=(0, 20))
        
        ctk.CTkButton(
            button_frame,
            text="🚀 Veri Çekmeyi Başlat",
            command=lambda: threading.Thread(target=sync_data, daemon=True).start(),
            width=150,
            height=35
        ).pack(side="left", padx=10, pady=10)
        
        ctk.CTkButton(
            button_frame,
            text="❌ İptal",
            command=sync_window.destroy,
            width=100,
            height=35
        ).pack(side="right", padx=10, pady=10)
        
    # === Müşteri İşlemleri ===
    
    def refresh_customers(self):
        """Müşteri listesini yenile"""
        # Mevcut verileri temizle
        for item in self.customers_tree.get_children():
            self.customers_tree.delete(item)
            
        customers = self.load_data('customers')
        credit_sales = self.load_data('credit_sales')
        
        for customer in customers:
            # Toplam borç hesapla
            total_debt = sum(
                cs['remaining_amount'] for cs in credit_sales 
                if cs['customer_id'] == customer['id'] and cs.get('payment_status', 'unpaid') != 'paid'
            )
            
            # Vadesi geçmiş kontrol
            overdue = any(
                cs['customer_id'] == customer['id'] and 
                cs.get('due_date', '') and 
                cs.get('due_date', '') < date.today().isoformat() and
                cs.get('payment_status', 'unpaid') != 'paid'
                for cs in credit_sales
            )
            
            status = "🚨 VADESİ GEÇMİŞ" if overdue else ("💰 Borçlu" if total_debt > 0 else "✅ Temiz")
            
            self.customers_tree.insert(
                "", 
                tk.END, 
                values=(
                    customer['id'][-6:],  # Son 6 karakter
                    customer['name'],
                    customer.get('phone', ''),
                    f"₺{total_debt:.2f}",
                    status
                ),
                tags=("overdue",) if overdue else ("normal",)
            )
            
        # Renk ayarları
        self.customers_tree.tag_configure("overdue", background="#ffebee")
        
    def filter_customers(self, event=None):
        """Müşteri arama"""
        search_term = self.customer_search.get().lower()
        
        # Tüm verileri temizle
        for item in self.customers_tree.get_children():
            self.customers_tree.delete(item)
            
        customers = self.load_data('customers')
        
        # Filtrelenmiş müşterileri göster
        for customer in customers:
            if (search_term in customer['name'].lower() or 
                search_term in customer.get('phone', '').lower()):
                # Aynı mantıkla ekle (kısaltıldı)
                self.customers_tree.insert("", tk.END, values=(
                    customer['id'][-6:],
                    customer['name'],
                    customer.get('phone', ''),
                    "₺0.00",  # Basitleştirildi
                    "✅ Temiz"
                ))
                
    def new_customer_dialog(self):
        """Yeni müşteri ekleme dialogu"""
        dialog = ctk.CTkToplevel(self.root)
        dialog.title("Yeni Müşteri")
        dialog.geometry("450x400")
        dialog.transient(self.root)
        dialog.grab_set()
        
        # Başlık
        title = ctk.CTkLabel(dialog, text="👤 Yeni Müşteri Ekle", font=ctk.CTkFont(size=18, weight="bold"))
        title.pack(pady=20)
        
        # Form frame
        form_frame = ctk.CTkFrame(dialog)
        form_frame.pack(fill="both", expand=True, padx=20, pady=10)
        
        # Form alanları
        ctk.CTkLabel(form_frame, text="Müşteri Adı *", font=ctk.CTkFont(size=12)).pack(anchor="w", padx=10, pady=(15, 5))
        name_entry = ctk.CTkEntry(form_frame, width=400, placeholder_text="Müşteri adını girin...")
        name_entry.pack(padx=10, pady=(0, 10))
        name_entry.focus()
        
        ctk.CTkLabel(form_frame, text="Telefon", font=ctk.CTkFont(size=12)).pack(anchor="w", padx=10, pady=(0, 5))
        phone_entry = ctk.CTkEntry(form_frame, width=400, placeholder_text="Telefon numarası...")
        phone_entry.pack(padx=10, pady=(0, 10))
        
        ctk.CTkLabel(form_frame, text="E-posta", font=ctk.CTkFont(size=12)).pack(anchor="w", padx=10, pady=(0, 5))
        email_entry = ctk.CTkEntry(form_frame, width=400, placeholder_text="E-posta adresi...")
        email_entry.pack(padx=10, pady=(0, 10))
        
        ctk.CTkLabel(form_frame, text="Adres", font=ctk.CTkFont(size=12)).pack(anchor="w", padx=10, pady=(0, 5))
        address_text = ctk.CTkTextbox(form_frame, width=400, height=60)
        address_text.pack(padx=10, pady=(0, 10))
        
        ctk.CTkLabel(form_frame, text="Kredi Limiti (₺)", font=ctk.CTkFont(size=12)).pack(anchor="w", padx=10, pady=(0, 5))
        credit_entry = ctk.CTkEntry(form_frame, width=400, placeholder_text="5000.00")
        credit_entry.pack(padx=10, pady=(0, 10))
        credit_entry.insert(0, "5000.00")
        
        ctk.CTkLabel(form_frame, text="Notlar", font=ctk.CTkFont(size=12)).pack(anchor="w", padx=10, pady=(0, 5))
        notes_text = ctk.CTkTextbox(form_frame, width=400, height=60)
        notes_text.pack(padx=10, pady=(0, 15))
        
        def save_customer():
            name = name_entry.get().strip()
            if not name:
                messagebox.showerror("Hata", "Müşteri adı gerekli!")
                return
                
            customers = self.load_data('customers')
            
            new_customer = {
                "id": f"cust_{len(customers)+1:03d}",
                "name": name,
                "phone": phone_entry.get().strip(),
                "email": email_entry.get().strip(),
                "address": address_text.get("1.0", "end-1c").strip(),
                "credit_limit": float(credit_entry.get().replace(',', '.') or 0),
                "notes": notes_text.get("1.0", "end-1c").strip(),
                "created_at": datetime.now().isoformat()
            }
            
            customers.append(new_customer)
            
            if self.save_data('customers', customers):
                messagebox.showinfo("Başarılı", "Müşteri eklendi!")
                dialog.destroy()
                self.refresh_customers()
                self.refresh_sale_combos()
        
        # Butonlar
        button_frame = ctk.CTkFrame(dialog)
        button_frame.pack(fill="x", padx=20, pady=(0, 20))
        
        ctk.CTkButton(button_frame, text="💾 Kaydet", command=save_customer, width=120).pack(side="left", padx=10, pady=10)
        ctk.CTkButton(button_frame, text="❌ İptal", command=dialog.destroy, width=100).pack(side="right", padx=10, pady=10)
    
    def create_products_tab(self):
        """Ürünler sekmesi"""
        self.tabview.add("📦 Ürünler")
        products_frame = self.tabview.tab("📦 Ürünler")
        
        # Üst kontrol paneli
        control_frame = ctk.CTkFrame(products_frame)
        control_frame.pack(fill="x", padx=10, pady=(10, 5))
        
        # Sol butonlar
        left_buttons = ctk.CTkFrame(control_frame, fg_color="transparent")
        left_buttons.pack(side="left", padx=10, pady=10)
        
        ctk.CTkButton(
            left_buttons,
            text="➕ Yeni Ürün",
            command=self.new_product_dialog,
            width=120,
            height=32
        ).pack(side="left", padx=(0, 10))
        
        ctk.CTkButton(
            left_buttons,
            text="🔄 Yenile",
            command=self.refresh_products,
            width=80,
            height=32
        ).pack(side="left")
        
        # Sağ arama
        search_frame = ctk.CTkFrame(control_frame, fg_color="transparent")
        search_frame.pack(side="right", padx=10, pady=10)
        
        ctk.CTkLabel(search_frame, text="🔍 Ürün Ara:", font=ctk.CTkFont(size=12)).pack(side="left", padx=(0, 5))
        self.product_search = ctk.CTkEntry(search_frame, placeholder_text="İsim veya barkod...", width=200)
        self.product_search.pack(side="left")
        self.product_search.bind('<KeyRelease>', self.filter_products)
        
        # Ürün listesi frame
        list_frame = ctk.CTkFrame(products_frame)
        list_frame.pack(fill="both", expand=True, padx=10, pady=5)
        
        # Treeview için frame
        tree_frame = tk.Frame(list_frame, bg='#212121' if ctk.get_appearance_mode() == "Dark" else '#f0f0f0')
        tree_frame.pack(fill="both", expand=True, padx=20, pady=20)
        
        # Ürün listesi
        columns = ("ID", "İsim", "Barkod", "Fiyat", "Stok")
        self.products_tree = tk.ttk.Treeview(tree_frame, columns=columns, show="headings", height=20)
        
        # Kolon başlıkları ve genişlikleri
        headers = {
            "ID": ("ID", 80),
            "İsim": ("Ürün Adı", 300), 
            "Barkod": ("Barkod", 150),
            "Fiyat": ("Satış Fiyatı", 120),
            "Stok": ("Stok Adedi", 100)
        }
        
        for col, (header, width) in headers.items():
            self.products_tree.heading(col, text=header)
            self.products_tree.column(col, width=width)
        
        # Scrollbar
        scrollbar = tk.ttk.Scrollbar(tree_frame, orient="vertical", command=self.products_tree.yview)
        self.products_tree.configure(yscrollcommand=scrollbar.set)
        
        self.products_tree.pack(side="left", fill="both", expand=True)
        scrollbar.pack(side="right", fill="y")
        
        # Events
        self.products_tree.bind("<Double-1>", self.edit_product_dialog)
        
        # Veriyi yükle
        self.refresh_products()
    
    def refresh_products(self):
        """Ürün listesini yenile"""
        for item in self.products_tree.get_children():
            self.products_tree.delete(item)
            
        products = self.load_data('products')
        
        for product in products:
            self.products_tree.insert("", "end", values=(
                product['id'][-6:],
                product['name'],
                product.get('barcode', ''),
                f"₺{product['price']:.2f}",
                product.get('stock', 0)
            ))
    
    def filter_products(self, event=None):
        """Ürün arama"""
        search_term = self.product_search.get().lower()
        
        for item in self.products_tree.get_children():
            self.products_tree.delete(item)
            
        products = self.load_data('products')
        
        for product in products:
            if (search_term in product['name'].lower() or 
                search_term in product.get('barcode', '').lower()):
                self.products_tree.insert("", "end", values=(
                    product['id'][-6:],
                    product['name'],
                    product.get('barcode', ''),
                    f"₺{product['price']:.2f}",
                    product.get('stock', 0)
                ))
    
    def new_product_dialog(self):
        """Yeni ürün ekleme dialogu"""
        dialog = ctk.CTkToplevel(self.root)
        dialog.title("Yeni Ürün")
        dialog.geometry("450x400")
        dialog.transient(self.root)
        dialog.grab_set()
        
        # Başlık
        title = ctk.CTkLabel(dialog, text="📦 Yeni Ürün Ekle", font=ctk.CTkFont(size=18, weight="bold"))
        title.pack(pady=20)
        
        # Form frame
        form_frame = ctk.CTkFrame(dialog)
        form_frame.pack(fill="both", expand=True, padx=20, pady=10)
        
        # Form alanları
        ctk.CTkLabel(form_frame, text="Ürün Adı *", font=ctk.CTkFont(size=12)).pack(anchor="w", padx=10, pady=(15, 5))
        name_entry = ctk.CTkEntry(form_frame, width=400, placeholder_text="Ürün adını girin...")
        name_entry.pack(padx=10, pady=(0, 10))
        name_entry.focus()
        
        ctk.CTkLabel(form_frame, text="Barkod", font=ctk.CTkFont(size=12)).pack(anchor="w", padx=10, pady=(0, 5))
        barcode_entry = ctk.CTkEntry(form_frame, width=400, placeholder_text="Barkod numarası...")
        barcode_entry.pack(padx=10, pady=(0, 10))
        
        ctk.CTkLabel(form_frame, text="Satış Fiyatı (₺) *", font=ctk.CTkFont(size=12)).pack(anchor="w", padx=10, pady=(0, 5))
        price_entry = ctk.CTkEntry(form_frame, width=400, placeholder_text="0.00")
        price_entry.pack(padx=10, pady=(0, 10))
        
        ctk.CTkLabel(form_frame, text="Başlangıç Stok Adedi", font=ctk.CTkFont(size=12)).pack(anchor="w", padx=10, pady=(0, 5))
        stock_entry = ctk.CTkEntry(form_frame, width=400, placeholder_text="0")
        stock_entry.pack(padx=10, pady=(0, 15))
        stock_entry.insert(0, "0")
        
        def save_product():
            name = name_entry.get().strip()
            if not name:
                messagebox.showerror("Hata", "Ürün adı gerekli!")
                return
                
            try:
                price = float(price_entry.get().replace(',', '.'))
                if price < 0:
                    raise ValueError("Fiyat negatif olamaz")
            except ValueError:
                messagebox.showerror("Hata", "Geçerli bir fiyat girin!")
                return
                
            try:
                stock = int(stock_entry.get())
                if stock < 0:
                    raise ValueError("Stok negatif olamaz")
            except ValueError:
                messagebox.showerror("Hata", "Geçerli bir stok adedi girin!")
                return
                
            products = self.load_data('products')
            
            new_product = {
                "id": f"prod_{len(products)+1:03d}",
                "name": name,
                "barcode": barcode_entry.get().strip(),
                "price": price,
                "stock": stock,
                "created_at": datetime.now().isoformat()
            }
            
            products.append(new_product)
            
            if self.save_data('products', products):
                messagebox.showinfo("Başarılı", "Ürün eklendi!")
                dialog.destroy()
                self.refresh_products()
                self.refresh_sale_combos()
        
        # Butonlar
        button_frame = ctk.CTkFrame(dialog)
        button_frame.pack(fill="x", padx=20, pady=(0, 20))
        
        ctk.CTkButton(button_frame, text="💾 Kaydet", command=save_product, width=120).pack(side="left", padx=10, pady=10)
        ctk.CTkButton(button_frame, text="❌ İptal", command=dialog.destroy, width=100).pack(side="right", padx=10, pady=10)
    
    def edit_product_dialog(self, event=None):
        """Ürün düzenleme (gelecek sürümde)"""
        messagebox.showinfo("Bilgi", "Ürün düzenleme özelliği gelecek versiyonda eklenecek.")
        
    def customer_context_menu(self, event):
        """Müşteri sağ tık menüsü"""
        item = self.customers_tree.selection()
        if not item:
            return
            
        menu = tk.Menu(self.root, tearoff=0)
        menu.add_command(label="📊 Hesap Detayları", command=self.customer_account_details)
        menu.add_command(label="💰 Ödeme Al", command=self.record_payment_dialog)
        menu.add_command(label="📝 Manuel Borç Ekle", command=self.add_manual_credit_dialog)
        menu.add_separator()
        menu.add_command(label="✏️ Düzenle", command=self.edit_customer_dialog)
        
        try:
            menu.tk_popup(event.x_root, event.y_root)
        finally:
            menu.grab_release()
            
    def customer_account_details(self, event=None):
        """Müşteri hesap detayları"""
        selection = self.customers_tree.selection()
        if not selection:
            return
            
        values = self.customers_tree.item(selection[0])['values']
        
        customers = self.load_data('customers')
        customer = next((c for c in customers if c['id'].endswith(values[0])), None)
        
        if not customer:
            messagebox.showerror("Hata", "Müşteri bulunamadı!")
            return
            
        # Hesap detay penceresi
        detail_window = tk.Toplevel(self.root)
        detail_window.title(f"Hesap Detayları - {customer['name']}")
        detail_window.geometry("600x500")
        detail_window.transient(self.root)
        
        # Müşteri bilgileri
        info_frame = ttk.LabelFrame(detail_window, text="Müşteri Bilgileri", padding=10)
        info_frame.pack(fill=tk.X, padx=10, pady=5)
        
        info_text = f"""
🏷️ Ad: {customer['name']}
📞 Telefon: {customer.get('phone', '-')}
📧 E-posta: {customer.get('email', '-')} 
🏠 Adres: {customer.get('address', '-')}
💳 Kredi Limiti: ₺{customer.get('credit_limit', 0):.2f}
📅 Kayıt Tarihi: {customer.get('created_at', '')[:10]}
"""
        
        ttk.Label(info_frame, text=info_text, justify=tk.LEFT).pack()
        
        # Borç bilgileri
        credit_sales = self.load_data('credit_sales')
        customer_credits = [cs for cs in credit_sales if cs['customer_id'] == customer['id']]
        
        total_debt = sum(cs['remaining_amount'] for cs in customer_credits if cs.get('payment_status', 'unpaid') != 'paid')
        
        debt_frame = ttk.LabelFrame(detail_window, text="Borç Durumu", padding=10)
        debt_frame.pack(fill=tk.X, padx=10, pady=5)
        
        debt_text = f"💰 Toplam Borç: ₺{total_debt:.2f}"
        ttk.Label(debt_frame, text=debt_text, font=("Arial", 12, "bold")).pack()
        
        # Borç listesi
        if customer_credits:
            credits_frame = ttk.LabelFrame(detail_window, text="Borç Detayları", padding=5)
            credits_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=5)
            
            credits_text = tk.Text(credits_frame, height=10, font=("Courier", 9))
            credits_text.pack(fill=tk.BOTH, expand=True)
            
            credits_text.insert(tk.END, "Tarih       | Tutar      | Kalan      | Notlar\n")
            credits_text.insert(tk.END, "-" * 50 + "\n")
            
            for cs in customer_credits:
                date_str = cs.get('created_at', '')[:10]
                credits_text.insert(tk.END, 
                    f"{date_str} | ₺{cs['total_amount']:>8.2f} | ₺{cs['remaining_amount']:>8.2f} | {cs.get('notes', '')[:20]}\n"
                )
                
        # Alt butonlar
        buttons_frame = ttk.Frame(detail_window)
        buttons_frame.pack(pady=10)
        
        ttk.Button(buttons_frame, text="💰 Ödeme Al", 
                  command=lambda: self.record_payment_dialog(customer)).pack(side=tk.LEFT, padx=5)
        ttk.Button(buttons_frame, text="📝 Manuel Borç Ekle", 
                  command=lambda: self.add_manual_credit_dialog(customer)).pack(side=tk.LEFT, padx=5)
        ttk.Button(buttons_frame, text="❌ Kapat", 
                  command=detail_window.destroy).pack(side=tk.LEFT, padx=5)
                  
    def record_payment_dialog(self, customer=None):
        """Ödeme kaydetme dialogu"""
        if not customer:
            selection = self.customers_tree.selection()
            if not selection:
                messagebox.showwarning("Uyarı", "Lütfen bir müşteri seçin!")
                return
            values = self.customers_tree.item(selection[0])['values']
            customers = self.load_data('customers')
            customer = next((c for c in customers if c['id'].endswith(values[0])), None)
            
        if not customer:
            return
            
        dialog = tk.Toplevel(self.root)
        dialog.title(f"Ödeme Al - {customer['name']}")
        dialog.geometry("400x300")
        dialog.transient(self.root)
        dialog.grab_set()
        
        # Mevcut borç göster
        credit_sales = self.load_data('credit_sales')
        total_debt = sum(cs['remaining_amount'] for cs in credit_sales 
                        if cs['customer_id'] == customer['id'] and cs.get('payment_status', 'unpaid') != 'paid')
        
        ttk.Label(dialog, text=f"Toplam Borç: ₺{total_debt:.2f}", 
                 font=("Arial", 12, "bold"), foreground="red").pack(pady=10)
        
        # Ödeme formu
        form_frame = ttk.Frame(dialog)
        form_frame.pack(padx=20, pady=10)
        
        ttk.Label(form_frame, text="Ödeme Tutarı (₺) *").grid(row=0, column=0, sticky=tk.W, pady=5)
        amount_entry = ttk.Entry(form_frame, width=20)
        amount_entry.grid(row=0, column=1, pady=5)
        amount_entry.focus()
        
        ttk.Label(form_frame, text="Ödeme Yöntemi").grid(row=1, column=0, sticky=tk.W, pady=5)
        method_combo = ttk.Combobox(form_frame, values=["Nakit", "Kart", "Banka Havalesi"], width=17)
        method_combo.grid(row=1, column=1, pady=5)
        method_combo.set("Nakit")
        
        ttk.Label(form_frame, text="Notlar").grid(row=2, column=0, sticky=tk.W, pady=5)
        notes_text = tk.Text(form_frame, width=20, height=3)
        notes_text.grid(row=2, column=1, pady=5)
        
        def save_payment():
            try:
                amount = float(amount_entry.get().replace(',', '.'))
                if amount <= 0:
                    raise ValueError("Geçersiz tutar")
            except ValueError:
                messagebox.showerror("Hata", "Geçerli bir tutar girin!")
                return
                
            payments = self.load_data('payments')
            
            new_payment = {
                "id": f"pay_{len(payments)+1:03d}",
                "customer_id": customer['id'],
                "amount": amount,
                "payment_method": method_combo.get().lower().replace(' ', '_'),
                "notes": notes_text.get("1.0", tk.END).strip(),
                "created_at": datetime.now().isoformat()
            }
            
            payments.append(new_payment)
            
            # Borçları güncelle (FIFO mantığı)
            credit_sales = self.load_data('credit_sales')
            remaining_payment = amount
            
            for cs in credit_sales:
                if (cs['customer_id'] == customer['id'] and 
                    cs.get('payment_status', 'unpaid') != 'paid' and 
                    remaining_payment > 0):
                    
                    payment_for_this = min(remaining_payment, cs['remaining_amount'])
                    cs['remaining_amount'] -= payment_for_this
                    remaining_payment -= payment_for_this
                    
                    if cs['remaining_amount'] <= 0:
                        cs['payment_status'] = 'paid'
                    elif cs['remaining_amount'] < cs['total_amount']:
                        cs['payment_status'] = 'partial'
                        
                    cs['updated_at'] = datetime.now().isoformat()
                    
            # Kaydet
            if (self.save_data('payments', payments) and 
                self.save_data('credit_sales', credit_sales)):
                
                # Fazla ödeme kontrolü
                if remaining_payment > 0:
                    messagebox.showinfo("Bilgi", 
                        f"Ödeme kaydedildi!\n💰 Müşteri alacaklı oldu: ₺{remaining_payment:.2f}")
                else:
                    messagebox.showinfo("Başarılı", "Ödeme kaydedildi!")
                    
                dialog.destroy()
                self.refresh_customers()
            
        # Butonlar
        buttons_frame = ttk.Frame(dialog)
        buttons_frame.pack(pady=20)
        
        ttk.Button(buttons_frame, text="💰 Ödeme Kaydet", command=save_payment).pack(side=tk.LEFT, padx=5)
        ttk.Button(buttons_frame, text="❌ İptal", command=dialog.destroy).pack(side=tk.LEFT)
        
    def add_manual_credit_dialog(self, customer=None):
        """Manuel borç ekleme dialogu"""
        if not customer:
            selection = self.customers_tree.selection()
            if not selection:
                messagebox.showwarning("Uyarı", "Lütfen bir müşteri seçin!")
                return
            values = self.customers_tree.item(selection[0])['values']
            customers = self.load_data('customers')
            customer = next((c for c in customers if c['id'].endswith(values[0])), None)
            
        if not customer:
            return
            
        dialog = tk.Toplevel(self.root)
        dialog.title(f"Manuel Borç Ekle - {customer['name']}")
        dialog.geometry("400x250")
        dialog.transient(self.root)
        dialog.grab_set()
        
        # Form
        form_frame = ttk.Frame(dialog)
        form_frame.pack(padx=20, pady=20)
        
        ttk.Label(form_frame, text="Borç Tutarı (₺) *").grid(row=0, column=0, sticky=tk.W, pady=5)
        amount_entry = ttk.Entry(form_frame, width=20)
        amount_entry.grid(row=0, column=1, pady=5)
        amount_entry.focus()
        
        ttk.Label(form_frame, text="Vade Tarihi").grid(row=1, column=0, sticky=tk.W, pady=5)
        due_date_entry = ttk.Entry(form_frame, width=20)
        due_date_entry.grid(row=1, column=1, pady=5)
        due_date_entry.insert(0, (date.today().replace(day=28) if date.today().day < 28 
                                 else date.today().replace(month=date.today().month+1 if date.today().month < 12 else 1,
                                                          day=28)).isoformat())
        
        ttk.Label(form_frame, text="Açıklama *").grid(row=2, column=0, sticky=tk.W, pady=5)
        notes_text = tk.Text(form_frame, width=20, height=4)
        notes_text.grid(row=2, column=1, pady=5)
        
        def save_credit():
            try:
                amount = float(amount_entry.get().replace(',', '.'))
                if amount <= 0:
                    raise ValueError("Geçersiz tutar")
            except ValueError:
                messagebox.showerror("Hata", "Geçerli bir tutar girin!")
                return
                
            notes = notes_text.get("1.0", tk.END).strip()
            if not notes:
                messagebox.showerror("Hata", "Açıklama gerekli!")
                return
                
            credit_sales = self.load_data('credit_sales')
            
            new_credit = {
                "id": f"credit_{len(credit_sales)+1:03d}",
                "customer_id": customer['id'],
                "total_amount": amount,
                "remaining_amount": amount,
                "due_date": due_date_entry.get(),
                "payment_status": "unpaid",
                "notes": notes,
                "created_at": datetime.now().isoformat()
            }
            
            credit_sales.append(new_credit)
            
            if self.save_data('credit_sales', credit_sales):
                messagebox.showinfo("Başarılı", "Manuel borç eklendi!")
                dialog.destroy()
                self.refresh_customers()
            
        # Butonlar
        buttons_frame = ttk.Frame(dialog)
        buttons_frame.pack(pady=20)
        
        ttk.Button(buttons_frame, text="📝 Borç Ekle", command=save_credit).pack(side=tk.LEFT, padx=5)
        ttk.Button(buttons_frame, text="❌ İptal", command=dialog.destroy).pack(side=tk.LEFT)
        
    # === Satış İşlemleri ===
    
    def refresh_sale_combos(self):
        """Satış combobox verilerini yenile"""
        customers = self.load_data('customers')
        customer_names = [f"{c['name']} ({c['id'][-3:]})" for c in customers]
        self.sale_customer['values'] = customer_names
        
        products = self.load_data('products')
        product_names = [f"{p['name']} - ₺{p['price']:.2f}" for p in products]
        self.sale_product['values'] = product_names
        
    def process_sale(self):
        """Satış işlemi"""
        customer_text = self.sale_customer.get()
        product_text = self.sale_product.get()
        
        if not customer_text or not product_text:
            messagebox.showerror("Hata", "Müşteri ve ürün seçimi gerekli!")
            return
            
        try:
            quantity = int(self.sale_quantity.get())
            if quantity <= 0:
                raise ValueError
        except ValueError:
            messagebox.showerror("Hata", "Geçerli bir adet girin!")
            return
            
        # Müşteri ve ürün bilgilerini çıkar
        customer_id = customer_text.split('(')[-1].strip(')')
        customers = self.load_data('customers')
        customer = next((c for c in customers if c['id'].endswith(customer_id)), None)
        
        if not customer:
            messagebox.showerror("Hata", "Müşteri bulunamadı!")
            return
            
        # Ürün fiyatını çıkar
        try:
            price_text = product_text.split('₺')[-1]
            unit_price = float(price_text)
        except:
            messagebox.showerror("Hata", "Ürün fiyatı okunamadı!")
            return
            
        total_amount = unit_price * quantity
        payment_method = self.payment_type.get().lower()
        
        # Satış kaydı oluştur
        if payment_method == "veresiye":
            # Cari hesaba borç ekle
            credit_sales = self.load_data('credit_sales')
            new_credit = {
                "id": f"sale_credit_{len(credit_sales)+1:03d}",
                "customer_id": customer['id'],
                "total_amount": total_amount,
                "remaining_amount": total_amount,
                "due_date": (date.today().replace(day=28)).isoformat(),
                "payment_status": "unpaid",
                "notes": f"Satış: {product_text.split(' - ')[0]} x{quantity}",
                "created_at": datetime.now().isoformat()
            }
            credit_sales.append(new_credit)
            
            if self.save_data('credit_sales', credit_sales):
                messagebox.showinfo("Başarılı", 
                    f"Veresiye satış kaydedildi!\nTutar: ₺{total_amount:.2f}")
                self.refresh_customers()
        else:
            # Nakit/Kart satış
            messagebox.showinfo("Başarılı", 
                f"{payment_method.title()} satış tamamlandı!\nTutar: ₺{total_amount:.2f}")
                
        # Formu temizle
        self.sale_customer.set("")
        self.sale_product.set("")
        self.sale_quantity.set(1)
        self.payment_type.set("Nakit")
        
    # === Raporlar ===
    
    def customer_debt_report(self):
        """Müşteri borç raporu"""
        self.report_text.delete(1.0, tk.END)
        
        customers = self.load_data('customers')
        credit_sales = self.load_data('credit_sales')
        
        self.report_text.insert(tk.END, "🏪 ELITE MEDYA BİLİŞİM - MÜŞTERİ BORÇ RAPORU\n")
        self.report_text.insert(tk.END, f"📅 Rapor Tarihi: {datetime.now().strftime('%d.%m.%Y %H:%M')}\n")
        self.report_text.insert(tk.END, "=" * 60 + "\n\n")
        
        total_debt_all = 0
        
        for customer in customers:
            customer_debt = sum(cs['remaining_amount'] for cs in credit_sales 
                              if cs['customer_id'] == customer['id'] and cs.get('payment_status', 'unpaid') != 'paid')
            
            if customer_debt > 0:
                overdue = any(cs['customer_id'] == customer['id'] and 
                            cs.get('due_date', '') < date.today().isoformat() and
                            cs.get('payment_status', 'unpaid') != 'paid'
                            for cs in credit_sales)
                
                status = "⚠️ VADESİ GEÇMİŞ" if overdue else "📄 Normal"
                
                self.report_text.insert(tk.END, 
                    f"👤 {customer['name']:<25} ₺{customer_debt:>8.2f} {status}\n")
                
                total_debt_all += customer_debt
                
        self.report_text.insert(tk.END, "\n" + "=" * 60 + "\n")
        self.report_text.insert(tk.END, f"💰 TOPLAM BORÇ: ₺{total_debt_all:.2f}\n")
        
    def payment_history_report(self):
        """Ödeme geçmişi raporu"""
        self.report_text.delete(1.0, tk.END)
        
        payments = self.load_data('payments')
        customers = self.load_data('customers')
        
        self.report_text.insert(tk.END, "🏪 ELITE MEDYA BİLİŞİM - ÖDEME GEÇMİŞİ\n")
        self.report_text.insert(tk.END, f"📅 Rapor Tarihi: {datetime.now().strftime('%d.%m.%Y %H:%M')}\n")
        self.report_text.insert(tk.END, "=" * 70 + "\n\n")
        
        # Son 20 ödeme
        recent_payments = sorted(payments, key=lambda x: x.get('created_at', ''), reverse=True)[:20]
        
        self.report_text.insert(tk.END, "Tarih      | Müşteri                | Tutar     | Yöntem\n")
        self.report_text.insert(tk.END, "-" * 70 + "\n")
        
        total_payments = 0
        
        for payment in recent_payments:
            customer = next((c for c in customers if c['id'] == payment['customer_id']), 
                          {'name': 'Bilinmeyen'})
            
            date_str = payment.get('created_at', '')[:10]
            method = payment.get('payment_method', '').replace('_', ' ').title()
            
            self.report_text.insert(tk.END,
                f"{date_str} | {customer['name']:<22} | ₺{payment['amount']:>7.2f} | {method}\n")
            
            total_payments += payment['amount']
            
        self.report_text.insert(tk.END, "\n" + "=" * 70 + "\n")
        self.report_text.insert(tk.END, f"💰 TOPLAM ÖDEME: ₺{total_payments:.2f}\n")
        
    def summary_report(self):
        """Özet rapor"""
        self.report_text.delete(1.0, tk.END)
        
        customers = self.load_data('customers')
        credit_sales = self.load_data('credit_sales')
        payments = self.load_data('payments')
        
        # İstatistikler
        total_customers = len(customers)
        total_debt = sum(cs['remaining_amount'] for cs in credit_sales if cs.get('payment_status', 'unpaid') != 'paid')
        total_payments = sum(p['amount'] for p in payments)
        
        overdue_count = len(set(cs['customer_id'] for cs in credit_sales 
                               if cs.get('due_date', '') < date.today().isoformat() and
                               cs.get('payment_status', 'unpaid') != 'paid'))
        
        self.report_text.insert(tk.END, "🏪 ELITE MEDYA BİLİŞİM - ÖZET RAPOR\n")
        self.report_text.insert(tk.END, f"📅 Rapor Tarihi: {datetime.now().strftime('%d.%m.%Y %H:%M')}\n")
        self.report_text.insert(tk.END, "=" * 50 + "\n\n")
        
        self.report_text.insert(tk.END, "📊 SİSTEM İSTATİSTİKLERİ:\n")
        self.report_text.insert(tk.END, f"👥 Toplam Müşteri: {total_customers}\n")
        self.report_text.insert(tk.END, f"💰 Toplam Borç: ₺{total_debt:.2f}\n")
        self.report_text.insert(tk.END, f"💳 Toplam Ödeme: ₺{total_payments:.2f}\n")
        self.report_text.insert(tk.END, f"🚨 Vadesi Geçmiş: {overdue_count} müşteri\n\n")
        
        self.report_text.insert(tk.END, "📈 FİNANSAL DURUM:\n")
        net_position = total_payments - total_debt
        if net_position >= 0:
            self.report_text.insert(tk.END, f"✅ Net Pozisyon: ₺{net_position:.2f} (İyi)\n")
        else:
            self.report_text.insert(tk.END, f"⚠️ Net Pozisyon: ₺{net_position:.2f} (Takip Gerekli)\n")
            
        self.report_text.insert(tk.END, f"\n📍 Veri Konumu: {self.data_path}\n")
        
    # === Yedekleme ===
    
    def export_data(self):
        """Verileri dışa aktar"""
        filename = filedialog.asksaveasfilename(
            title="Yedek Dosyası Kaydet",
            defaultextension=".json",
            filetypes=[("JSON Dosyası", "*.json")],
            initialname=f"elite-pos-backup-{datetime.now().strftime('%Y%m%d-%H%M')}.json"
        )
        
        if not filename:
            return
            
        try:
            backup_data = {
                "export_date": datetime.now().isoformat(),
                "version": "1.0",
                "system": "Elite Medya POS Portable",
                "data": {}
            }
            
            # Tüm veri dosyalarını yedekle
            for data_type in ['customers', 'products', 'credit_sales', 'payments', 'settings']:
                backup_data["data"][data_type] = self.load_data(data_type)
                
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(backup_data, f, ensure_ascii=False, indent=2, default=str)
                
            messagebox.showinfo("Başarılı", f"Veriler başarıyla dışa aktarıldı:\n{filename}")
            
        except Exception as e:
            messagebox.showerror("Hata", f"Dışa aktarma hatası: {e}")
            
    def import_data(self):
        """Verileri içe aktar"""
        if not messagebox.askyesno("Onay", 
                                  "⚠️ Bu işlem mevcut tüm verileri siler!\n\nDevam etmek istediğinizden emin misiniz?"):
            return
            
        filename = filedialog.askopenfilename(
            title="Yedek Dosyası Seç",
            filetypes=[("JSON Dosyası", "*.json")]
        )
        
        if not filename:
            return
            
        try:
            with open(filename, 'r', encoding='utf-8') as f:
                backup_data = json.load(f)
                
            if 'data' not in backup_data:
                raise ValueError("Geçersiz yedek dosyası formatı!")
                
            # Verileri geri yükle
            imported_count = 0
            for data_type, data in backup_data['data'].items():
                if data_type in self.files:
                    self.save_data(data_type, data)
                    imported_count += len(data) if isinstance(data, list) else 1
                    
            messagebox.showinfo("Başarılı", 
                               f"Veriler başarıyla içe aktarıldı!\n\nToplam {imported_count} kayıt yüklendi.")
            
            # Arayüzü yenile
            self.refresh_customers()
            self.refresh_sale_combos()
            
        except Exception as e:
            messagebox.showerror("Hata", f"İçe aktarma hatası: {e}")
            
    def edit_customer_dialog(self):
        """Müşteri düzenleme (basit implementasyon)"""
        messagebox.showinfo("Bilgi", "Düzenleme özelliği gelecek versiyonda eklenecek.")
        
    def on_closing(self):
        """Uygulama kapanırken"""
        if messagebox.askokcancel("Çıkış", "Elite Medya POS'tan çıkmak istediğinizden emin misiniz?"):
            self.root.destroy()
            
    def run(self):
        """Uygulamayı başlat"""
        self.root.mainloop()

def main():
    """Ana fonksiyon"""
    try:
        # High DPI desteği (Windows 10+)
        from ctypes import windll
        windll.shcore.SetProcessDpiAwareness(1)
    except:
        pass
        
    app = ElitePOS()
    app.run()

if __name__ == "__main__":
    main()