import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'greenpart_super_secret_key_2026';

app.use(cors());
app.use(express.json());

// --- TYPES ---
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

// --- MIDDLEWARE ---
const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Authorization header missing' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Access denied. Admins only.' });
  }
  next();
};

// --- AUTH ROUTES ---
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, role } = req.body;
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: { email, passwordHash, name, role: role || 'STAFF' }
    });
    
    // Don't send hash back
    const { passwordHash: _, ...safeUser } = user;
    res.json(safeUser);
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '1d' });
    
    const { passwordHash, ...safeUser } = user;
    res.json({ token, user: safeUser });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/auth/me', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const { passwordHash, ...safeUser } = user;
    res.json(safeUser);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// --- GODOWN ROUTES ---
app.get('/api/godowns', authenticate, async (req, res) => {
  try {
    const godowns = await prisma.godown.findMany({
      include: {
        stocks: true
      }
    });
    res.json(godowns);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch godowns' });
  }
});

app.post('/api/godowns', authenticate, async (req, res) => {
  try {
    const godown = await prisma.godown.create({
      data: req.body
    });
    res.json(godown);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create godown' });
  }
});

// --- PRODUCT ROUTES ---
app.get('/api/products', authenticate, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const search = (req.query.search as string) || '';
    const category = (req.query.category as string) || '';
    const godownId = (req.query.godownId as string) || '';
    
    const skip = (page - 1) * limit;

    const whereClause: any = {};
    
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (category) {
      whereClause.category = category;
    }
    
    if (godownId) {
      whereClause.stocks = { some: { godownId } };
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: whereClause,
        include: { stocks: true },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.product.count({ where: whereClause })
    ]);

    // Dynamically compute global quantity from stocks
    const formatted = products.map(p => ({
      ...p,
      quantity: p.stocks.reduce((sum, s) => sum + s.quantity, 0)
    }));
    
    res.json({
      data: formatted,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.get('/api/dashboard/stats', authenticate, async (req, res) => {
  try {
    // Fetch minimal data needed to compute dashboard aggregates
    const products = await prisma.product.findMany({
      select: {
        category: true,
        minStock: true,
        price: true,
        stocks: {
          select: {
            quantity: true
          }
        }
      }
    });

    let totalProducts = products.length;
    let lowStockItems = 0;
    let totalValue = 0;
    const categoryData: Record<string, number> = {};

    products.forEach(p => {
      const quantity = p.stocks.reduce((sum, s) => sum + s.quantity, 0);
      
      if (quantity <= p.minStock) {
        lowStockItems++;
      }
      
      totalValue += quantity * p.price;
      
      categoryData[p.category] = (categoryData[p.category] || 0) + quantity;
    });

    const unreadAlerts = await prisma.inventoryAlert.count({
      where: { isRead: false }
    });

    res.json({
      totalProducts,
      lowStockItems,
      totalValue,
      unreadAlerts,
      categoryData
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

app.post('/api/products', authenticate, async (req, res) => {
  try {
    const { godownId, quantity, ...productData } = req.body;
    
    // Create product inside a transaction if initial stock is provided
    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: productData
      });

      if (godownId && quantity > 0) {
        await tx.godownStock.create({
          data: {
            productId: product.id,
            godownId,
            quantity
          }
        });

        await tx.stockMovement.create({
          data: {
            productId: product.id,
            godownId,
            userId: req.user.id,
            type: 'IN',
            quantity,
            reason: 'Initial Stock',
            reference: 'SYSTEM'
          }
        });
      }

      return await tx.product.findUnique({
        where: { id: product.id },
        include: { stocks: true }
      });
    });

    res.json({
      ...result,
      quantity: result?.stocks.reduce((sum, s) => sum + s.quantity, 0) || 0
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create product' });
  }
});

app.put('/api/products/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, stocks, ...updateData } = req.body;
    
    const product = await prisma.product.update({
      where: { id },
      data: updateData,
      include: { stocks: true }
    });
    
    res.json({
      ...product,
      quantity: product.stocks.reduce((sum, s) => sum + s.quantity, 0)
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update product' });
  }
});

app.delete('/api/products/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.product.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// --- STOCK MOVEMENT ---
app.post('/api/movements', authenticate, async (req, res) => {
  try {
    const { productId, godownId, type, quantity, reason, reference } = req.body;
    
    const result = await prisma.$transaction(async (tx) => {
      const movement = await tx.stockMovement.create({
        data: {
          productId,
          godownId,
          userId: req.user.id,
          type,
          quantity: parseInt(quantity),
          reason,
          reference: reference || ''
        }
      });

      const stock = await tx.godownStock.findUnique({
        where: { godownId_productId: { godownId, productId } }
      });

      const currentQty = stock?.quantity || 0;
      const parsedQty = parseInt(quantity);
      const newQty = type === 'IN' ? currentQty + parsedQty : currentQty - parsedQty;

      // Check capacity for IN movements
      if (type === 'IN') {
        const godown = await tx.godown.findUnique({
          where: { id: godownId },
          include: { stocks: true }
        });
        if (godown) {
          const totalGodownUnits = godown.stocks.reduce((acc, s) => acc + s.quantity, 0);
          if (totalGodownUnits + parsedQty > godown.capacity) {
            throw new Error(`Exceeds Godown Capacity. Available space: ${godown.capacity - totalGodownUnits}`);
          }
        }
      }

      if (stock) {
        await tx.godownStock.update({
          where: { id: stock.id },
          data: { quantity: newQty }
        });
      } else {
        await tx.godownStock.create({
          data: { godownId, productId, quantity: newQty }
        });
      }

      return movement;
    });

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to record movement' });
  }
});

app.get('/api/movements', authenticate, async (req, res) => {
  try {
    const movements = await prisma.stockMovement.findMany({
      include: {
        product: { select: { name: true, sku: true } },
        godown: { select: { name: true } },
        user: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 50 // Limit for performance
    });
    res.json(movements);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch movements' });
  }
});

// --- ANALYTICS ---
app.get('/api/analytics/overview', authenticate, requireAdmin, async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        category: true,
        minStock: true,
        price: true,
        cost: true,
        stocks: {
          select: {
            quantity: true,
            godown: { select: { name: true } }
          }
        }
      }
    });

    let totalProducts = products.length;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let totalValue = 0;
    const categoryData: Record<string, { quantity: number; value: number; products: number }> = {};
    const godownValues: Record<string, number> = {};

    const productsWithValue = products.map(p => {
      let quantity = 0;
      
      for (const stock of p.stocks) {
        quantity += stock.quantity;
        const val = stock.quantity * p.cost;
        if (stock.godown?.name) {
          godownValues[stock.godown.name] = (godownValues[stock.godown.name] || 0) + val;
        }
      }
      
      if (quantity === 0) outOfStockCount++;
      else if (quantity <= p.minStock) lowStockCount++;
      
      const totalProdValue = quantity * p.cost;
      totalValue += totalProdValue;
      
      if (!categoryData[p.category]) {
        categoryData[p.category] = { quantity: 0, value: 0, products: 0 };
      }
      categoryData[p.category].quantity += quantity;
      categoryData[p.category].value += totalProdValue;
      categoryData[p.category].products += 1;

      return {
        id: p.id,
        name: p.name,
        category: p.category,
        quantity,
        totalValue: totalProdValue,
        cost: p.cost,
        price: p.price,
        minStock: p.minStock
      };
    });

    const topProductsByValue = productsWithValue
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 10);

    const categoryChartData = Object.entries(categoryData).map(([category, data]) => ({
      category,
      quantity: data.quantity,
      value: data.value,
      products: data.products,
    }));

    const godownValueDistribution = Object.entries(godownValues).map(([name, value]) => ({
      name,
      value
    }));

    const stockStatusData = [
      { name: 'In Stock', value: totalProducts - lowStockCount - outOfStockCount, color: '#10B981' },
      { name: 'Low Stock', value: lowStockCount, color: '#F59E0B' },
      { name: 'Out of Stock', value: outOfStockCount, color: '#EF4444' },
    ];

    // Fast moving goods & Outbound Value
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const outMovements = await prisma.stockMovement.groupBy({
      by: ['productId'],
      where: {
        type: 'OUT',
        createdAt: { gte: thirtyDaysAgo }
      },
      _sum: { quantity: true }
    });
    
    let totalOutboundValue = 0;
    const productOutboundMap = new Map();

    const fastMovingGoodsData = await Promise.all(outMovements.map(async m => {
      const p = await prisma.product.findUnique({ where: { id: m.productId }, select: { name: true, sku: true, category: true, price: true } });
      const qty = m._sum.quantity || 0;
      if (p) {
        totalOutboundValue += qty * p.price;
        productOutboundMap.set(m.productId, qty);
      }
      return {
        id: m.productId,
        ...p,
        quantityOut: qty
      };
    }));

    const fastMovingGoods = fastMovingGoodsData
      .sort((a, b) => b.quantityOut - a.quantityOut)
      .slice(0, 10);

    const inventoryTurnover = totalValue > 0 ? (totalOutboundValue / totalValue) : 0;

    // Slowest moving goods (High inventory value, low/zero outbound)
    const slowestMovingGoods = productsWithValue
      .map(p => ({
        ...p,
        quantityOut: productOutboundMap.get(p.id) || 0
      }))
      .filter(p => p.quantity > 0) // Must have stock
      .sort((a, b) => {
        // Sort by lowest outbound first, then by highest inventory value
        if (a.quantityOut === b.quantityOut) {
          return b.totalValue - a.totalValue; 
        }
        return a.quantityOut - b.quantityOut;
      })
      .slice(0, 10);

    // Inventory Aging
    const latestMovements = await prisma.stockMovement.groupBy({
      by: ['productId'],
      _max: { createdAt: true }
    });

    const lastMovementMap = new Map();
    latestMovements.forEach(m => {
      lastMovementMap.set(m.productId, m._max.createdAt);
    });

    const now = new Date().getTime();
    let freshValue = 0;
    let slowValue = 0;
    let stagnantValue = 0;
    let deadValue = 0;

    productsWithValue.forEach(p => {
      const lastMoved = lastMovementMap.get(p.id);
      if (!lastMoved) {
        deadValue += p.totalValue; // Never moved
      } else {
        const daysSinceMove = (now - new Date(lastMoved).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceMove <= 30) freshValue += p.totalValue;
        else if (daysSinceMove <= 90) slowValue += p.totalValue;
        else if (daysSinceMove <= 180) stagnantValue += p.totalValue;
        else deadValue += p.totalValue;
      }
    });

    const agingReport = [
      { name: 'Fresh (<30d)', value: freshValue, color: '#10B981' },
      { name: 'Slow (31-90d)', value: slowValue, color: '#F59E0B' },
      { name: 'Stagnant (91-180d)', value: stagnantValue, color: '#F97316' },
      { name: 'Dead (>180d)', value: deadValue, color: '#EF4444' }
    ];

    // Dead Stock (Products with no movements in last 90 days count)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const deadStockCount = await prisma.product.count({
      where: {
        stockMovements: {
          none: {
            createdAt: { gte: ninetyDaysAgo }
          }
        }
      }
    });

    const recentMovements = await prisma.stockMovement.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { type: true, quantity: true, createdAt: true }
    });

    res.json({
      totalProducts,
      totalValue,
      lowStockCount,
      outOfStockCount,
      deadStockCount,
      categoryChartData,
      topProductsByValue,
      stockStatusData,
      godownValueDistribution,
      fastMovingGoods,
      slowestMovingGoods,
      inventoryTurnover,
      agingReport,
      recentMovements
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate overview analytics' });
  }
});

