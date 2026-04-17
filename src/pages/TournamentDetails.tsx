import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Users, Trophy, Activity, 
  ArrowRight, Settings, MapPin, Calendar, 
  Layers, Trash2, AlertTriangle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Group {
  id: string;
  name: string;
  _count: { pairs: number, matches: number };
}

interface Bracket {
  id: string;
  name: string;
  _count: { matches: number };
}

interface Pair {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
  groups: Group[];
  brackets: Bracket[];
  pairs: Pair[];
}

interface Tournament {
  id: string;
  name: string;
  location: string;
  startDate: string;
  endDate: string;
  sport: string;
  categories: Category[];
}

const TournamentDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', location: '', startDate: '', endDate: '' });

  // Custom Confirmation Modal State
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

  // Custom Prompt Modal State
  const [promptModal, setPromptModal] = useState<{
    show: boolean;
    title: string;
    value: string;
    placeholder: string;
    onConfirm: (val: string) => void;
  }>({
    show: false,
    title: '',
    value: '',
    placeholder: '',
    onConfirm: () => {}
  });

  // Custom Bracket Modal State
  const [bracketModal, setBracketModal] = useState<{
    show: boolean;
    categoryId: string;
    size: number;
  }>({
    show: false,
    categoryId: '',
    size: 4
  });

  const handleDeleteTournament = async () => {
    setConfirmModal({
      show: true,
      title: 'Eliminar Torneo',
      message: '¿Estás seguro de eliminar permanentemente este torneo? Esta acción no se puede deshacer.',
      onConfirm: async () => {
        try {
          const res = await fetch(`http://localhost:3001/api/tournaments/${id}`, { method: 'DELETE' });
          if (res.ok) navigate('/create');
        } catch (err) {
          console.error(err);
        }
      }
    });
  };

  const handleUpdateTournament = async () => {
    try {
      const res = await fetch(`http://localhost:3001/api/tournaments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      if (res.ok) {
        setIsEditing(false);
        fetchTournament();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddGroup = async (categoryId: string) => {
    const defaultName = `Grupo ${String.fromCharCode(65 + (tournament?.categories.find(c => c.id === categoryId)?.groups.length || 0))}`;
    setPromptModal({
      show: true,
      title: 'Nuevo Grupo',
      value: defaultName,
      placeholder: 'Nombre del grupo...',
      onConfirm: async (name) => {
        if (!name.trim()) return;
        try {
          const res = await fetch(`http://localhost:3001/api/categories/${categoryId}/groups`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
          });
          if (res.ok) fetchTournament();
        } catch (err) {
          console.error(err);
        }
      }
    });
  };

  const handleAddBracket = (categoryId: string) => {
    setBracketModal({ ...bracketModal, show: true, categoryId });
  };

  const handleConfirmBracket = async () => {
    try {
      const res = await fetch(`http://localhost:3001/api/categories/${bracketModal.categoryId}/brackets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Bracket Principal', size: bracketModal.size })
      });
      if (res.ok) {
        setBracketModal({ ...bracketModal, show: false });
        fetchTournament();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    setConfirmModal({
      show: true,
      title: 'Eliminar Grupo',
      message: '¿Estás seguro de eliminar este grupo y todos sus partidos asociados?',
      onConfirm: async () => {
        try {
          const res = await fetch(`http://localhost:3001/api/groups/${groupId}`, { method: 'DELETE' });
          if (res.ok) fetchTournament();
        } catch (err) {
          console.error(err);
        }
      }
    });
  };

  const handleDeleteBracket = async (bracketId: string) => {
    setConfirmModal({
      show: true,
      title: 'Eliminar Bracket',
      message: '¿Estás seguro de eliminar este bracket? Esta acción borrará todo el progreso de la fase de eliminación.',
      onConfirm: async () => {
        try {
          const res = await fetch(`http://localhost:3001/api/brackets/${bracketId}`, { method: 'DELETE' });
          if (res.ok) fetchTournament();
        } catch (err) {
          console.error(err);
        }
      }
    });
  };

  useEffect(() => {
    if (tournament) {
      setEditForm({
        name: tournament.name,
        location: tournament.location || '',
        startDate: tournament.startDate ? tournament.startDate.split('T')[0] : '',
        endDate: tournament.endDate ? tournament.endDate.split('T')[0] : ''
      });
    }
  }, [tournament]);

  useEffect(() => {
    fetchTournament();
  }, [id]);

  const fetchTournament = async () => {
    try {
      const res = await fetch(`http://localhost:3001/api/tournaments/${id}`);
      const data = await res.json();
      setTournament(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('es-ES', { 
      day: 'numeric', month: 'long', year: 'numeric' 
    });
  };

  if (loading) return <div style={{ color: 'white', textAlign: 'center', padding: '100px' }}>Cargando torneo...</div>;

  const currentCategory = tournament?.categories?.[activeTab];

  return (
    <div style={{
      minHeight: '100vh', padding: '120px 2rem 50px',
      backgroundImage: 'linear-gradient(135deg, #0c0e14 0%, #1a1d23 100%)', color: 'white'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'rgba(255,255,255,0.5)', textDecoration: 'none', marginBottom: '2rem' }}>
          <ChevronLeft size={20} /> Volver a Inicio
        </Link>

        <header style={{ marginBottom: '4rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
            <div>
              <span className="badge" style={{ backgroundColor: 'rgba(0, 242, 254, 0.1)', color: 'var(--primary)', padding: '6px 16px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '1rem', display: 'inline-block' }}>
                {tournament?.sport}
              </span>
              <h1 className="gradient-text" style={{ fontSize: '4rem', margin: '0 0 1rem', lineHeight: 1 }}>{tournament?.name}</h1>
              <div style={{ display: 'flex', gap: '2rem', opacity: 0.7 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><MapPin size={18} /> {tournament?.location || 'Sin ubicación'}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Calendar size={18} /> {formatDate(tournament?.startDate!)} - {formatDate(tournament?.endDate!)}</span>
              </div>
            </div>
            {isAdmin && (
              <div style={{ position: 'relative' }}>
                <button 
                  className="btn-primary" 
                  onClick={() => setShowSettings(!showSettings)}
                  style={{ background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Settings size={18} /> Configurar
                </button>
                {showSettings && (
                  <div className="glass-card fadeIn" style={{
                    position: 'absolute', top: '100%', right: 0, marginTop: '10px',
                    width: '200px', padding: '10px', zIndex: 10, backgroundColor: '#1a1d23',
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}>
                    <button 
                      onClick={() => { setIsEditing(true); setShowSettings(false); }}
                      style={{
                        width: '100%', padding: '10px', background: 'none', border: 'none',
                        color: 'white', cursor: 'pointer', textAlign: 'left', borderRadius: '8px',
                        display: 'flex', alignItems: 'center', gap: '10px'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      Editar Información
                    </button>
                    <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '5px 0' }} />
                    <button 
                      onClick={handleDeleteTournament}
                      style={{
                        width: '100%', padding: '10px', background: 'none', border: 'none',
                        color: '#ff4b2b', cursor: 'pointer', textAlign: 'left', borderRadius: '8px',
                        display: 'flex', alignItems: 'center', gap: '10px'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,75,43,0.1)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      Eliminar Torneo
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Edit Form Overlay */}
          {isEditing && (
            <div style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', zIndex: 2000, padding: '2rem'
            }}>
              <div className="glass-card fadeIn" style={{ padding: '3rem', maxWidth: '600px', width: '100%', backgroundColor: '#1a1d23' }}>
                <h2 style={{ marginBottom: '2rem' }}>Editar Torneo</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div>
                    <label style={{ opacity: 0.6, fontSize: '0.9rem' }}>Nombre</label>
                    <input type="text" className="input-field" value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} />
                  </div>
                  <div>
                    <label style={{ opacity: 0.6, fontSize: '0.9rem' }}>Ubicación</label>
                    <input type="text" className="input-field" value={editForm.location} onChange={(e) => setEditForm({...editForm, location: e.target.value})} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ opacity: 0.6, fontSize: '0.9rem' }}>Inicio</label>
                      <input type="date" className="input-field" value={editForm.startDate} onChange={(e) => setEditForm({...editForm, startDate: e.target.value})} />
                    </div>
                    <div>
                      <label style={{ opacity: 0.6, fontSize: '0.9rem' }}>Fin</label>
                      <input type="date" className="input-field" value={editForm.endDate} onChange={(e) => setEditForm({...editForm, endDate: e.target.value})} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                    <button className="btn-primary" onClick={() => setIsEditing(false)} style={{ flex: 1, background: 'rgba(255,255,255,0.05)' }}>Cancelar</button>
                    <button className="btn-primary" onClick={handleUpdateTournament} style={{ flex: 1 }}>Guardar Cambios</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Category Tabs */}
          <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1px' }}>
            {tournament?.categories.map((cat, idx) => (
              <button 
                key={cat.id} 
                onClick={() => setActiveTab(idx)}
                style={{
                  padding: '1rem 2rem', background: 'none', border: 'none', color: activeTab === idx ? 'var(--primary)' : 'rgba(255,255,255,0.5)',
                  cursor: 'pointer', borderBottom: activeTab === idx ? '3px solid var(--primary)' : '3px solid transparent',
                  fontWeight: activeTab === idx ? 'bold' : 'normal', transition: 'all 0.3s'
                }}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '3rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
            
            {/* Groups Section */}
            {currentCategory?.groups && currentCategory.groups.length > 0 && (
              <section className="fadeIn">
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                  <Users color="var(--primary)" /> Fase de Grupos
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                  {currentCategory.groups.map(group => (
                    <div key={group.id} className="glass-card" style={{ padding: '1.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <h3 style={{ margin: 0 }}>{group.name}</h3>
                        {isAdmin && (
                          <button 
                            onClick={(e) => { e.preventDefault(); handleDeleteGroup(group.id); }}
                            style={{ background: 'none', border: 'none', color: 'rgba(255,75,43,0.5)', cursor: 'pointer', padding: '5px' }}
                            onMouseEnter={(e) => e.currentTarget.style.color = '#ff4b2b'}
                            onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,75,43,0.5)'}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.8rem', opacity: 0.6, marginBottom: '1.5rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Users size={14} /> {group._count.pairs} Parejas</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Activity size={14} /> {group._count.matches} Partidos</span>
                      </div>
                      <Link to={`/group/${group.id}`} className="btn-primary" style={{ textDecoration: 'none', padding: '0.7rem 1rem', fontSize: '0.9rem', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px' }}>
                        Gestionar <ArrowRight size={16} />
                      </Link>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Brackets Section */}
            {currentCategory?.brackets && currentCategory.brackets.length > 0 && (
              <section className="fadeIn">
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                  <Trophy color="var(--primary)" /> Fase de Brackets
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
                  {currentCategory.brackets.map(bracket => (
                    <div key={bracket.id} className="glass-card" style={{ padding: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '0.5rem' }}>
                          <h3 style={{ margin: 0 }}>{bracket.name}</h3>
                          {isAdmin && (
                            <button 
                              onClick={(e) => { e.preventDefault(); handleDeleteBracket(bracket.id); }}
                              style={{ background: 'none', border: 'none', color: 'rgba(255,75,43,0.5)', cursor: 'pointer', padding: '5px', display: 'flex' }}
                              onMouseEnter={(e) => e.currentTarget.style.color = '#ff4b2b'}
                              onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,75,43,0.5)'}
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                        <span style={{ fontSize: '0.9rem', opacity: 0.6 }}>{bracket._count.matches} Partidos programados</span>
                      </div>
                      <Link to={`/bracket/${bracket.id}`} className="btn-primary" style={{ textDecoration: 'none', padding: '0.8rem 1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                         Ver Bracket <ArrowRight size={18} />
                      </Link>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {(!currentCategory?.groups?.length && !currentCategory?.brackets?.length) ? (
                <div className="glass-card fadeIn" style={{ padding: '5rem 4rem', textAlign: 'center', border: '2px dashed rgba(255,255,255,0.05)' }}>
                    <h3 style={{ opacity: 0.5, marginBottom: '2rem' }}>No hay estructura definida para esta categoría</h3>
                    {isAdmin && (
                      <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center' }}>
                        <button onClick={() => handleAddGroup(currentCategory!.id)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <Users size={18} /> Crear Fase de Grupos
                        </button>
                        <button onClick={() => handleAddBracket(currentCategory!.id)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <Trophy size={18} /> Crear Brackets
                        </button>
                      </div>
                    )}
                </div>
            ) : (
              isAdmin && (
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                   <button onClick={() => handleAddGroup(currentCategory!.id)} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem' }}>+ Añadir Grupo</button>
                   <button onClick={() => handleAddBracket(currentCategory!.id)} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem' }}>+ Añadir Bracket</button>
                </div>
              )
            )}
          </div>

          {/* Sidebar: Participants */}
          <aside className="fadeIn">
            <div className="glass-card" style={{ padding: '2rem' }}>
              <h3 style={{ marginTop: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Layers size={20} color="var(--primary)" /> Participantes ({currentCategory?.pairs.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                {currentCategory?.pairs.map(pair => (
                  <div key={pair.id} style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', fontSize: '0.9rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                    {pair.name}
                  </div>
                ))}
                {currentCategory?.pairs.length === 0 && (
                  <p style={{ opacity: 0.4, fontSize: '0.9rem', textAlign: 'center', padding: '1rem' }}>Sin participantes registrados</p>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Custom Confirmation Modal */}
      {confirmModal.show && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 3000, padding: '2rem', backdropFilter: 'blur(8px)'
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

      {/* Custom Prompt Modal (for Group Name) */}
      {promptModal.show && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 3100, padding: '2rem', backdropFilter: 'blur(8px)'
        }}>
          <div className="glass-card fadeIn" style={{ 
            padding: '3rem', maxWidth: '450px', width: '100%', 
            backgroundColor: '#1a1d23', textAlign: 'center'
          }}>
            <h2 style={{ marginBottom: '1.5rem', color: 'white' }}>{promptModal.title}</h2>
            <div style={{ marginBottom: '2.5rem' }}>
              <input 
                type="text" 
                className="input-field" 
                autoFocus
                placeholder={promptModal.placeholder}
                value={promptModal.value}
                onChange={(e) => setPromptModal({ ...promptModal, value: e.target.value })}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    promptModal.onConfirm(promptModal.value);
                    setPromptModal({ ...promptModal, show: false });
                  }
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                className="btn-primary" 
                onClick={() => setPromptModal({ ...promptModal, show: false })} 
                style={{ flex: 1, background: 'rgba(255,255,255,0.05)', color: 'white' }}
              >
                Cancelar
              </button>
              <button 
                className="btn-primary" 
                onClick={() => {
                  promptModal.onConfirm(promptModal.value);
                  setPromptModal({ ...promptModal, show: false });
                }} 
                style={{ flex: 1 }}
              >
                Crear Grupo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Bracket Modal */}
      {bracketModal.show && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 3200, padding: '2rem', backdropFilter: 'blur(8px)'
        }}>
          <div className="glass-card fadeIn" style={{ 
            padding: '3rem', maxWidth: '450px', width: '100%', 
            backgroundColor: '#1a1d23', textAlign: 'center'
          }}>
            <h2 style={{ marginBottom: '1rem', color: 'white' }}>Crear Brackets</h2>
            <p style={{ opacity: 0.7, marginBottom: '2rem' }}>Selecciona el tamaño de la fase de eliminación</p>
            
            <div style={{ marginBottom: '2.5rem' }}>
              <select 
                className="input-field" 
                value={bracketModal.size}
                onChange={(e) => setBracketModal({ ...bracketModal, size: parseInt(e.target.value) })}
              >
                <option value={2}>Final (2 jugadores)</option>
                <option value={4}>Semis (4 jugadores)</option>
                <option value={8}>Cuartos (8 jugadores)</option>
                <option value={16}>Octavos (16 jugadores)</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                className="btn-primary" 
                onClick={() => setBracketModal({ ...bracketModal, show: false })} 
                style={{ flex: 1, background: 'rgba(255,255,255,0.05)', color: 'white' }}
              >
                Cancelar
              </button>
              <button 
                className="btn-primary" 
                onClick={handleConfirmBracket}
                style={{ flex: 1 }}
              >
                Generar Bracket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TournamentDetails;
