// Renderer process - handles UI and user interactions

document.addEventListener('DOMContentLoaded', async () => {
    // DOM Elements
    const tilesContainer = document.getElementById('tilesContainer');
    const emptyState = document.getElementById('emptyState');
    const searchInput = document.getElementById('searchInput');
    const clearBtn = document.getElementById('clearBtn');
    const minimizeBtn = document.getElementById('minimizeBtn');
    const closeBtn = document.getElementById('closeBtn');
    const itemCount = document.getElementById('itemCount');

    // State
    let clipboardHistory = [];

    // Initialize
    await loadHistory();
    setupEventListeners();

    // Load history
    async function loadHistory() {
        try {
            clipboardHistory = await window.electronAPI.getHistory();
            renderTiles(clipboardHistory);
        } catch (error) {
            console.error('Failed to load history:', error);
        }
    }

    // Event setup
    function setupEventListeners() {
        // Window controls
        minimizeBtn.addEventListener('click', () => {
            window.electronAPI.minimizeWindow();
        });

        closeBtn.addEventListener('click', () => {
            window.electronAPI.closeWindow();
        });

        // Search
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            filterTiles(query);
        });

        // Clear all
        clearBtn.addEventListener('click', async () => {
            if (clipboardHistory.length === 0) return;

            try {
                clipboardHistory = await window.electronAPI.clearHistory();
                renderTiles(clipboardHistory);
            } catch (error) {
                console.error('Failed to clear history:', error);
            }
        });

        // Listen for new clipboard items
        window.electronAPI.onClipboardChanged((item) => {
            // Add to beginning of array
            clipboardHistory.unshift(item);

            // Re-render with current search filter
            const query = searchInput.value.toLowerCase().trim();
            if (query) {
                filterTiles(query);
            } else {
                renderTiles(clipboardHistory);
            }
        });

        // Listen for history updates (e.g., cleared from tray)
        window.electronAPI.onHistoryUpdated((history) => {
            clipboardHistory = history;
            renderTiles(clipboardHistory);
        });
    }

    // Render tiles
    function renderTiles(items) {
        // Update item count
        updateItemCount(items.length);

        // Show/hide empty state
        if (items.length === 0) {
            emptyState.classList.remove('hidden');
            // Clear existing tiles
            const tiles = tilesContainer.querySelectorAll('.tile');
            tiles.forEach(tile => tile.remove());
            return;
        }

        emptyState.classList.add('hidden');

        // Clear existing tiles
        const existingTiles = tilesContainer.querySelectorAll('.tile');
        existingTiles.forEach(tile => tile.remove());

        // Render new tiles
        items.forEach((item, index) => {
            const tile = createTile(item, index);
            tilesContainer.appendChild(tile);
        });
    }

    function createTile(item, index) {
        const tile = document.createElement('div');
        tile.className = 'tile';
        tile.dataset.id = item.id;
        tile.style.animationDelay = `${index * 30}ms`;

        const timeAgo = formatTimeAgo(new Date(item.timestamp));
        const charCount = item.text.length;

        tile.innerHTML = `
      <div class="tile-content">
        <div class="tile-text">${escapeHtml(item.text)}</div>
        <div class="tile-meta">${timeAgo} · ${charCount} chars</div>
      </div>
      <div class="tile-actions">
        <button class="tile-btn copy-btn" aria-label="Copy to clipboard" title="Copy">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
        </button>
        <button class="tile-btn delete-btn" aria-label="Delete item" title="Delete">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"></path>
          </svg>
        </button>
      </div>
    `;

        // Copy button click
        const copyBtn = tile.querySelector('.copy-btn');
        copyBtn.addEventListener('click', async () => {
            try {
                await window.electronAPI.writeClipboard(item.text);

                // Visual feedback
                copyBtn.classList.add('copied');
                copyBtn.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        `;

                setTimeout(() => {
                    copyBtn.classList.remove('copied');
                    copyBtn.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          `;
                }, 1500);
            } catch (error) {
                console.error('Failed to copy:', error);
            }
        });

        // Delete button click
        const deleteBtn = tile.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', async () => {
            try {
                // Animate out
                tile.style.opacity = '0';
                tile.style.transform = 'translateX(20px)';
                tile.style.transition = 'all 0.2s ease';

                setTimeout(async () => {
                    clipboardHistory = await window.electronAPI.deleteItem(item.id);

                    // Re-render with current search filter
                    const query = searchInput.value.toLowerCase().trim();
                    if (query) {
                        filterTiles(query);
                    } else {
                        renderTiles(clipboardHistory);
                    }
                }, 200);
            } catch (error) {
                console.error('Failed to delete:', error);
            }
        });

        return tile;
    }

    // Filter
    function filterTiles(query) {
        if (!query) {
            renderTiles(clipboardHistory);
            return;
        }

        const filtered = clipboardHistory.filter(item =>
            item.text.toLowerCase().includes(query)
        );
        renderTiles(filtered);
    }

    // Helpers
    function updateItemCount(count) {
        itemCount.textContent = `${count} item${count !== 1 ? 's' : ''}`;
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function formatTimeAgo(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHour = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHour / 24);

        if (diffSec < 60) {
            return 'Just now';
        } else if (diffMin < 60) {
            return `${diffMin}m ago`;
        } else if (diffHour < 24) {
            return `${diffHour}h ago`;
        } else if (diffDay === 1) {
            return 'Yesterday';
        } else if (diffDay < 7) {
            return `${diffDay}d ago`;
        } else {
            return date.toLocaleDateString();
        }
    }
});
