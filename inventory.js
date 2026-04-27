// State Management
let inventory = JSON.parse(localStorage.getItem('autoInventory')) || [];
let currentTab = 'dashboard';
let itemToDelete = null;
let editingItemId = null;


function saveToStorage() {
    localStorage.setItem('autoInventory', JSON.stringify(inventory));
    updateStats();
    renderAll();
}

// Navigation
function switchTab(tab) {
    currentTab = tab;

    // Update nav styles
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('bg-blue-600', 'text-white');
        btn.classList.add('text-slate-300', 'hover:bg-slate-800');
    });

    const activeBtn = document.getElementById(`nav-${tab}`);
    if (activeBtn) {
        activeBtn.classList.remove('text-slate-300', 'hover:bg-slate-800');
        activeBtn.classList.add('bg-blue-600', 'text-white');
    }

    // Update view titles
    const titles = {
        'dashboard': 'Dashboard',
        'inventory': 'Inventory',
        'tires': 'Tire Inventory',
        'batteries': 'Battery Inventory'
    };
    document.getElementById('page-title').textContent = titles[tab];

    // Show/hide views
    document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'));
    document.getElementById(`view-${tab}`).classList.remove('hidden');

    renderAll();
}

function toggleMobileMenu() {
    const menu = document.getElementById('mobile-menu');
    menu.classList.toggle('hidden');
    menu.classList.toggle('flex');
}

// Modal Functions
function openModal(type = null) {
    editingItemId = null;
    document.getElementById('modal-title').textContent = 'Add New Item';
    document.getElementById('item-form').reset();

    if (type) {
        document.querySelector(`input[name="type"][value="${type}"]`).checked = true;
    }

    toggleTypeFields();
    document.getElementById('item-modal').classList.remove('hidden');
    document.getElementById('item-modal').classList.add('flex');
}

function openEditModal(id) {
    const item = inventory.find(i => i.id === id);
    if (!item) return;

    editingItemId = id;
    document.getElementById('modal-title').textContent = 'Edit Item';
    document.querySelector(`input[name="type"][value="${item.type}"]`).checked = true;

    document.getElementById('item-name').value = item.name;
    document.getElementById('item-sku').value = item.sku;
    document.getElementById('item-brand').value = item.brand;
    document.getElementById('item-quantity').value = item.quantity;
    document.getElementById('item-min-stock').value = item.minStock;
    document.getElementById('item-price').value = item.price;
    document.getElementById('item-notes').value = item.notes || '';

    if (item.type === 'tire') {
        document.getElementById('tire-width').value = item.width || '';
        document.getElementById('tire-ratio').value = item.ratio || '';
        document.getElementById('tire-rim').value = item.rim || '';
        document.getElementById('tire-season').value = item.season || 'All-Season';
        document.getElementById('tire-vehicle').value = item.vehicle || 'Passenger';
    } else {
        document.getElementById('battery-group').value = item.groupSize || '';
        document.getElementById('battery-cca').value = item.cca || '';
        document.getElementById('battery-voltage').value = item.voltage || '12V';
        document.getElementById('battery-tech').value = item.technology || 'Lead-Acid';
    }

    toggleTypeFields();
    document.getElementById('item-modal').classList.remove('hidden');
    document.getElementById('item-modal').classList.add('flex');
}

function closeModal() {
    document.getElementById('item-modal').classList.add('hidden');
    document.getElementById('item-modal').classList.remove('flex');
    editingItemId = null;
}

function toggleTypeFields() {
    const type = document.querySelector('input[name="type"]:checked').value;
    const tireFields = document.getElementById('tire-fields');
    const batteryFields = document.getElementById('battery-fields');

    if (type === 'tire') {
        tireFields.classList.remove('hidden');
        batteryFields.classList.add('hidden');
    } else {
        tireFields.classList.add('hidden');
        batteryFields.classList.remove('hidden');
    }
}

