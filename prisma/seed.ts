import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { SIMULATED_FEEDBACK, sampleCompanyLabel } from "../lib/sample-data";
import { embedText, serializeVector } from "../lib/search";
import { classifyAndSave } from "../lib/classify";

const db = new PrismaClient();

const DEMO_PASSWORD = "Demo1234!";

async function main() {
  console.log("Seeding LOOP demo workspace…");

  // Clean slate for repeatable seeding.
  await db.report.deleteMany();
  await db.feedbackTheme.deleteMany();
  await db.embedding.deleteMany();
  await db.feedback.deleteMany();
  await db.theme.deleteMany();
  await db.user.deleteMany();
  await db.workspace.deleteMany();

  const workspace = await db.workspace.create({
    data: { name: "Acme Feedback Co." },
  });

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  const [admin, analyst, viewer] = await Promise.all([
    db.user.create({
      data: {
        name: "Avery Admin",
        email: "admin@loop-demo.com",
        passwordHash,
        role: "ADMIN",
        workspaceId: workspace.id,
      },
    }),
    db.user.create({
      data: {
        name: "Alex Analyst",
        email: "analyst@loop-demo.com",
        passwordHash,
        role: "ANALYST",
        workspaceId: workspace.id,
      },
    }),
    db.user.create({
      data: {
        name: "Val Viewer",
        email: "viewer@loop-demo.com",
        passwordHash,
        role: "VIEWER",
        workspaceId: workspace.id,
      },
    }),
  ]);

  console.log(`Created workspace "${workspace.name}" with 3 users (Admin/Analyst/Viewer).`);

  // Spread createdAt over the last 45 days so charts/trends have real shape.
  const now = Date.now();
  const daySpread = 45;

  const createdIds: string[] = [];
  let i = 0;
  for (const item of SIMULATED_FEEDBACK) {
    const daysAgo = Math.floor(Math.random() * daySpread);
    const createdAt = new Date(now - daysAgo * 24 * 60 * 60 * 1000);

    const feedback = await db.feedback.create({
      data: {
        content: item.content,
        channel: item.channel,
        customerLabel: item.customerLabel ?? sampleCompanyLabel(i),
        sourceRef: "seed-script",
        workspaceId: workspace.id,
        createdAt,
        status: Math.random() < 0.5 ? "NEW" : Math.random() < 0.8 ? "REVIEWED" : "ACTIONED",
      },
    });

    const vector = embedText(feedback.content);
    await db.embedding.create({
      data: { feedbackId: feedback.id, vector: serializeVector(vector) },
    });

    createdIds.push(feedback.id);
    i++;
  }

  console.log(`Created ${createdIds.length} feedback items across all channels.`);

  const hasApiKey = !!process.env.GEMINI_API_KEY;
  if (!hasApiKey) {
    console.warn(
      "\n⚠️  GEMINI_API_KEY is not set — skipping AI classification during seed.\n" +
        "   The app will still run; classify items later via the 'Re-classify' action\n" +
        "   once your API key is configured, or re-run `npm run seed` after adding it.\n"
    );
  } else {
    console.log("Classifying seeded feedback with Gemini (this takes a few minutes)…");
    let done = 0;
    for (const id of createdIds) {
      try {
        await classifyAndSave(id, workspace.id);
      } catch (err) {
        console.error(`  classify failed for ${id}:`, err);
      }
      done++;
      if (done % 20 === 0) console.log(`  ${done}/${createdIds.length} classified`);
    }
    console.log("Classification complete.");
  }

  console.log("\n✅ Seed complete.\n");
  console.log("Demo login credentials (workspace: Acme Feedback Co.):");
  console.log(`  Admin:   admin@loop-demo.com   / ${DEMO_PASSWORD}`);
  console.log(`  Analyst: analyst@loop-demo.com / ${DEMO_PASSWORD}`);
  console.log(`  Viewer:  viewer@loop-demo.com  / ${DEMO_PASSWORD}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
