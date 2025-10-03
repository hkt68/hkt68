#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Elite Medya Bilişim POS - Portable Windows Application
Modern arayüz, kurulum gerektirmez
"""

import customtkinter as ctk
import tkinter as tk
from tkinter import messagebox, filedialog
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
        self.root = tk.Tk()
        self.setup_window()
        self.setup_data()
        self.create_widgets()
        
    def setup_window(self):
        """Ana pencere ayarları"""
        self.root.title("Elite Medya Bilişim POS v1.0")
        self.root.geometry("1200x700")
        self.root.minsize(1000, 600)
        
        # Icon (opsiyonel)
        try:
            if getattr(sys, 'frozen', False):
                # PyInstaller bundle
                base_path = sys._MEIPASS
            else:
                base_path = os.path.dirname(__file__)
            icon_path = os.path.join(base_path, 'icon.ico')
            if os.path.exists(icon_path):
                self.root.iconbitmap(icon_path)
        except:
            pass
            
        # Modern tema
        style = ttk.Style()
        style.theme_use('clam')
        
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
                "version": "1.0"
            }
            self.save_data('settings', settings)
            
    def create_widgets(self):
        """Ana arayüzü oluştur"""
        # Ana frame
        main_frame = ttk.Frame(self.root)
        main_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # Üst başlık
        header_frame = ttk.Frame(main_frame)
        header_frame.pack(fill=tk.X, pady=(0, 10))
        
        title_label = ttk.Label(
            header_frame, 
            text="🏪 Elite Medya Bilişim POS", 
            font=("Arial", 16, "bold")
        )
        title_label.pack(side=tk.LEFT)
        
        version_label = ttk.Label(
            header_frame,
            text="v1.0 Portable",
            font=("Arial", 9),
            foreground="gray"
        )
        version_label.pack(side=tk.RIGHT)
        
        # Notebook (sekmeler)
        self.notebook = ttk.Notebook(main_frame)
        self.notebook.pack(fill=tk.BOTH, expand=True)
        
        # Sekmeler oluştur
        self.create_customers_tab()
        self.create_sales_tab()
        self.create_reports_tab()
        self.create_backup_tab()
        
        # Alt durum çubuğu
        status_frame = ttk.Frame(main_frame)
        status_frame.pack(fill=tk.X, pady=(10, 0))
        
        self.status_label = ttk.Label(
            status_frame,
            text=f"📅 {datetime.now().strftime('%d.%m.%Y')} | 💾 Data: {self.data_path}",
            font=("Arial", 8)
        )
        self.status_label.pack(side=tk.LEFT)
        
        # Sağ alt köşe
        info_label = ttk.Label(
            status_frame,
            text="Portable POS - Kurulum Gerektirmez",
            font=("Arial", 8),
            foreground="blue"
        )
        info_label.pack(side=tk.RIGHT)
        
    def create_customers_tab(self):
        """Müşteriler sekmesi"""
        customers_frame = ttk.Frame(self.notebook)
        self.notebook.add(customers_frame, text="👥 Müşteriler")
        
        # Üst butonlar
        buttons_frame = ttk.Frame(customers_frame)
        buttons_frame.pack(fill=tk.X, padx=5, pady=5)
        
        ttk.Button(
            buttons_frame,
            text="➕ Yeni Müşteri",
            command=self.new_customer_dialog
        ).pack(side=tk.LEFT, padx=(0, 5))
        
        ttk.Button(
            buttons_frame,
            text="🔄 Yenile",
            command=self.refresh_customers
        ).pack(side=tk.LEFT)
        
        # Arama
        search_frame = ttk.Frame(buttons_frame)
        search_frame.pack(side=tk.RIGHT)
        
        ttk.Label(search_frame, text="🔍 Ara:").pack(side=tk.LEFT)
        self.customer_search = ttk.Entry(search_frame, width=20)
        self.customer_search.pack(side=tk.LEFT, padx=(5, 0))
        self.customer_search.bind('<KeyRelease>', self.filter_customers)
        
        # Müşteri listesi
        columns = ("ID", "İsim", "Telefon", "Borç", "Durum")
        self.customers_tree = ttk.Treeview(customers_frame, columns=columns, show="headings", height=15)
        
        # Kolon başlıkları
        self.customers_tree.heading("ID", text="ID")
        self.customers_tree.heading("İsim", text="Müşteri Adı")
        self.customers_tree.heading("Telefon", text="Telefon")
        self.customers_tree.heading("Borç", text="Toplam Borç")
        self.customers_tree.heading("Durum", text="Durum")
        
        # Kolon genişlikleri
        self.customers_tree.column("ID", width=80)
        self.customers_tree.column("İsim", width=200)
        self.customers_tree.column("Telefon", width=120)
        self.customers_tree.column("Borç", width=100)
        self.customers_tree.column("Durum", width=100)
        
        self.customers_tree.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        
        # Scrollbar
        scrollbar = ttk.Scrollbar(customers_frame, orient=tk.VERTICAL, command=self.customers_tree.yview)
        self.customers_tree.configure(yscrollcommand=scrollbar.set)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        
        # Sağ tık menü
        self.customers_tree.bind("<Button-3>", self.customer_context_menu)
        self.customers_tree.bind("<Double-1>", self.customer_account_details)
        
        # Veriyi yükle
        self.refresh_customers()
        
    def create_sales_tab(self):
        """Satış sekmesi (basit)"""
        sales_frame = ttk.Frame(self.notebook)
        self.notebook.add(sales_frame, text="🛒 Satış")
        
        # Basit satış formu
        form_frame = ttk.LabelFrame(sales_frame, text="Hızlı Satış", padding=10)
        form_frame.pack(fill=tk.X, padx=10, pady=10)
        
        # Müşteri seçimi
        ttk.Label(form_frame, text="Müşteri:").grid(row=0, column=0, sticky=tk.W, pady=2)
        self.sale_customer = ttk.Combobox(form_frame, width=30)
        self.sale_customer.grid(row=0, column=1, sticky=tk.EW, pady=2)
        
        # Ürün seçimi
        ttk.Label(form_frame, text="Ürün:").grid(row=1, column=0, sticky=tk.W, pady=2)
        self.sale_product = ttk.Combobox(form_frame, width=30)
        self.sale_product.grid(row=1, column=1, sticky=tk.EW, pady=2)
        
        # Miktar
        ttk.Label(form_frame, text="Adet:").grid(row=2, column=0, sticky=tk.W, pady=2)
        self.sale_quantity = ttk.Spinbox(form_frame, from_=1, to=100, width=10)
        self.sale_quantity.grid(row=2, column=1, sticky=tk.W, pady=2)
        self.sale_quantity.set(1)
        
        # Ödeme türü
        ttk.Label(form_frame, text="Ödeme:").grid(row=3, column=0, sticky=tk.W, pady=2)
        self.payment_type = ttk.Combobox(form_frame, values=["Nakit", "Kart", "Veresiye"], width=15)
        self.payment_type.grid(row=3, column=1, sticky=tk.W, pady=2)
        self.payment_type.set("Nakit")
        
        # Satış butonu
        ttk.Button(
            form_frame,
            text="💰 Satış Yap",
            command=self.process_sale
        ).grid(row=4, column=0, columnspan=2, pady=10)
        
        # Grid ayarları
        form_frame.columnconfigure(1, weight=1)
        
        # Combobox verilerini yükle
        self.refresh_sale_combos()
        
    def create_reports_tab(self):
        """Raporlar sekmesi"""
        reports_frame = ttk.Frame(self.notebook)
        self.notebook.add(reports_frame, text="📊 Raporlar")
        
        # Rapor butonları
        buttons_frame = ttk.Frame(reports_frame)
        buttons_frame.pack(pady=20)
        
        ttk.Button(
            buttons_frame,
            text="👥 Müşteri Borç Raporu",
            command=self.customer_debt_report,
            width=25
        ).pack(pady=5)
        
        ttk.Button(
            buttons_frame,
            text="💰 Ödeme Geçmişi",
            command=self.payment_history_report,
            width=25
        ).pack(pady=5)
        
        ttk.Button(
            buttons_frame,
            text="📈 Özet Rapor",
            command=self.summary_report,
            width=25
        ).pack(pady=5)
        
        # Rapor gösterim alanı
        self.report_text = tk.Text(reports_frame, height=20, font=("Courier", 10))
        self.report_text.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
    def create_backup_tab(self):
        """Yedekleme sekmesi"""
        backup_frame = ttk.Frame(self.notebook)
        self.notebook.add(backup_frame, text="💾 Yedekleme")
        
        # Yedekleme işlemleri
        backup_buttons = ttk.Frame(backup_frame)
        backup_buttons.pack(pady=50)
        
        ttk.Label(
            backup_buttons,
            text="💾 Veri Yedekleme İşlemleri",
            font=("Arial", 14, "bold")
        ).pack(pady=20)
        
        ttk.Button(
            backup_buttons,
            text="📤 Verileri Dışa Aktar",
            command=self.export_data,
            width=30
        ).pack(pady=10)
        
        ttk.Button(
            backup_buttons,
            text="📥 Verileri İçe Aktar",
            command=self.import_data,
            width=30
        ).pack(pady=5)
        
        # Bilgi
        info_frame = ttk.Frame(backup_frame)
        info_frame.pack(pady=30)
        
        info_text = """ℹ️ Yedekleme Bilgileri:

