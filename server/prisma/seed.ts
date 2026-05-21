import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const testAccount = {
  name: "Student Kit Tester",
  email: "test@studentkit.local",
  password: "Test@12345"
};

async function main() {
  const existing = await prisma.workLimitPolicy.findFirst({
    where: {
      countryCode: "DE",
      studentStatus: "INTERNATIONAL",
      effectiveFrom: new Date("2024-03-01T00:00:00.000Z")
    }
  });

  const data = {
    countryCode: "DE",
    studentStatus: "INTERNATIONAL" as const,
    yearlyFullDayLimit: 140,
    yearlyHalfDayLimit: 280,
    halfDayMaxHours: 4,
    effectiveFrom: new Date("2024-03-01T00:00:00.000Z"),
    sourceUrl: "https://www.make-it-in-germany.com/en/study-vocational-training/studies-in-germany/work",
    notes:
      "Default Germany planning policy for international students. Keep configurable and verify current rules before relying on it."
  };

  if (existing) {
    await prisma.workLimitPolicy.update({
      where: { id: existing.id },
      data
    });
  } else {
    await prisma.workLimitPolicy.create({ data });
  }

  await prisma.user.upsert({
    where: { email: testAccount.email },
    update: {
      name: testAccount.name,
      country: "DE",
      studentStatus: "INTERNATIONAL",
      hourlyWageDefault: 13.5,
      currency: "EUR"
    },
    create: {
      name: testAccount.name,
      email: testAccount.email,
      passwordHash: await bcrypt.hash(testAccount.password, 12),
      country: "DE",
      studentStatus: "INTERNATIONAL",
      hourlyWageDefault: 13.5,
      currency: "EUR"
    }
  });

  await prisma.coupon.upsert({
    where: { id: "coupon-aldi-student-basket" },
    update: {
      title: "Aldi Student Basket",
      code: "STUDENT10",
      discount: "10% off",
      description: "A grocery basket offer for students on essential weekly items.",
      terms: "Valid on groceries over EUR 20. Availability can vary by participating store.",
      url: "https://www.aldi.com",
      expiresAt: new Date("2026-05-31T21:59:59.000Z"),
      source: "Student Kit sample admin seed",
      isActive: true
    },
    create: {
      id: "coupon-aldi-student-basket",
      title: "Aldi Student Basket",
      code: "STUDENT10",
      discount: "10% off",
      description: "A grocery basket offer for students on essential weekly items.",
      terms: "Valid on groceries over EUR 20. Availability can vary by participating store.",
      url: "https://www.aldi.com",
      expiresAt: new Date("2026-05-31T21:59:59.000Z"),
      source: "Student Kit sample admin seed",
      isActive: true
    }
  });

  await prisma.coupon.upsert({
    where: { id: "coupon-db-city-pass" },
    update: {
      title: "DB City Pass",
      code: "CITY5",
      discount: "EUR 5 off",
      description: "Student travel discount for selected city routes.",
      terms: "Online only. Student verification may be required.",
      url: "https://www.bahn.de",
      expiresAt: new Date("2026-06-15T21:59:59.000Z"),
      source: "Student Kit sample admin seed",
      isActive: true
    },
    create: {
      id: "coupon-db-city-pass",
      title: "DB City Pass",
      code: "CITY5",
      discount: "EUR 5 off",
      description: "Student travel discount for selected city routes.",
      terms: "Online only. Student verification may be required.",
      url: "https://www.bahn.de",
      expiresAt: new Date("2026-06-15T21:59:59.000Z"),
      source: "Student Kit sample admin seed",
      isActive: true
    }
  });

  await prisma.event.upsert({
    where: { id: "event-career-night" },
    update: {
      title: "Student Career Night",
      description: "Meet local employers and alumni mentors. Bring your CV if you want feedback.",
      startsAt: new Date("2026-05-22T18:00:00.000Z"),
      endsAt: new Date("2026-05-22T20:00:00.000Z"),
      location: "Campus Hall A",
      organizer: "Student Services",
      url: "https://example.com/events/career-night",
      isActive: true
    },
    create: {
      id: "event-career-night",
      title: "Student Career Night",
      description: "Meet local employers and alumni mentors. Bring your CV if you want feedback.",
      startsAt: new Date("2026-05-22T18:00:00.000Z"),
      endsAt: new Date("2026-05-22T20:00:00.000Z"),
      location: "Campus Hall A",
      organizer: "Student Services",
      url: "https://example.com/events/career-night",
      isActive: true
    }
  });

  await prisma.event.upsert({
    where: { id: "event-budget-workshop" },
    update: {
      title: "Budget Workshop",
      description: "A practical money session for students building a weekly spending plan.",
      startsAt: new Date("2026-05-29T17:00:00.000Z"),
      endsAt: new Date("2026-05-29T18:30:00.000Z"),
      location: "Library Room 2",
      organizer: "Student Services",
      url: "https://example.com/events/budget-workshop",
      isActive: true
    },
    create: {
      id: "event-budget-workshop",
      title: "Budget Workshop",
      description: "A practical money session for students building a weekly spending plan.",
      startsAt: new Date("2026-05-29T17:00:00.000Z"),
      endsAt: new Date("2026-05-29T18:30:00.000Z"),
      location: "Library Room 2",
      organizer: "Student Services",
      url: "https://example.com/events/budget-workshop",
      isActive: true
    }
  });

  console.log("Seeded test account:");
  console.log(`  email: ${testAccount.email}`);
  console.log(`  password: ${testAccount.password}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
