<?php
// Pastikan script hanya dijalankan jika ada data POST yang dikirim
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    
    // --- 1. Ambil dan Bersihkan Data dari Formulir ---
    
    // Menggunakan operator null coalescing (??) untuk menangani kasus jika input hilang
    $product_name = htmlspecialchars($_POST['product_name'] ?? 'Tidak Diketahui');
    $customer_name = htmlspecialchars($_POST['customer_name'] ?? '');
    $phone_number = htmlspecialchars($_POST['phone_number'] ?? '');
    $delivery_address = htmlspecialchars($_POST['delivery_address'] ?? '');
    $quantity = (int)($_POST['quantity'] ?? 1);
    $price_unit = (int)($_POST['price'] ?? 0);
    
    // Validasi dasar
    if (empty($customer_name) || empty($phone_number) || empty($delivery_address) || $quantity < 1 || $price_unit <= 0) {
        die("Error: Data wajib (Nama, Telp, Alamat, Kuantitas) tidak lengkap atau tidak valid.");
    }
    
    // --- 2. Hitung Total Harga ---
    $total_price = $quantity * $price_unit;
    
    // --- 3. Format Data untuk Penyimpanan/Log ---
    $timestamp = date("Y-m-d H:i:s");
    $log_data = "======================= PESANAN BARU =======================\n";
    $log_data .= "Waktu Pesanan: " . $timestamp . "\n";
    $log_data .= "Produk: " . $product_name . "\n";
    $log_data .= "Kuantitas: " . $quantity . " pcs\n";
    $log_data .= "Harga Satuan: Rp " . number_format($price_unit, 0, ',', '.') . "\n";
    $log_data .= "TOTAL HARGA: Rp " . number_format($total_price, 0, ',', '.') . "\n";
    $log_data .= "--------------------------------------------------------\n";
    $log_data .= "Nama Pelanggan: " . $customer_name . "\n";
    $log_data .= "No. HP/WA: " . $phone_number . "\n";
    $log_data .= "Alamat Kirim: " . $delivery_address . "\n";
    $log_data .= "========================================================\n\n";

    // --- 4. Simpan Data ke Log File (order_log.txt) ---
    $file = 'order_log.txt';
    // FILE_APPEND: Menambahkan data ke akhir file. LOCK_EX: Mengunci file saat menulis.
    if (file_put_contents($file, $log_data, FILE_APPEND | LOCK_EX) !== false) {
        
        // --- 5. Tampilkan Konfirmasi Sukses ---
        echo "
        <!DOCTYPE html>
        <html lang='id'>
        <head>
            <meta charset='UTF-8'>
            <title>Pesanan Berhasil</title>
            <link rel='stylesheet' href='style.css'>
            <style>
                /* Gaya khusus untuk halaman sukses */
                .success-message {
                    text-align: center;
                    padding: 50px;
                    border: 1px solid #2ecc71;
                    background-color: #e6ffe6;
                    border-radius: 10px;
                    margin-top: 50px;
                    box-shadow: 0 4px 10px rgba(46, 204, 113, 0.2);
                }
                .success-message h1 { 
                    color: #2ecc71; 
                    font-size: 2.5em;
                }
                .success-message p {
                    margin-bottom: 10px;
                }
            </style>
        </head>
        <body>
            <div class='container' style='max-width: 800px;'>
                <div class='success-message'>
                    <h1>✅ Pesanan Berhasil Dibuat!</h1>
                    <p>Terima kasih, <strong>" . $customer_name . "</strong>.</p>
                    <p>Pesanan Anda **{$product_name}** ({$quantity} pcs) telah kami terima.</p>
                    <p><strong>Total Sementara (Belum Termasuk Ongkir): Rp " . number_format($total_price, 0, ',', '.') . "</strong></p>
                    <p>Kami akan segera menghubungi Anda melalui WhatsApp di nomor <strong>{$phone_number}</strong> dalam 1x24 jam untuk konfirmasi dan biaya pengiriman.</p>
                    <a href='index.html' class='cta-button' style='margin-top: 30px;'>Kembali ke Beranda</a>
                </div>
            </div>
        </body>
        </html>
        ";
        
    } else {
        // Jika gagal menulis ke file
        echo "Error: Gagal menyimpan data pesanan. Mohon coba lagi atau hubungi admin langsung.";
    }

} else {
    // Jika diakses langsung tanpa submit form
    // Redirect ke halaman utama
    header("Location: index.html");
    exit();
}
?>
