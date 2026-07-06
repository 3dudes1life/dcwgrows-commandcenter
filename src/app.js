let currentFilter = "all";

const formatMoney = value =>
  `$${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;

const sum = (items, key) =>
  items.reduce((total, item) => total + Number(item[key] || 0), 0);

function statusClass(status) {
  return String(status || "unknown").toLowerCase().replaceAll(" ", "-");
}

function renderOverview() {
  const { orders, products, sources } = dashboardData;

  const revenue = sum(orders, "total");
  const monthRevenue = sum(products, "revenue");
  const monthProfit = sum(products, "profit");
  const bestSeller = [...products].sort((a, b) => Number(b.orders || 0) - Number(a.orders || 0))[0];
  const topSource = [...sources].sort((a, b) => Number(b.sales || 0) - Number(a.sales || 0))[0];
  const newOrders = orders.filter(order => order.status === "New").length;

  const cards = [
    { label: "Today Revenue", value: formatMoney(revenue), note: `${orders.length} orders across Etsy + Shopify` },
    { label: "New Orders", value: newOrders, note: "Ready to pull, pack, or prep" },
    { label: "Month Revenue", value: formatMoney(monthRevenue), note: `${products.length} active product lines tracked` },
    { label: "Estimated Profit", value: formatMoney(monthProfit), note: "Estimated from current dashboard data" },
    { label: "Best Seller", value: bestSeller ? bestSeller.name.split(" - ")[0] : "No sales yet", note: bestSeller ? `${bestSeller.orders} orders tracked` : "Waiting for order data" },
    { label: "Top Source", value: topSource ? topSource.name : "No source yet", note: topSource ? `${topSource.sales} sales attributed` : "Waiting for marketing data" }
  ];

  document.querySelector("#overview").innerHTML = cards.map(card => `
    <article class="metric-card">
      <p class="small-label">${card.label}</p>
      <strong>${card.value}</strong>
      <span>${card.note}</span>
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
    if (currentFilter === "all") return true;
    return order.platform === currentFilter || order.status === currentFilter;
  });

  document.querySelector("#ordersTable").innerHTML = rows.length
    ? rows.map(order => `
      <tr>
        <td><strong>${order.id || ""}</strong></td>
        <td>${order.platform || ""}</td>
        <td>${order.customer || ""}</td>
        <td>${order.item || ""}</td>
        <td>${formatMoney(order.total)}</td>
        <td><span class="status ${statusClass(order.status)}">${order.status || "Unknown"}</span></td>
        <td>${order.source || ""}</td>
      </tr>
    `).join("")
    : `<tr><td colspan="7">No orders loaded yet. Etsy connection is next.</td></tr>`;
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
            <p class="small-label">${item.category || ""}</p>
            <h4>${item.product || ""}</h4>
          </div>
          <strong>${item.available || 0}</strong>
          <span>${isLow ? "Restock soon" : `Reorder at ${item.reorderAt || 0}`}</span>
        </article>
      `;
    }).join("")
    : `<p class="muted">No inventory rows found in Google Sheets.</p>`;
}

function renderAlerts() {
  const lowStock = dashboardData.inventory.filter(item =>
    Number(item.available || 0) <= Number(item.reorderAt || 0)
  );
  const newOrders = dashboardData.orders.filter(order => order.status === "New");
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
        <span>${alert.type}</span>
        <p>${alert.text}</p>
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
          <strong>${source.name || ""}</strong>
          <span>${source.sales || 0} sales · ${formatMoney(source.revenue)} · ${source.clicks || 0} clicks</span>
        </div>
        <div class="bar-track"><span style="width: ${(Number(source.sales || 0) / maxSales) * 100}%"></span></div>
      </div>
    `).join("")
    : `<p class="muted">No marketing rows found in Google Sheets.</p>`;
}

function renderLeaderboard() {
  document.querySelector("#leaderboard").innerHTML = dashboardData.products.length
    ? dashboardData.products.map((product, index) => `
      <div class="leaderboard-row">
        <span class="rank">#${index + 1}</span>
        <div>
          <strong>${product.name || ""}</strong>
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
          <p>“${review.text || ""}”</p>
          <span>${review.customer || ""} · ${review.product || ""}</span>
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

  const reports = [
    {
      title: "Sales momentum",
      body: `${dashboardData.orders.length} orders currently tracked with ${formatMoney(sum(dashboardData.orders, "total"))} in order revenue.`
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
      <h4>${report.title}</h4>
      <p>${report.body}</p>
    </article>
  `).join("");
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

function renderAll() {
  renderOverview();
  renderGoal();
  renderOrders();
  renderInventory();
  renderAlerts();
  renderSources();
  renderLeaderboard();
  renderReviews();
  renderReport();
}

const refreshButton = document.querySelector("#refreshButton");

if (refreshButton) {
  refreshButton.addEventListener("click", async () => {
    await loadDashboardData();
    renderAll();
  });
}

setupFilters();
setupNav();

loadDashboardData()
  .then(renderAll)
  .catch(error => {
    console.error("Dashboard API error:", error);
    renderAll();
  });