app.get('/api/analytics/financial', authenticate, requireAdmin, async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: { stocks: true }
    });
    
    let totalRevenue = 0;
    let totalCogs = 0;
    let deadStockCost = 0;
    const marginData: Record<string, { revenue: number; cogs: number; date: string }> = {};
    const categoryRevenue: Record<string, number> = {};

    // For Dead Stock Capital Cost
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const deadProducts = await prisma.product.findMany({
      where: { stockMovements: { none: { createdAt: { gte: ninetyDaysAgo } } } },
      include: { stocks: true }
    });
    
    deadProducts.forEach(p => {
      const qty = p.stocks.reduce((sum, s) => sum + s.quantity, 0);
      deadStockCost += qty * p.cost * 0.05; // 5% holding cost
    });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const outMovements = await prisma.stockMovement.findMany({
      where: { type: 'OUT', createdAt: { gte: thirtyDaysAgo } },
      include: { product: true },
      orderBy: { createdAt: 'asc' }
    });

    const skuProfits = new Map<string, { id: string, name: string, category: string, margin: number, quantity: number }>();

    outMovements.forEach(m => {
      const p = m.product;
      const rev = m.quantity * p.price;
      const cost = m.quantity * p.cost;
      const margin = rev - cost;
      
      totalRevenue += rev;
      totalCogs += cost;
      
      categoryRevenue[p.category] = (categoryRevenue[p.category] || 0) + rev;

      const dateStr = m.createdAt.toISOString().split('T')[0];
      if (!marginData[dateStr]) {
        marginData[dateStr] = { revenue: 0, cogs: 0, date: dateStr };
      }
      marginData[dateStr].revenue += rev;
      marginData[dateStr].cogs += cost;

      if (!skuProfits.has(p.id)) {
        skuProfits.set(p.id, { id: p.id, name: p.name, category: p.category, margin: 0, quantity: 0 });
      }
      const sku = skuProfits.get(p.id)!;
      sku.margin += margin;
      sku.quantity += m.quantity;
    });

    const marginTrends = Object.values(marginData).map(d => ({
      date: d.date,
      margin: d.revenue - d.cogs
    }));

    const topProfitableSKUs = Array.from(skuProfits.values())
      .sort((a, b) => b.margin - a.margin)
      .slice(0, 10);
      
    const revenueByCategory = Object.entries(categoryRevenue).map(([name, value]) => ({ name, value }));

    res.json({
      totalRevenue,
      totalCogs,
      grossMargin: totalRevenue - totalCogs,
      deadStockCost,
      marginTrends,
      topProfitableSKUs,
      revenueByCategory
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch financial analytics' });
  }
});