// CRUD Operations
function saveItem(e) {
    e.preventDefault();

    const type = document.querySelector('input[name="type"]:checked').value;
    const itemData = {
        id: editingItemId || Date.now().toString(),
        type: type,
        name: document.getElementById('item-name').value,
        sku: document.getElementById('item-sku').value,
        brand: document.getElementById('item-brand').value,
        quantity: parseInt(document.getElementById('item-quantity').value),
        minStock: parseInt(document.getElementById('item-min-stock').value),
        price: parseFloat(document.getElementById('item-price').value) || 0,
        notes: document.getElementById('item-notes').value,
        updatedAt: new Date().toISOString()
    };

    if (!editingItemId) {
        itemData.createdAt = new Date().toISOString();
    } else {
        const existing = inventory.find(i => i.id === editingItemId);
        if (existing) itemData.createdAt = existing.createdAt;
    }

    if (type === 'tire') {
        itemData.width = document.getElementById('tire-width').value;
        itemData.ratio = document.getElementById('tire-ratio').value;
        itemData.rim = document.getElementById('tire-rim').value;
        itemData.season = document.getElementById('tire-season').value;
        itemData.vehicle = document.getElementById('tire-vehicle').value;
    } else {
        itemData.groupSize = document.getElementById('battery-group').value;
        itemData.cca = parseInt(document.getElementById('battery-cca').value) || 0;
        itemData.voltage = document.getElementById('battery-voltage').value;
        itemData.technology = document.getElementById('battery-tech').value;
    }

    if (editingItemId) {
        const index = inventory.findIndex(i => i.id === editingItemId);
        if (index !== -1) inventory[index] = itemData;
        showToast('Item updated successfully', 'success');
    } else {
        inventory.push(itemData);
        showToast('Item added successfully', 'success');
    }

    saveToStorage();
    closeModal();
}

function deleteItem(id) {
    itemToDelete = id;
    document.getElementById('delete-modal').classList.remove('hidden');
    document.getElementById('delete-modal').classList.add('flex');
}

function closeDeleteModal() {
    document.getElementById('delete-modal').classList.add('hidden');
    document.getElementById('delete-modal').classList.remove('flex');
    itemToDelete = null;
}

function confirmDelete() {
    if (itemToDelete) {
        inventory = inventory.filter(i => i.id !== itemToDelete);
        saveToStorage();
        showToast('Item deleted', 'success');
    }
    closeDeleteModal();
}

function adjustQuantity(id, delta) {
    const item = inventory.find(i => i.id === id);
    if (item) {
        const newQty = item.quantity + delta;
        if (newQty >= 0) {
            item.quantity = newQty;
            item.updatedAt = new Date().toISOString();
            saveToStorage();
        }
    }
}

// Rendering
function getStockStatus(item) {
    if (item.quantity === 0) return { class: 'low-stock', label: 'Out of Stock', color: 'text-red-600 bg-red-50' };
    if (item.quantity <= item.minStock) return { class: 'low-stock', label: 'Low Stock', color: 'text-red-600 bg-red-50' };
    if (item.quantity <= item.minStock * 2) return { class: 'medium-stock', label: 'Medium', color: 'text-amber-600 bg-amber-50' };
    return { class: 'good-stock', label: 'Good', color: 'text-emerald-600 bg-emerald-50' };
}

function renderAll() {
    renderDashboard();
    renderInventory();
    renderTires();
    renderBatteries();
}

function renderDashboard() {
    const total = inventory.length;
    const low = inventory.filter(i => i.quantity <= i.minStock).length;
    const medium = inventory.filter(i => i.quantity > i.minStock && i.quantity <= i.minStock * 2).length;
    const good = inventory.filter(i => i.quantity > i.minStock * 2).length;

    document.getElementById('stat-total-items').textContent = total;
    document.getElementById('stat-low-stock').textContent = low;
    document.getElementById('stat-medium-stock').textContent = medium;
    document.getElementById('stat-good-stock').textContent = good;
    document.getElementById('sidebar-total').textContent = total;
    document.getElementById('sidebar-low').textContent = low;

    // Tire stats
    const tires = inventory.filter(i => i.type === 'tire');
    document.getElementById('dash-tire-count').textContent = tires.length;
    document.getElementById('dash-tire-units').textContent = tires.reduce((sum, t) => sum + t.quantity, 0);
    document.getElementById('dash-tire-low').textContent = tires.filter(t => t.quantity <= t.minStock).length;

    // Battery stats
    const batteries = inventory.filter(i => i.type === 'battery');
    document.getElementById('dash-battery-count').textContent = batteries.length;
    document.getElementById('dash-battery-units').textContent = batteries.reduce((sum, b) => sum + b.quantity, 0);
    document.getElementById('dash-battery-low').textContent = batteries.filter(b => b.quantity <= b.minStock).length;

    // Recent low stock
    const recentLow = inventory
        .filter(i => i.quantity <= i.minStock)
        .sort((a, b) => a.quantity - b.quantity)
        .slice(0, 5);

    const recentContainer = document.getElementById('dash-recent-low');
    if (recentLow.length === 0) {
        recentContainer.innerHTML = '<div class="p-6 text-center text-slate-400">No low stock items</div>';
    } else {
        recentContainer.innerHTML = recentLow.map(item => {
            const status = getStockStatus(item);
            const icon = item.type === 'tire' ? 'fa-dharmachakra' : 'fa-car-battery';
            return `
                <div class="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-lg ${status.color} flex items-center justify-center">
                            <i class="fas ${icon}"></i>
                        </div>
                        <div>
                            <div class="font-medium text-slate-900">${item.name}</div>
                            <div class="text-sm text-slate-500">${item.brand} • ${item.sku}</div>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="font-bold text-slate-900">${item.quantity} units</div>
                        <div class="text-xs ${status.color.split(' ')[0]} font-medium px-2 py-0.5 rounded-full inline-block mt-1">${status.label}</div>
                    </div>
                </div>
            `;
        }).join('');
    }
}

