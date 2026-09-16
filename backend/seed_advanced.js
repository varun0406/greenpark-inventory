const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('Generating advanced analytics data...');

  // 1. Create Staff Users
  const passwordHash = await bcrypt.hash('password123', 10);
  const staffUsers = [];
  
  for (let i = 1; i <= 3; i++) {
    const email = `staff${i}@example.com`;
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: `Staff Member ${i}`,
          role: 'STAFF',
          passwordHash
        }
      });
    }
    staffUsers.push(user);
  }

  // Get Godowns & Products
  const godowns = await prisma.godown.findMany();
  const products = await prisma.product.findMany({
    take: 100,
    select: { id: true, cost: true, price: true }
  });

  const now = new Date();
  const movements = [];

  // Generate 1000 TRANSFERS and 500 ADJUSTMENTS distributed among Staff and Admin
  const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' }});
  const allUsers = [...staffUsers, adminUser];

  console.log('Generating Transfer movements...');
  for (let i = 0; i < 1000; i++) {
    const p = products[Math.floor(Math.random() * products.length)];
    const g = godowns[Math.floor(Math.random() * godowns.length)];
    const u = allUsers[Math.floor(Math.random() * allUsers.length)];
    
    const randomDaysAgo = Math.floor(Math.random() * 30);
    // Random hour of day (weighted to operational hours 8am - 6pm)
    let hour = Math.floor(Math.random() * 24);
    if (Math.random() > 0.2) {
       hour = 8 + Math.floor(Math.random() * 10); // 8am to 6pm
    }
    
    const date = new Date(now.getTime() - randomDaysAgo * 24 * 60 * 60 * 1000);
    date.setHours(hour);

    movements.push({
      productId: p.id,
      godownId: g.id,
      userId: u.id,
      type: 'TRANSFER',
      quantity: Math.floor(Math.random() * 20) + 1,
      reason: 'Inter-warehouse rebalancing',
      reference: `TRF-${Math.floor(Math.random() * 10000)}`,
      createdAt: date
    });
  }

  console.log('Generating Adjustment movements...');
  for (let i = 0; i < 500; i++) {
    const p = products[Math.floor(Math.random() * products.length)];
    const g = godowns[Math.floor(Math.random() * godowns.length)];
    const u = allUsers[Math.floor(Math.random() * allUsers.length)];
    
    const randomDaysAgo = Math.floor(Math.random() * 30);
    const date = new Date(now.getTime() - randomDaysAgo * 24 * 60 * 60 * 1000);

    movements.push({
      productId: p.id,
      godownId: g.id,
      userId: u.id,
      type: 'ADJUSTMENT',
      quantity: -1 * (Math.floor(Math.random() * 5) + 1), // usually negative for shrinkage
      reason: 'Damage/Shrinkage found in audit',
      reference: `ADJ-${Math.floor(Math.random() * 10000)}`,
      createdAt: date
    });
  }

  // Insert in chunks
  const chunkSize = 500;
  for (let i = 0; i < movements.length; i += chunkSize) {
    const chunk = movements.slice(i, i + chunkSize);
    await prisma.stockMovement.createMany({ data: chunk });
    console.log(`Inserted ${Math.min(i + chunkSize, movements.length)} / ${movements.length} movements...`);
  }

  console.log('Advanced Data Seeding Complete!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
