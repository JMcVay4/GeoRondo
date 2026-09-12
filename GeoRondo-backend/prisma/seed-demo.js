const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const legacyDemoGoogleIds = [
  'demo-aurora',
  'demo-orion',
  'demo-nova',
  'demo-vega',
  'demo-sol',
  'demo-luna',
];

const demoPlayers = [
  { googleId: 'demo-vitaly-kornev', email: 'vitaly.kornev.demo@georondo.local', name: 'Vitaly Kornev' },
  { googleId: 'demo-eric-zipf', email: 'eric.zipf.demo@georondo.local', name: 'Eric Zipf' },
  { googleId: 'demo-ben-vanorny', email: 'ben.vanorny.demo@georondo.local', name: 'Ben Vanorny' },
  { googleId: 'demo-raymond-liu', email: 'raymond.liu.demo@georondo.local', name: 'Raymond Liu' },
  { googleId: 'demo-jac-carey', email: 'jac.carey.demo@georondo.local', name: 'Jac Carey' },
  { googleId: 'demo-radu-c', email: 'radu.c.demo@georondo.local', name: 'Radu C' },
  { googleId: 'demo-noah-schlorf', email: 'noah.schlorf.demo@georondo.local', name: 'Noah Schlorf' },
  { googleId: 'demo-ethan-do', email: 'ethan.do.demo@georondo.local', name: 'Ethan Do' },
  { googleId: 'demo-hayden-chu', email: 'hayden.chu.demo@georondo.local', name: 'Hayden Chu' },
  { googleId: 'demo-marie-mcvay', email: 'marie.mcvay.demo@georondo.local', name: 'Marie McVay' },
  { googleId: 'demo-bhuvan-sakhamuru', email: 'bhuvan.sakhamuru.demo@georondo.local', name: 'Bhuvan Sakhamuru' },
  { googleId: 'demo-divya-godithi', email: 'divya.godithi.demo@georondo.local', name: 'Divya Godithi' },
  { googleId: 'demo-gabe-northrop', email: 'gabe.northrop.demo@georondo.local', name: 'Gabe Northrop' },
  { googleId: 'demo-gabe-fayos', email: 'gabe.fayos.demo@georondo.local', name: 'Gabe Fayos' },
  { googleId: 'demo-mark-altra', email: 'mark.altra.demo@georondo.local', name: 'Mark Altra' },
  { googleId: 'demo-lucio-armano', email: 'lucio.armano.demo@georondo.local', name: 'Lucio Armano' },
];

const scoresByDifficulty = {
  easy: [
    ['Vitaly Kornev', 26, 83.7],
    ['Marie McVay', 26, 91.4],
    ['Bhuvan Sakhamuru', 25, 86.2],
    ['Raymond Liu', 25, 94.6],
    ['Eric Zipf', 24, 88.9],
    ['Divya Godithi', 24, 102.5],
    ['Noah Schlorf', 23, 97.1],
    ['Ben Vanorny', 23, 109.8],
    ['Hayden Chu', 22, 101.2],
    ['Jac Carey', 22, 116.4],
  ],
  medium: [
    ['Raymond Liu', 23, 132.9],
    ['Vitaly Kornev', 22, 126.8],
    ['Gabe Northrop', 22, 141.6],
    ['Marie McVay', 21, 137.4],
    ['Radu C', 21, 154.2],
    ['Divya Godithi', 20, 149.7],
    ['Eric Zipf', 20, 163.1],
    ['Ethan Do', 19, 158.5],
    ['Ben Vanorny', 18, 171.8],
    ['Lucio Armano', 18, 184.6],
  ],
  hard: [
    ['Radu C', 17, 206.3],
    ['Hayden Chu', 16, 218.9],
    ['Vitaly Kornev', 16, 234.5],
    ['Gabe Fayos', 15, 227.1],
    ['Raymond Liu', 15, 246.8],
    ['Noah Schlorf', 14, 239.6],
    ['Mark Altra', 13, 252.4],
    ['Marie McVay', 13, 271.9],
    ['Jac Carey', 12, 266.2],
    ['Bhuvan Sakhamuru', 11, 289.7],
  ],
  grandmaster: [
    ['Jac Carey', 9, 337.8],
    ['Divya Godithi', 8, 351.4],
    ['Radu C', 8, 382.9],
    ['Ethan Do', 7, 366.5],
    ['Gabe Northrop', 7, 401.2],
    ['Raymond Liu', 6, 389.6],
    ['Lucio Armano', 6, 426.1],
    ['Ben Vanorny', 5, 418.7],
    ['Hayden Chu', 4, 447.3],
    ['Mark Altra', 3, 472.8],
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
  const legacyUsers = await prisma.user.findMany({
    where: { googleId: { in: legacyDemoGoogleIds } },
    select: { id: true },
  });

  if (legacyUsers.length) {
    const legacyUserIds = legacyUsers.map((user) => user.id);
    await prisma.score.deleteMany({ where: { userId: { in: legacyUserIds } } });
    await prisma.user.deleteMany({ where: { id: { in: legacyUserIds } } });
  }

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
  const usersByName = new Map(users.map((user) => [user.name, user]));
  const demoUserIds = users.map((user) => user.id);

  const today = new Date().toISOString().slice(0, 10);
  const difficulties = {
    ...scoresByDifficulty,
    [`daily-${today}`]: [
      ['Marie McVay', 25, 107.6],
      ['Eric Zipf', 24, 118.8],
      ['Radu C', 24, 129.4],
      ['Bhuvan Sakhamuru', 23, 121.7],
      ['Vitaly Kornev', 23, 136.9],
      ['Gabe Fayos', 22, 132.5],
      ['Raymond Liu', 21, 149.1],
      ['Divya Godithi', 21, 157.8],
      ['Noah Schlorf', 20, 166.4],
      ['Ethan Do', 19, 181.2],
    ],
  };
  const managedDifficulties = Object.keys(difficulties);

  await prisma.score.deleteMany({
    where: {
      userId: { in: demoUserIds },
      difficulty: { in: managedDifficulties },
    },
  });

  for (const [difficulty, scores] of Object.entries(difficulties)) {
    for (const [name, score, time] of scores) {
      const user = usersByName.get(name);
      if (!user) {
        throw new Error(`Missing demo user for ${name}`);
      }
      await upsertScore({
        userId: user.id,
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
