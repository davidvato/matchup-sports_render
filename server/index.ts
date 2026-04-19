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
    name, location, startDate, endDate, sport, description, creatorId, 
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
          description,
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
          for (let r = 1; r < round; r++) {
            const matchesInRound = Math.pow(2, round - r);
            for (let i = 0; i < matchesInRound; i++) {
              const currentId = matchMap.get(`${r}-${i}`);
              const nextId = matchMap.get(`${r + 1}-${Math.floor(i / 2)}`);
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
        pairs: {
          include: {
            group: true,
            bracketMatchesAsA: { include: { bracket: true } },
            bracketMatchesAsB: { include: { bracket: true } }
          }
        },
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

      for (let r = 1; r < round; r++) {
        const matchesInRound = Math.pow(2, round - r);
        for (let i = 0; i < matchesInRound; i++) {
          const currentId = matchMap.get(`${r}-${i}`);
          const nextId = matchMap.get(`${r + 1}-${Math.floor(i / 2)}`);
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
        category: { include: { tournament: true } },
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
        category: {
          include: {
            tournament: true
          }
        },
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
  const { 
    winnerId, pointsA, pointsB, nextMatchId, nextMatchPos,
    set1A, set1B, set2A, set2B, set3A, set3B, set4A, set4B, set5A, set5B
  } = req.body;
  // nextMatchPos: 'pairAId' or 'pairBId'
  try {
    await prisma.$transaction(async (tx) => {
      await tx.bracketMatch.update({
        where: { id: req.params.id },
        data: { 
          winnerId, pointsA, pointsB,
          set1A: set1A || 0,
          set1B: set1B || 0,
          set2A: set2A || 0,
          set2B: set2B || 0,
          set3A: set3A || 0,
          set3B: set3B || 0,
          set4A: set4A || 0,
          set4B: set4B || 0,
          set5A: set5A || 0,
          set5B: set5B || 0
        }
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

// Brackets: Update Match Pairs (Manual)
app.patch('/api/bracket-matches/:id', async (req, res) => {
  const { pairAId, pairBId } = req.body;
  try {
    const match = await prisma.bracketMatch.update({
      where: { id: req.params.id },
      data: { 
        pairAId: pairAId === null ? null : pairAId,
        pairBId: pairBId === null ? null : pairBId
      }
    });
    res.json(match);
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

// Brackets: Reset all matches in a bracket
app.post('/api/brackets/:id/reset', async (req, res) => {
  const bracketId = req.params.id;
  try {
    await prisma.$transaction(async (tx) => {
      // 1. Reset all match results
      await tx.bracketMatch.updateMany({
        where: { bracketId },
        data: {
          pointsA: 0,
          pointsB: 0,
          winnerId: null
        }
      });

      // 2. Clear advancement (pairs in rounds > 1)
      await tx.bracketMatch.updateMany({
        where: { 
          bracketId,
          round: { gt: 1 }
        },
        data: {
          pairAId: null,
          pairBId: null
        }
      });
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Error resetting bracket:', error);
    res.status(500).json({ success: false });
  }
});

// Brackets: Random Seed
app.post('/api/brackets/:id/seed', async (req, res) => {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const bracket = await tx.bracket.findUnique({
        where: { id: req.params.id },
        include: { matches: true }
      });

      if (!bracket) throw new Error('Bracket not found');

      // Get pairs in category NOT in any group
      const pairs = await tx.pair.findMany({
        where: { 
          categoryId: bracket.categoryId,
          groupId: null
        }
      });

      // Find the first round matches (Always Round 1)
      const firstRoundMatches = await tx.bracketMatch.findMany({
        where: { bracketId: bracket.id, round: 1 },
        orderBy: { matchIndex: 'asc' }
      });

      // Shuffle pairs
      const shuffledPairs = [...pairs].sort(() => Math.random() - 0.5);

      // Assign to matches
      for (let i = 0; i < firstRoundMatches.length; i++) {
        const match = firstRoundMatches[i];
        const pA = shuffledPairs[i * 2] || null;
        const pB = shuffledPairs[i * 2 + 1] || null;

        await tx.bracketMatch.update({
          where: { id: match.id },
          data: {
            pairAId: pA?.id || null,
            pairBId: pB?.id || null
          }
        });
      }

      return { success: true };
    });
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false });
  }
});

// Matches: Update Result
app.post('/api/matches/:id/result', async (req, res) => {
  const { 
    winnerId, pointsA, pointsB, pairAId, pairBId,
    set1A, set1B, set2A, set2B, set3A, set3B, set4A, set4B, set5A, set5B
  } = req.body;
  const matchId = req.params.id;

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Update Match
      const match = await tx.match.update({
        where: { id: matchId },
        data: { 
          winnerId, pointsA, pointsB,
          set1A: set1A || 0,
          set1B: set1B || 0,
          set2A: set2A || 0,
          set2B: set2B || 0,
          set3A: set3A || 0,
          set3B: set3B || 0,
          set4A: set4A || 0,
          set4B: set4B || 0,
          set5A: set5A || 0,
          set5B: set5B || 0
        },
        include: { 
          group: { 
            include: { 
              category: { 
                include: { 
                  tournament: true 
                } 
              } 
            } 
          },
          pairA: true,
          pairA2: true,
          pairB: true,
          pairB2: true
        }
      });

      const sport = match.group.category.tournament.sport?.toLowerCase();

      const calculateStats = (matches: any[], pairId: string, currentSport: string | undefined) => {
        return matches.reduce((total, m) => {
          const isPlayed = !!m.winnerId;
          const isSitOut = !m.pairBId;
          if (isSitOut) return total; // Ignore sit-out matches in stats
          if (!isPlayed && m.pointsA === 0 && m.pointsB === 0) return total;

          const isSideA = m.pairAId === pairId || m.pairA2Id === pairId;
          const isSideB = m.pairBId === pairId || m.pairB2Id === pairId;
          if (!isSideA && !isSideB) return total;

          if (currentSport === 'futbol') {
            const myPoints = isSideA ? m.pointsA : m.pointsB;
            const opponentPoints = isSideA ? m.pointsB : m.pointsA;
            if (myPoints > opponentPoints) return total + 3;
            if (myPoints === opponentPoints) return total + 1;
            return total;
          } else if (currentSport === 'basquetball') {
            const myPoints = isSideA ? m.pointsA : m.pointsB;
            const opponentPoints = isSideA ? m.pointsB : m.pointsA;
            if (myPoints > opponentPoints) return total + 2;
            return total;
          } else if (currentSport === 'racquetball' || currentSport === 'pickleball') {
            const myPoints = isSideA ? m.pointsA : m.pointsB;
            const opponentPoints = isSideA ? m.pointsB : m.pointsA;
            return total + (myPoints - opponentPoints);
          } else {
            return total + (isSideA ? m.pointsA : m.pointsB);
          }
        }, 0);
      };

      // 2. Recalculate totalScore for all involved participants
      const involvedIds = [pairAId, match.pairA2Id, pairBId, match.pairB2Id].filter(id => !!id) as string[];

      for (const pId of involvedIds) {
        const matches_all = await tx.match.findMany({
          where: { 
            OR: [
              { pairAId: pId }, { pairA2Id: pId },
              { pairBId: pId }, { pairB2Id: pId }
            ] 
          }
        });
        const total = calculateStats(matches_all, pId, sport);
        await tx.pair.update({
          where: { id: pId },
          data: { totalScore: total }
        });
      }
    });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
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

      const group = await tx.group.findUnique({
        where: { id: groupId },
        include: { category: { include: { tournament: true } } }
      });
      if (!group) throw new Error('Group not found');
      const isPickleball = group.category.tournament.sport?.toLowerCase() === 'pickleball';

      if (isPickleball) {
        // Multi-Doubles Rotation Algorithm (Social Doubles)
        const N = allPairs.length;
        const indices = Array.from({ length: N }, (_, i) => i);
        
        // Strategy: 
        // For N players, we want to generate matches of (p1, p2) vs (p3, p4).
        // A simple rotation for N players can generate N rounds.
        // For each round i:
        // Partner player j with player (j + i) % N.
        
        const generatedMatches = new Set<string>();

        // We want every player to partner with every other player exactly once.
        // There are (N-1) possible partners for each player.
        // In each match, we use 2 player-partnerships.
        
        for (let partnerOffset = 1; partnerOffset < N; partnerOffset++) {
          const usedInRound = new Set<number>();
          for (let i = 0; i < N; i++) {
            if (usedInRound.has(i)) continue;
            const partner = (i + partnerOffset) % N;
            if (usedInRound.has(partner)) continue;

            // We have a pair (i, partner). Now we need an opponent pair.
            // Let's find the next available pair.
            let opponent1 = -1;
            let opponent2 = -1;
            for (let k = 0; k < N; k++) {
              if (usedInRound.has(k) || k === i || k === partner) continue;
              const kPartner = (k + partnerOffset) % N;
              if (usedInRound.has(kPartner) || kPartner === i || kPartner === partner || kPartner === k) continue;
              
              opponent1 = k;
              opponent2 = kPartner;
              break;
            }

            if (opponent1 !== -1) {
              // Create Match: (i, partner) vs (opponent1, opponent2)
              const pA1 = allPairs[i].id;
              const pA2 = allPairs[partner].id;
              const pB1 = allPairs[opponent1].id;
              const pB2 = allPairs[opponent2].id;

              // Avoid duplicates
              const matchKey = [pA1, pA2, pB1, pB2].sort().join('-');
              if (!generatedMatches.has(matchKey)) {
                await tx.match.create({
                  data: {
                    groupId,
                    pairAId: pA1,
                    pairA2Id: pA2,
                    pairBId: pB1,
                    pairB2Id: pB2
                  }
                });
                generatedMatches.add(matchKey);
              }
              usedInRound.add(i);
              usedInRound.add(partner);
              usedInRound.add(opponent1);
              usedInRound.add(opponent2);
            } else {
              // This pair (i, partner) has no opponent. It's a Sit-out (Descanso).
              // The user wants: "crea el juego y marcalo en rojo, de contrincante ponle dos guiones, marcador 0-0"
              // We'll create a match with only Side A filled. Side B is null.
              await tx.match.create({
                data: {
                  groupId,
                  pairAId: allPairs[i].id,
                  pairA2Id: allPairs[partner].id,
                  pairBId: null, // Use null for sit-out
                  pointsA: 0,
                  pointsB: 0,
                  winnerId: 'SITOUT' // Specific marker
                }
              });
              usedInRound.add(i);
              usedInRound.add(partner);
            }
          }
        }
      } else {
        // Standard Round-robin
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

// Categories: Reset (Groups results and delete brackets)
app.post('/api/categories/:id/reset', async (req, res) => {
  const { id: categoryId } = req.params;
  try {
    await prisma.$transaction(async (tx) => {
      // 1. Reset all groups in this category
      const groups = await tx.group.findMany({ where: { categoryId } });
      for (const group of groups) {
        const pairs = await tx.pair.findMany({ where: { groupId: group.id } });
        for (const pair of pairs) {
          await tx.score.deleteMany({ where: { pairId: pair.id } });
          await tx.pair.update({
            where: { id: pair.id },
            data: { totalScore: 0 }
          });
        }
        await tx.match.updateMany({
          where: { groupId: group.id },
          data: { winnerId: null, pointsA: 0, pointsB: 0 }
        });
      }
      // 2. Delete all brackets in this category
      await tx.bracket.deleteMany({ where: { categoryId } });
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Error resetting category:', error);
    res.status(500).json({ success: false });
  }
});

// Categories: Delete
app.delete('/api/categories/:id', async (req, res) => {
  const { id: categoryId } = req.params;
  try {
    await prisma.$transaction(async (tx) => {
      // 1. Delete all brackets and their matches first
      await tx.bracket.deleteMany({ where: { categoryId } });
      // 2. Delete the category (this will cascade to groups, pairs, etc.)
      await tx.category.delete({ where: { id: categoryId } });
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting category:', error);
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

// Tournaments: Create Category
app.post('/api/tournaments/:id/categories', async (req, res) => {
  const { name } = req.body;
  try {
    const category = await prisma.category.create({
      data: {
        name,
        tournamentId: req.params.id
      }
    });
    res.json(category);
  } catch (error) {
    console.error('Error creating category:', error);
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