function renderInventory() {
    const search = document.getElementById('search-input').value.toLowerCase();
    const typeFilter = document.getElementById('filter-type').value;
    const stockFilter = document.getElementById('filter-stock').value;

    let filtered = inventory.filter(item => {
        const matchesSearch = !search ||
            item.name.toLowerCase().includes(search) ||
            item.sku.toLowerCase().includes(search) ||
            item.brand.toLowerCase().includes(search) ||
            (item.width && item.width.includes(search)) ||
            (item.groupSize && item.groupSize.toLowerCase().includes(search));

        const matchesType = typeFilter === 'all' || item.type === typeFilter;

        let matchesStock = true;
        if (stockFilter === 'low') matchesStock = item.quantity <= item.minStock;
        else if (stockFilter === 'medium') matchesStock = item.quantity > item.minStock && item.quantity <= item.minStock * 2;
        else if (stockFilter === 'good') matchesStock = item.quantity > item.minStock * 2;

        return matchesSearch && matchesType && matchesStock;
    });

    const grid = document.getElementById('items-grid');
    const noResults = document.getElementById('no-results');

    if (filtered.length === 0) {
        grid.innerHTML = '';
        noResults.classList.remove('hidden');
        return;
    }

    noResults.classList.add('hidden');
    grid.innerHTML = filtered.map(item => createItemCard(item)).join('');
}

