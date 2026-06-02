"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const result = await prisma.$executeRaw `
    DELETE FROM _prisma_migrations 
    WHERE migration_name = '20260602122700_add_tags_and_notifications';
  `;
    console.log('=== DELETION RESULT ===', result);
    const migrations = await prisma.$queryRaw `
    SELECT * FROM _prisma_migrations;
  `;
    console.log('=== REMAINING MIGRATIONS ===', migrations);
}
main().catch(console.error).finally(() => prisma.$disconnect());
