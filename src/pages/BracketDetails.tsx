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
  nextMatchId: string | null;
}

interface Bracket {
  id: string;
  name: string;
  categoryId: string;
  category: { 
    tournamentId: string,
    tournament: { sport: string }
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

  const handleUpdateResult = async (match: BracketMatch, pA: number, pB: number) => {
    const winnerId = pA > pB ? match.pairA?.id : (pB > pA ? match.pairB?.id : null);
    
    if (pA === pB) {
      setConfirmModal({
        show: true,
        title: 'Empate no permitido',
        message: 'En Brackets debe haber un ganador para avanzar a la siguiente ronda. Por favor ingresa un marcador diferente.',
        onConfirm: () => {}
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
          nextMatchPos 
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
                <Trophy size={18} /> Sembrar Aleatoriamente
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
                {rounds[rNum].sort((a,b) => a.matchIndex - b.matchIndex).map(match => (
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
                        defaultValue={match.pointsA}
                        onBlur={(e) => handleUpdateResult(match, parseInt(e.target.value), match.pointsB)}
                        onClick={(e) => e.stopPropagation()}
                        disabled={!isAdmin || !match.pairA || !match.pairB}
                      />
                    </div>
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
                        defaultValue={match.pointsB}
                        onBlur={(e) => handleUpdateResult(match, match.pointsA, parseInt(e.target.value))}
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

export default BracketDetails;