function createItemCard(item) {
    const status = getStockStatus(item);
    const icon = item.type === 'tire' ? 'fa-dharmachakra' : 'fa-car-battery';
    const specs = item.type === 'tire'
        ? `${item.width}/${item.ratio}R${item.rim} • ${item.season}`
        : `Group ${item.groupSize} • ${item.cca} CCA • ${item.voltage}`;

    return `
        <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg transition-all duration-300 ${status.class}">
            <div class="p-5">
                <div class="flex justify-between items-start mb-3">
                    <div class="flex items-center gap-3">
                        <div class="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                            <i class="fas ${icon} text-xl"></i>
                        </div>
                        <div>
                            <h4 class="font-bold text-slate-900 leading-tight">${item.name}</h4>
                            <p class="text-sm text-slate-500">${item.brand}</p>
                        </div>
                    </div>
                    <span class="text-xs font-medium px-2 py-1 rounded-full ${status.color}">${status.label}</span>
                </div>

                <div class="text-sm text-slate-600 mb-4 font-mono bg-slate-50 px-2 py-1 rounded inline-block">${item.sku}</div>

                <div class="text-sm text-slate-600 mb-4">
                    <i class="fas fa-tag mr-1 text-slate-400"></i> ${specs}
                </div>

                <div class="flex items-center justify-between mb-4">
                    <div>
                        <div class="text-2xl font-bold text-slate-900">${item.quantity}</div>
                        <div class="text-xs text-slate-500">in stock (min: ${item.minStock})</div>
                    </div>
                    <div class="text-right">
                        <div class="text-lg font-bold text-blue-600">$${item.price.toFixed(2)}</div>
                        <div class="text-xs text-slate-500">per unit</div>
                    </div>
                </div>

                <div class="flex items-center gap-2 pt-4 border-t border-slate-100">
                    <button onclick="adjustQuantity('${item.id}', -1)" class="w-8 h-8 rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-600 transition-colors">
                        <i class="fas fa-minus text-xs"></i>
                    </button>
                    <button onclick="adjustQuantity('${item.id}', 1)" class="w-8 h-8 rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-600 transition-colors">
                        <i class="fas fa-plus text-xs"></i>
                    </button>
                    <div class="flex-1"></div>
                    <button onclick="openEditModal('${item.id}')" class="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <i class="fas fa-edit mr-1"></i> Edit
                    </button>
                    <button onclick="deleteItem('${item.id}')" class="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <i class="fas fa-trash-alt mr-1"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

function renderTires() {
    const tires = inventory
        .filter(i => i.type === 'tire')
        .sort((a, b) => a.name.localeCompare(b.name));
    const container = document.getElementById('tires-list');

    if (tires.length === 0) {
        container.innerHTML = '<div class="p-8 text-center text-slate-400">No tires in inventory</div>';
        return;
    }

    container.innerHTML = tires.map(item => createListItem(item)).join('');
}

function renderBatteries() {
    const batteries = inventory
        .filter(i => i.type === 'battery')
        .sort((a, b) => a.name.localeCompare(b.name));
    const container = document.getElementById('batteries-list');

    if (batteries.length === 0) {
        container.innerHTML = '<div class="p-8 text-center text-slate-400">No batteries in inventory</div>';
        return;
    }

    container.innerHTML = batteries.map(item => createListItem(item)).join('');
}

function createListItem(item) {
    const status = getStockStatus(item);
    const icon = item.type === 'tire' ? 'fa-dharmachakra' : 'fa-car-battery';
    const detail = item.type === 'tire'
        ? `${item.width}/${item.ratio}R${item.rim} • ${item.season} • ${item.vehicle}`
        : `Group ${item.groupSize} • ${item.cca} CCA • ${item.voltage} • ${item.technology}`;

    return `
        <div class="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors ${status.class}">
            <div class="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 flex-shrink-0">
                <i class="fas ${icon} text-lg"></i>
            </div>
            <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                    <h4 class="font-bold text-slate-900 truncate">${item.name}</h4>
                    <span class="text-xs px-2 py-0.5 rounded-full ${status.color} whitespace-nowrap">${status.label}</span>
                </div>
                <div class="text-sm text-slate-500 mb-1">${item.brand} • ${item.sku}</div>
                <div class="text-sm text-slate-600">${detail}</div>
            </div>
            <div class="text-right flex-shrink-0 w-16">
                <div class="text-xl font-bold text-slate-900 tabular-nums">${item.quantity}</div>
                <div class="text-xs text-slate-500">units</div>
            </div>
            <div class="text-right flex-shrink-0 hidden sm:block w-24">
                <div class="font-bold text-blue-600">$${item.price.toFixed(2)}</div>
            </div>
            <div class="flex items-center gap-1 flex-shrink-0">
                <button onclick="adjustQuantity('${item.id}', -1)" class="w-8 h-8 rounded-lg border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-600">
                    <i class="fas fa-minus text-xs"></i>
                </button>
                <button onclick="adjustQuantity('${item.id}', 1)" class="w-8 h-8 rounded-lg border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-600">
                    <i class="fas fa-plus text-xs"></i>
                </button>
                <button onclick="openEditModal('${item.id}')" class="w-8 h-8 rounded-lg hover:bg-blue-50 flex items-center justify-center text-blue-600 ml-1">
                    <i class="fas fa-edit text-sm"></i>
                </button>
                <button onclick="deleteItem('${item.id}')" class="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-red-600">
                    <i class="fas fa-trash-alt text-sm"></i>
                </button>
            </div>
        </div>
    `;
}

function filterItems() {
    renderInventory();
}

function updateStats() {
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const icon = document.getElementById('toast-icon');
    const msg = document.getElementById('toast-message');

    msg.textContent = message;
    icon.className = type === 'success' ? 'fas fa-check-circle text-emerald-400' : 'fas fa-exclamation-circle text-amber-400';

    toast.classList.remove('translate-y-20', 'opacity-0');

    setTimeout(() => {
        toast.classList.add('translate-y-20', 'opacity-0');
    }, 3000);
}

document.addEventListener('DOMContentLoaded', () => {
    loadDemoData();
    switchTab('dashboard');
});

document.getElementById('item-modal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
});
document.getElementById('delete-modal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeDeleteModal();
});
