import prisma from '../src/db.js';

async function main(){
  const rows = await prisma.lessonProgress.findMany({ orderBy: { watchedAt: 'desc' }, take: 50 });
  console.log(`Found ${rows.length} lesson progress rows`);
  for (const r of rows) {
    console.log({ id: r.id, enrollmentId: r.enrollmentId, lessonId: r.lessonId, status: r.status, watchedSeconds: r.watchedSeconds, watchedAt: r.watchedAt });
  }
  process.exit(0);
}

main().catch(e=>{ console.error(e); process.exit(1); });
