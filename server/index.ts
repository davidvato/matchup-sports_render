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

    if (user && user.password === password) { // In production use bcrypt!
      res.json({ success: true, user: { id: user.id, username: user.username, role: user.role } });
    } else {
      res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error de servidor' });
  }
});

// Auth: Register
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const newUser = await prisma.user.create({
      data: {
        username,
        password, // In production use bcrypt!
        role: 'ADMIN'
      }
    });
    res.json({ success: true, user: { id: newUser.id, username: newUser.username } });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Usuario ya existe o error de validación' });
  }
});

// Tournaments: Get all
app.get('/api/tournaments', async (req, res) => {
  try {
    const tournaments = await prisma.tournament.findMany({
      include: { creator: { select: { username: true } } }
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
        sport,
        creatorId
      }
    });
    res.json(newTournament);
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
