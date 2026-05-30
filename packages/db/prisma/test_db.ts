import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const posts = await prisma.post.findMany({
    select: {
      id: true,
      author: { select: { username: true } },
      content: true
    }
  });

  for (const post of posts) {
    if (post.author.username === 'grace_eecs' || post.author.username === 'frank_chem') {
      console.log(`=== POST BY ${post.author.username} ===`);
      console.log(JSON.stringify(post.content));
      console.log('---------------------------');
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
