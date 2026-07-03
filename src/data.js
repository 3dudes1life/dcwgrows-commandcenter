const API_URL = "https://script.google.com/macros/s/AKfycbyTxolAcNcnB1quGqPz6RQuhAxTXOrn34FmYfdx0VKtzOktU6k23f7rkO4nwWW3Gqv4iA/exec";

let dashboardData = {
  goal: { current: 794, target: 1000 },
  orders: [
    { id: "ET-1048", platform: "Etsy", customer: "Megan R.", item: "Spider Plant - 4 inch pot", total: 17.99, status: "New", source: "Pinterest", shipBy: "Tomorrow" },
    { id: "ET-1047", platform: "Etsy", customer: "Jasmine P.", item: "Talavera Coaster Set - 6 Pack", total: 16.99, status: "Pull Product", source: "Etsy Search", shipBy: "2 days" },
    { id: "SH-2210", platform: "Shopify", customer: "Andre M.", item: "Dragon Fruit Cutting - 2 Pack", total: 34.99, status: "Packed", source: "Instagram", shipBy: "Today" }
  ],
  inventory: [
    { product: "Spider Plants", available: 47, reorderAt: 12, category: "Live Plants" },
    { product: "Dragon Fruit Cuttings", available: 21, reorderAt: 10, category: "Live Plants" },
    { product: "Pothos", available: 14, reorderAt: 10, category: "Live Plants" },
    { product: "Red Geraniums", available: 32, reorderAt: 12, category: "Live Plants" },
    { product: "Shipping Boxes", available: 11, reorderAt: 15, category: "Supplies" },
    { product: "Heat Packs", available: 5, reorderAt: 12, category: "Supplies" }
  ],
  sources: [
    { name: "Pinterest", sales: 37, revenue: 542, clicks: 1280 },
    { name: "Etsy Search", sales: 22, revenue: 317, clicks: 840 },
    { name: "Instagram", sales: 7, revenue: 109, clicks: 210 },
    { name: "Google", sales: 5, revenue: 91, clicks: 190 },
    { name: "Shopify Direct", sales: 4, revenue: 73, clicks: 96 }
  ],
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
  try {
    const [ordersResponse, statsResponse] = await Promise.all([
      fetch(`${API_URL}?action=mockOrders`),
      fetch(`${API_URL}?action=mockStats`)
    ]);

    if (!ordersResponse.ok || !statsResponse.ok) {
      throw new Error("Dashboard API did not return OK.");
    }

    const ordersData = await ordersResponse.json();
    const statsData = await statsResponse.json();

    dashboardData.orders = ordersData.orders || dashboardData.orders;
    dashboardData.goal = statsData.goal || dashboardData.goal;
    dashboardData.sources = statsData.sources || dashboardData.sources;
    dashboardData.inventory = statsData.inventory || dashboardData.inventory;
  } catch (error) {
    console.warn("Using fallback dashboard data:", error);
  }
}
