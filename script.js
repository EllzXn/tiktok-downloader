document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('download-form');
    const urlInput = document.getElementById('tiktok-url');
    const downloadBtn = document.getElementById('download-btn');
    const statusDiv = document.getElementById('status');
    const resultDiv = document.getElementById('result');

    const videoThumbnail = document.getElementById('video-thumbnail');
    const videoTitle = document.getElementById('video-title');
    const noWatermarkLink = document.getElementById('no-watermark');
    const noWatermarkHdLink = document.getElementById('no-watermark-hd');

    // --- EVENT LISTENER UTAMA ---
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const tiktokUrl = urlInput.value.trim();
        if (!tiktokUrl) {
            showStatus('Harap masukkan URL video TikTok.', true);
            return;
        }
        await fetchAndDisplayVideo(tiktokUrl);
    });

    // --- MENAMBAHKAN EVENT LISTENER UNTUK TOMBOL UNDUH ---
    noWatermarkLink.addEventListener('click', (e) => {
        e.preventDefault(); // Mencegah navigasi standar
        forceDownload(e.target.href, `${videoTitle.textContent.trim()}_no_watermark.mp4`, e.target);
    });

    noWatermarkHdLink.addEventListener('click', (e) => {
        e.preventDefault(); // Mencegah navigasi standar
        forceDownload(e.target.href, `${videoTitle.textContent.trim()}_hd_no_watermark.mp4`, e.target);
    });

    async function fetchAndDisplayVideo(tiktokUrl) {
        showLoading();
        try {
            const apiUrl = `https://ellzxn-api.vercel.app/downloader/tiktok?url=${encodeURIComponent(tiktokUrl)}`;
            const response = await fetch(apiUrl);

            if (!response.ok) {
                throw new Error(`Gagal menghubungi server. Status: ${response.status}`);
            }

            const data = await response.json();

            if (data.status === true && data.data && data.data.length > 0) {
                displayResult(data);
            } else {
                throw new Error(data.message || 'Video tidak ditemukan atau URL tidak valid.');
            }
        } catch (error) {
            showStatus(`Terjadi kesalahan: ${error.message}`, true);
        } finally {
            downloadBtn.disabled = false;
            downloadBtn.textContent = 'Unduh';
        }
    }

    // --- FUNGSI BARU UNTUK MEMAKSA UNDUHAN ---
    async function forceDownload(url, fileName, buttonElement) {
        if (!url || url === '#') {
            alert("URL tidak valid untuk diunduh.");
            return;
        }

        const originalText = buttonElement.textContent;
        buttonElement.textContent = 'Mengunduh...';
        buttonElement.style.pointerEvents = 'none'; // Menonaktifkan tombol sementara

        try {
            // Mengambil data video sebagai blob
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Gagal mengunduh file. Status: ${response.status}`);
            }
            const blob = await response.blob();

            // Membuat URL sementara untuk blob
            const blobUrl = window.URL.createObjectURL(blob);
            
            // Membuat elemen <a> tersembunyi untuk memicu unduhan
            const link = document.createElement('a');
            link.href = blobUrl;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();

            // Membersihkan setelah unduhan selesai
            link.remove();
            window.URL.revokeObjectURL(blobUrl);

        } catch (error) {
            console.error('Download error:', error);
            alert(`Tidak dapat mengunduh video secara otomatis karena batasan browser (CORS). Silakan klik kanan dan pilih "Simpan video sebagai...".\n\nError: ${error.message}`);
            // Jika gagal, buka di tab baru sebagai fallback
            window.open(url, '_blank');
        } finally {
            // Mengembalikan teks tombol dan mengaktifkannya kembali
            buttonElement.textContent = originalText;
            buttonElement.style.pointerEvents = 'auto';
        }
    }

    function showLoading() {
        downloadBtn.disabled = true;
        downloadBtn.textContent = 'Memproses...';
        statusDiv.textContent = 'Sedang mengambil data video, mohon tunggu...';
        statusDiv.style.color = 'var(--text-muted-color)';
        resultDiv.classList.add('hidden');
    }

    function showStatus(message, isError = false) {
        statusDiv.textContent = message;
        statusDiv.style.color = isError ? '#ff5c5c' : 'var(--text-muted-color)';
        resultDiv.classList.add('hidden');
    }

    function displayResult(resultData) {
        statusDiv.textContent = '';
        videoThumbnail.src = resultData.cover;
        videoTitle.textContent = resultData.title || 'video_tiktok'; // Nama file default

        const noWatermarkObj = resultData.data.find(item => item.type === 'nowatermark');
        const noWatermarkHdObj = resultData.data.find(item => item.type === 'nowatermark_hd');

        const noWatermarkUrl = noWatermarkObj ? noWatermarkObj.url : '#';
        const noWatermarkHdUrl = noWatermarkHdObj ? noWatermarkHdObj.url : '#';
        
        noWatermarkLink.href = noWatermarkUrl;
        noWatermarkHdLink.href = noWatermarkHdUrl;

        noWatermarkLink.style.display = noWatermarkUrl !== '#' ? 'block' : 'none';
        noWatermarkHdLink.style.display = noWatermarkHdUrl !== '#' ? 'block' : 'none';

        resultDiv.classList.remove('hidden');
    }
});
      
