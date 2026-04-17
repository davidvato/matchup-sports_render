import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Auth: Login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (user && user.password === password) {
      res.json({ success: true, user: { id: user.id, username: user.username, role: user.role } });
    } else {
      res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error de servidor' });
  }
});
// Tournaments: Get all
app.get('/api/tournaments', async (req, res) => {
  try {
    const tournaments = await prisma.tournament.findMany({
      include: { 
        _count: { select: { categories: true } } 
      }
    });
    res.json(tournaments);
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

// Tournaments: Create
app.post('/api/tournaments', async (req, res) => {
  const { 
    name, location, startDate, endDate, sport, creatorId, 
    categories 
  } = req.body;
  
  // categories: Array of { name, hasGroups, groupCount, hasBrackets, bracketSize, participants }
  
  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Tournament
      const tournament = await tx.tournament.create({
        data: {
          name,
          location,
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
          sport,
          creatorId: parseInt(creatorId)
        }
      });

      // 2. Process each Category
      for (const catData of categories) {
        const category = await tx.category.create({
          data: {
            name: catData.name,
            tournamentId: tournament.id
          }
        });

        // 3. Create Pairs for this category
        const pairMap = new Map();
        for (const pName of catData.participants) {
          const pair = await tx.pair.create({
            data: { 
              name: pName, 
              categoryId: category.id 
            }
          });
          pairMap.set(pName, pair.id);
        }

        // 4. Create Groups if requested
        if (catData.hasGroups) {
          for (let i = 0; i < catData.groupCount; i++) {
            await tx.group.create({
              data: {
                name: `Grupo ${String.fromCharCode(65 + i)}`,
                categoryId: category.id
              }
            });
          }
        }

        // 5. Create Bracket if requested
        if (catData.hasBrackets) {
          const bracket = await tx.bracket.create({
            data: {
              name: 'Eliminatorias',
              categoryId: category.id
            }
          });

          const size = catData.bracketSize;
          let round = Math.log2(size);
          let currentRoundMatches: any[] = [];
          let nextRoundMatches: any[] = [];

          // Create matches from Final down to Quarters
          // Actually easier to create them and store them in a map to link them
          const matchMap = new Map<string, string>(); // round-index -> matchId

          for (let r = 1; r <= round; r++) {
            const matchesInRound = Math.pow(2, round - r);
            for (let i = 0; i < matchesInRound; i++) {
              const match = await tx.bracketMatch.create({
                data: {
                  bracketId: bracket.id,
                  round: r,
                  matchIndex: i,
                  // We'll update nextMatchId in a second pass or by logic
                }
              });
              matchMap.set(`${r}-${i}`, match.id);
            }
          }

          // Second pass: Link nextMatchId
          for (let r = round; r > 1; r--) {
            const matchesInRound = Math.pow(2, round - r);
            for (let i = 0; i < matchesInRound; i++) {
              const currentId = matchMap.get(`${r}-${i}`);
              const nextId = matchMap.get(`${r - 1}-${Math.floor(i / 2)}`);
              if (currentId && nextId) {
                await tx.bracketMatch.update({
                  where: { id: currentId },
                  data: { nextMatchId: nextId }
                });
              }
            }
          }
        }
      }

      return tournament;
    });

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false });
  }
});

