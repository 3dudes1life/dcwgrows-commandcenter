const API_URL = "https://script.google.com/macros/s/AKfycbx1k2PAdwAAo228nFL9Na1LHOOyT2MUSgDCHxvoxbc0-iu-8NkLqyfPndqpcqNPWLuP/exec";

let dashboardData = {
  goal: { current: 794, target: 1000 },
  orders: [],
  inventory: [],
  sources: [],
  products: [
    { name: "Spider Plant - 4 inch pot", orders: 41, revenue: 737.59, profit: 466.20 },
    { name: "Dragon Fruit Cutting - 2 Pack", orders: 28, revenue: 979.72, profit: 612.30 },
    { name: "Talavera Coaster Sets", orders: 22, revenue: 373.78, profit: 190.40 },
    { name: "Pothos - 4 inch pot", orders: 19, revenue: 341.81, profit: 207.90 },
    { name: "Red Geraniums", orders: 13, revenue: 129.87, profit: 72.20 }
  ],
  reviews: [
    { customer: "Alicia", rating: 5, product: "Spider Plant", text: "Arrived healthy and packed perfectly. Already putting out new growth!", replied: false },
    { customer: "Trevor", rating: 5, product: "Talavera Coasters", text: "Beautiful colors and exactly what my patio table needed.", replied: true },
    { customer: "Monica", rating: 4, product: "Dragon Fruit Cutting", text: "Healthy cutting and clear instructions. Excited to grow it!", replied: false }
  ]
};

function jsonp(action) {
  return new Promise((resolve, reject) => {
    const callbackName = `dcwCallback_${action}_${Date.now()}`;
    const script = document.createElement("script");

    window[callbackName] = data => {
      resolve(data);
      delete window[callbackName];
      script.remove();
    };

    script.onerror = () => {
      delete window[callbackName];
      script.remove();
      reject(new Error(`JSONP failed for ${action}`));
    };

    script.src = `${API_URL}?action=${action}&callback=${callbackName}`;
    document.body.appendChild(script);
  });
}

async function loadDashboardData() {
  try {
  const [ordersData, statsData] = await Promise.all([
  jsonp("orders"),
  jsonp("stats")
  ]);

    dashboardData.orders = ordersData.orders || dashboardData.orders;
    dashboardData.goal = statsData.goal || dashboardData.goal;
    dashboardData.sources = statsData.sources || dashboardData.sources;
    dashboardData.inventory = statsData.inventory || dashboardData.inventory;
  } catch (error) {
    console.warn("Using fallback dashboard data:", error);
  }
}
