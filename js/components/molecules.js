import { CONFIG } from '../config.js';

export function generatePopupContent(item) {
    // 1. Define columns to hide from the table (redundant or system cols)
    const HIDDEN_COLS = [...CONFIG.SYSTEM_COLS, 'Location Name', 'Phone'];

    // 2. Generate Table Rows
    const tableRows = Object.keys(item)
        .filter(key => !HIDDEN_COLS.includes(key) && !key.startsWith('_'))
        .map(key => {
            const value = item[key];
            let displayValue = value;

            // Handle Array Data (Surplus/Needed)
            if (Array.isArray(value)) {
                if (value.length === 0) return ''; // Skip empty lists

                const listItems = value.map(i =>
                    `<li>
                        <span class="item-name">${i.item}</span>
                        <span class="item-amount">${i.amount}</span>
                     </li>`
                ).join('');

                let colorClass = '';
                if (key.toLowerCase() === 'needed') colorClass = 'list-critical';
                if (key.toLowerCase() === 'surplus') colorClass = 'list-surplus';

                displayValue = `<ul class="item-list ${colorClass}">${listItems}</ul>`;
            }

            return `<tr><th>${key}</th><td>${displayValue}</td></tr>`;
        })
        .join('');

    const phoneBtn = item.Phone
        ? `<a href="tel:${item.Phone}" class="btn btn-secondary">Call</a>`
        : '';

    // 3. Return Cleaner HTML
    return `
        <div class="popup-content">
            <div class="popup-header">
                <h3>${item['Location Name'] || 'Unknown Location'}</h3>
                <div class="popup-meta">
                    Updated: ${new Date(item.updated_at).toLocaleString([], { hour: '2-digit', minute: '2-digit' })}
                    ${item._isStale ? '<span class="tag-stale">STALE</span>' : ''}
                </div>
            </div>
            
            <div class="popup-body">
                <table class="data-table">
                    ${tableRows}
                </table>
            </div>

            <div class="actions">
                <a href="https://www.google.com/maps/search/?api=1&query=${item.lat},${item.lng}" target="_blank" class="btn btn-secondary">Nav</a>
                ${phoneBtn}
                <button onclick="navigator.clipboard.writeText('${item.lat}, ${item.lng}')" class="btn btn-secondary">GPS</button>
            </div>
        </div>
    `;
}

export function createCard(item) {
    const card = document.createElement('div');
    card.className = `card status-${item._displayStatus}`;
    card.innerHTML = generatePopupContent(item);
    return card;
}