app.get('/api/analytics/supply-chain', authenticate, requireAdmin, async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: { stocks: true }
    });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const outMovements = await prisma.stockMovement.groupBy({
      by: ['productId'],
      where: { type: 'OUT', createdAt: { gte: thirtyDaysAgo } },
      _sum: { quantity: true }
    });

    const velocityMap = new Map<string, number>();
    outMovements.forEach(m => {
      velocityMap.set(m.productId, (m._sum.quantity || 0) / 30); // units per day
    });

    let overstockCount = 0;
    const restockRecommendations = [];

    products.forEach(p => {
      const qty = p.stocks.reduce((sum, s) => sum + s.quantity, 0);
      const dailyVelocity = velocityMap.get(p.id) || 0;
      
      if (dailyVelocity > 0) {
        const daysCoverage = qty / dailyVelocity;
        if (daysCoverage > 180) overstockCount++;
        else if (daysCoverage < 7) {
          restockRecommendations.push({
            id: p.id,
            name: p.name,
            sku: p.sku,
            currentStock: qty,
            daysRemaining: Math.floor(daysCoverage),
            dailyVelocity: parseFloat(dailyVelocity.toFixed(2))
          });
        }
      } else if (qty > 0 && velocityMap.has(p.id) === false) {
        // Zero velocity but has stock -> basically overstock/dead
        overstockCount++;
      }
    });

    restockRecommendations.sort((a, b) => a.daysRemaining - b.daysRemaining);

    // Stockout frequency
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    const alerts = await prisma.inventoryAlert.findMany({
      where: { type: 'OUT_OF_STOCK', createdAt: { gte: oneYearAgo } },
      include: { product: { select: { name: true, sku: true } } }
    });
    
    const stockoutFreq = new Map<string, { id: string, name: string, count: number }>();
    alerts.forEach(a => {
      if (!stockoutFreq.has(a.productId)) {
        stockoutFreq.set(a.productId, { id: a.productId, name: a.product.name, count: 0 });
      }
      stockoutFreq.get(a.productId)!.count++;
    });
    const frequentStockouts = Array.from(stockoutFreq.values()).sort((a, b) => b.count - a.count).slice(0, 10);

    // Shrinkage
    const adjustments = await prisma.stockMovement.aggregate({
      where: { type: 'ADJUSTMENT' },
      _sum: { quantity: true }
    });

    res.json({
      overstockCount,
      totalAdjustments: adjustments._sum.quantity || 0,
      restockRecommendations: restockRecommendations.slice(0, 15),
      frequentStockouts
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch supply chain analytics' });
  }
});

