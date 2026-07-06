let currentFilter = "all";

const PACKED_KEY = "dcwPackedOrders";

const formatMoney = value =>
  `$${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;

const sum = (items, key) =>
  items.reduce((total, item) => total + Number(item[key] || 0), 0);

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function statusClass(status) {
  return String(status || "unknown").toLowerCase().replaceAll(" ", "-");
}

function getPackedMap() {
  try {
    return JSON.parse(localStorage.getItem(PACKED_KEY) || "{}");
  } catch {
    return {};
  }
}

function savePackedMap(map) {
  localStorage.setItem(PACKED_KEY, JSON.stringify(map));
}

function effectiveStatus(order) {
  if (!order) return "Unknown";
  if (order.status === "Shipped") return "Shipped";

  const packed = getPackedMap();
  return packed[order.id] ? "Packed" : order.status || "New";
}

function markOrderPacked(orderId) {
  const packed = getPackedMap();
  packed[orderId] = true;
  savePackedMap(packed);
  renderAll();
}

function unmarkOrderPacked(orderId) {
  const packed = getPackedMap();
  delete packed[orderId];
  savePackedMap(packed);
  renderAll();
}

function cleanProductName(name) {
  return String(name || "Unknown Product")
    .replace(/\s*\|\s*/g, " - ")
    .replace(/\s+/g, " ")
    .trim();
}

function inferCategory(itemName) {
  const item = String(itemName || "").toLowerCase();

  if (item.includes("talavera") || item.includes("tile") || item.includes("coaster") || item.includes("trivet")) return "Tiles + Coasters";
  if (item.includes("pothos") || item.includes("spider") || item.includes("plant") || item.includes("geranium") || item.includes("succulent")) return "Live Plants";
  if (item.includes("dragon fruit") || item.includes("cutting") || item.includes("cactus")) return "Cuttings";
  if (item.includes("shirt") || item.includes("sweatshirt") || item.includes("hoodie")) return "Apparel";
  if (item.includes("heat pack") || item.includes("box") || item.includes("shipping")) return "Supplies";

  return "Other";
}

function getProductsFromOrders() {
  return buildProductsFromOrders(dashboardData.orders || []);
}

function getCategoryStats() {
  const categories = {};

  (dashboardData.orders || []).forEach(order => {
    const category = inferCategory(order.item);
    const total = Number(order.total || 0);

    if (!categories[category]) {
      categories[category] = { name: category, orders: 0, revenue: 0 };
    }

    categories[category].orders += 1;
    categories[category].revenue += total;
  });

  return Object.values(categories).sort((a, b) => b.revenue - a.revenue);
}

function getCustomerStats() {
  const customers = {};

  (dashboardData.orders || []).forEach(order => {
    const customer = order.customer || "Etsy Customer";
    const total = Number(order.total || 0);

    if (!customers[customer]) {
      customers[customer] = { name: customer, orders: 0, revenue: 0 };
    }

    customers[customer].orders += 1;
    customers[customer].revenue += total;
  });

  return Object.values(customers).sort((a, b) => b.orders - a.orders || b.revenue - a.revenue);
}

function renderOverview() {
  const { orders, sources } = dashboardData;
  const products = getProductsFromOrders();

  const revenue = sum(orders, "total");
  const monthRevenue = sum(products, "revenue");
  const monthProfit = sum(products, "profit");
  const bestSeller = [...products].sort((a, b) => Number(b.orders || 0) - Number(a.orders || 0))[0];
  const topSource = [...sources].sort((a, b) => Number(b.sales || 0) - Number(a.sales || 0))[0];
  const newOrders = orders.filter(order => effectiveStatus(order) === "New").length;
  const averageOrder = orders.length ? revenue / orders.length : 0;

  const cards = [
    { label: "Tracked Revenue", value: formatMoney(revenue), note: `${orders.length} latest Etsy orders tracked` },
    { label: "Needs Packing", value: newOrders, note: "Ready to pull, pack, or prep" },
    { label: "Average Order", value: formatMoney(averageOrder), note: "Average value from loaded orders" },
    { label: "Estimated Profit", value: formatMoney(monthProfit), note: "Estimated from current dashboard data" },
    { label: "Best Seller", value: bestSeller ? bestSeller.name.split(" - ")[0] : "No sales yet", note: bestSeller ? `${bestSeller.orders} orders tracked` : "Waiting for order data" },
    { label: "Top Source", value: topSource ? topSource.name : "No source yet", note: topSource ? `${topSource.sales} sales attributed` : "Waiting for marketing data" }
  ];

  document.querySelector("#overview").innerHTML = cards.map(card => `
    <article class="metric-card">
      <p class="small-label">${escapeHtml(card.label)}</p>
      <strong>${escapeHtml(card.value)}</strong>
      <span>${escapeHtml(card.note)}</span>
    </article>
  `).join("");
}

function renderGoal() {
  const { current, target } = dashboardData.goal;
  const safeTarget = Number(target || 1000);
  const safeCurrent = Number(current || 0);
  const percent = Math.min((safeCurrent / safeTarget) * 100, 100);

  document.querySelector("#goalText").textContent = `${safeCurrent} / ${safeTarget}`;
  document.querySelector("#goalProgress").style.width = `${percent}%`;
}

function renderOrders() {
  const rows = dashboardData.orders.filter(order => {
    const status = effectiveStatus(order);
    if (currentFilter === "all") return true;
    return order.platform === currentFilter || status === currentFilter;
  });

  document.querySelector("#ordersTable").innerHTML = rows.length
    ? rows.map(order => {
      const status = effectiveStatus(order);
      const canPack = status !== "Shipped";

      return `
        <tr>
          <td><strong>${escapeHtml(order.id || "")}</strong></td>
          <td>${escapeHtml(order.platform || "")}</td>
          <td>${escapeHtml(order.customer || "")}</td>
          <td>${escapeHtml(order.item || "")}</td>
          <td>${formatMoney(order.total)}</td>
          <td><span class="status ${statusClass(status)}">${escapeHtml(status)}</span></td>
          <td>${escapeHtml(order.source || "")}</td>
          <td>
            <button class="ghost-button" data-action="print-slip" data-order-id="${escapeHtml(order.id)}">Print</button>
            ${
              canPack
                ? status === "Packed"
                  ? `<button class="ghost-button" data-action="unpack" data-order-id="${escapeHtml(order.id)}">Undo</button>`
                  : `<button class="primary-button" data-action="pack" data-order-id="${escapeHtml(order.id)}">Packed</button>`
                : ""
            }
          </td>
        </tr>
      `;
    }).join("")
    : `<tr><td colspan="8">No orders loaded yet. Hit refresh or reconnect Etsy.</td></tr>`;
}

function renderShippingHub() {
  const orders = dashboardData.orders || [];
  const activeOrders = orders.filter(order => effectiveStatus(order) !== "Shipped");

  document.querySelector("#shippingList").innerHTML = activeOrders.length
    ? `
      <div class="shipping-queue">
        ${activeOrders.map(order => {
          const status = effectiveStatus(order);

          return `
            <article class="shipping-card">
              <div class="shipping-main">
                <strong>${escapeHtml(order.id)}</strong>
                <span>${escapeHtml(order.customer)}</span>
                <p>${escapeHtml(order.item)}</p>
              </div>

              <div class="shipping-meta">
                <strong>${formatMoney(order.total)}</strong>
                <span class="status ${statusClass(status)}">${escapeHtml(status)}</span>
              </div>

              <div class="shipping-actions">
                <button class="ghost-button" data-action="print-slip" data-order-id="${escapeHtml(order.id)}">Print</button>
                ${
                  status === "Packed"
                    ? `<button class="ghost-button" data-action="unpack" data-order-id="${escapeHtml(order.id)}">Undo</button>`
                    : `<button class="primary-button" data-action="pack" data-order-id="${escapeHtml(order.id)}">Packed</button>`
                }
              </div>
            </article>
          `;
        }).join("")}
      </div>
    `
    : `<p class="muted">No active orders need packing.</p>`;
}

function renderSalesIntelligence() {
  const orders = dashboardData.orders || [];
  const products = getProductsFromOrders();
  const categories = getCategoryStats();
  const customers = getCustomerStats();

  const revenue = sum(orders, "total");
  const averageOrder = orders.length ? revenue / orders.length : 0;
  const repeatCustomers = customers.filter(customer => customer.orders > 1);
  const bestCategory = categories[0];
  const bestProduct = products[0];

  const cards = [
    {
      title: "Latest order revenue",
      body: `${formatMoney(revenue)} from ${orders.length} loaded orders.`
    },
    {
      title: "Average order value",
      body: `${formatMoney(averageOrder)} average order value.`
    },
    {
      title: "Top product",
      body: bestProduct ? `${bestProduct.name} — ${bestProduct.orders} orders.` : "No product data yet."
    },
    {
      title: "Repeat customers",
      body: repeatCustomers.length ? `${repeatCustomers.length} repeat customer names in the loaded orders.` : "No repeat customers in the loaded order set."
    }
  ];

  document.querySelector("#salesIntelligenceCards").innerHTML = cards.map(card => `
    <article>
      <h4>${escapeHtml(card.title)}</h4>
      <p>${escapeHtml(card.body)}</p>
    </article>
  `).join("");

  const maxCategoryRevenue = Math.max(...categories.map(category => Number(category.revenue || 0)), 1);

  document.querySelector("#categoryBreakdown").innerHTML = categories.length
    ? categories.map(category => `
      <div class="source-row">
        <div class="source-meta">
          <strong>${escapeHtml(category.name)}</strong>
          <span>${category.orders} orders · ${formatMoney(category.revenue)}</span>
        </div>
        <div class="bar-track"><span style="width: ${(Number(category.revenue || 0) / maxCategoryRevenue) * 100}%"></span></div>
      </div>
    `).join("")
    : `<p class="muted">No categories yet.</p>`;

  document.querySelector("#customerBreakdown").innerHTML = customers.length
    ? customers.slice(0, 6).map((customer, index) => `
      <div class="leaderboard-row">
        <span class="rank">#${index + 1}</span>
        <div>
          <strong>${escapeHtml(customer.name)}</strong>
          <p>${customer.orders} orders · ${formatMoney(customer.revenue)}</p>
        </div>
      </div>
    `).join("")
    : `<p class="muted">No customer data yet.</p>`;
}

function renderInventory() {
  const lowStock = dashboardData.inventory.filter(item =>
    Number(item.available || 0) <= Number(item.reorderAt || 0)
  );

  document.querySelector("#lowStockCount").textContent = `${lowStock.length} low stock`;

  document.querySelector("#inventoryGrid").innerHTML = dashboardData.inventory.length
    ? dashboardData.inventory.map(item => {
      const isLow = Number(item.available || 0) <= Number(item.reorderAt || 0);
      return `
        <article class="inventory-card ${isLow ? "is-low" : ""}">
          <div>
            <p class="small-label">${escapeHtml(item.category || "")}</p>
            <h4>${escapeHtml(item.product || "")}</h4>
          </div>
          <strong>${escapeHtml(item.available || 0)}</strong>
          <span>${isLow ? "Restock soon" : `Reorder at ${escapeHtml(item.reorderAt || 0)}`}</span>
        </article>
      `;
    }).join("")
    : `<p class="muted">No inventory rows found in Google Sheets.</p>`;
}

function renderAlerts() {
  const lowStock = dashboardData.inventory.filter(item =>
    Number(item.available || 0) <= Number(item.reorderAt || 0)
  );

  const newOrders = dashboardData.orders.filter(order => effectiveStatus(order) === "New");

  const unrepliedReviews = dashboardData.reviews.filter(review =>
    String(review.replied).toLowerCase() !== "true"
  );

  const alerts = [
    ...newOrders.map(order => ({ type: "Order", text: `${order.id} needs packing: ${order.item}` })),
    ...lowStock.map(item => ({ type: "Inventory", text: `${item.product} is low with ${item.available} left` })),
    ...unrepliedReviews.map(review => ({ type: "Review", text: `Reply to ${review.customer}'s ${review.rating}-star review` }))
  ];

  document.querySelector("#alerts").innerHTML = alerts.length
    ? alerts.slice(0, 7).map(alert => `
      <div class="alert-item">
        <span>${escapeHtml(alert.type)}</span>
        <p>${escapeHtml(alert.text)}</p>
      </div>
    `).join("")
    : `<p class="muted">No urgent action items right now.</p>`;
}

