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

interface Match {
  id: string;
  pairA: Pair;
  pairB: Pair;
  winnerId: string | null;
  pointsA: number;
  pointsB: number;
}

interface Group {
  id: string;
  name: string;
  categoryId: string;
  category: { 
    tournamentId: string;
    tournament: { sport: string };
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
  }>({
    show: false,
    match: null,
    rowPair: null,
    colPair: null,
    scoreRow: '0',
    scoreCol: '0'
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
    onConfirm: () => {}
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

  const handleDeleteGroup = async () => {
    if (!window.confirm('¿Estás seguro de eliminar este grupo?')) return;
    try {
      const res = await fetch(`http://localhost:3001/api/groups/${id}`, { method: 'DELETE' });
      if (res.ok) navigate(`/tournament/${group?.category.tournamentId}`);
    } catch (err) {
      console.error(err);
    }
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

  const handleUpdateResult = async (matchId: string, pairAId: string, pairBId: string, pointsA: number, pointsB: number) => {
    const winnerId = pointsA > pointsB ? pairAId : (pointsB > pointsA ? pairBId : 'DRAW');
    try {
      const res = await fetch(`http://localhost:3001/api/matches/${matchId}/result`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ winnerId, pointsA, pointsB, pairAId, pairBId })
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

  const standings = [...(group?.pairs || [])].sort((a, b) => {
    if (isFootball) {
      const statsA = getFootballStats(a.id);
      const statsB = getFootballStats(b.id);
      
      if (statsB.pts !== statsA.pts) return statsB.pts - statsA.pts;
      if (statsB.dg !== statsA.dg) return statsB.dg - statsA.dg;
      return statsB.gf - statsA.gf;
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
                                    scoreCol: String(isRowPairA ? match.pointsB : match.pointsA)
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
                                  {isDraw ? (
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
                <CheckCircle2 color="var(--primary)" /> Detalle de Resultados
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
                        <td style={{ padding: '15px 12px', textAlign: 'center', fontWeight: 'bold', letterSpacing: '2px' }}>
                          {match.winnerId ? `${match.pointsA} - ${match.pointsB}` : '-- : --'}
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
                    ) : (
                      <th style={{ padding: '10px 5px', textAlign: 'right' }}>Pts</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {standings.map((pair, idx) => {
                    const stats = isFootball ? getFootballStats(pair.id) : null;
                    return (
                      <tr key={pair.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: idx === 0 ? 'rgba(0, 242, 254, 0.05)' : 'transparent' }}>
                        <td style={{ padding: '12px 5px', opacity: 0.5, fontSize: '0.8rem' }}>{idx + 1}</td>
                        <td style={{ padding: '12px 5px', fontWeight: idx === 0 ? 'bold' : 'normal', fontSize: '0.8rem', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pair.name}</td>
                        {isFootball && stats ? (
                          <>
                            <td style={{ padding: '12px 5px', textAlign: 'center', fontSize: '0.8rem' }}>{stats.pj}</td>
                            <td style={{ padding: '12px 5px', textAlign: 'center', fontSize: '0.8rem' }}>{stats.g}</td>
                            <td style={{ padding: '12px 5px', textAlign: 'center', fontSize: '0.8rem' }}>{stats.e}</td>
                            <td style={{ padding: '12px 5px', textAlign: 'center', fontSize: '0.8rem' }}>{stats.p}</td>
                            <td style={{ padding: '12px 5px', textAlign: 'center', fontSize: '0.8rem' }}>{stats.gf}</td>
                            <td style={{ padding: '12px 5px', textAlign: 'center', fontSize: '0.8rem' }}>{stats.gc}</td>
                            <td style={{ padding: '12px 5px', textAlign: 'center', fontSize: '0.8rem' }}>{stats.dg}</td>
                            <td style={{ padding: '12px 5px', textAlign: 'right', color: 'var(--primary)', fontWeight: 'bold' }}>{stats.pts}</td>
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
                        onChange={() => {}} // Controlled via onClick of parent
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
                  const pA = isRowPairA ? parseInt(resultModal.scoreRow) : parseInt(resultModal.scoreCol);
                  const pB = isRowPairA ? parseInt(resultModal.scoreCol) : parseInt(resultModal.scoreRow);
                  await handleUpdateResult(resultModal.match!.id, resultModal.match!.pairA.id, resultModal.match!.pairB.id, pA, pB);
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
          justifyContent: 'center', zIndex: 3100, padding: '2rem', backdropFilter: 'blur(8px)'
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

export default GroupDetails;
