import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const coupons = [
    { code: 'MARIALUIZA', discount: 799.00, type: 'FIXED_PRICE' },
    { code: 'MARIANALIMA', discount: 15, type: 'PERCENTAGE' },
    { code: '50OFF', discount: 50, type: 'PERCENTAGE' },
    { code: '25OFF', discount: 25, type: 'PERCENTAGE' },
    { code: '15OFF', discount: 15, type: 'PERCENTAGE' },
    { code: '10OFF', discount: 10, type: 'PERCENTAGE' },
  ];

  for (const c of coupons) {
    await prisma.coupon.upsert({
      where: { code: c.code },
      update: { discount: c.discount, type: c.type },
      create: c,
    });
  }
  console.log('Coupons seeded successfully.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });