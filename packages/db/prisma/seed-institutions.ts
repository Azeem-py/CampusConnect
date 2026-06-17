import { PrismaClient } from '@prisma/client';
import {
  FEDERAL_UNIVERSITIES,
  STATE_UNIVERSITIES,
  PRIVATE_UNIVERSITIES,
  FEDERAL_POLYTECHNICS,
  STATE_POLYTECHNICS,
  FEDERAL_COLLEGES_OF_EDUCATION,
  STATE_COLLEGES_OF_EDUCATION,
  COLLEGES_OF_HEALTH,
} from './seed-institutions-data.js';
import type { InstitutionSeed } from './seed-institutions-data.js';

const prisma = new PrismaClient();

async function seedInstitutions(category: string, institutions: InstitutionSeed[]) {
  console.log(`\n--- Seeding ${category} (${institutions.length} institutions) ---`);
  let count = 0;

  for (const inst of institutions) {
    const institution = await prisma.institution.upsert({
      where: { id: '' }, // Dummy — we use name+type as unique constraint via findFirst
      update: { state: inst.state, acronym: inst.acronym },
      create: {
        name: inst.name,
        type: inst.type,
        state: inst.state,
        acronym: inst.acronym,
        departments: {
          create: inst.departments.map((dept) => ({ name: dept })),
        },
      },
    });
    count++;
    if (count % 10 === 0 || count === institutions.length) {
      process.stdout.write(`  Progress: ${count}/${institutions.length}\r`);
    }
  }
  console.log(`  ${category} seeded: ${count} institutions`);
}

async function main() {
  console.log('=== SEEDING NIGERIAN INSTITUTIONS ===');
  console.log('This script uses upsert and will NOT delete existing data.');

  const allInstitutions = [
    ...FEDERAL_UNIVERSITIES,
    ...STATE_UNIVERSITIES,
    ...PRIVATE_UNIVERSITIES,
    ...FEDERAL_POLYTECHNICS,
    ...STATE_POLYTECHNICS,
    ...FEDERAL_COLLEGES_OF_EDUCATION,
    ...STATE_COLLEGES_OF_EDUCATION,
    ...COLLEGES_OF_HEALTH,
  ];

  for (const inst of allInstitutions) {
    const existing = await prisma.institution.findFirst({
      where: { name: inst.name, type: inst.type },
    });

    if (existing) {
      await prisma.institution.update({
        where: { id: existing.id },
        data: {
          state: inst.state,
          acronym: inst.acronym,
        },
      });

      const existingDepts = await prisma.department.findMany({
        where: { institutionId: existing.id },
        select: { name: true },
      });
      const existingDeptNames = new Set(existingDepts.map((d) => d.name));
      const newDepts = inst.departments.filter((d) => !existingDeptNames.has(d));

      if (newDepts.length > 0) {
        await prisma.department.createMany({
          data: newDepts.map((name) => ({
            name,
            institutionId: existing.id,
          })),
        });
      }
    } else {
      await prisma.institution.create({
        data: {
          name: inst.name,
          type: inst.type,
          state: inst.state,
          acronym: inst.acronym,
          departments: {
            create: inst.departments.map((name) => ({ name })),
          },
        },
      });
    }
  }

  const total = await prisma.institution.count();
  const deptTotal = await prisma.department.count();
  console.log(`\n=== SEEDING COMPLETE ===`);
  console.log(`  Institutions: ${total}`);
  console.log(`  Departments:  ${deptTotal}`);
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