app.get('/api/analytics/operations', authenticate, requireAdmin, async (req, res) => {
  try {
    const godowns = await prisma.godown.findMany({
      include: { stocks: true }
    });
    
    const storageUtilization = godowns.map(g => {
      const totalUnits = g.stocks.reduce((sum, s) => sum + s.quantity, 0);
      return { id: g.id, name: g.name, totalUnits };
    });

    // Heatmap of peak hours
    const movements = await prisma.stockMovement.findMany({
      select: { createdAt: true }
    });
    
    const peakHours = new Array(24).fill(0);
    movements.forEach(m => {
      const hour = m.createdAt.getHours();
      peakHours[hour]++;
    });
    
    const heatmap = peakHours.map((count, hour) => ({ hour: `${hour}:00`, count }));

    // Inbound vs Outbound ratio per godown
    const ioRatio = await Promise.all(godowns.map(async g => {
      const inQty = await prisma.stockMovement.aggregate({
        where: { godownId: g.id, type: 'IN' },
        _sum: { quantity: true }
      });
      const outQty = await prisma.stockMovement.aggregate({
        where: { godownId: g.id, type: 'OUT' },
        _sum: { quantity: true }
      });
      return {
        godownName: g.name,
        inbound: inQty._sum.quantity || 0,
        outbound: outQty._sum.quantity || 0
      };
    }));

    res.json({
      storageUtilization,
      peakHours: heatmap,
      ioRatio
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch operations analytics' });
  }
});

app.get('/api/analytics/staff', authenticate, requireAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        _count: {
          select: { movements: true }
        }
      }
    });

    const leaderboard = users.map(u => ({
      id: u.id,
      name: u.name,
      role: u.role,
      movementsCount: u._count.movements
    })).sort((a, b) => b.movementsCount - a.movementsCount);

    const typeBreakdown = await prisma.stockMovement.groupBy({
      by: ['type'],
      _count: { id: true }
    });
    
    const movementBreakdown = typeBreakdown.map(t => ({
      name: t.type,
      value: t._count.id
    }));

    let adminCount = 0;
    let staffCount = 0;
    
    users.forEach(u => {
      if (u.role === 'ADMIN') adminCount += u._count.movements;
      else staffCount += u._count.movements;
    });

    const roleProductivity = [
      { name: 'ADMIN', value: adminCount },
      { name: 'STAFF', value: staffCount }
    ];

    res.json({
      leaderboard,
      movementBreakdown,
      roleProductivity
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch staff analytics' });
  }
});

