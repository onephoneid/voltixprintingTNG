## Pembaruan pratinjau link WhatsApp

Metadata Open Graph dan Twitter Card sudah terpasang di public/index.html, menggunakan banner asli public/assets/voltix-hero-promo.png (735 × 413 px).

1. Ekstrak ZIP ini.
2. Unggah isi folder ke repository GitHub website yang terhubung dengan Vercel, lalu commit. Jangan unggah file ZIP sebagai pengganti source.
3. Tunggu deployment Vercel selesai. Jika repository sudah berisi versi ZIP sebelumnya, cukup ganti public/index.html untuk memasang metadata.
4. Buka https://voltixprint.vercel.app/assets/voltix-hero-promo.png untuk memastikan gambar bisa diakses.
5. Tempel https://voltixprint.vercel.app/ di WhatsApp dan tunggu pratinjau sebelum mengirim.
6. Jika pratinjau lama masih tersimpan, coba https://voltixprint.vercel.app/?v=2. Tampilan pratinjau bergantung pada cache dan aplikasi penerima.

Domain metadata saat ini: https://voltixprint.vercel.app/. Perbarui canonical, og:url, serta URL gambar jika domain berubah. Pembaruan ZIP ini belum otomatis mengubah website online.

---

# Voltix Printing — paket Vercel v29

Paket lengkap dari versi website terbaru, termasuk banner utama baru, seluruh katalog dan gambar, logo ekspedisi, form pemesanan pop-up, ringkasan WhatsApp, serta fungsi ongkir Maps untuk Vercel. Tidak memerlukan API key atau database.

## Deploy melalui GitHub

1. Ekstrak ZIP ini terlebih dahulu. Jangan upload file ZIP langsung sebagai kode proyek.
2. Buat repository baru di GitHub, atau gunakan repository Voltix yang sudah ada setelah mencadangkannya.
3. Upload SEMUA ISI folder ini. Di tingkat paling atas repository harus langsung terlihat `vercel.json`, `package.json`, folder `public`, folder `api`, dan folder `server`. Jangan hanya mengunggah `index.html` atau folder `public`.
4. Buka https://vercel.com/new dan import repository tersebut. Untuk memperbarui project Vercel lama, gunakan repository yang terhubung ke project tersebut.
5. Pilih Framework Preset **Other**, Root Directory **./**, Output Directory **public**, dan kosongkan Build Command. Konfigurasi ini juga sudah tersedia dalam `vercel.json`. Gunakan Node.js **22.x**.
6. Klik Deploy. Jika project lama masih memakai Next.js/Vite atau Build Command lain, ubah pengaturan tersebut sesuai langkah 5, lalu deploy ulang.
7. Buka alamat `.vercel.app` yang diberikan Vercel. Coba tombol pesan dan pilihan pengiriman sebelum membagikan link ke customer.

Alternatif untuk pengguna terminal: dari folder berisi `vercel.json`, jalankan `npx vercel`, ikuti petunjuk, lalu `npx vercel --prod` untuk publikasi production. Perintah tersebut memerlukan akun Vercel.

## Yang perlu diperiksa setelah deploy

- Banner utama dan semua gambar katalog tampil.
- Tombol Buat pesanan membuka pop-up; pilihan produk dan desain terisi dengan benar.
- Ringkasan pesanan mengarah ke WhatsApp Voltix: 0838-9379-3285.
- GoSend: isi alamat lengkap, tempel pin Google Maps tujuan, lalu klik Cek ongkir. Harga muncul hanya setelah pin dan rute berhasil dibaca.
- Simulasi GoSend Rp2.500/km, minimum Rp20.000, rute dibulatkan ke km berikutnya. Batas simulasi 40 km / 20 kg. Tarif bukan harga resmi Gojek.
- JNE menggunakan tabel asumsi berdasarkan wilayah dan berat. Ekspedisi lain dikonfirmasi admin; logo tidak berarti API ekspedisi sudah terhubung.
- Kartu ulasan rekaan tetap bertanda Contoh ulasan. Ganti dengan testimoni asli sebelum menghapus label.

## Mengedit website

- Teks dan susunan halaman: `public/index.html`.
- Desain dan responsivitas: `public/style.css`.
- Pemesanan, katalog, ulasan, WhatsApp: `public/app.js`.
- Perhitungan tarif: `public/shipping-estimator.js`.
- Interaksi pin Maps: `public/shipping-location.js`.
- Endpoint Vercel: `api/shipping/location.js`.
- Titik asal Voltix, pembacaan pin, dan rute jalan: `server/shipping-location.mjs`. Simpan file ini di server; jangan pindahkan ke `public` agar titik asal tidak disajikan sebagai aset website.
- Semua gambar dan logo: `public/assets/`. Pertahankan struktur folder serta huruf besar/kecil pada nama file.

## Catatan fungsi ongkir

Google Maps digunakan untuk membaca titik tujuan dari link customer. Rute dihitung memakai layanan publik OSRM dengan data OpenStreetMap, sehingga dapat berbeda dari rute Google Maps maupun kurir. Layanan publik bisa lambat atau tidak tersedia. Jika pin/rute tidak terbaca, sistem tidak menampilkan harga dan customer perlu mencoba lagi atau menghubungi admin. Tidak ada pembayaran otomatis, pembuatan pesanan kurir, atau nomor resi resmi.

Membuka `public/index.html` langsung dari komputer hanya cocok untuk melihat halaman; fungsi ongkir server harus dijalankan di hosting Vercel. Origin pengirim tidak ditampilkan pada UI, tetapi kode sumber repository yang dibuat public dapat dibaca orang lain; pilih repository private jika tidak ingin membagikan kode sumber.

## Validasi paket

Jalankan `npm test` menggunakan Node.js 22+. Tidak ada dependensi runtime tambahan. Verifikasi lokal mencakup aset, struktur halaman, endpoint pin/rute dengan respons layanan peta tiruan, validasi URL, dan tarif. Paket ini belum dideploy atau diuji langsung di akun Vercel Anda.

## Referensi konfigurasi

- https://vercel.com/docs/functions/runtimes/node-js
- https://vercel.com/docs/project-configuration/vercel-json
- https://vercel.com/docs/builds/configure-a-build

Sumber: Voltix Printing Sites versi 29, commit 77b8eb015f0f850068bfe662108492052d21681b. Paket ini menyesuaikan runtime untuk Vercel tanpa mengubah website live di ChatGPT Sites.