function renderSources() {
  const maxSales = Math.max(...dashboardData.sources.map(source => Number(source.sales || 0)), 1);

  document.querySelector("#sourceBars").innerHTML = dashboardData.sources.length
    ? dashboardData.sources.map(source => `
      <div class="source-row">
        <div class="source-meta">
          <strong>${escapeHtml(source.name || "")}</strong>
          <span>${source.sales || 0} sales · ${formatMoney(source.revenue)} · ${source.clicks || 0} clicks</span>
        </div>
        <div class="bar-track"><span style="width: ${(Number(source.sales || 0) / maxSales) * 100}%"></span></div>
      </div>
    `).join("")
    : `<p class="muted">No marketing rows found in Google Sheets.</p>`;
}

function renderLeaderboard() {
  const products = getProductsFromOrders();

  document.querySelector("#leaderboard").innerHTML = products.length
    ? products.map((product, index) => `
      <div class="leaderboard-row">
        <span class="rank">#${index + 1}</span>
        <div>
          <strong>${escapeHtml(product.name || "")}</strong>
          <p>${product.orders || 0} orders · ${formatMoney(product.revenue)} revenue · ${formatMoney(product.profit)} est. profit</p>
        </div>
      </div>
    `).join("")
    : `<p class="muted">No product sales yet. This will fill from orders.</p>`;
}

