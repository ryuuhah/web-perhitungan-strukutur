// Variabel global untuk grafik
let momentChart;

// --- KONSTANTA SNI ---
const DENSITY_CONCRETE = 24; // kN/m3 (SNI 1727:2020)
const PHI_FLEXURE = 0.9;     // Faktor reduksi kekuatan lentur (SNI 2847:2019)
const t_plat = 0.12;         // Asumsi tebal plat 120mm

// Mendapatkan nilai dari input
const getInputValue = (id) => parseFloat(document.getElementById(id).value);

// --- FUNGSI UTAMA: MENGAMBIL INPUT DAN MENAMPILKAN HASIL ---
function hitungStruktur() {
    try {
        // A. Ambil semua input
        const L = getInputValue('bentang_L');
        const H = getInputValue('tinggi_H');
        const W_nonstruktur = getInputValue('W_nonstruktur');
        const Load_live = getInputValue('Load_live');
        const fc_prime = getInputValue('fc_prime');
        const fy = getInputValue('fy');
        const P_ult = getInputValue('P_ult');
        const q_allow = getInputValue('q_allow');
        const B_fondasi = getInputValue('B_fondasi');
        const L_fondasi = getInputValue('L_fondasi');
        
        // Cek validitas input (sederhana)
        if (isNaN(L) || isNaN(Load_live) || isNaN(fc_prime) || isNaN(P_ult)) {
            document.getElementById('results-container').innerHTML = '<div class="alert alert-danger">Mohon isi semua kolom input dengan angka yang valid.</div>';
            return;
        }

        // 1. Perhitungan Pembebanan
        const beban = hitungPembebanan(L, H, W_nonstruktur, Load_live);
        
        // Beban Balok Terfaktor (menggabungkan beban plat dan berat sendiri balok)
        let q_u_balok = beban.U_max_gravitasi * L / 2;
        q_u_balok += beban.W_dead_balok;
        
        // 2 & 3. Analisis & Desain Balok
        const desain = hitungDesainBalok(q_u_balok, L, fc_prime, fy);
        
        // 4. Perhitungan Fondasi
        const fondasi = hitungKapasitasFondasi(P_ult, q_allow, B_fondasi, L_fondasi);

        // Menampilkan hasil dan Visualisasi
        tampilkanHasil({ beban, desain, fondasi, q_u_balok, L });

    } catch (error) {
        document.getElementById('results-container').innerHTML = `<div class="alert alert-danger">Terjadi kesalahan perhitungan: ${error.message}</div>`;
    }
}

// --- MODUL 1: PERHITUNGAN PEMBEBANAN ---
function hitungPembebanan(L, H, W_nonstruktur, Load_live) {
    const b_balok = 0.3; 
    const h_balok = 0.5; 
    
    const W_dead_balok = DENSITY_CONCRETE * b_balok * h_balok;
    const W_dead_plat = DENSITY_CONCRETE * t_plat;            

    const W_dead_total = W_dead_plat + W_nonstruktur; 
    const W_live = Load_live; 

    // Beban Gempa (Sederhana)
    const Cs = 0.10; 
    const W_seismic = (W_dead_total * L * L) + (0.25 * W_live * L * L);
    const V_gempa_total = Cs * W_seismic; 

    // Kombinasi Gravitasi Terburuk (U = 1.2D + 1.6L)
    const U_max_gravitasi = (1.2 * W_dead_total) + (1.6 * W_live);
    
    return {
        W_dead_balok,
        W_dead_plat,
        W_live,
        V_gempa_total,
        U_max_gravitasi
    };
}

// --- MODUL 2 & 3: ANALISIS & DESAIN ELEMEN ---
function hitungDesainBalok(q_u, L, fc_prime, fy) {
    // Analisis: Momen Ultimate (Asumsi balok jepit-jepit)
    const Mu_negatif = -1 * q_u * (L ** 2) / 12; // Tumpuan
    const Mu_positif = q_u * (L ** 2) / 24;      // Tengah Bentang
    const Mu_design = Math.abs(Mu_negatif);       // Momen desain terbesar

    // Desain: Luas Tulangan Perlu (As)
    const d = 0.45; // m
    const b = 0.30; // m
    
    // Mencari rho_min (SNI 2847:2019)
    const rho_min = Math.max(0.25 * Math.sqrt(fc_prime) / fy, 1.4 / fy);

    // Menghitung Luas Tulangan Perlu (As)
    const Mu_Newton = Mu_design * 1000000; // kN.m ke N.mm
    const b_mm = b * 1000;
    const d_mm = d * 1000;
    
    const Rn = Mu_Newton / (PHI_FLEXURE * b_mm * (d_mm ** 2));
    const m = fy / (0.85 * fc_prime);
    
    let rho_req = 0;
    if (Rn > 0) {
        rho_req = (1 / m) * (1 - Math.sqrt(1 - (2 * m * Rn) / fy));
    }

    const rho_design = Math.max(rho_req, rho_min);
    
    const As_req = rho_design * b_mm * d_mm / 100; // cm2

    return {
        Mu_negatif: Mu_negatif,
        Mu_positif: Mu_positif,
        As_req: As_req
    };
}

// --- MODUL 4: PERHITUNGAN FONDASI ---
function hitungKapasitasFondasi(P_ult, q_allow, B, L_f) {
    const Area_f = B * L_f;
    const Q_allow = q_allow * Area_f;
    const FS = Q_allow / P_ult;
    
    return {
        Area_f: Area_f,
        Q_allow: Q_allow,
        FS: FS
    };
}

// --- VISUALISASI MENGGUNAKAN CHART.JS ---
function gambarDiagramMomen(L, Mu_negatif, Mu_positif) {
    const ctx = document.getElementById('momentChartCanvas').getContext('2d');
    
    if (momentChart) {
        momentChart.destroy();
    }

    const dataPoints = [
        { x: 0, y: Mu_negatif },
        { x: L/2, y: Mu_positif },
        { x: L, y: Mu_negatif }
    ];

    momentChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                label: 'Momen Ultimate (kN.m)',
                data: dataPoints,
                borderColor: var_primary_dark, // Menggunakan variabel CSS melalui JS (didefinisikan di bawah)
                backgroundColor: 'rgba(74, 144, 226, 0.2)',
                borderWidth: 3,
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    title: { display: true, text: 'Posisi Balok (m)' }
                },
                y: {
                    title: { display: true, text: 'Momen (kN.m)' },
                    reverse: true,
                    min: Mu_negatif * 1.2
                }
            },
            plugins: {
                legend: { display: false },
                title: { display: true, text: 'Diagram Momen Lentur (Jepit-Jepit)' }
            }
        }
    });
}
// Ambil variabel CSS untuk Chart.js
const var_primary_dark = getComputedStyle(document.documentElement).getPropertyValue('--primary-dark');

// --- FUNGSI UNTUK MENAMPILKAN HASIL KE HTML ---
function tampilkanHasil(hasil) {
    const container = document.getElementById('results-container');
    const L = hasil.L;
    const Mu_negatif = hasil.desain.Mu_negatif;
    const Mu_positif = hasil.desain.Mu_positif;
    const As_req = hasil.desain.As_req;
    const FS = hasil.fondasi.FS;

    let htmlOutput = `
        <div class="result-box">
            <h5>1. PERHITUNGAN PEMBEBANAN <span class="sni-ref">(SNI 1727:2020 & 1726:2019)</span></h5>
            <ul class="list-unstyled">
                <li>Beban Mati Pelat: <span class="result-data">${hasil.beban.W_dead_plat.toFixed(2)} kN/m²</span></li>
                <li>Beban Hidup (Aktivitas): <span class="result-data">${hasil.beban.W_live.toFixed(2)} kN/m²</span></li>
                <li>Beban Terfaktor Gravitasi (U): <span class="result-data">${hasil.beban.U_max_gravitasi.toFixed(2)} kN/m²</span> (Rumus: 1.2 x D + 1.6 x L)</li>
                <li>Gaya Gempa Total ($V_{total}$): <span class="result-data">${hasil.beban.V_gempa_total.toFixed(2)} kN</span></li>
            </ul>
            <p class="mb-0">Beban Balok Terfaktor per Meter ($q_u$): <span class="result-data">${hasil.q_u_balok.toFixed(2)} kN/m</span></p>
        </div>
        
        <div class="result-box">
            <h5>2 & 3. ANALISIS & DESAIN ELEMEN <span class="sni-ref">(SNI 2847:2019)</span></h5>
            <div class="row">
                <div class="col-md-6">
                    <ul class="list-unstyled">
                        <li>Momen Tumpuan ($M_{u,neg}$): <span class="result-data">${Mu_negatif.toFixed(2)} kN.m</span></li>
                        <li>Momen Lapangan ($M_{u,pos}$): <span class="result-data">${Mu_positif.toFixed(2)} kN.m</span></li>
                        <li>Luas Tulangan Perlu ($A_s$): <span class="result-data text-danger">${As_req.toFixed(2)} cm²</span></li>
                    </ul>
                    <div class="tulangan-visual">
                        <h6>Kebutuhan Tulangan Baja</h6>
                        <p class="mb-0 small">Ini adalah luas minimum baja yang dibutuhkan pada penampang balok. Harus diverifikasi dengan diameter dan jarak tulangan aktual.</p>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="chart-container">
                        <canvas id="momentChartCanvas"></canvas>
                    </div>
                </div>
            </div>
        </div>

        <div class="result-box">
            <h5>4. PERHITUNGAN FONDASI <span class="sni-ref">(SNI 8460:2017)</span></h5>
            <ul class="list-unstyled">
                <li>Luas Fondasi: <span class="result-data">${hasil.fondasi.Area_f.toFixed(2)} m²</span></li>
                <li>Daya Dukung Izin Total ($Q_{all}$): <span class="result-data">${hasil.fondasi.Q_allow.toFixed(2)} kN</span></li>
                <li>Faktor Aman (FS): <span class="result-data">${FS.toFixed(2)}</span></li>
            </ul>
            <div class="alert ${FS >= 3.0 ? 'alert-success' : 'alert-danger'} small">
                Status Daya Dukung: **${FS >= 3.0 ? 'AMAN' : 'TIDAK AMAN'}** (FS harus $\ge$ 3.0)
            </div>
        </div>
    `;
    container.innerHTML = htmlOutput;
    
    // Panggil fungsi gambar diagram setelah HTML dimuat
    gambarDiagramMomen(L, Mu_negatif, Mu_positif);
}
