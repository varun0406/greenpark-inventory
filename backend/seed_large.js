const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting bulk data generation...');
  const TOTAL_RECORDS = 15000;
  const BATCH_SIZE = 5000;

  // 1. Ensure a Godown exists
  let godown = await prisma.godown.findFirst();
  if (!godown) {
    godown = await prisma.godown.create({
      data: {
        name: 'Main Mega Warehouse',
        location: 'Central Node'
      }
    });
  }

  console.log(`Target: Insert ${TOTAL_RECORDS} products in chunks of ${BATCH_SIZE}...`);

  for (let i = 0; i < TOTAL_RECORDS / BATCH_SIZE; i++) {
    const productsToInsert = [];
    const stocksToInsert = [];
    const offset = i * BATCH_SIZE;

    console.log(`Generating batch ${i + 1}...`);
    
    for (let j = 0; j < BATCH_SIZE; j++) {
      const id = uuidv4();
      const num = offset + j;
      const ts = Date.now();
      
      productsToInsert.push({
        id: id,
        name: `Automated Product ${num} - ${ts}`,
        sku: `SKU-AUTO-${num}-${ts}`,
        barcode: `BAR-${num}-${ts}`,
        category: ['Electronics', 'Furniture', 'Clothing', 'Food', 'Toys'][num % 5],
        description: `This is an automatically generated product for load testing. ID: ${num}`,
        price: Number((Math.random() * 1000 + 10).toFixed(2)),
        cost: Number((Math.random() * 500 + 5).toFixed(2)),
        minStock: 10,
        maxStock: 1000
      });

      stocksToInsert.push({
        id: uuidv4(),
        godownId: godown.id,
        productId: id,
        quantity: Math.floor(Math.random() * 500)
      });
    }

    console.log(`Inserting batch ${i + 1} products...`);
    await prisma.product.createMany({
      data: productsToInsert,
      skipDuplicates: true
    });

    console.log(`Inserting batch ${i + 1} stocks...`);
    await prisma.godownStock.createMany({
      data: stocksToInsert,
      skipDuplicates: true
    });
  }

  console.log(`Successfully generated and inserted ${TOTAL_RECORDS} products and stocks!`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