function renderReviews() {
  document.querySelector("#reviewsList").innerHTML = dashboardData.reviews.length
    ? dashboardData.reviews.map(review => {
      const replied = String(review.replied).toLowerCase() === "true";
      return `
        <article class="review-card">
          <div class="review-header">
            <strong>${"⭐".repeat(Number(review.rating || 0))}</strong>
            <span class="pill ${replied ? "success" : "warning"}">${replied ? "Responded" : "Needs reply"}</span>
          </div>
          <p>“${escapeHtml(review.text || "")}”</p>
          <span>${escapeHtml(review.customer || "")} · ${escapeHtml(review.product || "")}</span>
        </article>
      `;
    }).join("")
    : `<p class="muted">No reviews loaded yet.</p>`;
}

function renderReport() {
  const topSource = [...dashboardData.sources].sort((a, b) => Number(b.sales || 0) - Number(a.sales || 0))[0];
  const lowStock = dashboardData.inventory
    .filter(item => Number(item.available || 0) <= Number(item.reorderAt || 0))
    .map(item => item.product)
    .join(", ");

  const orders = dashboardData.orders || [];
  const categories = getCategoryStats();
  const topCategory = categories[0];

  const reports = [
    {
      title: "Sales momentum",
      body: `${orders.length} orders currently tracked with ${formatMoney(sum(orders, "total"))} in order revenue.`
    },
    {
      title: "Top category",
      body: topCategory ? `${topCategory.name} is leading with ${formatMoney(topCategory.revenue)}.` : "No category data yet."
    },
    {
      title: "Top marketing source",
      body: topSource ? `${topSource.name} is currently the strongest source with ${topSource.sales} sales and ${topSource.clicks} clicks.` : "No marketing source data yet."
    },
    {
      title: "Restock focus",
      body: lowStock ? `Restock or prep: ${lowStock}.` : "No urgent restock items today."
    }
  ];

  document.querySelector("#ceoReport").innerHTML = reports.map(report => `
    <article>
      <h4>${escapeHtml(report.title)}</h4>
      <p>${escapeHtml(report.body)}</p>
    </article>
  `).join("");
}

