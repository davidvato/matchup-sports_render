import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, Users, Trophy, Activity, CheckCircle2, RotateCcw, Plus, X, AlertTriangle, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Pair {
  id: string;
  name: string;
  totalScore: number;
  groupId?: string | null;
  group?: { name: string } | null;
  bracketMatchesAsA?: { bracket: { name: string } }[];
  bracketMatchesAsB?: { bracket: { name: string } }[];
}

interface FootballStats {
  pj: number;
  g: number;
  e: number;
  p: number;
  gf: number;
  gc: number;
  dg: number;
  pts: number;
}

interface BasketballStats {
  pj: number;
  g: number;
  p: number;
  pf: number;
  pc: number;
  pts: number;
}

interface RacquetballStats {
  pj: number;
  g: number;
  p: number;
  pf: number;
  pc: number;
  pts: number;
}

interface Match {
  id: string;
  pairA: Pair;
  pairB: Pair;
  winnerId: string | null;
  pointsA: number;
  pointsB: number;
  set1A: number;
  set1B: number;
  set2A: number;
  set2B: number;
  set3A: number;
  set3B: number;
  set4A: number;
  set4B: number;
  set5A: number;
  set5B: number;
}

interface Group {
  id: string;
  name: string;
  categoryId: string;
  category: {
    tournamentId: string;
    tournament: { sport: string; description: string };
  };
  pairs: Pair[];
  matches: Match[];
}

const GroupDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [availablePairs, setAvailablePairs] = useState<Pair[]>([]);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [selectedPairs, setSelectedPairs] = useState<string[]>([]);
  const [registerModal, setRegisterModal] = useState({ show: false, name: '' });
  const [resultModal, setResultModal] = useState<{
    show: boolean;
    match: Match | null;
    rowPair: Pair | null;
    colPair: Pair | null;
    scoreRow: string;
    scoreCol: string;
    set1Row: string;
    set1Col: string;
    set2Row: string;
    set2Col: string;
    set3Row: string;
    set3Col: string;
  }>({
    show: false,
    match: null,
    rowPair: null,
    colPair: null,
    scoreRow: '0',
    scoreCol: '0',
    set1Row: '0',
    set1Col: '0',
    set2Row: '0',
    set2Col: '0',
    set3Row: '0',
    set3Col: '0',
    set4Row: '0',
    set4Col: '0',
    set5Row: '0',
    set5Col: '0'
  });
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    show: false,
    title: '',
    message: '',
    onConfirm: () => { }
  });

  useEffect(() => {
    fetchGroup();
  }, [id]);

  const fetchGroup = async () => {
    try {
      const res = await fetch(`http://localhost:3001/api/groups/${id}`);
      const data = await res.json();
      setGroup(data);

      // Fetch category pairs to see who is available
      if (data.categoryId) {
        const catRes = await fetch(`http://localhost:3001/api/categories/${data.categoryId}`);
        const catData = await catRes.json();
        // Get all category pairs (we will show them all with warnings instead of filtering)
        setAvailablePairs(catData.pairs);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGroup = () => {
    setConfirmModal({
      show: true,
      title: 'Eliminar Grupo',
      message: '¿Estás seguro de eliminar este grupo? Esta acción borrará todos sus partidos asociados.',
      onConfirm: async () => {
        try {
          const res = await fetch(`http://localhost:3001/api/groups/${id}`, { method: 'DELETE' });
          if (res.ok) navigate(`/tournament/${group?.category.tournamentId}`);
        } catch (err) {
          console.error(err);
        }
      }
    });
  };

  const handleBatchAdd = async () => {
    if (selectedPairs.length === 0) return;
    try {
      const res = await fetch(`http://localhost:3001/api/groups/${id}/pairs/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pairIds: selectedPairs })
      });
      if (res.ok) {
        setShowAddPlayer(false);
        setSelectedPairs([]);
        fetchGroup();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const togglePairSelection = (pair: Pair) => {
    const isSelected = selectedPairs.includes(pair.id);

    if (!isSelected) {
      // Check for existing assignments
      let warningMessage = '';
      if (pair.group && pair.groupId !== id) {
        warningMessage = `Este jugador ya está asignado al grupo: ${pair.group.name}.`;
      } else {
        const bracketA = pair.bracketMatchesAsA?.[0]?.bracket?.name;
        const bracketB = pair.bracketMatchesAsB?.[0]?.bracket?.name;
        const bracketName = bracketA || bracketB;
        if (bracketName) {
          warningMessage = `Este jugador ya está asignado al bracket: ${bracketName}.`;
        }
      }

      if (warningMessage) {
        setConfirmModal({
          show: true,
          title: 'Jugador ya asignado',
          message: `${warningMessage}\n\n¿Deseas seleccionarlo de todas formas? Se moverá a este grupo al guardar.`,
          onConfirm: () => {
            setSelectedPairs(prev => [...prev, pair.id]);
          }
        });
        return;
      }
    }

    setSelectedPairs(prev =>
      prev.includes(pair.id) ? prev.filter(id => id !== pair.id) : [...prev, pair.id]
    );
  };

  const handleRegisterPair = async () => {
    if (!registerModal.name.trim() || !group) return;
    try {
      const res = await fetch(`http://localhost:3001/api/categories/${group.categoryId}/pairs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: registerModal.name })
      });
      if (res.ok) {
        setRegisterModal({ show: false, name: '' });
        fetchGroup();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateResult = async (
    matchId: string, pairAId: string, pairBId: string,
    pointsA: number, pointsB: number,
    set1A?: number, set1B?: number,
    set2A?: number, set2B?: number,
    set3A?: number, set3B?: number,
    set4A?: number, set4B?: number,
    set5A?: number, set5B?: number
  ) => {
    if ((isBasketball || isRacquetball || isPickleball) && pointsA === pointsB) {
      setConfirmModal({
        show: true,
        title: 'Empate no permitido',
        message: `En ${isBasketball ? 'básquetbol' : (isRacquetball ? 'racquetball' : 'pickleball')} no puede haber empates. Por favor ingresa un ganador.`,
        onConfirm: () => { }
      });
      return;
    }

    const winnerId = pointsA > pointsB ? pairAId : (pointsB > pointsA ? pairBId : 'DRAW');
    try {
      const res = await fetch(`http://localhost:3001/api/matches/${matchId}/result`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          winnerId, pointsA, pointsB, pairAId, pairBId,
          set1A, set1B, set2A, set2B, 
          set3A, set3B, set4A, set4B,
          set5A, set5B
        })
      });
      if (res.ok) fetchGroup();
    } catch (err) {
      console.error(err);
    }
  };

  const resetGroup = async () => {
    setConfirmModal({
      show: true,
      title: 'Reiniciar Resultados',
      message: '¿Estás seguro de reiniciar todos los resultados de este grupo? Esta acción pondrá todos los marcadores en 0.',
      onConfirm: async () => {
        try {
          const res = await fetch(`http://localhost:3001/api/groups/${id}/reset`, { method: 'POST' });
          if (res.ok) fetchGroup();
        } catch (err) {
          console.error(err);
        }
      }
    });
  };

  if (loading) return <div style={{ color: 'white', textAlign: 'center', padding: '100px' }}>Cargando grupo...</div>;

  const isFootball = group?.category?.tournament?.sport?.toLowerCase() === 'futbol';
  const isBasketball = group?.category?.tournament?.sport?.toLowerCase() === 'basquetball';
  const isRacquetball = group?.category?.tournament?.sport?.toLowerCase() === 'racquetball';
  const isPickleball = group?.category?.tournament?.sport?.toLowerCase() === 'pickleball';
  const isRacquetball2Of3 = isRacquetball && group?.category?.tournament?.description === '2 de 3 sets a 15 puntos con cambios';
  const isRacquetball3Of5 = isRacquetball && group?.category?.tournament?.description === '3 de 5 sets a 11 puntos, punto directo, con diferencia de dos puntos';
  const isPickleballLogic = isPickleball && group?.category?.tournament?.description === '1 set a 7 puntos minimo';

  const getFootballStats = (pairId: string): FootballStats => {
    const stats = { pj: 0, g: 0, e: 0, p: 0, gf: 0, gc: 0, dg: 0, pts: 0 };
    if (!group) return stats;

    group.matches.forEach(m => {
      if (!m.winnerId && m.pointsA === 0 && m.pointsB === 0) return; // Match really not played (initial state)
      if (m.winnerId === 'DRAW' && m.pointsA === 0 && m.pointsB === 0) {
        // It's a played 0-0 draw, continue
      } else if (!m.winnerId) {
        return; // Other null winner cases are not played
      }

      const isPairA = m.pairA.id === pairId;
      const isPairB = m.pairB.id === pairId;
      if (!isPairA && !isPairB) return;

      stats.pj++;
      const selfPoints = isPairA ? m.pointsA : m.pointsB;
      const oppPoints = isPairA ? m.pointsB : m.pointsA;

      stats.gf += selfPoints;
      stats.gc += oppPoints;

      if (selfPoints > oppPoints) {
        stats.g++;
        stats.pts += 3;
      } else if (selfPoints === oppPoints) {
        stats.e++;
        stats.pts += 1;
      } else {
        stats.p++;
      }
    });

    stats.dg = stats.gf - stats.gc;
    return stats;
  };

  const getBasketballStats = (pairId: string): BasketballStats => {
    const stats = { pj: 0, g: 0, p: 0, pf: 0, pc: 0, pts: 0 };
    if (!group) return stats;

    group.matches.forEach(m => {
      if (!m.winnerId) return; // In basketball we don't handle 'DRAW' in groups

      const isPairA = m.pairA.id === pairId;
      const isPairB = m.pairB.id === pairId;
      if (!isPairA && !isPairB) return;

      stats.pj++;
      const selfPoints = isPairA ? m.pointsA : m.pointsB;
      const oppPoints = isPairA ? m.pointsB : m.pointsA;

      stats.pf += selfPoints;
      stats.pc += oppPoints;

      if (selfPoints > oppPoints) {
        stats.g++;
        stats.pts += 2;
      } else {
        stats.p++;
        stats.pts += 0;
      }
    });

    return stats;
  };

  const getRacquetballStats = (pairId: string): RacquetballStats => {
    const stats = { pj: 0, g: 0, p: 0, pf: 0, pc: 0, pts: 0 };
    if (!group) return stats;

    group.matches.forEach(m => {
      if (!m.winnerId) return;
      if (m.winnerId === 'SITOUT') return; // Ignore sit-out matches in stats

      const isSideA = m.pairAId === pairId || m.pairA2Id === pairId;
      const isSideB = m.pairBId === pairId || m.pairB2Id === pairId;
      if (!isSideA && !isSideB) return;

      stats.pj++;
      const selfPoints = isSideA ? m.pointsA : m.pointsB;
      const oppPoints = isSideA ? m.pointsB : m.pointsA;

      stats.pf += selfPoints;
      stats.pc += oppPoints;

      if (selfPoints > oppPoints) {
        stats.g++;
      } else {
        stats.p++;
      }
    });

    stats.pts = isPickleball ? stats.pf : stats.pf - stats.pc;
    return stats;
  };

  const standings = [...(group?.pairs || [])].sort((a, b) => {
    if (isFootball) {
      const statsA = getFootballStats(a.id);
      const statsB = getFootballStats(b.id);

      if (statsB.pts !== statsA.pts) return statsB.pts - statsA.pts;
      if (statsB.dg !== statsA.dg) return statsB.dg - statsA.dg;
      return statsB.gf - statsA.gf;
    }
    if (isBasketball) {
      const statsA = getBasketballStats(a.id);
      const statsB = getBasketballStats(b.id);

      if (statsB.pts !== statsA.pts) return statsB.pts - statsA.pts;
      return statsB.g - statsA.g;
    }
    if (isPickleball) {
      const statsA = getRacquetballStats(a.id);
      const statsB = getRacquetballStats(b.id);
      
      if (statsB.g !== statsA.g) return statsB.g - statsA.g;
      return statsB.pts - statsA.pts;
    }
    if (isRacquetball) {
      const statsA = getRacquetballStats(a.id);
      const statsB = getRacquetballStats(b.id);
      
      if (statsB.pts !== statsA.pts) return statsB.pts - statsA.pts;
      return statsB.g - statsA.g;
    }
    return b.totalScore - a.totalScore;
  });

  return (
    <div style={{
      minHeight: '100vh', padding: '120px 2rem 50px',
      backgroundImage: 'linear-gradient(135deg, #0c0e14 0%, #1a1d23 100%)', color: 'white'
    }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <header style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Link to={group ? `/tournament/${group.category.tournamentId}` : '/'} style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'rgba(255,255,255,0.5)', textDecoration: 'none', marginBottom: '1rem' }}>
              <ChevronLeft size={18} /> Volver al Torneo
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <h1 className="gradient-text" style={{ fontSize: '3rem', margin: 0 }}>{group?.name}</h1>
              {isAdmin && (
                <button
                  onClick={handleDeleteGroup}
                  style={{
                    background: 'rgba(255, 71, 87, 0.1)',
                    border: '1px solid rgba(255, 71, 87, 0.3)',
                    color: '#ff4757',
                    padding: '8px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease'
                  }}
                  title="Eliminar grupo"
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 71, 87, 0.2)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 71, 87, 0.1)'}
                >
                  <Trash2 size={20} />
                </button>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            {isAdmin && (
              <>
                <button onClick={() => setShowAddPlayer(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Plus size={18} /> Asignar Jugadores
                </button>
                <button onClick={resetGroup} className="btn-primary" style={{ background: 'rgba(255,75,43,0.1)', color: '#ff4b2b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <RotateCcw size={18} /> Reiniciar Grupo
                </button>
              </>
            )}
          </div>
        </header>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          {/* Standings Table (Moved to Center) */}
            <section>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                <Trophy size={22} color="var(--primary)" /> Tabla de Posiciones
              </h2>
              <div className="glass-card fadeIn" style={{ padding: '2rem', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', opacity: 0.5, fontSize: '0.8rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      <th style={{ padding: '12px' }}>#</th>
                      <th style={{ padding: '12px' }}>Jugador(es)</th>
                      {isFootball ? (
                        <>
                          <th style={{ padding: '12px', textAlign: 'center' }}>PJ</th>
                          <th style={{ padding: '12px', textAlign: 'center' }}>G</th>
                          <th style={{ padding: '12px', textAlign: 'center' }}>E</th>
                          <th style={{ padding: '12px', textAlign: 'center' }}>P</th>
                          <th style={{ padding: '12px', textAlign: 'center' }}>GF</th>
                          <th style={{ padding: '12px', textAlign: 'center' }}>GC</th>
                          <th style={{ padding: '12px', textAlign: 'center' }}>DG</th>
                          <th style={{ padding: '12px', textAlign: 'right' }}>Pts</th>
                        </>
                      ) : isBasketball ? (
                        <>
                          <th style={{ padding: '12px', textAlign: 'center' }}>PJ</th>
                          <th style={{ padding: '12px', textAlign: 'center' }}>PG</th>
                          <th style={{ padding: '12px', textAlign: 'center' }}>PP</th>
                          <th style={{ padding: '12px', textAlign: 'right' }}>Pts</th>
                        </>
                      ) : isPickleball ? (
                        <>
                          <th style={{ padding: '12px', textAlign: 'center' }}>PJ</th>
                          <th style={{ padding: '12px', textAlign: 'center' }}>PG</th>
                          <th style={{ padding: '12px', textAlign: 'center' }}>PP</th>
                          <th style={{ padding: '12px', textAlign: 'right' }}>Pts</th>
                        </>
                      ) : isRacquetball ? (
                        <>
                          <th style={{ padding: '12px', textAlign: 'center' }}>PJ</th>
                          <th style={{ padding: '12px', textAlign: 'center' }}>PG</th>
                          <th style={{ padding: '12px', textAlign: 'center' }}>PP</th>
                          <th style={{ padding: '12px', textAlign: 'center' }}>PF</th>
                          <th style={{ padding: '12px', textAlign: 'center' }}>PC</th>
                          <th style={{ padding: '12px', textAlign: 'right' }}>Pts</th>
                        </>
                      ) : (
                        <th style={{ padding: '12px', textAlign: 'right' }}>Pts</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((pair, idx) => {
                      const statsF = isFootball ? getFootballStats(pair.id) : null;
                      const statsB = isBasketball ? getBasketballStats(pair.id) : null;
                      const statsR = (isRacquetball || isPickleball) ? getRacquetballStats(pair.id) : null;
                      return (
                        <tr key={pair.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: idx === 0 ? 'rgba(0, 242, 254, 0.05)' : 'transparent' }}>
                          <td style={{ padding: '15px 12px', opacity: 0.5 }}>{idx + 1}</td>
                          <td style={{ padding: '15px 12px', fontWeight: idx === 0 ? 'bold' : 'normal' }}>{pair.name}</td>
                          {isFootball && statsF ? (
                            <>
                              <td style={{ padding: '15px 12px', textAlign: 'center' }}>{statsF.pj}</td>
                              <td style={{ padding: '15px 12px', textAlign: 'center' }}>{statsF.g}</td>
                              <td style={{ padding: '15px 12px', textAlign: 'center' }}>{statsF.e}</td>
                              <td style={{ padding: '15px 12px', textAlign: 'center' }}>{statsF.p}</td>
                              <td style={{ padding: '15px 12px', textAlign: 'center' }}>{statsF.gf}</td>
                              <td style={{ padding: '15px 12px', textAlign: 'center' }}>{statsF.gc}</td>
                              <td style={{ padding: '15px 12px', textAlign: 'center' }}>{statsF.dg}</td>
                              <td style={{ padding: '15px 12px', textAlign: 'right', color: 'var(--primary)', fontWeight: 'bold' }}>{statsF.pts}</td>
                            </>
                          ) : isBasketball && statsB ? (
                            <>
                              <td style={{ padding: '15px 12px', textAlign: 'center' }}>{statsB.pj}</td>
                              <td style={{ padding: '15px 12px', textAlign: 'center' }}>{statsB.g}</td>
                              <td style={{ padding: '15px 12px', textAlign: 'center' }}>{statsB.p}</td>
                              <td style={{ padding: '15px 12px', textAlign: 'right', color: 'var(--primary)', fontWeight: 'bold' }}>{statsB.pts}</td>
                            </>
                          ) : isPickleball && statsR ? (
                            <>
                              <td style={{ padding: '15px 12px', textAlign: 'center' }}>{statsR.pj}</td>
                              <td style={{ padding: '15px 12px', textAlign: 'center' }}>{statsR.g}</td>
                              <td style={{ padding: '15px 12px', textAlign: 'center' }}>{statsR.p}</td>
                              <td style={{ padding: '15px 12px', textAlign: 'right', color: 'var(--primary)', fontWeight: 'bold' }}>{statsR.pts}</td>
                            </>
                          ) : isRacquetball && statsR ? (
                            <>
                              <td style={{ padding: '15px 12px', textAlign: 'center' }}>{statsR.pj}</td>
                              <td style={{ padding: '15px 12px', textAlign: 'center' }}>{statsR.g}</td>
                              <td style={{ padding: '15px 12px', textAlign: 'center' }}>{statsR.p}</td>
                              <td style={{ padding: '15px 12px', textAlign: 'center' }}>{statsR.pf}</td>
                              <td style={{ padding: '15px 12px', textAlign: 'center' }}>{statsR.pc}</td>
                              <td style={{ padding: '15px 12px', textAlign: 'right', color: 'var(--primary)', fontWeight: 'bold' }}>{statsR.pts}</td>
                            </>
                          ) : (
                            <td style={{ padding: '15px 12px', textAlign: 'right', color: 'var(--primary)', fontWeight: 'bold' }}>{pair.totalScore}</td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Matches List: Detailed View */}
            <section className="fadeIn">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                <CheckCircle2 color="var(--primary)" /> Detalle de Partidos
              </h2>
              <div className="glass-card" style={{ padding: '1.5rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', opacity: 0.5, fontSize: '0.8rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      <th style={{ padding: '12px' }}>Partido</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>Marcador</th>
                      <th style={{ padding: '12px' }}>Ganador</th>
                      <th style={{ padding: '12px' }}>Perdedor</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...(group?.matches || [])].sort((a, b) => a.pairA.name.localeCompare(b.pairA.name)).map(match => (
                      <tr key={match.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '15px 12px', background: match.winnerId === 'SITOUT' ? 'rgba(255, 75, 43, 0.1)' : 'transparent' }}>
                          {match.winnerId === 'SITOUT' ? (
                            <span style={{ color: '#ff4b2b', fontWeight: 'bold' }}>
                              {match.pairA2 ? 'Descansan: ' : 'Descansa: '}
                              {match.pairA.name}{match.pairA2 ? ` / ${match.pairA2.name}` : ''}
                            </span>
                          ) : (
                            <>
                              <span style={{ fontWeight: match.winnerId === match.pairA.id ? 'bold' : 'normal', color: match.winnerId === match.pairA.id ? 'var(--primary)' : 'inherit' }}>
                                {match.pairA.name}{match.pairA2 ? ` / ${match.pairA2.name}` : ''}
                              </span>
                              <span style={{ margin: '0 10px', opacity: 0.3 }}>vs</span>
                              <span style={{ fontWeight: match.winnerId === match.pairB?.id ? 'bold' : 'normal', color: match.winnerId === match.pairB?.id ? 'var(--primary)' : 'inherit' }}>
                                {match.pairB?.name || '--'}{match.pairB2 ? ` / ${match.pairB2.name}` : ''}
                              </span>
                            </>
                          )}
                        </td>
                        <td style={{ padding: '15px 12px', textAlign: 'center', fontWeight: 'bold' }}>
                          {match.winnerId ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                              <span>
                                {(isRacquetball2Of3 || isRacquetball3Of5) ? (
                                  (() => {
                                    if (isRacquetball3Of5) {
                                      if (match.set5A > 0 || match.set5B > 0) return `${match.set5A} - ${match.set5B}`;
                                      if (match.set4A > 0 || match.set4B > 0) return `${match.set4A} - ${match.set4B}`;
                                    }
                                    if (match.set3A > 0 || match.set3B > 0) return `${match.set3A} - ${match.set3B}`;
                                    if (match.set2A > 0 || match.set2B > 0) return `${match.set2A} - ${match.set2B}`;
                                    return `${match.set1A} - ${match.set1B}`;
                                  })()
                                ) : (
                                  `${match.pointsA} - ${match.pointsB}`
                                )}
                              </span>
                              {isRacquetball2Of3 && (
                                <span style={{ fontSize: '0.7rem', opacity: 0.5, fontWeight: 'normal' }}>
                                  ({match.set1A}-{match.set1B}, {match.set2A}-{match.set2B}, {match.set3A}-{match.set3B})
                                </span>
                              )}
                              {isRacquetball3Of5 && (
                                <span style={{ fontSize: '0.7rem', opacity: 0.5, fontWeight: 'normal' }}>
                                  ({match.set1A}-{match.set1B}, {match.set2A}-{match.set2B}, {match.set3A}-{match.set3B}, {match.set4A}-{match.set4B}, {match.set5A}-{match.set5B})
                                </span>
                              )}
                              {isPickleballLogic && (
                                <span style={{ fontSize: '0.7rem', opacity: 0.5, fontWeight: 'normal' }}>
                                  ({match.set1A}-{match.set1B})
                                </span>
                              )}
                            </div>
                          ) : '-- : --'}
                        </td>
                        <td style={{ padding: '15px 12px' }}>
                          {match.winnerId && match.winnerId !== 'SITOUT' ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4ade80' }}>
                              <Trophy size={16} />
                              <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
                                {match.winnerId === match.pairAId 
                                  ? `${match.pairA.name}${match.pairA2 ? ` / ${match.pairA2.name}` : ''}`
                                  : `${match.pairB.name}${match.pairB2 ? ` / ${match.pairB2.name}` : ''}`}
                              </span>
                            </div>
                          ) : '--'}
                        </td>
                        <td style={{ padding: '15px 12px' }}>
                          {match.winnerId && match.winnerId !== 'SITOUT' ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ff4757' }}>
                              <Trophy size={16} />
                              <span style={{ fontSize: '0.8rem' }}>
                                {match.winnerId === match.pairAId 
                                  ? `${match.pairB.name}${match.pairB2 ? ` / ${match.pairB2.name}` : ''}`
                                  : `${match.pairA.name}${match.pairA2 ? ` / ${match.pairA2.name}` : ''}`}
                              </span>
                            </div>
                          ) : '--'}
                        </td>
                        <td style={{ padding: '15px 12px', textAlign: 'right' }}>
                          {match.winnerId === 'SITOUT' ? (
                            <span style={{ fontSize: '0.75rem', background: 'rgba(255, 75, 43, 0.2)', color: '#ff4b2b', padding: '4px 10px', borderRadius: '12px', fontWeight: 'bold' }}>Descanso</span>
                          ) : match.winnerId ? (
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', alignItems: 'center' }}>
                              {isAdmin && (
                                <button
                                  onClick={() => {
                                    setResultModal({
                                      show: true,
                                      match,
                                      rowPair: match.pairA,
                                      colPair: match.pairB,
                                      scoreRow: String(match.pointsA),
                                      scoreCol: String(match.pointsB),
                                      set1Row: String(match.set1A),
                                      set1Col: String(match.set1B),
                                      set2Row: String(match.set2A),
                                      set2Col: String(match.set2B),
                                      set3Row: String(match.set3A),
                                      set3Col: String(match.set3B),
                                      set4Row: String(match.set4A),
                                      set4Col: String(match.set4B),
                                      set5Row: String(match.set5A),
                                      set5Col: String(match.set5B)
                                    });
                                  }}
                                  style={{ padding: '4px 8px', fontSize: '0.7rem', background: 'rgba(255,255,255,0.1)', color: 'white', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer' }}
                                >
                                  Editar
                                </button>
                              )}
                              <span style={{ fontSize: '0.75rem', background: 'rgba(74, 222, 128, 0.1)', color: '#4ade80', padding: '4px 10px', borderRadius: '12px', fontWeight: 'bold' }}>Finalizado</span>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                              {isAdmin && (
                                <button 
                                  onClick={() => {
                                    setResultModal({
                                      show: true,
                                      match,
                                      rowPair: match.pairA,
                                      colPair: match.pairB,
                                      scoreRow: String(match.pointsA),
                                      scoreCol: String(match.pointsB),
                                      set1Row: String(match.set1A),
                                      set1Col: String(match.set1B),
                                      set2Row: String(match.set2A),
                                      set2Col: String(match.set2B),
                                      set3Row: String(match.set3A),
                                      set3Col: String(match.set3B),
                                      set4Row: String(match.set4A),
                                      set4Col: String(match.set4B),
                                      set5Row: String(match.set5A),
                                      set5Col: String(match.set5B)
                                    });
                                  }}
                                  style={{ padding: '4px 8px', fontSize: '0.7rem', background: 'var(--primary)', color: 'black', borderRadius: '4px', border: 'none', cursor: 'pointer' }}
                                >
                                  Cargar
                                </button>
                              )}
                              <span style={{ fontSize: '0.75rem', background: 'rgba(255, 255, 255, 0.05)', color: 'rgba(255,255,255,0.3)', padding: '4px 10px', borderRadius: '12px' }}>Pendiente</span>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </div>

      {/* Add Player Modal */}
      {showAddPlayer && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 3000, padding: '2rem', backdropFilter: 'blur(8px)'
        }}>
          <div className="glass-card fadeIn" style={{ padding: '3rem', maxWidth: '500px', width: '100%', backgroundColor: '#1a1d23' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 style={{ margin: 0 }}>Asignar a {group?.name}</h2>
              <button
                onClick={() => setRegisterModal({ show: true, name: '' })}
                className="btn-primary"
                style={{
                  background: 'linear-gradient(90deg, #00f2fe 0%, #4facfe 100%)',
                  color: '#000',
                  fontWeight: 'bold',
                  fontSize: '0.8rem',
                  padding: '0.6rem 1.2rem',
                  border: 'none',
                  boxShadow: '0 4px 15px rgba(0, 242, 254, 0.3)'
                }}
              >
                + Registrar Nuevo
              </button>
            </div>
            <p style={{ opacity: 0.6, marginBottom: '2rem' }}>Selecciona los jugadores de la categoría para unirlos a este grupo:</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '300px', overflowY: 'auto', paddingRight: '10px', marginBottom: '2rem' }}>
              {availablePairs.map(pair => {
                const isAssigned = (pair.group && pair.groupId !== id) ||
                  (pair.bracketMatchesAsA?.length! > 0) ||
                  (pair.bracketMatchesAsB?.length! > 0);
                let assignmentLabel = '';
                if (pair.group && pair.groupId !== id) assignmentLabel = `(En ${pair.group.name})`;
                else if (pair.bracketMatchesAsA?.[0]?.bracket?.name || pair.bracketMatchesAsB?.[0]?.bracket?.name) {
                  assignmentLabel = `(En ${pair.bracketMatchesAsA?.[0]?.bracket?.name || pair.bracketMatchesAsB?.[0]?.bracket?.name})`;
                }

                return (
                  <div
                    key={pair.id}
                    className="glass-card"
                    onClick={() => togglePairSelection(pair)}
                    style={{
                      padding: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: selectedPairs.includes(pair.id) ? 'rgba(0, 242, 254, 0.1)' : 'rgba(255,255,255,0.02)',
                      border: selectedPairs.includes(pair.id) ? '1px solid var(--primary)' : '1px solid transparent',
                      cursor: 'pointer',
                      opacity: pair.groupId === id ? 0.3 : 1, // Dim if already in THIS group
                      pointerEvents: pair.groupId === id ? 'none' : 'auto'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <input
                        type="checkbox"
                        checked={selectedPairs.includes(pair.id)}
                        onChange={() => { }} // Controlled via onClick of parent
                        style={{ cursor: 'pointer', width: '20px', height: '20px', accentColor: 'var(--primary)' }}
                      />
                      <span>{pair.name}</span>
                    </div>
                    {isAssigned && (
                      <span style={{ fontSize: '0.7rem', opacity: 0.5, fontStyle: 'italic' }}>{assignmentLabel}</span>
                    )}
                  </div>
                );
              })}
              {availablePairs.length === 0 && (
                <p style={{ textAlign: 'center', opacity: 0.4, padding: '2rem' }}>No hay jugadores disponibles en esta categoría.</p>
              )}
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                className="btn-primary"
                onClick={() => { setShowAddPlayer(false); setSelectedPairs([]); }}
                style={{ flex: 1, background: 'rgba(255,255,255,0.05)', color: 'white' }}
              >
                Cancelar
              </button>
              <button
                className="btn-primary"
                onClick={handleBatchAdd}
                disabled={selectedPairs.length === 0}
                style={{ flex: 1, opacity: selectedPairs.length === 0 ? 0.5 : 1 }}
              >
                Asignar ({selectedPairs.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Result Modal */}
      {resultModal.show && resultModal.match && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 4500, padding: '2rem', backdropFilter: 'blur(8px)'
        }}>
          <div className="glass-card fadeIn" style={{
            padding: '3rem', maxWidth: '500px', width: '100%',
            backgroundColor: '#1a1d23', textAlign: 'center'
          }}>
            <h2 style={{ marginBottom: '2rem', color: 'white' }}>Registrar Resultado</h2>

            {(!isRacquetball2Of3 && !isRacquetball3Of5 && !isPickleballLogic) ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem', marginBottom: '3rem' }}>
                <div style={{ flex: 1, textAlign: 'right' }}>
                  <div style={{ fontSize: '1.2rem', marginBottom: '10px', fontWeight: 'bold' }}>
                    {resultModal.rowPair?.name}{resultModal.match?.pairA2Id === resultModal.rowPair?.id ? ` / ${resultModal.match?.pairA.name}` : (resultModal.match?.pairAId === resultModal.rowPair?.id ? ` / ${resultModal.match?.pairA2?.name}` : '')}
                    {resultModal.match?.pairBId === resultModal.rowPair?.id ? ` / ${resultModal.match?.pairB2?.name}` : (resultModal.match?.pairB2Id === resultModal.rowPair?.id ? ` / ${resultModal.match?.pairB?.name}` : '')}
                  </div>
                  <input
                    type="number"
                    className="input-field"
                    style={{ width: '80px', fontSize: '2rem', textAlign: 'center', padding: '0.5rem' }}
                    value={resultModal.scoreRow}
                    onChange={(e) => setResultModal({ ...resultModal, scoreRow: e.target.value })}
                    autoFocus
                  />
                </div>
                <div style={{ fontSize: '2rem', opacity: 0.3 }}>-</div>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontSize: '1.2rem', marginBottom: '10px', fontWeight: 'bold' }}>
                    {resultModal.colPair?.name}{resultModal.match?.pairA2Id === resultModal.colPair?.id ? ` / ${resultModal.match?.pairA.name}` : (resultModal.match?.pairAId === resultModal.colPair?.id ? ` / ${resultModal.match?.pairA2?.name}` : '')}
                    {resultModal.match?.pairBId === resultModal.colPair?.id ? ` / ${resultModal.match?.pairB2?.name}` : (resultModal.match?.pairB2Id === resultModal.colPair?.id ? ` / ${resultModal.match?.pairB?.name}` : '')}
                  </div>
                  <input
                    type="number"
                    className="input-field"
                    style={{ width: '80px', fontSize: '2rem', textAlign: 'center', padding: '0.5rem' }}
                    value={resultModal.scoreCol}
                    onChange={(e) => setResultModal({ ...resultModal, scoreCol: e.target.value })}
                  />
                </div>
              </div>
            ) : isRacquetball2Of3 ? (
              <div style={{ marginBottom: '3rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1.5fr', gap: '1rem', alignItems: 'center', marginBottom: '1rem', opacity: 0.5, fontSize: '0.8rem' }}>
                  <div style={{ textAlign: 'right' }}>Jugador A</div>
                  <div style={{ textAlign: 'center' }}>Set A</div>
                  <div style={{ textAlign: 'center' }}>Set B</div>
                  <div style={{ textAlign: 'left' }}>Jugador B</div>
                </div>

                <SetRow label="Set 1" valA={resultModal.set1Row} valB={resultModal.set1Col} onChangeA={(v) => setResultModal({ ...resultModal, set1Row: v })} onChangeB={(v) => setResultModal({ ...resultModal, set1Col: v })} />
                <SetRow label="Set 2" valA={resultModal.set2Row} valB={resultModal.set2Col} onChangeA={(v) => setResultModal({ ...resultModal, set2Row: v })} onChangeB={(v) => setResultModal({ ...resultModal, set2Col: v })} />
                <SetRow label="Set 3" valA={resultModal.set3Row} valB={resultModal.set3Col} onChangeA={(v) => setResultModal({ ...resultModal, set3Row: v })} onChangeB={(v) => setResultModal({ ...resultModal, set3Col: v })} />

                <div style={{
                  marginTop: '2rem', padding: '1.5rem', background: 'rgba(255,255,255,0.02)',
                  borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  border: '1px solid rgba(255,255,255,0.05)'
                }}>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '0.8rem', opacity: 0.5 }}>Total {resultModal.rowPair?.name}</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                      {(parseInt(resultModal.set1Row) || 0) + (parseInt(resultModal.set2Row) || 0) + (parseInt(resultModal.set3Row) || 0)}
                    </div>
                  </div>
                  <div style={{ fontSize: '1.2rem', opacity: 0.2 }}>Suma PF-PC</div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.8rem', opacity: 0.5 }}>Total {resultModal.colPair?.name}</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                      {(parseInt(resultModal.set1Col) || 0) + (parseInt(resultModal.set2Col) || 0) + (parseInt(resultModal.set3Col) || 0)}
                    </div>
                  </div>
                </div>
              </div>
            ) : isRacquetball3Of5 ? (
              <div style={{ marginBottom: '3rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1.5fr', gap: '0.8rem', alignItems: 'center', marginBottom: '1rem', opacity: 0.5, fontSize: '0.8rem' }}>
                  <div style={{ textAlign: 'right' }}>{resultModal.rowPair?.name}</div>
                  <div style={{ textAlign: 'center' }}>Sets</div>
                  <div style={{ textAlign: 'center' }}>Sets</div>
                  <div style={{ textAlign: 'left' }}>{resultModal.colPair?.name}</div>
                </div>

                <SetRow label="Set 1" valA={resultModal.set1Row} valB={resultModal.set1Col} onChangeA={(v) => setResultModal({ ...resultModal, set1Row: v })} onChangeB={(v) => setResultModal({ ...resultModal, set1Col: v })} />
                <SetRow label="Set 2" valA={resultModal.set2Row} valB={resultModal.set2Col} onChangeA={(v) => setResultModal({ ...resultModal, set2Row: v })} onChangeB={(v) => setResultModal({ ...resultModal, set2Col: v })} />
                <SetRow label="Set 3" valA={resultModal.set3Row} valB={resultModal.set3Col} onChangeA={(v) => setResultModal({ ...resultModal, set3Row: v })} onChangeB={(v) => setResultModal({ ...resultModal, set3Col: v })} />
                <SetRow label="Set 4" valA={resultModal.set4Row} valB={resultModal.set4Col} onChangeA={(v) => setResultModal({ ...resultModal, set4Row: v })} onChangeB={(v) => setResultModal({ ...resultModal, set4Col: v })} />
                <SetRow label="Set 5" valA={resultModal.set5Row} valB={resultModal.set5Col} onChangeA={(v) => setResultModal({ ...resultModal, set5Row: v })} onChangeB={(v) => setResultModal({ ...resultModal, set5Col: v })} />

                <div style={{
                  marginTop: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.02)',
                  borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  border: '1px solid rgba(255,255,255,0.05)'
                }}>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>Total {resultModal.rowPair?.name}</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                      {(parseInt(resultModal.set1Row) || 0) + (parseInt(resultModal.set2Row) || 0) + (parseInt(resultModal.set3Row) || 0) + (parseInt(resultModal.set4Row) || 0) + (parseInt(resultModal.set5Row) || 0)}
                    </div>
                  </div>
                  <div style={{ fontSize: '1rem', opacity: 0.2 }}>Suma Puntos</div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>Total {resultModal.colPair?.name}</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                      {(parseInt(resultModal.set1Col) || 0) + (parseInt(resultModal.set2Col) || 0) + (parseInt(resultModal.set3Col) || 0) + (parseInt(resultModal.set4Col) || 0) + (parseInt(resultModal.set5Col) || 0)}
                    </div>
                  </div>
                </div>
              </div>
            ) : isPickleballLogic ? (
              <div style={{ marginBottom: '3rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1.5fr', gap: '1rem', alignItems: 'center', marginBottom: '1rem', opacity: 0.5, fontSize: '0.8rem' }}>
                  <div style={{ textAlign: 'right' }}>{resultModal.rowPair?.name}</div>
                  <div style={{ textAlign: 'center' }}>Set 1</div>
                  <div style={{ textAlign: 'center' }}>Set 1</div>
                  <div style={{ textAlign: 'left' }}>{resultModal.colPair?.name || '--'}</div>
                </div>

                <SetRow label="Único Set" valA={resultModal.set1Row} valB={resultModal.set1Col} onChangeA={(v) => setResultModal({ ...resultModal, set1Row: v })} onChangeB={(v) => setResultModal({ ...resultModal, set1Col: v })} />

                <div style={{
                  marginTop: '2rem', padding: '1.5rem', background: 'rgba(255,255,255,0.02)',
                  borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center',
                  border: '1px solid rgba(255,255,255,0.05)'
                }}>
                  <div style={{ fontSize: '1.2rem', color: 'var(--primary)', fontWeight: 'bold' }}>
                    Solo cuenta el primer set
                  </div>
                </div>
              </div>
            ) : null}

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                className="btn-primary"
                onClick={() => setResultModal({ ...resultModal, show: false })}
                style={{ flex: 1, background: 'rgba(255,255,255,0.05)', color: 'white' }}
              >
                Cancelar
              </button>
              <button
                className="btn-primary"
                onClick={async () => {
                  const isRowPairA = resultModal.match!.pairA.id === resultModal.rowPair!.id;

                  let pA, pB, s1A, s1B, s2A, s2B, s3A, s3B, s4A, s4B, s5A, s5B;

                  if (isRacquetball2Of3) {
                    s1A = isRowPairA ? parseInt(resultModal.set1Row) || 0 : parseInt(resultModal.set1Col) || 0;
                    s1B = isRowPairA ? parseInt(resultModal.set1Col) || 0 : parseInt(resultModal.set1Row) || 0;
                    s2A = isRowPairA ? parseInt(resultModal.set2Row) || 0 : parseInt(resultModal.set2Col) || 0;
                    s2B = isRowPairA ? parseInt(resultModal.set2Col) || 0 : parseInt(resultModal.set2Row) || 0;
                    s3A = isRowPairA ? parseInt(resultModal.set3Row) || 0 : parseInt(resultModal.set3Col) || 0;
                    s3B = isRowPairA ? parseInt(resultModal.set3Col) || 0 : parseInt(resultModal.set3Row) || 0;

                    // Validación de puntajes mínimos según reglas de Racquetball
                    const s1Max = Math.max(s1A, s1B);
                    const s2Max = Math.max(s2A, s2B);
                    const s3Max = Math.max(s3A, s3B);

                    if (s1Max < 15) {
                      setConfirmModal({
                        show: true,
                        title: 'Set 1 incompleto',
                        message: 'El ganador del primer set debe llegar al menos a 15 puntos.',
                        onConfirm: () => { }
                      });
                      return;
                    }

                    if (s2Max < 15) {
                      setConfirmModal({
                        show: true,
                        title: 'Set 2 incompleto',
                        message: 'El ganador del segundo set debe llegar al menos a 15 puntos.',
                        onConfirm: () => { }
                      });
                      return;
                    }

                    // Lógica de Ganador por Sets (2 de 3)
                    const setsA = (s1A > s1B ? 1 : 0) + (s2A > s2B ? 1 : 0) + (s3A > s3B ? 1 : 0);
                    const setsB = (s1B > s1A ? 1 : 0) + (s2B > s2A ? 1 : 0) + (s3B > s3A ? 1 : 0);

                    if (setsA < 2 && setsB < 2) {
                      setConfirmModal({
                        show: true,
                        title: 'Jugador debe ganar 2 sets',
                        message: 'Un jugador debe ganar al menos 2 sets para registrar el resultado.',
                        onConfirm: () => { }
                      });
                      return;
                    }

                    // Si alguien ganó 2-0, el 3er set debe ser 0-0
                    const winner20 = (s1A > s1B && s2A > s2B) || (s1B > s1A && s2B > s2A);
                    if (winner20 && (s3A !== 0 || s3B !== 0)) {
                      setConfirmModal({
                        show: true,
                        title: 'Error en 3er Set',
                        message: 'Si un jugador ganó los primeros 2 sets, el 3er set debe quedar 0-0.',
                        onConfirm: () => { }
                      });
                      return;
                    }

                    // Si van 1-1, el 3er set es obligatorio
                    const tieBreakerNeeded = (s1A > s1B && s2B > s2A) || (s1B > s1A && s2A > s2B);
                    if (tieBreakerNeeded) {
                      if (s3A === 0 && s3B === 0) {
                        setConfirmModal({
                          show: true,
                          title: '3er Set Obligatorio',
                          message: 'El tercer set es obligatorio ya que los jugadores están empatados 1-1 en sets.',
                          onConfirm: () => { }
                        });
                        return;
                      }
                      if (s3Max < 11) {
                        setConfirmModal({
                          show: true,
                          title: '3er Set incompleto',
                          message: 'El ganador del tercer set debe llegar al menos a 11 puntos.',
                          onConfirm: () => { }
                        });
                        return;
                      }
                    }

                    pA = s1A + s2A + s3A;
                    pB = s1B + s2B + s3B;
                  } else if (isRacquetball3Of5) {
                    s1A = isRowPairA ? parseInt(resultModal.set1Row) || 0 : parseInt(resultModal.set1Col) || 0;
                    s1B = isRowPairA ? parseInt(resultModal.set1Col) || 0 : parseInt(resultModal.set1Row) || 0;
                    s2A = isRowPairA ? parseInt(resultModal.set2Row) || 0 : parseInt(resultModal.set2Col) || 0;
                    s2B = isRowPairA ? parseInt(resultModal.set2Col) || 0 : parseInt(resultModal.set2Row) || 0;
                    s3A = isRowPairA ? parseInt(resultModal.set3Row) || 0 : parseInt(resultModal.set3Col) || 0;
                    s3B = isRowPairA ? parseInt(resultModal.set3Col) || 0 : parseInt(resultModal.set3Row) || 0;
                    s4A = isRowPairA ? parseInt(resultModal.set4Row) || 0 : parseInt(resultModal.set4Col) || 0;
                    s4B = isRowPairA ? parseInt(resultModal.set4Col) || 0 : parseInt(resultModal.set4Row) || 0;
                    s5A = isRowPairA ? parseInt(resultModal.set5Row) || 0 : parseInt(resultModal.set5Col) || 0;
                    s5B = isRowPairA ? parseInt(resultModal.set5Col) || 0 : parseInt(resultModal.set5Row) || 0;

                    // Validación de empates y diferencia de 2 puntos en sets
                    const sets = [
                      { a: s1A, b: s1B, label: 'Set 1' },
                      { a: s2A, b: s2B, label: 'Set 2' },
                      { a: s3A, b: s3B, label: 'Set 3' },
                      { a: s4A, b: s4B, label: 'Set 4' },
                      { a: s5A, b: s5B, label: 'Set 5' }
                    ];

                    for (const set of sets) {
                      if (set.a === 0 && set.b === 0) continue;
                      
                      if (set.a === set.b) {
                        setConfirmModal({
                          show: true,
                          title: 'Empate no permitido',
                          message: `No se permiten empates en los sets en Racquetball (${set.label}).`,
                          onConfirm: () => { }
                        });
                        return;
                      }

                      const maxVal = Math.max(set.a, set.b);
                      const minVal = Math.min(set.a, set.b);
                      
                      if (maxVal < 11) {
                        setConfirmModal({
                          show: true,
                          title: `${set.label} incompleto`,
                          message: `El ganador del set debe llegar al menos a 11 puntos.`,
                          onConfirm: () => { }
                        });
                        return;
                      }

                      if (maxVal - minVal < 2) {
                        setConfirmModal({
                          show: true,
                          title: `Diferencia de puntos insuficiente`,
                          message: `El ganador del set (${set.label}) debe tener al menos 2 puntos de diferencia (ej: 11-9, 12-10).`,
                          onConfirm: () => { }
                        });
                        return;
                      }
                    }

                    // Lógica de Ganador por Sets (3 de 5)
                    const setsA = sets.filter(s => s.a > s.b).length;
                    const setsB = sets.filter(s => s.b > s.a).length;

                    if (setsA < 3 && setsB < 3) {
                      setConfirmModal({
                        show: true,
                        title: 'Jugador debe ganar 3 sets',
                        message: 'Un jugador debe ganar al menos 3 sets para registrar el resultado final.',
                        onConfirm: () => { }
                      });
                      return;
                    }

                    // Validación de sets extra (pueden ser 0-0 si ya se ganó)
                    if (setsA === 3) {
                      if ((s1A > s1B && s2A > s2B && s3A > s3B) && (s4A !== 0 || s4B !== 0 || s5A !== 0 || s5B !== 0)) {
                         setConfirmModal({ show: true, title: 'Error en resultados', message: 'Como el Jugador A ganó 3-0, los sets 4 y 5 deben quedar 0-0.', onConfirm: () => {} });
                         return;
                      }
                      const wonIn4 = setsA === 3 && setsB === 1;
                      if (wonIn4 && (s5A !== 0 || s5B !== 0)) {
                         setConfirmModal({ show: true, title: 'Error en resultados', message: 'Como el Jugador A ganó 3-1, el set 5 debe quedar 0-0.', onConfirm: () => {} });
                         return;
                      }
                    } else if (setsB === 3) {
                      if ((s1B > s1A && s2B > s2A && s3B > s3A) && (s4A !== 0 || s4B !== 0 || s5A !== 0 || s5B !== 0)) {
                         setConfirmModal({ show: true, title: 'Error en resultados', message: 'Como el Jugador B ganó 3-0, los sets 4 y 5 deben quedar 0-0.', onConfirm: () => {} });
                         return;
                      }
                      const wonIn4 = setsB === 3 && setsA === 1;
                      if (wonIn4 && (s5A !== 0 || s5B !== 0)) {
                         setConfirmModal({ show: true, title: 'Error en resultados', message: 'Como el Jugador B ganó 3-1, el set 5 debe quedar 0-0.', onConfirm: () => {} });
                         return;
                      }
                    }

                    pA = s1A + s2A + s3A + s4A + s5A;
                    pB = s1B + s2B + s3B + s4B + s5B;
                  } else if (isPickleballLogic) {
                    s1A = isRowPairA ? parseInt(resultModal.set1Row) || 0 : parseInt(resultModal.set1Col) || 0;
                    s1B = isRowPairA ? parseInt(resultModal.set1Col) || 0 : parseInt(resultModal.set1Row) || 0;

                    if (s1A === s1B && s1A + s1B > 0) {
                      setConfirmModal({ show: true, title: 'Empate no permitido', message: 'No se permiten empates en Pickleball.', onConfirm: () => { } });
                      return;
                    }

                    const maxVal = Math.max(s1A, s1B);
                    if (maxVal < 7) {
                      setConfirmModal({ show: true, title: 'Puntuación mínima insuficiente', message: 'El ganador del set debe alcanzar al menos 7 puntos.', onConfirm: () => { } });
                      return;
                    }

                    pA = s1A;
                    pB = s1B;
                    // Reset other sets
                    s2A = s2B = s3A = s3B = s4A = s4B = s5A = s5B = 0;
                  } else {
                    pA = isRowPairA ? parseInt(resultModal.scoreRow) : parseInt(resultModal.scoreCol);
                    pB = isRowPairA ? parseInt(resultModal.scoreCol) : parseInt(resultModal.scoreRow);
                  }

                  await handleUpdateResult(
                    resultModal.match!.id, resultModal.match!.pairA.id, resultModal.match!.pairB.id,
                    pA, pB, s1A, s1B, s2A, s2B, s3A, s3B, s4A, s4B, s5A, s5B
                  );
                  setResultModal({ ...resultModal, show: false });
                }}
                style={{ flex: 1 }}
              >
                Guardar Resultado
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Register Modal */}
      {registerModal.show && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 4000, padding: '2rem', backdropFilter: 'blur(8px)'
        }}>
          <div className="glass-card fadeIn" style={{
            padding: '3rem', maxWidth: '450px', width: '100%',
            backgroundColor: '#1a1d23', textAlign: 'center'
          }}>
            <h2 style={{ marginBottom: '1rem', color: 'white' }}>Registrar Nuevo Jugador</h2>
            <p style={{ opacity: 0.7, marginBottom: '2.5rem' }}>Ingresa el nombre de la pareja o jugador individual</p>
            <div style={{ marginBottom: '2.5rem' }}>
              <input
                type="text"
                className="input-field"
                autoFocus
                placeholder="Nombre del jugador..."
                value={registerModal.name}
                onChange={(e) => setRegisterModal({ ...registerModal, name: e.target.value })}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handleRegisterPair();
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                className="btn-primary"
                onClick={() => setRegisterModal({ ...registerModal, show: false })}
                style={{ flex: 1, background: 'rgba(255,255,255,0.05)', color: 'white' }}
              >
                Cancelar
              </button>
              <button
                className="btn-primary"
                onClick={handleRegisterPair}
                style={{ flex: 1, background: 'linear-gradient(90deg, #00f2fe 0%, #4facfe 100%)', color: '#000', border: 'none' }}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal */}
      {confirmModal.show && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 5000, padding: '2rem', backdropFilter: 'blur(8px)'
        }}>
          <div className="glass-card fadeIn" style={{
            padding: '3rem', maxWidth: '450px', width: '100%',
            backgroundColor: '#1a1d23', textAlign: 'center',
            border: '1px solid rgba(255,75,43,0.3)'
          }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              backgroundColor: 'rgba(255,75,43,0.1)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem',
              color: '#ff4b2b'
            }}>
              <AlertTriangle size={32} />
            </div>
            <h2 style={{ marginBottom: '1rem', color: 'white' }}>{confirmModal.title}</h2>
            <p style={{ opacity: 0.7, marginBottom: '2.5rem', lineHeight: '1.6' }}>{confirmModal.message}</p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                className="btn-primary"
                onClick={() => setConfirmModal({ ...confirmModal, show: false })}
                style={{ flex: 1, background: 'rgba(255,255,255,0.05)', color: 'white' }}
              >
                Cancelar
              </button>
              <button
                className="btn-primary"
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal({ ...confirmModal, show: false });
                }}
                style={{ flex: 1, background: '#ff4b2b', border: 'none' }}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SetRow: React.FC<{ label: string; valA: string; valB: string; onChangeA: (v: string) => void; onChangeB: (v: string) => void }> = ({ label, valA, valB, onChangeA, onChangeB }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1.5fr', gap: '1rem', alignItems: 'center', marginBottom: '0.8rem' }}>
    <div style={{ textAlign: 'right', fontSize: '0.9rem', opacity: 0.7 }}>{label}</div>
    <input
      type="number" className="input-field" style={{ textAlign: 'center', padding: '0.5rem' }}
      value={valA} onChange={(e) => onChangeA(e.target.value)}
    />
    <input
      type="number" className="input-field" style={{ textAlign: 'center', padding: '0.5rem' }}
      value={valB} onChange={(e) => onChangeB(e.target.value)}
    />
    <div />
  </div>
);

export default GroupDetails;
