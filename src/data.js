const API_URL = "https://script.google.com/macros/s/AKfycbx1k2PAdwAAo228nFL9Na1LHOOyT2MUSgDCHxvoxbc0-iu-8NkLqyfPndqpcqNPWLuP/exec";

let dashboardData = {
  goal: { current: 0, target: 1000 },
  orders: [],
  inventory: [],
  sources: [],
  products: [],
  reviews: [],
  businessIq: {}
};

function jsonp(action) {
  return new Promise((resolve, reject) => {
    const callbackName = `dcwCallback_${action}_${Date.now()}`;
    const script = document.createElement("script");

    window[callbackName] = data => {
      resolve(data || {});
      delete window[callbackName];
      script.remove();
    };

    script.onerror = () => {
      delete window[callbackName];
      script.remove();
      reject(new Error(`JSONP failed for ${action}`));
    };

    script.src = `${API_URL}?action=${action}&callback=${callbackName}&t=${Date.now()}`;
    document.body.appendChild(script);
  });
}

async function loadDashboardData() {
  const [ordersData, statsData, businessIqData] = await Promise.all([
    jsonp("orders"),
    jsonp("stats"),
    jsonp("businessIq")
  ]);

  dashboardData.orders = ordersData.orders || [];
  dashboardData.goal = statsData.goal || { current: 0, target: 1000 };
  dashboardData.sources = statsData.sources || [];
  dashboardData.inventory = statsData.inventory || [];
  dashboardData.reviews = statsData.reviews || [];
  dashboardData.businessIq = businessIqData || {};
  dashboardData.products = statsData.products || buildProductsFromOrders(dashboardData.orders);
}

function buildProductsFromOrders(orders) {
  const products = {};

  orders.forEach(order => {
    const name = order.item || "Unknown Item";
    const total = Number(order.total || 0);

    if (!products[name]) {
      products[name] = { name, orders: 0, revenue: 0, profit: 0 };
    }

    products[name].orders += 1;
    products[name].revenue += total;
    products[name].profit += total * 0.6;
  });

  return Object.values(products).sort((a, b) => b.orders - a.orders);
}
