const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Fetching users, godowns, and products...');
  
  // Get admin user
  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  });
  
  if (!admin) {
    console.error('No admin user found!');
    process.exit(1);
  }

  // Get godowns
  const godowns = await prisma.godown.findMany();
  if (godowns.length === 0) {
    console.error('No godowns found!');
    process.exit(1);
  }

  // Get a subset of products (say 100 random products) to make queries faster
  const products = await prisma.product.findMany({
    take: 100,
    select: { id: true }
  });
  
  if (products.length === 0) {
    console.error('No products found!');
    process.exit(1);
  }

  const NUM_MOVEMENTS = 5000;
  console.log(`Generating ${NUM_MOVEMENTS} stock movements...`);

  const types = ['IN', 'OUT'];
  const movements = [];
  
  const now = new Date();

  for (let i = 0; i < NUM_MOVEMENTS; i++) {
    const product = products[Math.floor(Math.random() * products.length)];
    const godown = godowns[Math.floor(Math.random() * godowns.length)];
    const type = types[Math.floor(Math.random() * types.length)];
    const quantity = Math.floor(Math.random() * 50) + 1;
    
    // Random date within the last 30 days
    const randomDaysAgo = Math.floor(Math.random() * 30);
    const date = new Date(now.getTime() - randomDaysAgo * 24 * 60 * 60 * 1000);
    
    movements.push({
      productId: product.id,
      godownId: godown.id,
      userId: admin.id,
      type: type,
      quantity: quantity,
      reason: `Bulk generation ${i}`,
      reference: `REF-${Math.floor(Math.random() * 10000)}`,
      createdAt: date
    });
  }

  // Insert in chunks of 1000 to avoid memory issues
  const chunkSize = 1000;
  for (let i = 0; i < movements.length; i += chunkSize) {
    const chunk = movements.slice(i, i + chunkSize);
    await prisma.stockMovement.createMany({
      data: chunk
    });
    console.log(`Inserted ${Math.min(i + chunkSize, movements.length)} / ${movements.length} movements...`);
  }

  console.log('Stock movements seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
