// CartShare Application Logic
document.addEventListener('DOMContentLoaded', function () {

    // Threshold constant for free delivery
    const FREE_SHIPPING_THRESHOLD = 75.00;
    const STANDARD_SHIPPING_FEE = 5.99;

    // State
    let currentUser = sessionStorage.getItem('cartshare_user') || '';
    let currentRoom = sessionStorage.getItem('cartshare_room') || '';

    // DOM Elements
    const authSection = document.getElementById('authSection');
    const dashboardSection = document.getElementById('dashboardSection');
    const navRoomDetails = document.getElementById('navRoomDetails');
    const navRoomCode = document.getElementById('navRoomCode');
    const navUserName = document.getElementById('navUserName');

    const roomForm = document.getElementById('roomForm');
    const userNameInput = document.getElementById('userNameInput');
    const roomCodeInput = document.getElementById('roomCodeInput');
    const generateCodeBtn = document.getElementById('generateCodeBtn');
    const copyCodeBtn = document.getElementById('copyCodeBtn');
    const copyIcon = document.getElementById('copyIcon');
    const leaveRoomBtn = document.getElementById('leaveRoomBtn');
    const printReceiptBtn = document.getElementById('printReceiptBtn');

    const addItemForm = document.getElementById('addItemForm');
    const itemName = document.getElementById('itemName');
    const itemQty = document.getElementById('itemQty');
    const itemPrice = document.getElementById('itemPrice');
    const itemCategory = document.getElementById('itemCategory');

    const cartTableBody = document.getElementById('cartTableBody');
    const emptyCartMessage = document.getElementById('emptyCartMessage');
    const itemCountBadge = document.getElementById('itemCountBadge');

    const thresholdProgressBar = document.getElementById('thresholdProgressBar');
    const thresholdStatusText = document.getElementById('thresholdStatusText');
    const thresholdCurrentTotal = document.getElementById('thresholdCurrentTotal');
    const thresholdRemainingText = document.getElementById('thresholdRemainingText');

    const summarySubtotal = document.getElementById('summarySubtotal');
    const summaryShipping = document.getElementById('summaryShipping');
    const summaryGrandTotal = document.getElementById('summaryGrandTotal');

    const expenseSplitList = document.getElementById('expenseSplitList');
    const activityLogList = document.getElementById('activityLogList');
    const clearLogBtn = document.getElementById('clearLogBtn');

    // Receipt elements
    const printableReceipt = document.getElementById('printableReceipt');
    const receiptRoomCode = document.getElementById('receiptRoomCode');
    const receiptDate = document.getElementById('receiptDate');
    const receiptTableBody = document.getElementById('receiptTableBody');
    const receiptSubtotal = document.getElementById('receiptSubtotal');
    const receiptShipping = document.getElementById('receiptShipping');
    const receiptGrandTotal = document.getElementById('receiptGrandTotal');
    const receiptSplitSummary = document.getElementById('receiptSplitSummary');
    const receiptPrintTimestamp = document.getElementById('receiptPrintTimestamp');

    // ----------------------------------------------------
    // Helper Functions: Storage & Data Management
    // ----------------------------------------------------

    function getRoomStorageKey(room) {
        return 'cartshare_room_' + room.toUpperCase();
    }

    function getRoomData(room) {
        const raw = localStorage.getItem(getRoomStorageKey(room));
        if (raw) {
            try {
                return JSON.parse(raw);
            } catch (e) {
                console.error('Error parsing room data', e);
            }
        }
        return {
            code: room.toUpperCase(),
            items: [],
            logs: []
        };
    }

    function saveRoomData(data) {
        localStorage.setItem(getRoomStorageKey(data.code), JSON.stringify(data));
        // Render UI locally
        renderAll();
    }

    function getTimeString() {
        const now = new Date();
        return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    function addLogEntry(roomData, text) {
        if (!roomData.logs) roomData.logs = [];
        roomData.logs.unshift({
            text: text,
            time: getTimeString()
        });
        // Limit log entries to last 30
        if (roomData.logs.length > 30) {
            roomData.logs.pop();
        }
    }

    // ----------------------------------------------------
    // Multi-Tab Collaboration Event Listener (Sync across tabs)
    // ----------------------------------------------------
    window.addEventListener('storage', function (e) {
        if (currentRoom && e.key === getRoomStorageKey(currentRoom)) {
            renderAll();
        }
    });

    // ----------------------------------------------------
    // Room Entry & Exit Logic
    // ----------------------------------------------------

    // Generate random 6-character room code
    function generateRandomCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = 'ROOM-';
        for (let i = 0; i < 4; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    generateCodeBtn.addEventListener('click', function () {
        roomCodeInput.value = generateRandomCode();
    });

    if (copyCodeBtn) {
        copyCodeBtn.addEventListener('click', function () {
            if (!currentRoom) return;
            navigator.clipboard.writeText(currentRoom).then(() => {
                copyIcon.className = 'bi bi-check-lg text-success';
                setTimeout(() => {
                    copyIcon.className = 'bi bi-clipboard';
                }, 1500);
            }).catch(() => {
                alert('Room code: ' + currentRoom);
            });
        });
    }

    // Handle Join / Create Room form submission
    roomForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const user = userNameInput.value.trim();
        let room = roomCodeInput.value.trim().toUpperCase();

        if (!user) return;
        if (!room) {
            room = generateRandomCode();
        }

        currentUser = user;
        currentRoom = room;

        // Persist session
        sessionStorage.setItem('cartshare_user', currentUser);
        sessionStorage.setItem('cartshare_room', currentRoom);

        // Fetch or create room
        const roomData = getRoomData(currentRoom);
        addLogEntry(roomData, `${currentUser} joined the room`);
        saveRoomData(roomData);

        updateView();
    });

    // Handle Leave Room
    leaveRoomBtn.addEventListener('click', function () {
        if (confirm('Are you sure you want to leave this room?')) {
            if (currentRoom) {
                const roomData = getRoomData(currentRoom);
                addLogEntry(roomData, `${currentUser} left the room`);
                saveRoomData(roomData);
            }

            sessionStorage.removeItem('cartshare_user');
            sessionStorage.removeItem('cartshare_room');
            currentUser = '';
            currentRoom = '';
            updateView();
        }
    });

    // ----------------------------------------------------
    // Cart Actions: Add & Remove Items
    // ----------------------------------------------------

    addItemForm.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!currentRoom || !currentUser) return;

        const name = itemName.value.trim();
        const qty = parseInt(itemQty.value, 10);
        const price = parseFloat(itemPrice.value);
        const category = itemCategory.value;

        if (!name || isNaN(qty) || qty <= 0 || isNaN(price) || price <= 0) return;

        const roomData = getRoomData(currentRoom);

        const newItem = {
            id: Date.now() + Math.random().toString(36).substring(2, 6),
            name: name,
            qty: qty,
            price: price,
            category: category,
            addedBy: currentUser,
            time: getTimeString()
        };

        roomData.items.push(newItem);
        const itemTotal = (qty * price).toFixed(2);
        addLogEntry(roomData, `${currentUser} added ${name} (x${qty}) - $${itemTotal}`);

        saveRoomData(roomData);

        // Reset form inputs
        itemName.value = '';
        itemQty.value = '1';
        itemPrice.value = '';
        itemName.focus();
    });

    // Delegate remove item button click
    cartTableBody.addEventListener('click', function (e) {
        const removeBtn = e.target.closest('.remove-item-btn');
        if (!removeBtn) return;

        const itemId = removeBtn.getAttribute('data-id');
        const roomData = getRoomData(currentRoom);

        const itemIndex = roomData.items.findIndex(item => item.id === itemId);
        if (itemIndex !== -1) {
            const removedItem = roomData.items[itemIndex];
            roomData.items.splice(itemIndex, 1);
            addLogEntry(roomData, `${currentUser} removed ${removedItem.name}`);
            saveRoomData(roomData);
        }
    });

    // Clear activity log
    clearLogBtn.addEventListener('click', function () {
        if (!currentRoom) return;
        const roomData = getRoomData(currentRoom);
        roomData.logs = [];
        addLogEntry(roomData, `${currentUser} cleared the log`);
        saveRoomData(roomData);
    });

    // ----------------------------------------------------
    // Rendering Logic
    // ----------------------------------------------------

    function updateView() {
        if (currentRoom && currentUser) {
            authSection.classList.add('d-none');
            dashboardSection.classList.remove('d-none');
            navRoomDetails.classList.remove('d-none');
            navRoomCode.textContent = currentRoom;
            navUserName.textContent = currentUser;
            renderAll();
        } else {
            authSection.classList.remove('d-none');
            dashboardSection.classList.add('d-none');
            navRoomDetails.classList.add('d-none');
        }
    }

    function renderAll() {
        if (!currentRoom) return;

        const roomData = getRoomData(currentRoom);
        const items = roomData.items || [];
        const logs = roomData.logs || [];

        // 1. Calculate Totals
        let subtotal = 0;
        const userTotals = {};

        items.forEach(item => {
            const lineTotal = item.qty * item.price;
            subtotal += lineTotal;

            if (!userTotals[item.addedBy]) {
                userTotals[item.addedBy] = { total: 0, count: 0 };
            }
            userTotals[item.addedBy].total += lineTotal;
            userTotals[item.addedBy].count += item.qty;
        });

        const isFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;
        const shippingFee = (subtotal === 0 || isFreeShipping) ? 0.00 : STANDARD_SHIPPING_FEE;
        const grandTotal = subtotal + shippingFee;

        // 2. Render Shared Cart Table
        cartTableBody.innerHTML = '';
        if (items.length === 0) {
            emptyCartMessage.classList.remove('d-none');
            itemCountBadge.textContent = '0 items';
        } else {
            emptyCartMessage.classList.add('d-none');
            itemCountBadge.textContent = `${items.length} ${items.length === 1 ? 'item' : 'items'}`;

            items.forEach((item, index) => {
                const tr = document.createElement('tr');
                const lineTotal = (item.qty * item.price).toFixed(2);
                tr.innerHTML = `
                    <td><strong>${escapeHtml(item.name)}</strong></td>
                    <td><span class="badge bg-light text-dark border">${escapeHtml(item.category)}</span></td>
                    <td class="text-center">${item.qty}</td>
                    <td class="text-end">$${item.price.toFixed(2)}</td>
                    <td class="text-end fw-semibold">$${lineTotal}</td>
                    <td>
                        <span class="badge ${item.addedBy === currentUser ? 'bg-primary' : 'bg-secondary'}">
                            ${escapeHtml(item.addedBy)}
                        </span>
                    </td>
                    <td class="text-center">
                        <button class="btn btn-outline-danger btn-sm remove-item-btn" data-id="${item.id}" title="Remove item">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                `;
                cartTableBody.appendChild(tr);
            });
        }

        // 3. Render Order Summary
        summarySubtotal.textContent = `$${subtotal.toFixed(2)}`;
        summaryShipping.textContent = isFreeShipping ? 'FREE' : `$${shippingFee.toFixed(2)}`;
        summaryGrandTotal.textContent = `$${grandTotal.toFixed(2)}`;

        // 4. Render Delivery Threshold Tracker
        thresholdCurrentTotal.textContent = `$${subtotal.toFixed(2)}`;
        const percent = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);
        thresholdProgressBar.style.width = `${percent}%`;

        if (isFreeShipping) {
            thresholdProgressBar.className = 'progress-bar bg-success';
            thresholdStatusText.className = 'badge bg-success text-white';
            thresholdStatusText.textContent = 'FREE SHIPPING UNLOCKED!';
            thresholdRemainingText.textContent = 'Goal reached! No shipping charges apply.';
        } else {
            thresholdProgressBar.className = 'progress-bar progress-bar-striped progress-bar-animated bg-primary';
            thresholdStatusText.className = 'badge bg-warning text-dark';
            const remaining = (FREE_SHIPPING_THRESHOLD - subtotal).toFixed(2);
            thresholdStatusText.textContent = `$${remaining} away from free shipping`;
            thresholdRemainingText.textContent = `Add $${remaining} more to unlock Free Shipping`;
        }

        // 5. Render Individual Expense Splitting
        expenseSplitList.innerHTML = '';
        const userKeys = Object.keys(userTotals);
        if (userKeys.length === 0) {
            expenseSplitList.innerHTML = '<li class="list-group-item text-muted small text-center py-3">No expenses added yet</li>';
        } else {
            userKeys.forEach(user => {
                const data = userTotals[user];
                // Individual shipping share (divided equally if shipping applies)
                const userShippingShare = shippingFee > 0 ? (shippingFee / userKeys.length) : 0;
                const userFinalShare = data.total + userShippingShare;

                const li = document.createElement('li');
                li.className = 'list-group-item d-flex justify-content-between align-items-center py-2 px-0';
                li.innerHTML = `
                    <div>
                        <strong>${escapeHtml(user)}</strong>
                        <div class="small text-muted">${data.count} items ($${data.total.toFixed(2)})</div>
                    </div>
                    <div class="text-end">
                        <span class="fw-bold text-primary">$${userFinalShare.toFixed(2)}</span>
                        ${shippingFee > 0 ? '<div class="text-muted" style="font-size:0.75rem;">(incl. split delivery)</div>' : ''}
                    </div>
                `;
                expenseSplitList.appendChild(li);
            });
        }

        // 6. Render Activity Log
        activityLogList.innerHTML = '';
        if (logs.length === 0) {
            activityLogList.innerHTML = '<div class="text-muted small text-center py-3">No recent activity</div>';
        } else {
            logs.forEach(log => {
                const div = document.createElement('div');
                div.className = 'activity-item d-flex justify-content-between align-items-center';
                div.innerHTML = `
                    <span>${escapeHtml(log.text)}</span>
                    <span class="activity-time ms-2">${log.time}</span>
                `;
                activityLogList.appendChild(div);
            });
        }
    }

    // Helper: Escape HTML to prevent injection
    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // ----------------------------------------------------
    // Print Receipt Generator (CSS @media print)
    // ----------------------------------------------------
    printReceiptBtn.addEventListener('click', function () {
        if (!currentRoom) return;

        const roomData = getRoomData(currentRoom);
        const items = roomData.items || [];

        if (items.length === 0) {
            alert('Your cart is empty. Add items before generating a receipt.');
            return;
        }

        // Populate receipt elements
        receiptRoomCode.textContent = currentRoom;
        const now = new Date();
        receiptDate.textContent = now.toLocaleDateString();
        receiptPrintTimestamp.textContent = now.toLocaleString();

        let subtotal = 0;
        const userTotals = {};
        receiptTableBody.innerHTML = '';

        items.forEach((item, index) => {
            const lineTotal = item.qty * item.price;
            subtotal += lineTotal;

            if (!userTotals[item.addedBy]) {
                userTotals[item.addedBy] = { total: 0, count: 0 };
            }
            userTotals[item.addedBy].total += lineTotal;
            userTotals[item.addedBy].count += item.qty;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${index + 1}</td>
                <td><strong>${escapeHtml(item.name)}</strong></td>
                <td>${escapeHtml(item.category)}</td>
                <td class="text-center">${item.qty}</td>
                <td class="text-end">$${item.price.toFixed(2)}</td>
                <td class="text-end">$${lineTotal.toFixed(2)}</td>
                <td>${escapeHtml(item.addedBy)}</td>
            `;
            receiptTableBody.appendChild(tr);
        });

        const isFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;
        const shippingFee = (subtotal === 0 || isFreeShipping) ? 0.00 : STANDARD_SHIPPING_FEE;
        const grandTotal = subtotal + shippingFee;

        receiptSubtotal.textContent = `$${subtotal.toFixed(2)}`;
        receiptShipping.textContent = isFreeShipping ? '$0.00 (FREE)' : `$${shippingFee.toFixed(2)}`;
        receiptGrandTotal.textContent = `$${grandTotal.toFixed(2)}`;

        // Splitting breakdown in receipt
        receiptSplitSummary.innerHTML = '';
        const userKeys = Object.keys(userTotals);
        const splitRow = document.createElement('div');
        splitRow.className = 'row g-2';

        userKeys.forEach(user => {
            const data = userTotals[user];
            const userShipping = shippingFee > 0 ? (shippingFee / userKeys.length) : 0;
            const userOwes = data.total + userShipping;

            const col = document.createElement('div');
            col.className = 'col-sm-6 col-md-4';
            col.innerHTML = `
                <div class="border p-2 rounded">
                    <strong>${escapeHtml(user)}</strong>
                    <div class="small text-muted">${data.count} items: $${data.total.toFixed(2)}</div>
                    <div class="fw-bold text-primary mt-1">Owes: $${userOwes.toFixed(2)}</div>
                </div>
            `;
            splitRow.appendChild(col);
        });
        receiptSplitSummary.appendChild(splitRow);

        // Make receipt visible for printing and trigger browser print dialog
        printableReceipt.classList.remove('d-none');
        window.print();
        printableReceipt.classList.add('d-none');
    });

    // Check existing session on page load
    if (currentUser && currentRoom) {
        updateView();
    }

});

