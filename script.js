/**
 * Fungsi ini mensimulasikan penambahan produk ke keranjang.
 * Dalam implementasi website sebenarnya (e-commerce), 
 * fungsi ini akan terhubung ke backend untuk mengelola sesi belanja.
 * @param {string} productName - Nama produk yang ditambahkan.
 */
function addToCart(productName) {
    console.log("Produk berhasil ditambahkan:", productName);
    
    // Memberikan feedback visual ke pengguna
    alert("Produk '" + productName + "' berhasil ditambahkan ke keranjang virtual.");
    
    // Di sini Anda bisa menambahkan logika seperti:
    // - Menghitung total item
    // - Mengubah ikon keranjang belanja
    // - Mengarahkan ke halaman checkout
}

// Anda bisa menambahkan fungsionalitas lain di sini, 
// seperti slider untuk testimoni (membutuhkan library tambahan atau kode JS yang lebih kompleks)
