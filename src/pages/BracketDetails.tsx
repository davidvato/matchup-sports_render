import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, Trophy, CheckCircle2, Trash2, RotateCcw, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Pair {
  id: string;
  name: string;
  group?: { name: string } | null;
  bracketMatchesAsA?: { bracket: { name: string } }[];
  bracketMatchesAsB?: { bracket: { name: string } }[];
}

interface BracketMatch {
  id: string;
  round: number;
  matchIndex: number;
  pairA: Pair | null;
  pairB: Pair | null;
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
  nextMatchId: string | null;
}

interface Bracket {
  id: string;
  name: string;
  categoryId: string;
  category: {
    tournamentId: string;
    tournament: { sport: string; description: string };
  };
  matches: BracketMatch[];
}

const BracketDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [bracket, setBracket] = useState<Bracket | null>(null);
  const [loading, setLoading] = useState(true);
  const [categoryPairs, setCategoryPairs] = useState<Pair[]>([]);
  const [registerModal, setRegisterModal] = useState({ show: false, name: '' });
  const [selectModal, setSelectModal] = useState<{
    show: boolean;
    matchId: string;
    pos: 'pairA' | 'pairB';
    currentPairId: string | null;
  }>({
    show: false,
    matchId: '',
    pos: 'pairA',
    currentPairId: null
  });

  const [resultModal, setResultModal] = useState<{
    show: boolean;
    match: BracketMatch | null;
    set1A: string;
    set1B: string;
    set2A: string;
    set2B: string;
    set3A: string;
    set3B: string;
    set4A: string;
    set4B: string;
    set5A: string;
    set5B: string;
    scoreA: string;
    scoreB: string;
  }>({
    show: false,
    match: null,
    set1A: '0',
    set1B: '0',
    set2A: '0',
    set2B: '0',
    set3A: '0',
    set3B: '0',
    set4A: '0',
    set4B: '0',
    set5A: '0',
    set5B: '0',
    scoreA: '0',
    scoreB: '0'
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
    fetchBracket();
  }, [id]);

  const fetchBracket = async () => {
    try {
      const res = await fetch(`http://localhost:3001/api/brackets/${id}`);
      const data = await res.json();
      setBracket(data);

      if (data.categoryId) {
        const catRes = await fetch(`http://localhost:3001/api/categories/${data.categoryId}`);
        const catData = await catRes.json();
        setCategoryPairs(catData.pairs);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterPair = async () => {
    if (!registerModal.name.trim() || !bracket) return;
    try {
      const res = await fetch(`http://localhost:3001/api/categories/${bracket.categoryId}/pairs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: registerModal.name })
      });
      if (res.ok) {
        setRegisterModal({ show: false, name: '' });
        fetchBracket();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const isRacquetball2Of3 = bracket?.category?.tournament?.sport?.toLowerCase() === 'racquetball' &&
    bracket?.category?.tournament?.description === '2 de 3 sets a 15 puntos con cambios';
  const isRacquetball3Of5 = bracket?.category?.tournament?.sport?.toLowerCase() === 'racquetball' &&
    bracket?.category?.tournament?.description === '3 de 5 sets a 11 puntos, punto directo, con diferencia de dos puntos';
  const isPickleballLogic = bracket?.category?.tournament?.sport?.toLowerCase() === 'pickleball' &&
    bracket?.category?.tournament?.description === '1 set a 7 puntos minimo';

  const handleUpdateResult = async (
    match: BracketMatch,
    pA: number, pB: number,
    s1A?: number, s1B?: number,
    s2A?: number, s2B?: number,
    s3A?: number, s3B?: number,
    s4A?: number, s4B?: number,
    s5A?: number, s5B?: number
  ) => {
    const winnerId = pA > pB ? match.pairA?.id : (pB > pA ? match.pairB?.id : null);

    if (pA === pB) {
      setConfirmModal({
        show: true,
        title: 'Empate no permitido',
        message: 'En Brackets debe haber un ganador para avanzar a la siguiente ronda. Por favor ingresa un marcador diferente.',
        onConfirm: () => { }
      });
      return;
    }

    if (!winnerId) return;

    const nextMatchPos = match.matchIndex % 2 === 0 ? 'pairAId' : 'pairBId';

    try {
      const res = await fetch(`http://localhost:3001/api/bracket-matches/${match.id}/result`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          winnerId,
          pointsA: pA,
          pointsB: pB,
          nextMatchId: match.nextMatchId,
          nextMatchPos,
          set1A: s1A, set1B: s1B,
          set2A: s2A, set2B: s2B,
          set3A: s3A, set3B: s3B,
          set4A: s4A, set4B: s4B,
          set5A: s5A, set5B: s5B
        })
      });
      if (res.ok) fetchBracket();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSeedBracket = async () => {
    if (!bracket) return;
    try {
      const res = await fetch(`http://localhost:3001/api/brackets/${bracket.id}/seed`, {
        method: 'POST'
      });
      if (res.ok) fetchBracket();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssignPair = async (pairId: string | null) => {
    if (pairId) {
      const pair = categoryPairs.find(p => p.id === pairId);
      if (pair) {
        let warningMessage = '';
        if (pair.group) {
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
            message: `${warningMessage}\n\n¿Deseas asignarlo de todas formas?`,
            onConfirm: async () => {
              await executeAssign(pairId);
            }
          });
          return;
        }
      }
    }

    await executeAssign(pairId);
  };

  const executeAssign = async (pairId: string | null) => {
    try {
      const res = await fetch(`http://localhost:3001/api/bracket-matches/${selectModal.matchId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          [selectModal.pos + 'Id']: pairId
        })
      });
      if (res.ok) {
        setSelectModal({ ...selectModal, show: false });
        fetchBracket();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetBracket = async () => {
    setConfirmModal({
      show: true,
      title: 'Reiniciar Bracket',
      message: '¿Estás seguro de reiniciar el bracket? Se borrarán todos los resultados y el avance, pero se mantendrá el sembrado inicial.',
      onConfirm: async () => {
        try {
          const res = await fetch(`http://localhost:3001/api/brackets/${id}/reset`, { method: 'POST' });
          if (res.ok) {
            await fetchBracket();
          }
        } catch (err) {
          console.error(err);
        }
      }
    });
  };

  const handleDeleteBracket = async () => {
    setConfirmModal({
      show: true,
      title: 'Eliminar Bracket',
      message: '¿Estás seguro de eliminar este bracket? Se perderán todos los partidos y resultados.',
      onConfirm: async () => {
        try {
          const res = await fetch(`http://localhost:3001/api/brackets/${id}`, { method: 'DELETE' });
          if (res.ok) {
            navigate(`/tournament/${bracket?.category.tournamentId}`);
          }
        } catch (err) {
          console.error(err);
        }
      }
    });
  };

  if (loading) return <div style={{ color: 'white', textAlign: 'center', padding: '100px' }}>Cargando bracket...</div>;

  const rounds: { [key: number]: BracketMatch[] } = {};
  bracket?.matches.forEach(m => {
    if (!rounds[m.round]) rounds[m.round] = [];
    rounds[m.round].push(m);
  });

  const roundNumbers = Object.keys(rounds).map(Number).sort((a, b) => a - b);
  const maxRound = Math.max(...roundNumbers);

  return (
    <div style={{
      minHeight: '100vh', padding: '120px 2rem 50px',
      backgroundImage: 'linear-gradient(135deg, #0c0e14 0%, #1a1d23 100%)', color: 'white',
      overflowX: 'auto'
    }}>
      <div style={{ minWidth: '1000px', maxWidth: '1400px', margin: '0 auto' }}>
        <header style={{ marginBottom: '4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <Link to={bracket ? `/tournament/${bracket.category.tournamentId}` : '/'} style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'rgba(255,255,255,0.5)', textDecoration: 'none', marginBottom: '1rem' }}>
              <ChevronLeft size={18} /> Volver al Torneo
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <h1 className="gradient-text" style={{ fontSize: '3.5rem', margin: 0 }}>{bracket?.name}</h1>
              {isAdmin && (
                <button
                  onClick={handleDeleteBracket}
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
                  title="Eliminar bracket"
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 71, 87, 0.2)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 71, 87, 0.1)'}
                >
                  <Trash2 size={20} />
                </button>
              )}
            </div>
          </div>
          {isAdmin && (
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={handleResetBracket}
                className="btn-primary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '0.8rem 1.8rem',
                  background: 'rgba(255,75,43,0.1)',
                  color: '#ff4b2b',
                }}
              >
                <RotateCcw size={18} /> Reiniciar Bracket
              </button>
              <button
                onClick={handleSeedBracket}
                className="btn-primary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '0.8rem 1.8rem',
                  background: 'rgba(255,255,255,0.05)',
                  color: 'white',
                }}
              >
                <Trophy size={18} /> Asignar Aleatoriamente
              </button>
              <button
                onClick={() => setRegisterModal({ show: true, name: '' })}
                className="btn-primary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '0.8rem 1.8rem',
                  background: 'linear-gradient(90deg, #00f2fe 0%, #4facfe 100%)',
                  color: '#000',
                  fontWeight: 'bold',
                  border: 'none',
                  boxShadow: '0 4px 20px rgba(0, 242, 254, 0.4)'
                }}
              >
                Registrar Jugadores
              </button>
            </div>
          )}
        </header>

        <div style={{ display: 'flex', gap: '4rem', alignItems: 'center', padding: '2rem 0' }}>
          {roundNumbers.map(rNum => (
            <div key={rNum} style={{ display: 'flex', flexDirection: 'column', gap: '2rem', flex: 1 }}>
              <h3 style={{ textAlign: 'center', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '2px', fontSize: '0.9rem' }}>
                {rNum === maxRound ? 'Final' : (rNum === maxRound - 1 ? 'Semifinales' : `Ronda ${rNum}`)}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around', height: '500px' }}>
                {rounds[rNum].sort((a, b) => a.matchIndex - b.matchIndex).map(match => (
                  <div key={match.id} className="glass-card fadeIn" style={{
                    padding: '1rem', width: '220px', position: 'relative',
                    border: match.winnerId ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.05)'
                  }}>
                    <div
                      onClick={() => isAdmin && setSelectModal({ show: true, matchId: match.id, pos: 'pairA', currentPairId: match.pairA?.id || null })}
                      style={{
                        display: 'flex', justifyContent: 'space-between', marginBottom: '8px',
                        opacity: match.winnerId && match.winnerId !== match.pairA?.id ? 0.3 : 1,
                        cursor: isAdmin ? 'pointer' : 'default',
                        padding: '4px', borderRadius: '4px',
                        backgroundColor: isAdmin ? 'rgba(255,255,255,0.02)' : 'transparent'
                      }}
                    >
                      <span style={{ fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>
                        {match.pairA?.name || '---'}
                      </span>
                      <input
                        key={`${match.id}-a-${match.pointsA}`}
                        type="number"
                        className="input-field"
                        style={{ width: '45px', padding: '2px 5px', textAlign: 'center', background: 'rgba(255,255,255,0.05)' }}
                        value={(isRacquetball2Of3 || isRacquetball3Of5) ? (
                          (() => {
                            if (isRacquetball3Of5) {
                              if (match.set5A > 0 || match.set5B > 0) return match.set5A;
                              if (match.set4A > 0 || match.set4B > 0) return match.set4A;
                            }
                            if (match.set3A > 0 || match.set3B > 0) return match.set3A;
                            if (match.set2A > 0 || match.set2B > 0) return match.set2A;
                            return match.set1A;
                          })()
                        ) : match.pointsA}
                        onFocus={() => {
                          if (isAdmin) {
                            setResultModal({
                              show: true,
                              match,
                              set1A: String(match.set1A),
                              set1B: String(match.set1B),
                              set2A: String(match.set2A),
                              set2B: String(match.set2B),
                              set3A: String(match.set3A),
                              set3B: String(match.set3B),
                              set4A: String(match.set4A),
                              set4B: String(match.set4B),
                              set5A: String(match.set5A),
                              set5B: String(match.set5B),
                              scoreA: String(match.pointsA),
                              scoreB: String(match.pointsB)
                            });
                          }
                        }}
                        onChange={() => { }} // Controlled by onFocus/Modal for 3/5 sets
                        onBlur={(e) => false && handleUpdateResult(match, parseInt(e.target.value), match.pointsB)}
                        onClick={(e) => e.stopPropagation()}
                        disabled={!isAdmin || !match.pairA || !match.pairB}
                      />
                    </div>
                    {(isRacquetball2Of3 || isRacquetball3Of5 || isPickleballLogic) && match.pointsA + match.pointsB > 0 && (
                      <div style={{ fontSize: '0.6rem', opacity: 0.5, textAlign: 'center', marginTop: '-4px', marginBottom: '8px' }}>
                        {isPickleballLogic ? (
                           `(${match.set1A}-${match.set1B})`
                        ) : isRacquetball2Of3 ? (
                           `(${match.set1A}-${match.set1B}, ${match.set2A}-${match.set2B}, ${match.set3A}-${match.set3B})`
                        ) : (
                           `(${match.set1A}-${match.set1B}, ${match.set2A}-${match.set2B}, ${match.set3A}-${match.set3B}, ${match.set4A}-${match.set4B}, ${match.set5A}-${match.set5B})`
                        )}
                      </div>
                    )}
                    <div
                      onClick={() => isAdmin && setSelectModal({ show: true, matchId: match.id, pos: 'pairB', currentPairId: match.pairB?.id || null })}
                      style={{
                        display: 'flex', justifyContent: 'space-between',
                        opacity: match.winnerId && match.winnerId !== match.pairB?.id ? 0.3 : 1,
                        cursor: isAdmin ? 'pointer' : 'default',
                        padding: '4px', borderRadius: '4px',
                        backgroundColor: isAdmin ? 'rgba(255,255,255,0.02)' : 'transparent'
                      }}
                    >
                      <span style={{ fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>
                        {match.pairB?.name || '---'}
                      </span>
                      <input
                        key={`${match.id}-b-${match.pointsB}`}
                        type="number"
                        className="input-field"
                        style={{ width: '45px', padding: '2px 5px', textAlign: 'center', background: 'rgba(255,255,255,0.05)' }}
                        value={(isRacquetball2Of3 || isRacquetball3Of5) ? (
                          (() => {
                            if (isRacquetball3Of5) {
                              if (match.set5A > 0 || match.set5B > 0) return match.set5B;
                              if (match.set4A > 0 || match.set4B > 0) return match.set4B;
                            }
                            if (match.set3A > 0 || match.set3B > 0) return match.set3B;
                            if (match.set2A > 0 || match.set2B > 0) return match.set2B;
                            return match.set1B;
                          })()
                        ) : match.pointsB}
                        onFocus={() => {
                          if (isAdmin) {
                            setResultModal({
                              show: true,
                              match,
                              set1A: String(match.set1A),
                              set1B: String(match.set1B),
                              set2A: String(match.set2A),
                              set2B: String(match.set2B),
                              set3A: String(match.set3A),
                              set3B: String(match.set3B),
                              set4A: String(match.set4A),
                              set4B: String(match.set4B),
                              set5A: String(match.set5A),
                              set5B: String(match.set5B),
                              scoreA: String(match.pointsA),
                              scoreB: String(match.pointsB)
                            });
                          }
                        }}
                        onChange={() => { }}
                        onBlur={(e) => false && handleUpdateResult(match, match.pointsA, parseInt(e.target.value))}
                        onClick={(e) => e.stopPropagation()}
                        disabled={!isAdmin || !match.pairA || !match.pairB}
                      />
                    </div>
                    {match.winnerId && (
                      <div style={{ position: 'absolute', right: '-10px', top: '-10px', background: 'var(--primary)', color: 'black', borderRadius: '50%', padding: '4px' }}>
                        <CheckCircle2 size={12} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div style={{ flex: 0.5, textAlign: 'center' }}>
            <div style={{ display: 'inline-block', padding: '2rem', background: 'rgba(0, 242, 254, 0.1)', borderRadius: '20px', border: '2px solid var(--primary)' }}>
              <Trophy size={48} color="var(--primary)" style={{ marginBottom: '1rem' }} />
              <h4 style={{ margin: 0, opacity: 0.5 }}>Ganador</h4>
              <h2 style={{ margin: '0.5rem 0 0', color: 'var(--primary)' }}>
                {rounds[maxRound]?.[0]?.winnerId ? (rounds[maxRound][0].winnerId === rounds[maxRound][0].pairA?.id ? rounds[maxRound][0].pairA.name : rounds[maxRound][0].pairB?.name) : '---'}
              </h2>
            </div>
          </div>
        </div>
      </div>

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

      {selectModal.show && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 4500, padding: '2rem', backdropFilter: 'blur(8px)'
        }}>
          <div className="glass-card fadeIn" style={{ padding: '3rem', maxWidth: '500px', width: '100%', backgroundColor: '#1a1d23' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>Seleccionar Jugador</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '400px', overflowY: 'auto', marginBottom: '2rem' }}>
              <div
                onClick={() => handleAssignPair(null)}
                style={{
                  padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', cursor: 'pointer',
                  border: selectModal.currentPairId === null ? '1px solid var(--primary)' : '1px solid transparent'
                }}
              >
                --- Vacío ---
              </div>
              {categoryPairs.map(pair => {
                const isAssigned = (pair.group) || (pair.bracketMatchesAsA?.length! > 0) || (pair.bracketMatchesAsB?.length! > 0);
                let assignmentLabel = '';
                if (pair.group) assignmentLabel = `(En ${pair.group.name})`;
                else if (pair.bracketMatchesAsA?.[0]?.bracket?.name || pair.bracketMatchesAsB?.[0]?.bracket?.name) {
                  assignmentLabel = `(En ${pair.bracketMatchesAsA?.[0]?.bracket?.name || pair.bracketMatchesAsB?.[0]?.bracket?.name})`;
                }

                return (
                  <div
                    key={pair.id}
                    onClick={() => handleAssignPair(pair.id)}
                    style={{
                      padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', cursor: 'pointer',
                      border: selectModal.currentPairId === pair.id ? '1px solid var(--primary)' : '1px solid transparent',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}
                  >
                    <span>{pair.name}</span>
                    {isAssigned && (
                      <span style={{ fontSize: '0.7rem', opacity: 0.5, fontStyle: 'italic' }}>{assignmentLabel}</span>
                    )}
                  </div>
                );
              })}
            </div>
            <button
              className="btn-primary"
              style={{ width: '100%', background: 'rgba(255,255,255,0.05)' }}
              onClick={() => setSelectModal({ ...selectModal, show: false })}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

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
            <h2 style={{ marginBottom: '2rem', color: 'white' }}>Registrar Resultado (Sets)</h2>

            <div style={{ marginBottom: '3rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1.5fr', gap: '1rem', alignItems: 'center', marginBottom: '1rem', opacity: 0.5, fontSize: '0.8rem' }}>
                <div style={{ textAlign: 'right' }}>{resultModal.match.pairA?.name || 'A'}</div>
                <div style={{ textAlign: 'center' }}>{(isRacquetball2Of3 || isRacquetball3Of5 || isPickleballLogic) ? 'Set A' : 'Puntos'}</div>
                <div style={{ textAlign: 'center' }}>{(isRacquetball2Of3 || isRacquetball3Of5 || isPickleballLogic) ? 'Set B' : 'Puntos'}</div>
                <div style={{ textAlign: 'left' }}>{resultModal.match.pairB?.name || 'B'}</div>
              </div>

              {(!isRacquetball2Of3 && !isRacquetball3Of5 && !isPickleballLogic) ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem', marginBottom: '1.5rem' }}>
                  <input
                    type="number"
                    className="input-field"
                    style={{ width: '80px', fontSize: '2rem', textAlign: 'center', padding: '0.5rem' }}
                    value={resultModal.scoreA}
                    onChange={(e) => setResultModal({ ...resultModal, scoreA: e.target.value })}
                    autoFocus
                  />
                  <div style={{ fontSize: '2rem', opacity: 0.3 }}>-</div>
                  <input
                    type="number"
                    className="input-field"
                    style={{ width: '80px', fontSize: '2rem', textAlign: 'center', padding: '0.5rem' }}
                    value={resultModal.scoreB}
                    onChange={(e) => setResultModal({ ...resultModal, scoreB: e.target.value })}
                  />
                </div>
              ) : (
                <>
                  {!isPickleballLogic && (
                    <>
                      <SetRow label="Set 1" valA={resultModal.set1A} valB={resultModal.set1B} onChangeA={(v) => setResultModal({ ...resultModal, set1A: v })} onChangeB={(v) => setResultModal({ ...resultModal, set1B: v })} />
                      <SetRow label="Set 2" valA={resultModal.set2A} valB={resultModal.set2B} onChangeA={(v) => setResultModal({ ...resultModal, set2A: v })} onChangeB={(v) => setResultModal({ ...resultModal, set2B: v })} />
                      <SetRow label="Set 3" valA={resultModal.set3A} valB={resultModal.set3B} onChangeA={(v) => setResultModal({ ...resultModal, set3A: v })} onChangeB={(v) => setResultModal({ ...resultModal, set3B: v })} />
                    </>
                  )}
                  {isPickleballLogic && (
                    <SetRow label="Único Set" valA={resultModal.set1A} valB={resultModal.set1B} onChangeA={(v) => setResultModal({ ...resultModal, set1A: v })} onChangeB={(v) => setResultModal({ ...resultModal, set1B: v })} />
                  )}
                  
                  {isRacquetball3Of5 && (
                    <>
                      <SetRow label="Set 4" valA={resultModal.set4A} valB={resultModal.set4B} onChangeA={(v) => setResultModal({ ...resultModal, set4A: v })} onChangeB={(v) => setResultModal({ ...resultModal, set4B: v })} />
                      <SetRow label="Set 5" valA={resultModal.set5A} valB={resultModal.set5B} onChangeA={(v) => setResultModal({ ...resultModal, set5A: v })} onChangeB={(v) => setResultModal({ ...resultModal, set5B: v })} />
                    </>
                  )}
                </>
              )}

              <div style={{
                marginTop: '1.5rem', padding: '1.2rem', background: 'rgba(255,255,255,0.02)',
                borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                border: '1px solid rgba(255,255,255,0.05)'
              }}>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                    {isPickleballLogic ? (parseInt(resultModal.set1A) || 0) : (parseInt(resultModal.set1A) || 0) + (parseInt(resultModal.set2A) || 0) + (parseInt(resultModal.set3A) || 0) + (isRacquetball3Of5 ? (parseInt(resultModal.set4A) || 0) + (parseInt(resultModal.set5A) || 0) : 0)}
                  </div>
                </div>
                <div style={{ fontSize: '0.8rem', opacity: 0.3 }}>TOTAL PUNTOS</div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                    {isPickleballLogic ? (parseInt(resultModal.set1B) || 0) : (parseInt(resultModal.set1B) || 0) + (parseInt(resultModal.set2B) || 0) + (parseInt(resultModal.set3B) || 0) + (isRacquetball3Of5 ? (parseInt(resultModal.set4B) || 0) + (parseInt(resultModal.set5B) || 0) : 0)}
                  </div>
                </div>
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
                  const s1A = parseInt(resultModal.set1A) || 0;
                  const s1B = parseInt(resultModal.set1B) || 0;
                  const s2A = parseInt(resultModal.set2A) || 0;
                  const s2B = parseInt(resultModal.set2B) || 0;
                  const s3A = parseInt(resultModal.set3A) || 0;
                  const s3B = parseInt(resultModal.set3B) || 0;
                  const s4A = isRacquetball3Of5 ? (parseInt(resultModal.set4A) || 0) : 0;
                  const s4B = isRacquetball3Of5 ? (parseInt(resultModal.set4B) || 0) : 0;
                  const s5A = isRacquetball3Of5 ? (parseInt(resultModal.set5A) || 0) : 0;
                  const s5B = isRacquetball3Of5 ? (parseInt(resultModal.set5B) || 0) : 0;

                  const sets = [
                    { a: s1A, b: s1B, label: 'Set 1' },
                    { a: s2A, b: s2B, label: 'Set 2' },
                    { a: s3A, b: s3B, label: 'Set 3' },
                  ];
                  if (isRacquetball3Of5) {
                    sets.push({ a: s4A, b: s4B, label: 'Set 4' });
                    sets.push({ a: s5A, b: s5B, label: 'Set 5' });
                  }

                  for (const set of sets) {
                    if (set.a === 0 && set.b === 0) continue;
                    if (set.a === set.b) {
                      setConfirmModal({ show: true, title: 'Empate no permitido', message: `No se permiten empates en los sets en ${set.label}.`, onConfirm: () => { } });
                      return;
                    }

                    if (isRacquetball3Of5) {
                      const maxVal = Math.max(set.a, set.b);
                      const minVal = Math.min(set.a, set.b);
                      if (maxVal < 11) {
                        setConfirmModal({ show: true, title: `${set.label} incompleto`, message: `El ganador del set debe llegar al menos a 11 puntos.`, onConfirm: () => { } });
                        return;
                      }
                      if (maxVal - minVal < 2) {
                        setConfirmModal({ show: true, title: `Diferencia insuficiente`, message: `El ganador del set (${set.label}) debe tener al menos 2 puntos de diferencia.`, onConfirm: () => { } });
                        return;
                      }
                    }
                  }

                  const setsWinA = sets.filter(s => s.a > s.b).length;
                  const setsWinB = sets.filter(s => s.b > s.a).length;
                  const requiredSets = isPickleballLogic ? 1 : (isRacquetball3Of5 ? 3 : 2);

                  if (setsWinA < requiredSets && setsWinB < requiredSets) {
                    setConfirmModal({
                      show: true,
                      title: `Faltan sets ganados`,
                      message: `Un jugador debe ganar al menos ${requiredSets} sets para registrar el resultado.`,
                      onConfirm: () => { }
                    });
                    return;
                  }

                  // Validación de secuencia de sets y puntajes mínimos
                  if (isRacquetball2Of3) {
                    const s1Max = Math.max(s1A, s1B);
                    const s2Max = Math.max(s2A, s2B);
                    const s3Max = Math.max(s3A, s3B);

                    if (s1Max < 15) {
                      setConfirmModal({ show: true, title: 'Set 1 incompleto', message: 'El ganador del primer set debe llegar al menos a 15 puntos.', onConfirm: () => { } });
                      return;
                    }
                    if (s2Max < 15) {
                      setConfirmModal({ show: true, title: 'Set 2 incompleto', message: 'El ganador del segundo set debe llegar al menos a 15 puntos.', onConfirm: () => { } });
                      return;
                    }

                    const winner20 = (s1A > s1B && s2A > s2B) || (s1B > s1A && s2B > s2A);
                    if (winner20 && (s3A !== 0 || s3B !== 0)) {
                      setConfirmModal({ show: true, title: 'Error en 3er Set', message: 'Si un jugador ganó 2-0, el 3er set debe ser 0-0.', onConfirm: () => { } });
                      return;
                    }
                    const tieBreakerNeeded = (s1A > s1B && s2B > s2A) || (s1B > s1A && s2A > s2B);
                    if (tieBreakerNeeded) {
                      if (s3A === 0 && s3B === 0) {
                        setConfirmModal({ show: true, title: '3er Set Obligatorio', message: 'El 3er set es obligatorio en empate 1-1.', onConfirm: () => { } });
                        return;
                      }
                      if (s3Max < 11) {
                        setConfirmModal({ show: true, title: '3er Set incompleto', message: 'El ganador del tercer set debe llegar al menos a 11 puntos.', onConfirm: () => { } });
                        return;
                      }
                    }
                  } else if (isRacquetball3Of5) {
                    if (setsWinA === 3) {
                      if ((s1A > s1B && s2A > s2B && s3A > s3B) && (s4A !== 0 || s4B !== 0 || s5A !== 0 || s5B !== 0)) {
                        setConfirmModal({ show: true, title: 'Error en sets', message: 'Ganó 3-0: sets 4 y 5 deben ser 0-0.', onConfirm: () => { } });
                        return;
                      }
                      if (setsWinA === 3 && setsWinB === 1 && (s5A !== 0 || s5B !== 0)) {
                        setConfirmModal({ show: true, title: 'Error en sets', message: 'Ganó 3-1: set 5 debe ser 0-0.', onConfirm: () => { } });
                        return;
                      }
                    } else if (setsWinB === 3) {
                      if ((s1B > s1A && s2B > s2A && s3B > s3A) && (s4A !== 0 || s4B !== 0 || s5A !== 0 || s5B !== 0)) {
                        setConfirmModal({ show: true, title: 'Error en sets', message: 'Ganó 3-0: sets 4 y 5 deben ser 0-0.', onConfirm: () => { } });
                        return;
                      }
                      if (setsWinB === 3 && setsWinA === 1 && (s5A !== 0 || s5B !== 0)) {
                        setConfirmModal({ show: true, title: 'Error en sets', message: 'Ganó 3-1: set 5 debe ser 0-0.', onConfirm: () => { } });
                        return;
                      }
                    }
                  } else if (isPickleballLogic) {
                    if (s1A === s1B && s1A + s1B > 0) {
                      setConfirmModal({ show: true, title: 'Empate no permitido', message: 'No se permiten empates en Pickleball.', onConfirm: () => { } });
                      return;
                    }
                    if (Math.max(s1A, s1B) < 7) {
                      setConfirmModal({ show: true, title: 'Puntuación mínima insuficiente', message: 'El ganador del set debe alcanzar al menos 7 puntos.', onConfirm: () => { } });
                      return;
                    }
                  }

                  const pA = (isRacquetball2Of3 || isRacquetball3Of5 || isPickleballLogic) 
                    ? sets.reduce((acc, s) => acc + s.a, 0)
                    : parseInt(resultModal.scoreA) || 0;
                  const pB = (isRacquetball2Of3 || isRacquetball3Of5 || isPickleballLogic)
                    ? sets.reduce((acc, s) => acc + s.b, 0)
                    : parseInt(resultModal.scoreB) || 0;

                  await handleUpdateResult(resultModal.match!, pA, pB, s1A, s1B, s2A, s2B, s3A, s3B, s4A, s4B, s5A, s5B);
                  setResultModal({ ...resultModal, show: false });
                }}
                style={{ flex: 1 }}
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
          justifyContent: 'center', zIndex: 9999, padding: '2rem', backdropFilter: 'blur(8px)'
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

export default BracketDetails;
