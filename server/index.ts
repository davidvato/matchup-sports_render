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
      include: { _count: { select: { groups: true } } }
    });
    res.json(tournaments);
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

// Tournaments: Create
app.post('/api/tournaments', async (req, res) => {
  const { name, sport, creatorId } = req.body;
  try {
    const newTournament = await prisma.tournament.create({
      data: {
        name,
        sport: sport || 'General',
        creatorId: parseInt(creatorId)
      }
    });
    res.json(newTournament);
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
        groups: {
          include: {
            _count: { select: { pairs: true, matches: true } }
          }
        }
      }
    });
    res.json(tournament);
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

// Groups: Create
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

// Pairs: Create (+ Auto-matches)
app.post('/api/groups/:id/pairs', async (req, res) => {
  const { name } = req.body;
  const groupId = req.params.id;
  try {
    const result = await prisma.$transaction(async (tx) => {
      const newPair = await tx.pair.create({
        data: { name, groupId, totalScore: 0 }
      });

      const existingPairs = await tx.pair.findMany({
        where: { groupId, id: { not: newPair.id } }
      });

      for (const p of existingPairs) {
        await tx.match.create({
          data: {
            groupId,
            pairAId: p.id,
            pairBId: newPair.id
          }
        });
      }
      return newPair;
    });
    res.json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: 'Nombre ya existe o error' });
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

      // 2. Add scores
      await tx.score.create({ data: { points: pointsA, pairId: pairAId } });
      const pairA = await tx.pair.findUnique({ where: { id: pairAId } });
      await tx.pair.update({
        where: { id: pairAId },
        data: { totalScore: (pairA?.totalScore || 0) + pointsA }
      });

      await tx.score.create({ data: { points: pointsB, pairId: pairBId } });
      const pairB = await tx.pair.findUnique({ where: { id: pairBId } });
      await tx.pair.update({
        where: { id: pairBId },
        data: { totalScore: (pairB?.totalScore || 0) + pointsB }
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

// Groups: Reset
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