// --- MICRO ANALYTICS (GODOWN) ---
app.get('/api/analytics/godown/:godownId', authenticate, async (req, res) => {
  try {
    const { godownId } = req.params;
    
    const stocks = await prisma.godownStock.findMany({
      where: { godownId },
      include: {
        product: {
          select: { id: true, name: true, minStock: true, cost: true, price: true }
        }
      }
    });

    let totalValue = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    
    stocks.forEach(stock => {
      if (stock.quantity === 0) outOfStockCount++;
      else if (stock.quantity <= stock.product.minStock) lowStockCount++;
      
      totalValue += stock.quantity * stock.product.cost;
    });

    const totalProducts = stocks.length;
    const stockStatusData = [
      { name: 'In Stock', value: totalProducts - lowStockCount - outOfStockCount, color: '#10B981' },
      { name: 'Low Stock', value: lowStockCount, color: '#F59E0B' },
      { name: 'Out of Stock', value: outOfStockCount, color: '#EF4444' },
    ];

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Movements trend for this godown
    const recentMovements = await prisma.stockMovement.findMany({
      where: { godownId, createdAt: { gte: thirtyDaysAgo } },
      select: { type: true, quantity: true, createdAt: true }
    });

    res.json({
      totalProducts,
      totalValue,
      lowStockCount,
      outOfStockCount,
      stockStatusData,
      recentMovements
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch godown analytics' });
  }
});

// --- BARCODE SCANNING ---
app.get('/api/products/barcode/:barcode', authenticate, async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { barcode: req.params.barcode },
      include: { stocks: true }
    });
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json({
      ...product,
      quantity: product.stocks.reduce((sum, s) => sum + s.quantity, 0)
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch product by barcode' });
  }
});

// --- ALERTS ---
app.get('/api/alerts', authenticate, async (req, res) => {
  try {
    const alerts = await prisma.inventoryAlert.findMany({
      include: { product: { select: { name: true, sku: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Greenpart Automotives API listening on port ${PORT}`);
});