function printPackingSlips(orderIds) {
  const orders = (dashboardData.orders || []).filter(order => orderIds.includes(order.id));

  if (!orders.length) return;

  const slipHtml = orders.map(order => `
    <section class="slip">
      <h1>DCW Grows Packing Slip</h1>
      <h2>${escapeHtml(order.id)}</h2>
      <p><strong>Customer:</strong> ${escapeHtml(order.customer)}</p>
      <p><strong>Item:</strong> ${escapeHtml(order.item)}</p>
      <p><strong>Total:</strong> ${formatMoney(order.total)}</p>
      <p><strong>Status:</strong> ${escapeHtml(effectiveStatus(order))}</p>
      <p><strong>Ship By:</strong> ${escapeHtml(order.shipBy || "Needs review")}</p>
      <div class="checklist">
        <p>☐ Pull item</p>
        <p>☐ Check plant/product quality</p>
        <p>☐ Add care card / note</p>
        <p>☐ Pack safely</p>
        <p>☐ Weigh package</p>
        <p>☐ Add tracking in Etsy</p>
      </div>
    </section>
  `).join("");

  const printWindow = window.open("", "_blank");

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>DCW Grows Packing Slips</title>
        <style>
          body { font-family: Arial, sans-serif; color: #1f2b21; padding: 24px; }
          .slip { page-break-after: always; border: 2px solid #2f6f3e; border-radius: 18px; padding: 24px; margin-bottom: 24px; }
          h1 { margin: 0 0 8px; color: #2f6f3e; }
          h2 { margin: 0 0 20px; }
          p { font-size: 16px; }
          .checklist { margin-top: 24px; padding: 16px; background: #f5f1e8; border-radius: 12px; }
          @media print { body { padding: 0; } .slip { border-radius: 0; margin: 0; } }
        </style>
      </head>
      <body>${slipHtml}</body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

function printOneSlip(orderId) {
  printPackingSlips([orderId]);
}

function printUnshippedSlips() {
  const ids = (dashboardData.orders || [])
    .filter(order => effectiveStatus(order) !== "Shipped")
    .map(order => order.id);

  printPackingSlips(ids);
}

function setupFilters() {
  document.querySelectorAll(".filter").forEach(button => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".filter").forEach(item => item.classList.remove("active"));
      button.classList.add("active");
      currentFilter = button.dataset.filter;
      renderOrders();
    });
  });
}

function setupNav() {
  document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", () => {
      document.querySelectorAll(".nav-link").forEach(item => item.classList.remove("active"));
      link.classList.add("active");
    });
  });
}

function setupActions() {
  document.addEventListener("click", event => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const action = button.dataset.action;
    const orderId = button.dataset.orderId;

    if (action === "pack" && orderId) markOrderPacked(orderId);
    if (action === "unpack" && orderId) unmarkOrderPacked(orderId);
    if (action === "print-slip" && orderId) printOneSlip(orderId);
    if (action === "print-unshipped") printUnshippedSlips();
  });
}

function renderAll() {
  dashboardData.products = getProductsFromOrders();

  renderOverview();
  renderGoal();
  renderOrders();
  renderSalesIntelligence();
  renderInventory();
  renderAlerts();
  renderSources();
  renderLeaderboard();
  renderReviews();
  renderReport();
}

const refreshButton = document.querySelector("#refreshButton");
const printAllButton = document.querySelector("#printAllButton");

if (refreshButton) {
  refreshButton.addEventListener("click", async () => {
    await loadDashboardData();
    renderAll();
  });
}

if (printAllButton) {
  printAllButton.addEventListener("click", printUnshippedSlips);
}

setupFilters();
setupNav();
setupActions();

loadDashboardData()
  .then(renderAll)
  .catch(error => {
    console.error("Dashboard API error:", error);
    renderAll();
  });
