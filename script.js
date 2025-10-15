document.addEventListener('DOMContentLoaded', () => {
    // Referensi Elemen DOM
    const form = document.getElementById('download-form');
    const urlInput = document.getElementById('media-url');
    const downloadBtn = document.getElementById('download-btn');
    const statusDiv = document.getElementById('status');
    const resultDiv = document.getElementById('result');
    const mediaThumbnail = document.getElementById('media-thumbnail');
    const mediaTitle = document.getElementById('media-title');
    const downloadLinksContainer = document.getElementById('download-links-container');

    // Event Listener Utama
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const mediaUrl = urlInput.value.trim();
        if (!mediaUrl) {
            showStatus('Harap masukkan URL media.', true);
            return;
        }

        // Tentukan jenis downloader yang dipilih
        const downloaderType = document.querySelector('input[name="downloader-type"]:checked').value;
        
        showLoading();

        try {
            let apiUrl;
            if (downloaderType === 'tiktok') {
                apiUrl = `https://ellzxn-api.vercel.app/downloader/tiktok?url=${encodeURIComponent(mediaUrl)}`;
            } else { // 'allinone'
                apiUrl = `https://ellzxn-api.vercel.app/downloader/blackhole?url=${encodeURIComponent(mediaUrl)}`;
            }

            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error(`Gagal menghubungi server. Status: ${response.status}`);
            
            const data = await response.json();

            // Panggil fungsi display yang sesuai berdasarkan jenis downloader
            if (downloaderType === 'tiktok') {
                handleTikTokResponse(data);
            } else {
                handleAllInOneResponse(data);
            }

        } catch (error) {
            showStatus(`Terjadi kesalahan: ${error.message}`, true);
        } finally {
            downloadBtn.disabled = false;
            downloadBtn.textContent = 'Unduh';
        }
    });

    // --- FUNGSI UNTUK MENANGANI RESPONS TIAP API ---

    function handleTikTokResponse(data) {
        if (data.status === true && data.data && data.data.length > 0) {
            mediaThumbnail.src = data.cover;
            mediaTitle.textContent = data.title || 'Video TikTok';
            mediaThumbnail.style.display = 'block'; // Pastikan thumbnail terlihat

            // Hapus link lama sebelum menambahkan yang baru
            downloadLinksContainer.innerHTML = ''; 

            const noWatermarkObj = data.data.find(item => item.type === 'nowatermark');
            const noWatermarkHdObj = data.data.find(item => item.type === 'nowatermark_hd');

            if (noWatermarkObj) {
                createDownloadButton(noWatermarkObj.url, 'Unduh (Tanpa Watermark)', `${mediaTitle.textContent.trim()}_no_watermark.mp4`);
            }
            if (noWatermarkHdObj) {
                createDownloadButton(noWatermarkHdObj.url, 'Unduh (HD Tanpa Watermark)', `${mediaTitle.textContent.trim()}_hd.mp4`);
            }
            
            showResult();
        } else {
            throw new Error(data.message || 'Video TikTok tidak ditemukan.');
        }
    }

    function handleAllInOneResponse(data) {
        if (data.status === true && data.result?.success === true && data.result.download_links?.length > 0) {
            mediaTitle.textContent = 'Media Ditemukan';
            mediaThumbnail.style.display = 'none'; // Sembunyikan thumbnail karena API ini tidak memberikannya

            downloadLinksContainer.innerHTML = ''; // Hapus link lama

            data.result.download_links.forEach((linkUrl, index) => {
                const fileName = getFileNameFromUrl(linkUrl) || `media_${index + 1}.mp4`;
                createDownloadButton(linkUrl, `Unduh Link ${index + 1}`, fileName);
            });
            
            showResult();
        } else {
            throw new Error(data.result?.error_message || 'Media tidak ditemukan atau URL tidak didukung.');
        }
    }
    
    // --- FUNGSI BANTUAN ---

    function createDownloadButton(url, text, fileName) {
        const link = document.createElement('a');
        link.href = url;
        link.textContent = text;
        link.className = 'btn-download';
        link.addEventListener('click', (e) => {
            e.preventDefault();
            forceDownload(url, fileName, e.target);
        });
        downloadLinksContainer.appendChild(link);
    }
    
    async function forceDownload(url, fileName, buttonElement) {
        if (!url || url === '#') {
            alert("URL tidak valid untuk diunduh.");
            return;
        }

        const originalText = buttonElement.textContent;
        buttonElement.textContent = 'Mengunduh...';
        buttonElement.style.pointerEvents = 'none';

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Gagal mengunduh file. Status: ${response.status}`);
            
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = blobUrl;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error('Download error:', error);
            alert(`Gagal mengunduh otomatis karena batasan browser (CORS). Coba buka link di tab baru.\nError: ${error.message}`);
            window.open(url, '_blank');
        } finally {
            buttonElement.textContent = originalText;
            buttonElement.style.pointerEvents = 'auto';
        }
    }

    function getFileNameFromUrl(url) {
        try {
            const urlPath = new URL(url).pathname;
            const lastSegment = urlPath.substring(urlPath.lastIndexOf('/') + 1);
            return lastSegment || null;
        } catch (e) {
            return null;
        }
    }

    function showLoading() {
        downloadBtn.disabled = true;
        downloadBtn.textContent = 'Memproses...';
        statusDiv.textContent = 'Sedang mengambil data, mohon tunggu...';
        statusDiv.style.color = 'var(--text-muted-color)';
        resultDiv.classList.add('hidden');
    }

    function showStatus(message, isError = false) {
        statusDiv.textContent = message;
        statusDiv.style.color = isError ? '#ff5c5c' : 'var(--text-muted-color)';
        resultDiv.classList.add('hidden');
    }

    function showResult() {
        statusDiv.textContent = '';
        resultDiv.classList.remove('hidden');
    }
});