// Tournament Detail: Get full structure
app.get('/api/tournaments/:id', async (req, res) => {
  try {
    const tournament = await prisma.tournament.findUnique({
      where: { id: req.params.id },
      include: {
        categories: {
          include: {
            groups: {
              include: {
                _count: { select: { pairs: true, matches: true } }
              }
            },
            brackets: {
              include: {
                _count: { select: { matches: true } }
              }
            },
            pairs: true
          }
        }
      }
    });
    res.json(tournament);
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

// Categories: Add Pair
app.post('/api/categories/:id/pairs', async (req, res) => {
  const { name } = req.body;
  try {
    const pair = await prisma.pair.create({
      data: {
        name,
        categoryId: req.params.id
      }
    });
    res.json(pair);
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

// Categories: Get detail
app.get('/api/categories/:id', async (req, res) => {
  try {
    const category = await prisma.category.findUnique({
      where: { id: req.params.id },
      include: {
        pairs: true,
        groups: true,
        brackets: true
      }
    });
    res.json(category);
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

// Categories: Create Group
app.post('/api/categories/:id/groups', async (req, res) => {
  const { name } = req.body;
  try {
    const group = await prisma.group.create({
      data: {
        name: name || 'Nuevo Grupo',
        categoryId: req.params.id
      }
    });
    res.json(group);
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

// Categories: Create Bracket
app.post('/api/categories/:id/brackets', async (req, res) => {
  const { name, size } = req.body;
  try {
    const result = await prisma.$transaction(async (tx) => {
      const bracket = await tx.bracket.create({
        data: {
          name: name || 'Eliminatorias',
          categoryId: req.params.id
        }
      });

      let round = Math.log2(size);
      const matchMap = new Map();

      for (let r = 1; r <= round; r++) {
        const matchesInRound = Math.pow(2, round - r);
        for (let i = 0; i < matchesInRound; i++) {
          const match = await tx.bracketMatch.create({
            data: {
              bracketId: bracket.id,
              round: r,
              matchIndex: i
            }
          });
          matchMap.set(`${r}-${i}`, match.id);
        }
      }

      for (let r = round; r > 1; r--) {
        const matchesInRound = Math.pow(2, round - r);
        for (let i = 0; i < matchesInRound; i++) {
          const currentId = matchMap.get(`${r}-${i}`);
          const nextId = matchMap.get(`${r - 1}-${Math.floor(i / 2)}`);
          if (currentId && nextId) {
            await tx.bracketMatch.update({
              where: { id: currentId },
              data: { nextMatchId: nextId }
            });
          }
        }
      }
      return bracket;
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

// Groups: Create (Legacy/Alternative)
app.post('/api/tournaments/:id/groups', async (req, res) => {
  const { name } = req.body;
  try {
    const group = await prisma.group.create({
      data: {
        name,
        tournamentId: req.params.id
      }
    });
    res.json(group);
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

// Groups: Get detail (Pairs & Matches)
app.get('/api/groups/:id', async (req, res) => {
  try {
    const group = await prisma.group.findUnique({
      where: { id: req.params.id },
      include: {
        category: true,
        pairs: { include: { _count: { select: { scores: true } } } },
        matches: {
          include: {
            pairA: true,
            pairB: true
          }
        }
      }
    });
    res.json(group);
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

// Pairs: Assign to Group
app.post('/api/groups/:id/pairs', async (req, res) => {
  const { pairId } = req.body;
  const groupId = req.params.id;
  try {
    const result = await prisma.$transaction(async (tx) => {
      const updatedPair = await tx.pair.update({
        where: { id: pairId },
        data: { groupId }
      });

      const existingPairs = await tx.pair.findMany({
        where: { groupId, id: { not: pairId } }
      });

      for (const p of existingPairs) {
        await tx.match.create({
          data: {
            groupId,
            pairAId: p.id,
            pairBId: pairId
          }
        });
      }
      return updatedPair;
    });
    res.json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: 'Error al asignar pareja' });
  }
});

// Brackets: Get detail
app.get('/api/brackets/:id', async (req, res) => {
  try {
    const bracket = await prisma.bracket.findUnique({
      where: { id: req.params.id },
      include: {
        category: true,
        matches: {
          include: {
            pairA: true,
            pairB: true
          }
        }
      }
    });
    res.json(bracket);
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

// Brackets: Update Match Result
app.post('/api/bracket-matches/:id/result', async (req, res) => {
  const { winnerId, pointsA, pointsB, nextMatchId, nextMatchPos } = req.body;
  // nextMatchPos: 'pairAId' or 'pairBId'
  try {
    await prisma.$transaction(async (tx) => {
      await tx.bracketMatch.update({
        where: { id: req.params.id },
        data: { winnerId, pointsA, pointsB }
      });

      if (nextMatchId && winnerId) {
        await tx.bracketMatch.update({
          where: { id: nextMatchId },
          data: { [nextMatchPos]: winnerId }
        });
      }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

// Matches: Update Result
app.post('/api/matches/:id/result', async (req, res) => {
  const { winnerId, pointsA, pointsB, pairAId, pairBId } = req.body;
  const matchId = req.params.id;

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Update Match
      await tx.match.update({
        where: { id: matchId },
        data: { winnerId, pointsA, pointsB }
      });

      // 2. Recalculate totalScore for Pair A
      const matchesA = await tx.match.findMany({ where: { pairAId } });
      const matchesB_asA = await tx.match.findMany({ where: { pairBId: pairAId } });
      
      const totalA = [...matchesA, ...matchesB_asA].reduce((sum, m) => {
        return sum + (m.pairAId === pairAId ? m.pointsA : m.pointsB);
      }, 0);

      await tx.pair.update({
        where: { id: pairAId },
        data: { totalScore: totalA }
      });

      // 3. Recalculate totalScore for Pair B
      const matchesB = await tx.match.findMany({ where: { pairBId } });
      const matchesA_asB = await tx.match.findMany({ where: { pairAId: pairBId } });
      
      const totalB = [...matchesB, ...matchesA_asB].reduce((sum, m) => {
        return sum + (m.pairBId === pairBId ? m.pointsB : m.pointsA);
      }, 0);

      await tx.pair.update({
        where: { id: pairBId },
        data: { totalScore: totalB }
      });
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

// Pairs: Delete
app.delete('/api/pairs/:id', async (req, res) => {
  try {
    await prisma.pair.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

// Pairs: Assign to Group (Batch)
app.post('/api/groups/:id/pairs/batch', async (req, res) => {
  const { pairIds } = req.body;
  const groupId = req.params.id;
  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Assign pairs to group
      await tx.pair.updateMany({
        where: { id: { in: pairIds } },
        data: { groupId }
      });

      // 2. Get all pairs now in the group to generate round-robin matches
      const allPairs = await tx.pair.findMany({
        where: { groupId }
      });

      // 3. Generate matches that don't already exist
      for (let i = 0; i < allPairs.length; i++) {
        for (let j = i + 1; j < allPairs.length; j++) {
          const pairAId = allPairs[i].id;
          const pairBId = allPairs[j].id;

          const existingMatch = await tx.match.findFirst({
            where: {
              OR: [
                { pairAId, pairBId, groupId },
                { pairAId: pairBId, pairBId: pairAId, groupId }
              ]
            }
          });

          if (!existingMatch) {
            await tx.match.create({
              data: {
                groupId,
                pairAId,
                pairBId
              }
            });
          }
        }
      }
      return { success: true };
    });
    res.json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: 'Error al asignar parejas' });
  }
});

// Pairs: Reset scores in a group (Legacy/Manual)
app.post('/api/groups/:id/reset', async (req, res) => {
  const groupId = req.params.id;
  try {
    const pairs = await prisma.pair.findMany({ where: { groupId } });
    await prisma.$transaction(async (tx) => {
      for (const pair of pairs) {
        await tx.score.deleteMany({ where: { pairId: pair.id } });
        await tx.pair.update({
          where: { id: pair.id },
          data: { totalScore: 0 }
        });
      }
      await tx.match.updateMany({
        where: { groupId },
        data: { winnerId: null, pointsA: 0, pointsB: 0 }
      });
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

// Groups: Delete
app.delete('/api/groups/:id', async (req, res) => {
  try {
    await prisma.group.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

// Brackets: Delete
app.delete('/api/brackets/:id', async (req, res) => {
  try {
    await prisma.bracket.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

// Tournaments: Update
app.patch('/api/tournaments/:id', async (req, res) => {
  const { name, location, startDate, endDate, sport } = req.body;
  try {
    const tournament = await prisma.tournament.update({
      where: { id: req.params.id },
      data: {
        name,
        location,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        sport
      }
    });
    res.json(tournament);
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

// Tournaments: Delete
app.delete('/api/tournaments/:id', async (req, res) => {
  try {
    await prisma.tournament.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

