document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-menu a');
    const header = document.querySelector('header');
    
    // Asumsi nomor WhatsApp (NOMOR BARU)
    const waNumber = '6285117788355'; 
    
    // State untuk Keranjang Satuan
    let satuanCart = []; 
    
    // Daftar Produk Statis - DISESUAIKAN DENGAN TEMA BARU
    const SATUAN_PRODUCTS = [
        { id: 1, name: "Sketsa Rune Arsitektural (2D)", price: 15000, unit: 'm²' },
        { id: 2, name: "Visualisasi Alam 3D (Eksterior)", price: 15000, unit: 'm²' },
        { id: 3, name: "Manuskrip Anggaran (RAB)", price: 20000, unit: 'm²' },
        { id: 4, name: "Visualisasi Interior Aula Raja", price: 15000, unit: 'm²' },
        { id: 5, name: "Sketsa Desain Furnitur Kustom", price: 0, unit: 'Konsultasi Dewan Tetua' },
        { id: 6, name: "Jasa Peta Digital (Desain Web)", price: 0, unit: 'Konsultasi Dewan Tetua' }
    ];

    // Elemen DOM Satuan
    const satuanItems = document.querySelectorAll('.satuan-item');
    const cartListElement = document.getElementById('satuanCartList');
    const totalBiayaSpan = document.getElementById('hasilSatuanBiaya');
    const waButton = document.getElementById('hitungSatuanBiaya');
    const volumeNoteElement = document.getElementById('volumeNote'); 

    // =====================================================
    // Fungsi Pembantu
    // =====================================================
    function formatRupiah(angka) {
        if (angka === 0) return 'Rp 0';
        const rupiah = new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(angka);
        return rupiah;
    }

    function generateWaLink(message) {
        let cleanNumber = waNumber.replace(/^0|[^0-9]/g, ''); 
        if (!cleanNumber.startsWith('62')) {
            cleanNumber = '62' + cleanNumber;
        }
        const encodedMessage = encodeURIComponent(message);
        return `https://wa.me/${cleanNumber}?text=${encodedMessage}`;
    }

    function getProductById(id) {
        return SATUAN_PRODUCTS.find(p => p.id === id);
    }
    
    // =====================================================
    // Logika Keranjang Satuan
    // =====================================================

    // FUNGSI TOGGLE: Menambahkan atau menghapus item dari keranjang dengan satu klik
    function toggleCartItem(productId) {
        const id = parseInt(productId);
        const product = getProductById(id);
        const existingIndex = satuanCart.findIndex(item => item.productId === id);
        const itemCard = document.querySelector(`.satuan-item[data-id="${id}"]`);

        if (existingIndex !== -1) {
            satuanCart.splice(existingIndex, 1);
            if (itemCard) itemCard.classList.remove('in-cart');
        } else {
            if (!product) return;
            satuanCart.push({
                productId: id,
                volume: (product.price > 0 ? 100 : 1), 
                product: product 
            });
            if (itemCard) itemCard.classList.add('in-cart');
        }
        
        renderCart();
    }
    
    function removeFromCart(productId) {
        const id = parseInt(productId);
        satuanCart = satuanCart.filter(item => item.productId !== id);
        
        const itemCard = document.querySelector(`.satuan-item[data-id="${id}"]`);
        if (itemCard) itemCard.classList.remove('in-cart');

        renderCart();
    }
    
    function updateCartVolume(productId, newVolume) {
        const id = parseInt(productId);
        const item = satuanCart.find(i => i.productId === id);
        
        if (item && item.product.price > 0) {
            item.volume = Math.max(1, newVolume); 
            updateCartTotal();
        }
    }
    
    function updateCartTotal() {
        let totalCost = 0;
        let hasPayableItem = false; 

        satuanCart.forEach(item => {
            if (item.product.price > 0 && item.volume > 0) {
                totalCost += item.product.price * item.volume;
                hasPayableItem = true;
            }
        });

        totalBiayaSpan.textContent = formatRupiah(totalCost);
        
        if (satuanCart.length === 0) {
             waButton.textContent = "Pilih Manuskrip ke Peti Harta Karun"; 
             waButton.disabled = true;
             if (volumeNoteElement) volumeNoteElement.style.display = 'none'; 
        } else {
             waButton.disabled = false;
             if (hasPayableItem) {
                waButton.textContent = `Pesan ${satuanCart.length} Manuskrip via Juru Tulis`; 
                if (volumeNoteElement) volumeNoteElement.style.display = 'block'; 
             } else {
                waButton.textContent = `Ajukan Konsultasi ${satuanCart.length} Mantra via Juru Tulis`; 
                if (volumeNoteElement) volumeNoteElement.style.display = 'none'; 
             }
        }
    }

    function renderCart() {
        if (satuanCart.length === 0) {
            cartListElement.innerHTML = '<p class="cart-empty-message">Peti harta karun kosong. Pilih mantra dari katalog di atas.</p>'; 
        } else {
            let html = '';
            satuanCart.forEach(item => {
                const isConsultation = item.product.price === 0;
                
                html += `
                    <div class="cart-item" data-id="${item.productId}">
                        <div class="cart-item-info">
                            <span class="cart-item-name">${item.product.name}</span>
                            <span class="cart-item-price-m2">${isConsultation ? item.product.unit : formatRupiah(item.product.price) + '/' + item.product.unit}</span>
                        </div>
                        <div class="cart-item-controls">
                            ${isConsultation ? 
                                `<span class="cart-total-price">DEWAN TETUA</span>` : 
                                `<input type="number" min="1" value="${item.volume}" class="cart-item-input" data-id="${item.productId}" placeholder="m²">
                                <span class="cart-total-price">${item.product.unit}</span>`
                            }
                            <button class="cart-item-remove-btn" data-id="${item.productId}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `;
            });
            cartListElement.innerHTML = html;
        }
        updateCartTotal();
    }
    
    // =====================================================
    // Event Listeners Keranjang Satuan
    // =====================================================

    satuanItems.forEach(item => {
        item.addEventListener('click', function() {
            const productId = this.getAttribute('data-id');
            toggleCartItem(productId);
        });
    });

    cartListElement.addEventListener('change', function(e) {
        if (e.target.classList.contains('cart-item-input')) {
            const id = e.target.getAttribute('data-id');
            const newVolume = Math.round(parseFloat(e.target.value)); 
            
            if (!isNaN(newVolume) && newVolume >= 1) {
                updateCartVolume(id, newVolume);
            } else {
                const currentItem = satuanCart.find(i => i.productId == id);
                e.target.value = currentItem ? currentItem.volume : 1; 
                alert("Mohon masukkan nominal area tanah (m²) yang benar (angka positif)."); 
            }
        }
    });

    cartListElement.addEventListener('click', function(e) {
        if (e.target.closest('.cart-item-remove-btn')) {
            const button = e.target.closest('.cart-item-remove-btn');
            const id = button.getAttribute('data-id');
            removeFromCart(id);
        }
    });
    
    waButton.addEventListener('click', function() {
        if (satuanCart.length === 0) return;

        let message = "Halo The Ryuu Realm, saya ingin memesan Manuskrip Satuan berikut:\n\n"; 
        let hasPayable = false;
        let totalCost = 0;

        satuanCart.forEach((item, index) => {
            const product = item.product;
            const isConsultation = product.price === 0;
            const subtotal = product.price * item.volume;
            
            if (isConsultation) {
                message += `${index + 1}. ${product.name} (Perlu Konsultasi Dana)\n`; 
            } else {
                message += `${index + 1}. ${product.name} - ${item.volume} ${product.unit} (Est. ${formatRupiah(subtotal)})\n`;
                totalCost += subtotal;
                hasPayable = true;
            }
        });

        if (hasPayable) {
            message += `\nTotal Estimasi Dana: ${formatRupiah(totalCost)}`; 
        } else {
             message = "Halo The Ryuu Realm, saya ingin mengajukan Konsultasi Dewan Tetua untuk layanan:\n" + satuanCart.map(item => `- ${item.product.name}`).join('\n'); 
        }

        window.open(generateWaLink(message), '_blank');
    });

    // =====================================================
    // Logika Lain (Non-Satuan)
    // =====================================================
    
    // 1. Fungsi Menu Mobile (Hamburger)
    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
        });
    }

    // 2. Tutup Menu saat Link Diklik (di Mobile)
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (navMenu.classList.contains('active')) {
                 navMenu.classList.remove('active');
            }
        });
    });
    
    // 3. Efek Header Dinamis saat Scroll
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // 4. Logika Kalkulator Harga Paket (Existing)
    const luasAreaInput = document.getElementById('luasArea');
    const paketDesainSelect = document.getElementById('paketDesain');
    const hitungBiayaBtn = document.getElementById('hitungBiaya');
    const hasilBiayaSpan = document.getElementById('hasilBiaya');

    function hitungEstimasiPaket() {
        const luasArea = parseFloat(luasAreaInput.value);
        const hargaPerM2 = parseFloat(paketDesainSelect.value);
        
        if (isNaN(luasArea) || luasArea <= 0) {
            hasilBiayaSpan.textContent = "Masukkan Luas Area Tanah yang valid."; 
            return;
        }

        const totalBiaya = luasArea * hargaPerM2;
        hasilBiayaSpan.textContent = formatRupiah(totalBiaya);
    }
    
    hitungEstimasiPaket(); 

    // Event listener untuk tombol hitung/pesan Paket
    hitungBiayaBtn.addEventListener('click', function() {
        const luasArea = parseFloat(luasAreaInput.value);
        const hargaPerM2 = parseFloat(paketDesainSelect.value);
        const paketNama = paketDesainSelect.options[paketDesainSelect.selectedIndex].getAttribute('data-name');
        
        if (isNaN(luasArea) || luasArea <= 0) {
            alert("Mohon masukkan Luas Area Total yang valid.");
            return;
        }

        const totalBiaya = luasArea * hargaPerM2;
        const message = `Halo The Ryuu Realm, saya ingin memesan:\n- Piagam: ${paketNama}\n- Luas Area: ${luasArea} m²\n- Estimasi Dana: ${formatRupiah(totalBiaya)}`; 
        
        window.open(generateWaLink(message), '_blank');
    });

    luasAreaInput.addEventListener('input', hitungEstimasiPaket);
    paketDesainSelect.addEventListener('change', hitungEstimasiPaket);
    
    // 5. WA Contact Links Handler 
    const waContactLinks = document.querySelectorAll('.wa-contact-link');
    waContactLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const defaultMessage = "Halo The Ryuu Realm, saya tertarik dengan Layanan Rune Anda dan ingin berkonsultasi dengan Dewan Tetua."; 
            window.open(generateWaLink(defaultMessage), '_blank');
        });
    });
    
    // =====================================================
    // 6. Scroll Reveal Animation (EFEK GULUNGAN TERBUKA)
    // =====================================================
    const revealSections = document.querySelectorAll('.reveal-section');

    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.15 
    };

    const observer = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target); 
        }
      });
    }, observerOptions);

    revealSections.forEach(section => {
      observer.observe(section);
    });
    
    // Initial call for Satuan Cart
    renderCart();
});
