const dashboardData = {
  goal: {
    current: 794,
    target: 1000
  },
  orders: [
    { id: 'ET-1048', platform: 'Etsy', customer: 'Megan R.', item: 'Spider Plant - 4 inch pot', total: 17.99, status: 'New', source: 'Pinterest' },
    { id: 'ET-1047', platform: 'Etsy', customer: 'Jasmine P.', item: 'Talavera Coaster Set - 6 Pack', total: 16.99, status: 'Pull Plant', source: 'Etsy Search' },
    { id: 'SH-2210', platform: 'Shopify', customer: 'Andre M.', item: 'Dragon Fruit Cutting - 2 Pack', total: 34.99, status: 'Packed', source: 'Instagram' },
    { id: 'ET-1046', platform: 'Etsy', customer: 'Kelsey T.', item: 'Pothos - 4 inch pot', total: 17.99, status: 'Shipped', source: 'Etsy Search' },
    { id: 'SH-2209', platform: 'Shopify', customer: 'Lena S.', item: 'Red Geranium - 2 Pack', total: 19.98, status: 'New', source: 'Google' },
    { id: 'ET-1045', platform: 'Etsy', customer: 'Carlos V.', item: 'Broken Talavera Tile Shards', total: 22.50, status: 'Packed', source: 'Pinterest' }
  ],
  inventory: [
    { product: 'Spider Plants', available: 47, reorderAt: 12, category: 'Live Plants' },
    { product: 'Dragon Fruit Cuttings', available: 21, reorderAt: 10, category: 'Live Plants' },
    { product: 'Pothos', available: 14, reorderAt: 10, category: 'Live Plants' },
    { product: 'Red Geraniums', available: 32, reorderAt: 12, category: 'Live Plants' },
    { product: 'Talavera Coaster Sets', available: 18, reorderAt: 8, category: 'Tiles' },
    { product: '6x6 Trivets', available: 6, reorderAt: 8, category: 'Tiles' },
    { product: 'Shipping Boxes', available: 11, reorderAt: 15, category: 'Supplies' },
    { product: 'Heat Packs', available: 5, reorderAt: 12, category: 'Supplies' }
  ],
  sources: [
    { name: 'Pinterest', sales: 37, revenue: 542, clicks: 1280 },
    { name: 'Etsy Search', sales: 22, revenue: 317, clicks: 840 },
    { name: 'Instagram', sales: 7, revenue: 109, clicks: 210 },
    { name: 'Google', sales: 5, revenue: 91, clicks: 190 },
    { name: 'Shopify Direct', sales: 4, revenue: 73, clicks: 96 },
    { name: 'Facebook', sales: 2, revenue: 34, clicks: 72 }
  ],
  products: [
    { name: 'Spider Plant - 4 inch pot', orders: 41, revenue: 737.59, profit: 466.20 },
    { name: 'Dragon Fruit Cutting - 2 Pack', orders: 28, revenue: 979.72, profit: 612.30 },
    { name: 'Talavera Coaster Sets', orders: 22, revenue: 373.78, profit: 190.40 },
    { name: 'Pothos - 4 inch pot', orders: 19, revenue: 341.81, profit: 207.90 },
    { name: 'Red Geraniums', orders: 13, revenue: 129.87, profit: 72.20 }
  ],
  reviews: [
    { customer: 'Alicia', rating: 5, product: 'Spider Plant', text: 'Arrived healthy and packed perfectly. Already putting out new growth!', replied: false },
    { customer: 'Trevor', rating: 5, product: 'Talavera Coasters', text: 'Beautiful colors and exactly what my patio table needed.', replied: true },
    { customer: 'Monica', rating: 4, product: 'Dragon Fruit Cutting', text: 'Healthy cutting and clear instructions. Excited to grow it!', replied: false }
  ]
};
