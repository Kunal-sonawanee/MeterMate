import { PrismaClient } from "@prisma/client";

/**
 * Development seed.
 *
 * Creates two properties with a handful of meters and a year of plausible
 * readings, so a fresh checkout has something to look at. Run it with
 * `pnpm db:seed`. It clears existing data first, so never point it at a
 * database you care about.
 */
const prisma = new PrismaClient();

/**
 * `usage` is consumption for each period *after* the baseline, so a meter ends
 * up with one opening reading plus `usage.length` billed months.
 */
const PROPERTIES = [
  {
    name: "Sunrise Apartments",
    address: "14 MG Road, Kothrud, Pune 411038",
    meters: [
      { name: "Flat 1A", whatsappNumber: "9876543210", start: 12_450, usage: [212, 198, 240, 265, 288, 241] },
      { name: "Flat 1B", whatsappNumber: "9876543211", start: 8_910, usage: [154, 168, 187, 173, 165, 158] },
      { name: "Flat 2A", whatsappNumber: "9876543212", start: 15_020, usage: [301, 288, 342, 366, 391, 318] },
      { name: "Common area", whatsappNumber: null, start: 4_280, usage: [96, 91, 104, 110, 118, 99] },
    ],
  },
  {
    name: "Nandini Shops",
    address: "Plot 7, Station Road, Nashik 422001",
    meters: [
      { name: "Shop front", whatsappNumber: "9876543213", start: 22_100, usage: [430, 462, 511, 498, 545, 470] },
      { name: "Back godown", whatsappNumber: null, start: 6_740, usage: [88, 79, 95, 102, 111, 94] },
    ],
  },
];

/** Tariffs drift a little over the year, the way a real bill does. */
const RATES = [7.6, 7.6, 7.8, 8.2, 8.2, 8.5, 8.5];

function periodsEndingNow(count: number) {
  const now = new Date();
  const periods: Array<{ month: number; year: number }> = [];

  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    periods.push({ month: date.getMonth() + 1, year: date.getFullYear() });
  }

  return periods;
}

async function main() {
  console.log("Clearing existing data…");
  await prisma.monthlyReading.deleteMany();
  await prisma.meter.deleteMany();
  await prisma.property.deleteMany();

  const periods = periodsEndingNow(RATES.length);

  for (const propertySeed of PROPERTIES) {
    const property = await prisma.property.create({
      data: { name: propertySeed.name, address: propertySeed.address },
    });

    for (const meterSeed of propertySeed.meters) {
      const meter = await prisma.meter.create({
        data: {
          name: meterSeed.name,
          whatsappNumber: meterSeed.whatsappNumber,
          propertyId: property.id,
        },
      });

      let previous = meterSeed.start;

      for (const [index, period] of periods.entries()) {
        // The earliest period is the meter's baseline: it records where the
        // dial stood and bills nothing, matching `recalculateChain`.
        const baseline = index === 0;
        const units = baseline ? 0 : (meterSeed.usage[index - 1] ?? 0);
        const current = baseline ? meterSeed.start : previous + units;
        const rate = RATES[index] ?? RATES.at(-1)!;

        await prisma.monthlyReading.create({
          data: {
            meterId: meter.id,
            month: period.month,
            year: period.year,
            previousReading: baseline ? current : previous,
            currentReading: current,
            unitsConsumed: units,
            ratePerUnit: rate,
            billAmount: Math.round(units * rate * 100) / 100,
          },
        });

        previous = current;
      }
    }
  }

  const [properties, meters, readings] = await Promise.all([
    prisma.property.count(),
    prisma.meter.count(),
    prisma.monthlyReading.count(),
  ]);

  console.log(`Seeded ${properties} properties, ${meters} meters, ${readings} readings.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
