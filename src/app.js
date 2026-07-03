let currentFilter = 'all';

const formatMoney = value => `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const sum = (items, key) => items.reduce((total, item) => total + item[key], 0);

function statusClass(status) {
  return status.toLowerCase().replaceAll(' ', '-');
}

function renderOverview() {
  const { orders, products } = dashboardData;
  const revenue = sum(orders, 'total');
  const monthRevenue = sum(products, 'revenue');
  const monthProfit = sum(products, 'profit');
  const bestSeller = [...products].sort((a, b) => b.orders - a.orders)[0];
  const newOrders = orders.filter(order => order.status === 'New').length;

  const cards = [
    { label: 'Today Revenue', value: formatMoney(revenue), note: `${orders.length} orders across Etsy + Shopify` },
    { label: 'New Orders', value: newOrders, note: 'Ready to pull, pack, or prep' },
    { label: 'Month Revenue', value: formatMoney(monthRevenue), note: `${products.length} active product lines tracked` },
    { label: 'Estimated Profit', value: formatMoney(monthProfit), note: 'Mock estimate before monthly overhead' },
    { label: 'Best Seller', value: bestSeller.name.split(' - ')[0], note: `${bestSeller.orders} orders this month` },
    { label: 'Top Source', value: dashboardData.sources[0].name, note: `${dashboardData.sources[0].sales} sales attributed` }
  ];

  document.querySelector('#overview').innerHTML = cards.map(card => `
    <article class="metric-card">
      <p class="small-label">${card.label}</p>
      <strong>${card.value}</strong>
      <span>${card.note}</span>
    </article>
  `).join('');
}

function renderGoal() {
  const { current, target } = dashboardData.goal;
  const percent = Math.min((current / target) * 100, 100);
  document.querySelector('#goalText').textContent = `${current} / ${target}`;
  document.querySelector('#goalProgress').style.width = `${percent}%`;
}

function renderOrders() {
  const rows = dashboardData.orders.filter(order => {
    if (currentFilter === 'all') return true;
    return order.platform === currentFilter || order.status === currentFilter;
  });

  document.querySelector('#ordersTable').innerHTML = rows.map(order => `
    <tr>
      <td><strong>${order.id}</strong></td>
      <td>${order.platform}</td>
      <td>${order.customer}</td>
      <td>${order.item}</td>
      <td>${formatMoney(order.total)}</td>
      <td><span class="status ${statusClass(order.status)}">${order.status}</span></td>
      <td>${order.source}</td>
    </tr>
  `).join('');
}

function renderInventory() {
  const lowStock = dashboardData.inventory.filter(item => item.available <= item.reorderAt);
  document.querySelector('#lowStockCount').textContent = `${lowStock.length} low stock`;

  document.querySelector('#inventoryGrid').innerHTML = dashboardData.inventory.map(item => {
    const isLow = item.available <= item.reorderAt;
    return `
      <article class="inventory-card ${isLow ? 'is-low' : ''}">
        <div>
          <p class="small-label">${item.category}</p>
          <h4>${item.product}</h4>
        </div>
        <strong>${item.available}</strong>
        <span>${isLow ? 'Restock soon' : `Reorder at ${item.reorderAt}`}</span>
      </article>
    `;
  }).join('');
}

function renderAlerts() {
  const lowStock = dashboardData.inventory.filter(item => item.available <= item.reorderAt);
  const newOrders = dashboardData.orders.filter(order => order.status === 'New');
  const unrepliedReviews = dashboardData.reviews.filter(review => !review.replied);

  const alerts = [
    ...newOrders.map(order => ({ type: 'Order', text: `${order.id} needs packing: ${order.item}` })),
    ...lowStock.map(item => ({ type: 'Inventory', text: `${item.product} is low with ${item.available} left` })),
    ...unrepliedReviews.map(review => ({ type: 'Review', text: `Reply to ${review.customer}'s ${review.rating}-star review` }))
  ];

  document.querySelector('#alerts').innerHTML = alerts.slice(0, 7).map(alert => `
    <div class="alert-item">
      <span>${alert.type}</span>
      <p>${alert.text}</p>
    </div>
  `).join('');
}

