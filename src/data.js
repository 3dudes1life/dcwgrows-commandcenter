const API_URL = "https://script.google.com/macros/s/AKfycbyTxolAcNcnB1quGqPz6RQuhAxTXOrn34FmYfdx0VKtzOktU6k23f7rkO4nwWW3Gqv4iA/exec";

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

async function loadDashboardData() {
  const [ordersResponse, statsResponse] = await Promise.all([
    fetch(`${API_URL}?action=mockOrders`),
    fetch(`${API_URL}?action=mockStats`)
  ]);

  const ordersData = await ordersResponse.json();
  const statsData = await statsResponse.json();

  dashboardData.orders = ordersData.orders || [];
  dashboardData.goal = statsData.goal || dashboardData.goal;
  dashboardData.sources = statsData.sources || [];
  dashboardData.inventory = statsData.inventory || [];
}
