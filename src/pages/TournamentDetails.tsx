import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Users, Trophy, Activity,
  ArrowRight, Settings, MapPin, Calendar,
  Layers, Trash2, AlertTriangle, Plus, RotateCcw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { sportsData } from '../data/sports';

interface Group {
  id: string;
  name: string;
  pairs?: Pair[];
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
  groupId?: string | null;
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
  description?: string;
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
    onConfirm: () => { }
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
    onConfirm: () => { }
  });

  // Custom Bracket Modal State
  const [bracketModal, setBracketModal] = useState({ show: false, categoryId: '', size: 8 });
  const [newCategoryModal, setNewCategoryModal] = useState({ show: false, name: '' });

  const handleDeleteTournament = async () => {
    setConfirmModal({
      show: true,
      title: 'Eliminar Torneo',
      message: '¿Estás seguro de eliminar permanentemente este torneo? Esta acción no se puede deshacer.',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/tournaments/${id}`, { method: 'DELETE' });
          if (res.ok) navigate('/create');
        } catch (err) {
          console.error(err);
        }
      }
    });
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
          const res = await fetch(`/api/categories/${categoryId}/groups`, {
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
      const res = await fetch(`/api/categories/${bracketModal.categoryId}/brackets`, {
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
          const res = await fetch(`/api/groups/${groupId}`, { method: 'DELETE' });
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
          const res = await fetch(`/api/brackets/${bracketId}`, { method: 'DELETE' });
          if (res.ok) fetchTournament();
        } catch (err) {
          console.error(err);
        }
      }
    });
  };

  const handleDeleteCategory = async (categoryId: string) => {
    setConfirmModal({
      show: true,
      title: 'Eliminar Categoría',
      message: '¿Estás seguro de eliminar esta CATEGORÍA? Se perderán TODOS los grupos, brackets y participantes asociados de forma permanente.',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/categories/${categoryId}`, { method: 'DELETE' });
          if (res.ok) {
            // Adjust active tab if needed
            if (activeTab > 0 && activeTab === (tournament?.categories.length || 0) - 1) {
              setActiveTab(activeTab - 1);
            }
            fetchTournament();
          }
        } catch (err) {
          console.error(err);
        }
      }
    });
  };

  const handleCreateCategory = async () => {
    if (!newCategoryModal.name.trim()) return;
    try {
      const res = await fetch(`/api/tournaments/${id}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryModal.name })
      });
      if (res.ok) {
        setNewCategoryModal({ show: false, name: '' });
        fetchTournament();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetGroups = async () => {
    if (!currentCategory) return;
    setConfirmModal({
      show: true,
      title: 'Reiniciar Fase',
      message: '¿Estás seguro de reiniciar todos los resultados y borrar los brackets de esta categoría? Esta acción no se puede deshacer.',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/categories/${currentCategory.id}/reset`, {
            method: 'POST'
          });
          if (res.ok) fetchTournament();
        } catch (err) {
          console.error(err);
        }
      }
    });
  };

  const handleAddPair = (categoryId: string) => {
    setPromptModal({
      show: true,
      title: 'Agregar Jugador',
      value: '',
      placeholder: 'Nombre del jugador o pareja...',
      onConfirm: async (name) => {
        if (!name.trim()) return;
        try {
          const res = await fetch(`/api/categories/${categoryId}/pairs`, {
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

  const handleDeletePair = (pairId: string, pairName: string) => {
    setConfirmModal({
      show: true,
      title: 'Eliminar Jugador',
      message: `¿Estás seguro de eliminar a "${pairName}"? Se borrará de todos los grupos y brackets donde esté asignado.`,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/pairs/${pairId}`, { method: 'DELETE' });
          if (res.ok) fetchTournament();
        } catch (err) {
          console.error(err);
        }
      }
    });
  };



  useEffect(() => {
    fetchTournament();
  }, [id]);

  const fetchTournament = async () => {
    try {
      const res = await fetch(`/api/tournaments/${id}`);
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
  const sportKey = tournament?.sport?.toLowerCase().replace(' ', '-');
  const sportInfo = sportKey ? sportsData[sportKey] : null;

  return (
    <div style={{
      minHeight: '100vh', padding: '120px 2rem 50px',
      backgroundImage: 'linear-gradient(135deg, #0c0e14 0%, #1a1d23 100%)', color: 'white'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'rgba(255,255,255,0.5)', textDecoration: 'none', marginBottom: '2rem' }}>
          <ChevronLeft size={20} /> Volver a Inicio
        </Link>

        {sportInfo ? (
          <>
            <header style={{
              position: 'relative',
              marginBottom: '3rem',
              borderRadius: '24px',
              overflow: 'hidden',
              minHeight: '350px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              padding: '3rem',
              backgroundImage: `linear-gradient(to top, rgba(12, 14, 20, 1) 0%, rgba(12, 14, 20, 0.4) 100%), url(${sportInfo.image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%' }}>
                <div>
                  <span style={{
                    backgroundColor: 'rgba(0, 242, 254, 0.2)',
                    color: '#00f2fe',
                    padding: '6px 16px',
                    borderRadius: '20px',
                    fontSize: '0.85rem',
                    fontWeight: 'bold',
                    marginBottom: '1rem',
                    display: 'inline-block',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(0, 242, 254, 0.3)'
                  }}>
                    {tournament?.sport}
                  </span>
                  <h1 className="gradient-text" style={{ fontSize: '4.5rem', margin: '0 0 0.5rem', lineHeight: 1, textShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                    {tournament?.name}
                  </h1>
                  <div style={{ display: 'flex', gap: '2rem', opacity: 0.9, fontSize: '1.1rem', flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><MapPin size={18} /> {tournament?.location || 'Sin ubicación'}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Calendar size={18} /> {formatDate(tournament?.startDate!)} - {formatDate(tournament?.endDate!)}</span>
                    {tournament?.description && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)' }}>
                        <Trophy size={18} /> {tournament.description}
                      </span>
                    )}
                  </div>
                </div>
                {isAdmin && (
                  <div style={{ position: 'relative' }}>
                    <button
                      className="btn-primary"
                      onClick={() => setShowSettings(!showSettings)}
                      style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid rgba(255,255,255,0.2)' }}
                    >
                      <Settings size={18} /> Configurar
                    </button>
                    {showSettings && (
                      <div className="glass-card fadeIn" style={{
                        position: 'absolute', bottom: '100%', right: 0, marginBottom: '10px',
                        width: '200px', padding: '10px', zIndex: 10, backgroundColor: 'rgba(26, 29, 35, 0.95)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255,255,255,0.1)'
                      }}>
                        <button
                          onClick={() => { /* setIsEditing(true); */ setShowSettings(false); }}
                          style={{
                            width: '100%', padding: '10px', background: 'none', border: 'none',
                            color: 'white', cursor: 'pointer', textAlign: 'left', borderRadius: '8px',
                            display: 'flex', alignItems: 'center', gap: '10px'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          Editar Información (Deshabilitado)
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
            </header>

            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px', opacity: 0.9 }}>
              <Layers size={24} color="#00f2fe" /> Categorías del Torneo
            </h2>
            <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1px', marginBottom: '3rem' }}>
              {tournament?.categories.map((cat, idx) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveTab(idx)}
                  style={{
                    padding: '1rem 2rem', background: 'none', border: 'none', color: activeTab === idx ? 'var(--primary)' : 'rgba(255,255,255,0.5)',
                    cursor: 'pointer', borderBottom: activeTab === idx ? '3px solid var(--primary)' : '3px solid transparent',
                    fontWeight: activeTab === idx ? 'bold' : 'normal', transition: 'all 0.3s',
                    display: 'flex', alignItems: 'center', gap: '10px'
                  }}
                >
                  {cat.name}
                  {isAdmin && activeTab === idx && (
                    <span
                      onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat.id); }}
                      style={{
                        padding: '4px', borderRadius: '4px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'rgba(255,75,43,0.1)', color: '#ff4b2b',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,75,43,0.2)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,75,43,0.1)'}
                      title="Eliminar categoría"
                    >
                      <Trash2 size={12} />
                    </span>
                  )}
                </button>
              ))}
              {isAdmin && (
                <button
                  onClick={() => setNewCategoryModal({ show: true, name: '' })}
                  className="glass-card"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'white',
                    padding: '0.5rem 1rem',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    height: '42px',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                >
                  <Plus size={18} /> Nueva Categoría
                </button>
              )}
            </div>
          </>
        ) : (
          <header style={{ marginBottom: '4rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div>
                <span className="badge" style={{ backgroundColor: 'rgba(0, 242, 254, 0.1)', color: 'var(--primary)', padding: '6px 16px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '1rem', display: 'inline-block' }}>
                  {tournament?.sport}
                </span>
                <h1 className="gradient-text" style={{ fontSize: '4rem', margin: '0 0 0.5rem', lineHeight: 1 }}>{tournament?.name}</h1>
                {tournament?.description && (
                  <p style={{ fontSize: '1.2rem', opacity: 0.6, margin: '0 0 1.5rem', maxWidth: '800px', fontStyle: 'italic' }}>
                    {tournament.description}
                  </p>
                )}
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
                        onClick={() => { /* setIsEditing(true); */ setShowSettings(false); }}
                        style={{
                          width: '100%', padding: '10px', background: 'none', border: 'none',
                          color: 'white', cursor: 'pointer', textAlign: 'left', borderRadius: '8px',
                          display: 'flex', alignItems: 'center', gap: '10px'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        Editar Información (Deshabilitado)
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

            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px', opacity: 0.8 }}>
              <Layers size={24} color="var(--primary)" /> Categorías del Torneo
            </h2>
            <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1px' }}>
              {tournament?.categories.map((cat, idx) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveTab(idx)}
                  style={{
                    padding: '1rem 2rem', background: 'none', border: 'none', color: activeTab === idx ? 'var(--primary)' : 'rgba(255,255,255,0.5)',
                    cursor: 'pointer', borderBottom: activeTab === idx ? '3px solid var(--primary)' : '3px solid transparent',
                    fontWeight: activeTab === idx ? 'bold' : 'normal', transition: 'all 0.3s',
                    display: 'flex', alignItems: 'center', gap: '10px'
                  }}
                >
                  {cat.name}
                  {isAdmin && activeTab === idx && (
                    <span
                      onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat.id); }}
                      style={{
                        padding: '4px', borderRadius: '4px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'rgba(255,75,43,0.1)', color: '#ff4b2b',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,75,43,0.2)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,75,43,0.1)'}
                      title="Eliminar categoría"
                    >
                      <Trash2 size={12} />
                    </span>
                  )}
                </button>
              ))}
              {isAdmin && (
                <button
                  onClick={() => setNewCategoryModal({ show: true, name: '' })}
                  className="glass-card"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'white',
                    padding: '0.5rem 1rem',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    height: '42px',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                >
                  <Plus size={18} /> Nueva Categoría
                </button>
              )}
            </div>
          </header>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '3rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>

            {/* Groups Section */}
            {currentCategory?.groups && currentCategory.groups.length > 0 && (
              <section className="fadeIn">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
                    <Users color="var(--primary)" /> Fase de Grupos
                  </h2>
                  {isAdmin && (
                    <button
                      onClick={handleResetGroups}
                      className="glass-card"
                      style={{
                        background: 'rgba(255,75,43,0.1)',
                        border: '1px solid rgba(255,75,43,0.2)',
                        color: '#ff4b2b',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        transition: 'all 0.3s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,75,43,0.2)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,75,43,0.1)'}
                    >
                      <RotateCcw size={14} /> Reiniciar Fase
                    </button>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                  {currentCategory.groups.map(group => (
                    <div key={group.id} className="glass-card" style={{ padding: '1.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <h3 style={{ margin: 0 }}>{group.name}</h3>
                        {isAdmin && (
                          <button
                            onClick={(e) => { e.preventDefault(); handleDeleteGroup(group.id); }}
                            style={{
                              background: '#ff4b2b',
                              border: 'none',
                              color: 'white',
                              cursor: 'pointer',
                              padding: '8px',
                              borderRadius: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 2px 10px rgba(255, 75, 43, 0.3)',
                              zIndex: 5
                            }}
                            title="Eliminar grupo"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.8rem', opacity: 0.6, marginBottom: '1.5rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Users size={14} /> {group._count.pairs} Jugadores</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Activity size={14} /> {group._count.matches} Partidos</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Link to={`/group/${group.id}`} className="btn-primary" style={{ textDecoration: 'none', padding: '0.6rem 1.2rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          Gestionar <ArrowRight size={16} />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Brackets Section */}
            {currentCategory?.brackets && currentCategory.brackets.length > 0 && (
              <section className="fadeIn">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
                    <Trophy color="var(--primary)" /> Fase de Brackets
                  </h2>
                  {isAdmin && (
                    <button
                      onClick={handleResetGroups}
                      className="glass-card"
                      style={{
                        background: 'rgba(255,75,43,0.1)',
                        border: '1px solid rgba(255,75,43,0.2)',
                        color: '#ff4b2b',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        transition: 'all 0.3s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,75,43,0.2)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,75,43,0.1)'}
                    >
                      <RotateCcw size={14} /> Reiniciar Brackets
                    </button>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
                  {currentCategory.brackets.map(bracket => (
                    <div key={bracket.id} className="glass-card" style={{ padding: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '0.5rem' }}>
                          <h3 style={{ margin: 0 }}>{bracket.name}</h3>
                          {isAdmin && (
                            <button
                              onClick={(e) => { e.preventDefault(); handleDeleteBracket(bracket.id); }}
                              style={{
                                background: '#ff4b2b',
                                border: 'none',
                                color: 'white',
                                cursor: 'pointer',
                                padding: '10px',
                                borderRadius: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 2px 10px rgba(255, 75, 43, 0.3)',
                                zIndex: 5
                              }}
                              title="Eliminar bracket"
                            >
                              <Trash2 size={18} />
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
                {isAdmin && currentCategory && (
                  <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center' }}>
                    <button
                      onClick={() => handleAddGroup(currentCategory.id)}
                      className="btn-primary"
                      style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
                    >
                      <Users size={18} /> Crear Fase de Grupos
                    </button>
                    <button
                      onClick={() => handleAddBracket(currentCategory.id)}
                      className="btn-primary"
                      disabled={tournament?.sport === 'Pickleball'}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        opacity: tournament?.sport === 'Pickleball' ? 0.4 : 1,
                        cursor: tournament?.sport === 'Pickleball' ? 'not-allowed' : 'pointer'
                      }}
                    >
                      <Trophy size={18} /> Crear Brackets {tournament?.sport === 'Pickleball' && '(No disponible)'}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              isAdmin && currentCategory && (
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                  <button onClick={() => handleAddGroup(currentCategory.id)} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem' }}>+ Añadir Grupo</button>
                  <button
                    onClick={() => handleAddBracket(currentCategory.id)}
                    disabled={tournament?.sport === 'Pickleball'}
                    style={{
                      background: 'none',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: 'white',
                      padding: '0.5rem 1rem',
                      borderRadius: '8px',
                      cursor: tournament?.sport === 'Pickleball' ? 'not-allowed' : 'pointer',
                      fontSize: '0.8rem',
                      opacity: tournament?.sport === 'Pickleball' ? 0.3 : 1
                    }}
                  >
                    + Añadir Bracket {tournament?.sport === 'Pickleball' && '(No disponible)'}
                  </button>
                </div>
              )
            )}
          </div>

          {/* Sidebar: Players grouped by Category */}
          <aside className="fadeIn">
            <div className="glass-card" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h3 style={{ marginTop: 0, marginBottom: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Users size={20} color="var(--primary)" /> Jugadores
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                {tournament?.categories.map(cat => {
                  const unassignedPairs = cat.pairs.filter(p => !p.groupId);

                  return (
                    <div key={cat.id}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '1.2rem',
                        paddingBottom: '0.6rem',
                        borderBottom: '2px solid rgba(0, 242, 254, 0.2)'
                      }}>
                        <span style={{ fontWeight: 'bold', fontSize: '1rem', color: 'var(--primary)' }}>
                          {cat.name}
                        </span>
                        {isAdmin && (
                          <button
                            onClick={() => handleAddPair(cat.id)}
                            style={{
                              background: 'rgba(0, 242, 254, 0.1)',
                              border: '1px solid rgba(0, 242, 254, 0.2)',
                              color: 'var(--primary)',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px',
                              fontSize: '0.75rem',
                              transition: 'all 0.3s'
                            }}
                          >
                            <Plus size={14} /> Jugador
                          </button>
                        )}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {/* Groups in this category */}
                        {cat.groups.map(group => (
                          <div key={group.id} style={{ paddingLeft: '0.5rem', borderLeft: '2px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ fontSize: '0.8rem', opacity: 0.5, marginBottom: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
                              {group.name}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              {group.pairs?.map(pair => (
                                <div
                                  key={pair.id}
                                  style={{
                                    padding: '0.7rem 1rem',
                                    background: 'rgba(255,255,255,0.03)',
                                    borderRadius: '8px',
                                    fontSize: '0.85rem',
                                    border: '1px solid rgba(255,255,255,0.02)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                  }}
                                >
                                  <span>{pair.name}</span>
                                  {isAdmin && (
                                    <button
                                      onClick={() => handleDeletePair(pair.id, pair.name)}
                                      style={{
                                        background: 'none',
                                        border: 'none',
                                        color: 'rgba(255,75,43,0.3)',
                                        cursor: 'pointer',
                                        padding: '2px',
                                        transition: 'color 0.3s'
                                      }}
                                      onMouseEnter={(e) => e.currentTarget.style.color = '#ff4b2b'}
                                      onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,75,43,0.3)'}
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  )}
                                </div>
                              ))}
                              {(!group.pairs || group.pairs.length === 0) && (
                                <p style={{ fontSize: '0.75rem', opacity: 0.3, margin: '0.2rem 0', fontStyle: 'italic' }}>
                                  Sin jugadores asignados
                                </p>
                              )}
                            </div>
                          </div>
                        ))}

                        {/* Unassigned players in this category */}
                        {unassignedPairs.length > 0 && (
                          <div style={{ paddingLeft: '0.5rem', borderLeft: '2px solid rgba(255,165,0,0.1)' }}>
                            <div style={{ fontSize: '0.8rem', color: '#ffa500', opacity: 0.6, marginBottom: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
                              Sin Grupo
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              {unassignedPairs.map(pair => (
                                <div
                                  key={pair.id}
                                  style={{
                                    padding: '0.7rem 1rem',
                                    background: 'rgba(255,165,0,0.02)',
                                    borderRadius: '8px',
                                    fontSize: '0.85rem',
                                    border: '1px solid rgba(255,165,0,0.05)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                  }}
                                >
                                  <span>{pair.name}</span>
                                  {isAdmin && (
                                    <button
                                      onClick={() => handleDeletePair(pair.id, pair.name)}
                                      style={{
                                        background: 'none',
                                        border: 'none',
                                        color: 'rgba(255,75,43,0.3)',
                                        cursor: 'pointer',
                                        padding: '2px',
                                        transition: 'color 0.3s'
                                      }}
                                      onMouseEnter={(e) => e.currentTarget.style.color = '#ff4b2b'}
                                      onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,75,43,0.3)'}
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {cat.groups.length === 0 && unassignedPairs.length === 0 && (
                          <p style={{ fontSize: '0.8rem', opacity: 0.3, textAlign: 'center', fontStyle: 'italic' }}>
                            Sin datos en esta categoría
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
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
                {promptModal.title === 'Agregar Jugador' ? 'Guardar' : 'Crear Grupo'}
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

      {/* New Category Modal */}
      {newCategoryModal.show && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          padding: '20px'
        }}>
          <div className="glass-card fadeIn" style={{ padding: '2.5rem', maxWidth: '450px', width: '100%', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h2 style={{ marginTop: 0, color: 'white', marginBottom: '1.5rem' }}>Nueva Categoría</h2>
            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', marginBottom: '0.8rem', opacity: 0.7, fontSize: '0.9rem' }}>Nombre de la categoría</label>
              <input
                type="text"
                value={newCategoryModal.name}
                onChange={(e) => setNewCategoryModal({ ...newCategoryModal, name: e.target.value })}
                placeholder="Ej: Categoría A, Open, etc."
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  padding: '1rem',
                  color: 'white',
                  fontSize: '1rem'
                }}
                autoFocus
              />
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                className="btn-primary"
                onClick={() => setNewCategoryModal({ show: false, name: '' })}
                style={{ flex: 1, background: 'rgba(255,255,255,0.05)', color: 'white' }}
              >
                Cancelar
              </button>
              <button
                className="btn-primary"
                onClick={handleCreateCategory}
                style={{ flex: 1 }}
                disabled={!newCategoryModal.name.trim()}
              >
                Crear Categoría
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TournamentDetails;
