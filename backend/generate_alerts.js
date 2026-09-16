const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning up existing alerts...');
  await prisma.inventoryAlert.deleteMany();

  console.log('Fetching products to check stock levels...');
  const products = await prisma.product.findMany({
    include: { stocks: true }
  });

  const alertsToCreate = [];
  const now = new Date();

  for (const product of products) {
    const totalQuantity = product.stocks.reduce((sum, stock) => sum + stock.quantity, 0);

    let type = null;
    let message = null;

    if (totalQuantity === 0) {
      type = 'OUT_OF_STOCK';
      message = `Product ${product.name} is completely out of stock across all godowns.`;
    } else if (totalQuantity <= product.minStock) {
      type = 'LOW_STOCK';
      message = `Low stock alert: Only ${totalQuantity} units of ${product.name} remaining (Minimum: ${product.minStock}).`;
    }

    if (type && message) {
      // Random date within the last 7 days
      const randomDaysAgo = Math.random() * 7;
      const date = new Date(now.getTime() - randomDaysAgo * 24 * 60 * 60 * 1000);
      
      alertsToCreate.push({
        productId: product.id,
        type,
        message,
        isRead: Math.random() > 0.5, // Randomly mark some as read
        createdAt: date
      });
    }
  }

  console.log(`Found ${alertsToCreate.length} products requiring alerts.`);
  
  if (alertsToCreate.length > 0) {
    const chunkSize = 1000;
    for (let i = 0; i < alertsToCreate.length; i += chunkSize) {
      const chunk = alertsToCreate.slice(i, i + chunkSize);
      await prisma.inventoryAlert.createMany({
        data: chunk
      });
      console.log(`Inserted ${Math.min(i + chunkSize, alertsToCreate.length)} / ${alertsToCreate.length} alerts...`);
    }
  }

  console.log('Alert generation complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