• Dışa Aktar: Tüm verilerinizi JSON dosyası olarak kaydeder
• İçe Aktar: Önceden kaydedilmiş verileri geri yükler
• Veriler: {data_path}
• Güvenli ve taşınabilir format""".format(data_path=self.data_path)
        
        ttk.Label(
            info_frame,
            text=info_text,
            justify=tk.LEFT,
            font=("Arial", 9)
        ).pack()
        
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
        dialog = tk.Toplevel(self.root)
        dialog.title("Yeni Müşteri")
        dialog.geometry("400x350")
        dialog.transient(self.root)
        dialog.grab_set()
        
        # Form alanları
        ttk.Label(dialog, text="Müşteri Adı *").grid(row=0, column=0, sticky=tk.W, padx=10, pady=5)
        name_entry = ttk.Entry(dialog, width=30)
        name_entry.grid(row=0, column=1, padx=10, pady=5)
        name_entry.focus()
        
        ttk.Label(dialog, text="Telefon").grid(row=1, column=0, sticky=tk.W, padx=10, pady=5)
        phone_entry = ttk.Entry(dialog, width=30)
        phone_entry.grid(row=1, column=1, padx=10, pady=5)
        
        ttk.Label(dialog, text="E-posta").grid(row=2, column=0, sticky=tk.W, padx=10, pady=5)
        email_entry = ttk.Entry(dialog, width=30)
        email_entry.grid(row=2, column=1, padx=10, pady=5)
        
        ttk.Label(dialog, text="Adres").grid(row=3, column=0, sticky=tk.W, padx=10, pady=5)
        address_text = tk.Text(dialog, width=25, height=3)
        address_text.grid(row=3, column=1, padx=10, pady=5)
        
        ttk.Label(dialog, text="Kredi Limiti").grid(row=4, column=0, sticky=tk.W, padx=10, pady=5)
        credit_entry = ttk.Entry(dialog, width=30)
        credit_entry.grid(row=4, column=1, padx=10, pady=5)
        credit_entry.insert(0, "5000.00")
        
        ttk.Label(dialog, text="Notlar").grid(row=5, column=0, sticky=tk.W, padx=10, pady=5)
        notes_text = tk.Text(dialog, width=25, height=2)
        notes_text.grid(row=5, column=1, padx=10, pady=5)
        
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
                "address": address_text.get("1.0", tk.END).strip(),
                "credit_limit": float(credit_entry.get() or 0),
                "notes": notes_text.get("1.0", tk.END).strip(),
                "created_at": datetime.now().isoformat()
            }
            
            customers.append(new_customer)
            
            if self.save_data('customers', customers):
                messagebox.showinfo("Başarılı", "Müşteri eklendi!")
                dialog.destroy()
                self.refresh_customers()
                self.refresh_sale_combos()
            
        # Butonlar
        buttons_frame = ttk.Frame(dialog)
        buttons_frame.grid(row=6, column=0, columnspan=2, pady=20)
        
        ttk.Button(buttons_frame, text="💾 Kaydet", command=save_customer).pack(side=tk.LEFT, padx=5)
        ttk.Button(buttons_frame, text="❌ İptal", command=dialog.destroy).pack(side=tk.LEFT)
        
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
        customer_id = f"cust_{values[0]}"  # ID'yi geri çevir
        
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