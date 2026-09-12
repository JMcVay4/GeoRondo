const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const demoPlayers = [
  { googleId: 'demo-aurora', email: 'aurora.demo@georondo.local', name: 'Aurora' },
  { googleId: 'demo-orion', email: 'orion.demo@georondo.local', name: 'Orion' },
  { googleId: 'demo-nova', email: 'nova.demo@georondo.local', name: 'Nova' },
  { googleId: 'demo-vega', email: 'vega.demo@georondo.local', name: 'Vega' },
  { googleId: 'demo-sol', email: 'sol.demo@georondo.local', name: 'Sol' },
  { googleId: 'demo-luna', email: 'luna.demo@georondo.local', name: 'Luna' },
];

const scoresByDifficulty = {
  easy: [
    [25, 104.8],
    [24, 118.2],
    [23, 121.5],
    [22, 132.0],
    [21, 148.9],
  ],
  medium: [
    [22, 135.4],
    [21, 142.6],
    [20, 151.1],
    [19, 164.7],
    [18, 179.3],
  ],
  hard: [
    [19, 160.5],
    [18, 173.2],
    [17, 181.0],
    [16, 193.8],
    [15, 205.4],
  ],
  grandmaster: [
    [15, 218.6],
    [14, 229.3],
    [13, 241.9],
    [12, 256.7],
    [11, 269.4],
  ],
};

async function upsertScore({ userId, difficulty, score, time }) {
  const existing = await prisma.score.findFirst({
    where: { userId, difficulty },
  });

  if (existing) {
    return prisma.score.update({
      where: { id: existing.id },
      data: { score, time },
    });
  }

  return prisma.score.create({
    data: { userId, difficulty, score, time },
  });
}

async function main() {
  const users = await Promise.all(
    demoPlayers.map((player) =>
      prisma.user.upsert({
        where: { googleId: player.googleId },
        update: {
          email: player.email,
          name: player.name,
          picture: null,
        },
        create: {
          ...player,
          picture: null,
        },
      })
    )
  );

  const today = new Date().toISOString().slice(0, 10);
  const difficulties = {
    ...scoresByDifficulty,
    [`daily-${today}`]: [
      [24, 112.4],
      [23, 126.8],
      [22, 139.1],
      [21, 151.6],
      [20, 166.0],
    ],
  };

  for (const [difficulty, scores] of Object.entries(difficulties)) {
    for (let i = 0; i < scores.length; i += 1) {
      const [score, time] = scores[i];
      await upsertScore({
        userId: users[i].id,
        difficulty,
        score,
        time,
      });
    }
  }

  console.log('Demo leaderboard data seeded.');
}

main()
  .catch((error) => {
    console.error('Demo seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
