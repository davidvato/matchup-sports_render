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
      } else {
        stats.p++;
      }
    });

    stats.pts = stats.pf - stats.pc;
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
    if (isRacquetball || isPickleball) {
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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '2.5rem' }}>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Matches Section: Matrix View */}
            <section>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                <Activity color="var(--primary)" /> Matriz de Juegos
              </h2>
              <div className="glass-card fadeIn" style={{ padding: '2rem', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '15px', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}></th>
                      {group?.pairs.map(p => (
                        <th key={p.id} style={{ padding: '15px', border: '1px solid rgba(255,255,255,0.05)', fontSize: '0.8rem', minWidth: '100px' }}>
                          {p.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {group?.pairs.map(rowPair => (
                      <tr key={rowPair.id}>
                        <td style={{ padding: '15px', border: '1px solid rgba(255,255,255,0.05)', fontWeight: 'bold', fontSize: '0.8rem', background: 'rgba(255,255,255,0.02)' }}>
                          {rowPair.name}
                        </td>
                        {group?.pairs.map(colPair => {
                          if (rowPair.id === colPair.id) {
                            return <td key={colPair.id} style={{ border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.05)' }}></td>;
                          }

                          const match = group.matches.find(m =>
                            (m.pairA.id === rowPair.id && m.pairB.id === colPair.id) ||
                            (m.pairA.id === colPair.id && m.pairB.id === rowPair.id)
                          );

                          if (!match) return <td key={colPair.id} style={{ border: '1px solid rgba(255,255,255,0.05)' }}></td>;

                          const isWinner = match.winnerId === rowPair.id;
                          const isDraw = match.winnerId === 'DRAW';
                          const isFinished = !!match.winnerId;

                          return (
                            <td
                              key={colPair.id}
                              onClick={() => {
                                if (isAdmin) {
                                  const isRowPairA = match.pairA.id === rowPair.id;
                                  setResultModal({
                                    show: true,
                                    match,
                                    rowPair,
                                    colPair,
                                    scoreRow: String(isRowPairA ? match.pointsA : match.pointsB),
                                    scoreCol: String(isRowPairA ? match.pointsB : match.pointsA),
                                    set1Row: String(isRowPairA ? match.set1A : match.set1B),
                                    set1Col: String(isRowPairA ? match.set1B : match.set1A),
                                    set2Row: String(isRowPairA ? match.set2A : match.set2B),
                                    set2Col: String(isRowPairA ? match.set2B : match.set2A),
                                    set3Row: String(isRowPairA ? match.set3A : match.set3B),
                                    set3Col: String(isRowPairA ? match.set3B : match.set3A),
                                    set4Row: String(isRowPairA ? match.set4A : match.set4B),
                                    set4Col: String(isRowPairA ? match.set4B : match.set4A),
                                    set5Row: String(isRowPairA ? match.set5A : match.set5B),
                                    set5Col: String(isRowPairA ? match.set5B : match.set5A)
                                  });
                                }
                              }}
                              style={{
                                border: '1px solid rgba(255,255,255,0.05)',
                                textAlign: 'center',
                                padding: '10px',
                                cursor: isAdmin ? 'pointer' : 'default',
                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                              }}
                              onMouseEnter={(e) => {
                                if (isAdmin) {
                                  e.currentTarget.style.background = 'rgba(0, 242, 254, 0.1)';
                                  e.currentTarget.style.boxShadow = 'inset 0 0 10px rgba(0, 242, 254, 0.2)';
                                  e.currentTarget.style.transform = 'scale(1.05)';
                                  e.currentTarget.style.zIndex = '10';
                                  e.currentTarget.style.position = 'relative';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (isAdmin) {
                                  e.currentTarget.style.background = 'transparent';
                                  e.currentTarget.style.boxShadow = 'none';
                                  e.currentTarget.style.transform = 'scale(1)';
                                  e.currentTarget.style.zIndex = '1';
                                }
                              }}
                            >
                              {isFinished && (
                                <div style={{ display: 'flex', justifyContent: 'center' }}>
                                  {isDraw && !isBasketball && !isRacquetball && !isPickleball ? (
                                    <span style={{ color: '#ffcc00', fontWeight: 'bold', fontSize: '1.2rem' }}>E</span>
                                  ) : (
                                    <Trophy size={20} color={isWinner ? '#4ade80' : '#ff4b2b'} />
                                  )}
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {group?.matches.length === 0 && (
                  <div style={{ padding: '3rem', textAlign: 'center', opacity: 0.4 }}>
                    Asigna al menos 2 jugadores para visualizar la matriz de juegos.
                  </div>
                )}
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
                      <th style={{ padding: '12px', textAlign: 'right' }}>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group?.matches.map(match => (
                      <tr key={match.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '15px 12px' }}>
                          <span style={{ fontWeight: match.winnerId === match.pairA.id ? 'bold' : 'normal', color: match.winnerId === match.pairA.id ? 'var(--primary)' : 'inherit' }}>{match.pairA.name}</span>
                          <span style={{ margin: '0 10px', opacity: 0.3 }}>vs</span>
                          <span style={{ fontWeight: match.winnerId === match.pairB.id ? 'bold' : 'normal', color: match.winnerId === match.pairB.id ? 'var(--primary)' : 'inherit' }}>{match.pairB.name}</span>
                        </td>
                        <td style={{ padding: '15px 12px', textAlign: 'center', fontWeight: 'bold' }}>
                          {match.winnerId ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                              <span>{match.pointsA} - {match.pointsB}</span>
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
                        <td style={{ padding: '15px 12px', textAlign: 'right' }}>
                          {match.winnerId ? (
                            <span style={{ fontSize: '0.75rem', background: 'rgba(74, 222, 128, 0.1)', color: '#4ade80', padding: '4px 10px', borderRadius: '12px', fontWeight: 'bold' }}>Finalizado</span>
                          ) : (
                            <span style={{ fontSize: '0.75rem', background: 'rgba(255, 255, 255, 0.05)', color: 'rgba(255,255,255,0.3)', padding: '4px 10px', borderRadius: '12px' }}>Pendiente</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          {/* Standings Sidebar */}
          <aside>
            <div className="glass-card" style={{ padding: '2rem' }}>
              <h2 style={{ marginTop: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Trophy size={22} color="var(--primary)" /> Tabla de Posiciones
              </h2>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', opacity: 0.5, fontSize: '0.7rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <th style={{ padding: '10px 5px' }}>#</th>
                    <th style={{ padding: '10px 5px' }}>Pareja</th>
                    {isFootball ? (
                      <>
                        <th style={{ padding: '10px 5px', textAlign: 'center' }}>PJ</th>
                        <th style={{ padding: '10px 5px', textAlign: 'center' }}>G</th>
                        <th style={{ padding: '10px 5px', textAlign: 'center' }}>E</th>
                        <th style={{ padding: '10px 5px', textAlign: 'center' }}>P</th>
                        <th style={{ padding: '10px 5px', textAlign: 'center' }}>GF</th>
                        <th style={{ padding: '10px 5px', textAlign: 'center' }}>GC</th>
                        <th style={{ padding: '10px 5px', textAlign: 'center' }}>DG</th>
                        <th style={{ padding: '10px 5px', textAlign: 'right' }}>Pts</th>
                      </>
                    ) : isBasketball ? (
                      <>
                        <th style={{ padding: '10px 5px', textAlign: 'center' }}>PJ</th>
                        <th style={{ padding: '10px 5px', textAlign: 'center' }}>PG</th>
                        <th style={{ padding: '10px 5px', textAlign: 'center' }}>PP</th>
                        <th style={{ padding: '10px 5px', textAlign: 'right' }}>Pts</th>
                      </>
                    ) : (isRacquetball || isPickleball) ? (
                      <>
                        <th style={{ padding: '10px 5px', textAlign: 'center' }}>PJ</th>
                        <th style={{ padding: '10px 5px', textAlign: 'center' }}>PG</th>
                        <th style={{ padding: '10px 5px', textAlign: 'center' }}>PP</th>
                        <th style={{ padding: '10px 5px', textAlign: 'center' }}>PF</th>
                        <th style={{ padding: '10px 5px', textAlign: 'center' }}>PC</th>
                        <th style={{ padding: '10px 5px', textAlign: 'right' }}>Pts</th>
                      </>
                    ) : (
                      <th style={{ padding: '10px 5px', textAlign: 'right' }}>Pts</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {standings.map((pair, idx) => {
                    const statsF = isFootball ? getFootballStats(pair.id) : null;
                    const statsB = isBasketball ? getBasketballStats(pair.id) : null;
                    const statsR = isRacquetball ? getRacquetballStats(pair.id) : null;
                    return (
                      <tr key={pair.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: idx === 0 ? 'rgba(0, 242, 254, 0.05)' : 'transparent' }}>
                        <td style={{ padding: '12px 5px', opacity: 0.5, fontSize: '0.8rem' }}>{idx + 1}</td>
                        <td style={{ padding: '12px 5px', fontWeight: idx === 0 ? 'bold' : 'normal', fontSize: '0.8rem', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pair.name}</td>
                        {isFootball && statsF ? (
                          <>
                            <td style={{ padding: '12px 5px', textAlign: 'center', fontSize: '0.8rem' }}>{statsF.pj}</td>
                            <td style={{ padding: '12px 5px', textAlign: 'center', fontSize: '0.8rem' }}>{statsF.g}</td>
                            <td style={{ padding: '12px 5px', textAlign: 'center', fontSize: '0.8rem' }}>{statsF.e}</td>
                            <td style={{ padding: '12px 5px', textAlign: 'center', fontSize: '0.8rem' }}>{statsF.p}</td>
                            <td style={{ padding: '12px 5px', textAlign: 'center', fontSize: '0.8rem' }}>{statsF.gf}</td>
                            <td style={{ padding: '12px 5px', textAlign: 'center', fontSize: '0.8rem' }}>{statsF.gc}</td>
                            <td style={{ padding: '12px 5px', textAlign: 'center', fontSize: '0.8rem' }}>{statsF.dg}</td>
                            <td style={{ padding: '12px 5px', textAlign: 'right', color: 'var(--primary)', fontWeight: 'bold' }}>{statsF.pts}</td>
                          </>
                        ) : isBasketball && statsB ? (
                          <>
                            <td style={{ padding: '12px 5px', textAlign: 'center', fontSize: '0.8rem' }}>{statsB.pj}</td>
                            <td style={{ padding: '12px 5px', textAlign: 'center', fontSize: '0.8rem' }}>{statsB.g}</td>
                            <td style={{ padding: '12px 5px', textAlign: 'center', fontSize: '0.8rem' }}>{statsB.p}</td>
                            <td style={{ padding: '12px 5px', textAlign: 'right', color: 'var(--primary)', fontWeight: 'bold' }}>{statsB.pts}</td>
                          </>
                        ) : (isRacquetball || isPickleball) && statsR ? (
                          <>
                            <td style={{ padding: '12px 5px', textAlign: 'center', fontSize: '0.8rem' }}>{statsR.pj}</td>
                            <td style={{ padding: '12px 5px', textAlign: 'center', fontSize: '0.8rem' }}>{statsR.g}</td>
                            <td style={{ padding: '12px 5px', textAlign: 'center', fontSize: '0.8rem' }}>{statsR.p}</td>
                            <td style={{ padding: '12px 5px', textAlign: 'center', fontSize: '0.8rem' }}>{statsR.pf}</td>
                            <td style={{ padding: '12px 5px', textAlign: 'center', fontSize: '0.8rem' }}>{statsR.pc}</td>
                            <td style={{ padding: '12px 5px', textAlign: 'right', color: 'var(--primary)', fontWeight: 'bold' }}>{statsR.pts}</td>
                          </>
                        ) : (
                          <td style={{ padding: '12px 5px', textAlign: 'right', color: 'var(--primary)', fontWeight: 'bold' }}>{pair.totalScore}</td>
                        )}
                      </tr>
                    );
                  })}
                  {standings.length === 0 && (
                    <tr>
                      <td colSpan={3} style={{ padding: '2rem', textAlign: 'center', opacity: 0.3 }}>Sin jugadores</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </aside>

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
                  <div style={{ fontSize: '1.2rem', marginBottom: '10px', fontWeight: 'bold' }}>{resultModal.rowPair?.name}</div>
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
                  <div style={{ fontSize: '1.2rem', marginBottom: '10px', fontWeight: 'bold' }}>{resultModal.colPair?.name}</div>
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
                  <div style={{ textAlign: 'left' }}>{resultModal.colPair?.name}</div>
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

                    // Validación de empates en sets
                    if ((s1A === s1B && s1A + s1B > 0) || (s2A === s2B && s2A + s2B > 0) || (s3A === s3B && s3A + s3B > 0)) {
                      setConfirmModal({
                        show: true,
                        title: 'Empate no permitido en sets',
                        message: 'No se permiten empates en los sets individuales en Racquetball.',
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
                    if (tieBreakerNeeded && s3A === 0 && s3B === 0) {
                      setConfirmModal({
                        show: true,
                        title: '3er Set Obligatorio',
                        message: 'El tercer set es obligatorio ya que los jugadores están empatados 1-1 en sets.',
                        onConfirm: () => { }
                      });
                      return;
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