function renderSources() {
  const maxSales = Math.max(...dashboardData.sources.map(source => source.sales));
  document.querySelector('#sourceBars').innerHTML = dashboardData.sources.map(source => `
    <div class="source-row">
      <div class="source-meta">
        <strong>${source.name}</strong>
        <span>${source.sales} sales · ${formatMoney(source.revenue)} · ${source.clicks} clicks</span>
      </div>
      <div class="bar-track"><span style="width: ${(source.sales / maxSales) * 100}%"></span></div>
    </div>
  `).join('');
}

function renderLeaderboard() {
  document.querySelector('#leaderboard').innerHTML = dashboardData.products.map((product, index) => `
    <div class="leaderboard-row">
      <span class="rank">#${index + 1}</span>
      <div>
        <strong>${product.name}</strong>
        <p>${product.orders} orders · ${formatMoney(product.revenue)} revenue · ${formatMoney(product.profit)} est. profit</p>
      </div>
    </div>
  `).join('');
}

function renderReviews() {
  document.querySelector('#reviewsList').innerHTML = dashboardData.reviews.map(review => `
    <article class="review-card">
      <div class="review-header">
        <strong>${'⭐'.repeat(review.rating)}</strong>
        <span class="pill ${review.replied ? 'success' : 'warning'}">${review.replied ? 'Responded' : 'Needs reply'}</span>
      </div>
      <p>“${review.text}”</p>
      <span>${review.customer} · ${review.product}</span>
    </article>
  `).join('');
}

function renderReport() {
  const pinterest = dashboardData.sources.find(source => source.name === 'Pinterest');
  const etsy = dashboardData.sources.find(source => source.name === 'Etsy Search');
  const lowStock = dashboardData.inventory.filter(item => item.available <= item.reorderAt).map(item => item.product).join(', ');

  const reports = [
    { title: 'Sales momentum', body: `${sum(dashboardData.products, 'orders')} product orders tracked this month with ${formatMoney(sum(dashboardData.products, 'revenue'))} in mock revenue.` },
    { title: 'Pinterest signal', body: `Pinterest is currently the strongest source with ${pinterest.sales} sales and ${pinterest.clicks} clicks.` },
    { title: 'Etsy search', body: `Etsy Search brought ${etsy.sales} sales, which means listing SEO is still doing work.` },
    { title: 'Restock focus', body: lowStock ? `Restock or prep: ${lowStock}.` : 'No urgent restock items today.' }
  ];

  document.querySelector('#ceoReport').innerHTML = reports.map(report => `
    <article>
      <h4>${report.title}</h4>
      <p>${report.body}</p>
    </article>
  `).join('');
}

function simulateOrder() {
  const randomId = `ET-${Math.floor(1050 + Math.random() * 899)}`;
  dashboardData.orders.unshift({
    id: randomId,
    platform: Math.random() > 0.35 ? 'Etsy' : 'Shopify',
    customer: 'New Customer',
    item: 'Spider Plant - 4 inch pot',
    total: 17.99,
    status: 'New',
    source: Math.random() > 0.5 ? 'Pinterest' : 'Etsy Search'
  });
  dashboardData.goal.current += 1;
  renderAll();
}

function setupFilters() {
  document.querySelectorAll('.filter').forEach(button => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.filter').forEach(item => item.classList.remove('active'));
      button.classList.add('active');
      currentFilter = button.dataset.filter;
      renderOrders();
    });
  });
}

function setupNav() {
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      document.querySelectorAll('.nav-link').forEach(item => item.classList.remove('active'));
      link.classList.add('active');
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

document.querySelector('#newOrderButton').addEventListener('click', simulateOrder);
document.querySelector('#refreshButton').addEventListener('click', renderAll);
setupFilters();
setupNav();
loadDashboardData()
  .then(renderAll)
  .catch(error => {
    console.error("Dashboard API error:", error);
    renderAll();
  });
