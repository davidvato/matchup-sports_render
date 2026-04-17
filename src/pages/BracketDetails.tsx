import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Trophy, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Pair {
  id: string;
  name: string;
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
  category: { tournamentId: string };
  matches: BracketMatch[];
}

const BracketDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { isAdmin } = useAuth();
  const [bracket, setBracket] = useState<Bracket | null>(null);
  const [loading, setLoading] = useState(true);
  const [registerModal, setRegisterModal] = useState({ show: false, name: '' });

  useEffect(() => {
    fetchBracket();
  }, [id]);

  const fetchBracket = async () => {
    try {
      const res = await fetch(`http://localhost:3001/api/brackets/${id}`);
      const data = await res.json();
      setBracket(data);
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
    if (!winnerId) return;

    // Determine position in next match (even index -> pairA, odd index -> pairB)
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

  if (loading) return <div style={{ color: 'white', textAlign: 'center', padding: '100px' }}>Cargando bracket...</div>;

  // Group matches by round
  const rounds: { [key: number]: BracketMatch[] } = {};
  bracket?.matches.forEach(m => {
    if (!rounds[m.round]) rounds[m.round] = [];
    rounds[m.round].push(m);
  });

  // Sort rounds descending (Quarters -> Semis -> Final)
  const roundNumbers = Object.keys(rounds).map(Number).sort((a, b) => b - a);

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
            <h1 className="gradient-text" style={{ fontSize: '3.5rem', margin: 0 }}>{bracket?.name}</h1>
          </div>
          {isAdmin && (
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
          )}
        </header>

        <div style={{ display: 'flex', gap: '4rem', alignItems: 'center', padding: '2rem 0' }}>
          {roundNumbers.map(rNum => (
            <div key={rNum} style={{ display: 'flex', flexDirection: 'column', gap: '2rem', flex: 1 }}>
              <h3 style={{ textAlign: 'center', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '2px', fontSize: '0.9rem' }}>
                {rNum === 1 ? 'Final' : (rNum === 2 ? 'Semifinales' : `Ronda ${rNum}`)}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around', height: '500px' }}>
                {rounds[rNum].sort((a,b) => a.matchIndex - b.matchIndex).map(match => (
                  <div key={match.id} className="glass-card fadeIn" style={{ 
                    padding: '1rem', width: '220px', position: 'relative',
                    border: match.winnerId ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.05)'
                  }}>
                    {/* Pair A */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', opacity: match.winnerId && match.winnerId !== match.pairA?.id ? 0.3 : 1 }}>
                      <span style={{ fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>
                        {match.pairA?.name || '---'}
                      </span>
                      <input 
                        type="number" 
                        className="input-field" 
                        style={{ width: '45px', padding: '2px 5px', textAlign: 'center', background: 'rgba(255,255,255,0.05)' }}
                        defaultValue={match.pointsA}
                        onBlur={(e) => handleUpdateResult(match, parseInt(e.target.value), match.pointsB)}
                        disabled={!isAdmin || !match.pairA || !match.pairB}
                      />
                    </div>
                    {/* Pair B */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', opacity: match.winnerId && match.winnerId !== match.pairB?.id ? 0.3 : 1 }}>
                      <span style={{ fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>
                        {match.pairB?.name || '---'}
                      </span>
                      <input 
                        type="number" 
                        className="input-field" 
                        style={{ width: '45px', padding: '2px 5px', textAlign: 'center', background: 'rgba(255,255,255,0.05)' }}
                        defaultValue={match.pointsB}
                        onBlur={(e) => handleUpdateResult(match, match.pointsA, parseInt(e.target.value))}
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
          
          {/* Winner Section */}
          <div style={{ flex: 0.5, textAlign: 'center' }}>
            <div style={{ display: 'inline-block', padding: '2rem', background: 'rgba(0, 242, 254, 0.1)', borderRadius: '20px', border: '2px solid var(--primary)' }}>
               <Trophy size={48} color="var(--primary)" style={{ marginBottom: '1rem' }} />
               <h4 style={{ margin: 0, opacity: 0.5 }}>Ganador</h4>
               <h2 style={{ margin: '0.5rem 0 0', color: 'var(--primary)' }}>
                 {rounds[1]?.[0]?.winnerId ? (rounds[1][0].winnerId === rounds[1][0].pairA?.id ? rounds[1][0].pairA.name : rounds[1][0].pairB?.name) : '---'}
               </h2>
            </div>
          </div>
        </div>
      </div>

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
    </div>
  );
};

export default BracketDetails;
