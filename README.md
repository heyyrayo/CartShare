# CartShare - Collaborative Shopping Ecosystem

CartShare is a collaborative web application designed for shared living and working spaces (roommates, student dorms, office teams). It allows multiple users to coordinate joint grocery and supply orders in real-time, track progress toward delivery thresholds, split costs transparently, and generate printable audit receipts.

---

## 🌟 Key Features

1. **Room-Based Collaboration:**
   - Create or join shared shopping rooms using unique codes (e.g. `DORM101`).
   - Multiple users can join the same room and shop together.

2. **Real-Time Multi-Tab Synchronization:**
   - Synchronizes cart updates, item removals, and user actions across multiple browser tabs in real-time using native JavaScript `storage` event listeners.

3. **Delivery Threshold Progress Tracker:**
   - Visual progress bar showing real-time progress toward the **$75.00 Free Delivery Goal**.
   - Dynamically calculates the remaining amount required to eliminate shipping fees.

4. **Transparent Cost Splitting:**
   - Automatic expense breakdown showing exactly what each participant ordered and what they owe (including equal split of delivery charges if applicable).

5. **Live Activity Feed:**
   - Chronological log of participant actions (e.g., who added which item, who joined or left the room).

6. **Audit-Ready Printable Receipt:**
   - Print-optimized CSS (`@media print`) that formats an itemized summary, room code, date, total, and individual contributor breakdown.

---

## 🛠️ Built With

- **HTML5:** Semantic layout and accessible form inputs.
- **CSS3 & Bootstrap 5:** Responsive Grid and Flexbox layout for mobile and desktop screens.
- **JavaScript (Vanilla ES6):** State persistence via `localStorage`, real-time tab sync with `window.addEventListener('storage')`, and DOM manipulation.
- **Print API:** CSS print media styling for group receipts.

---
