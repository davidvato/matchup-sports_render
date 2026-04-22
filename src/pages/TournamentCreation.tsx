import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Trophy, Users, Plus, Trash2,
  ArrowRight, CheckCircle2, MapPin, Calendar,
  ChevronRight, ChevronLeft, Tags
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface CategoryConfig {
  name: string;
  hasGroups: boolean;
  groupCount: number;
  hasBrackets: boolean;
  bracketSize: number;
  participants: string[];
}

const TournamentCreation: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Section 1: Basic Info
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sport, setSport] = useState('Basquetball');
  const [description, setDescription] = useState('');
  const [showRacquetModal, setShowRacquetModal] = useState(false);

  // Section 2: Categories
  const [categories, setCategories] = useState<CategoryConfig[]>([]);
  const [newCatName, setNewCatName] = useState('');

  const addCategory = () => {
    if (!newCatName.trim()) return;

    setCategories([...categories, {
      name: newCatName,
      hasGroups: false, // Disabled by default for all sports
      groupCount: 1,
      hasBrackets: false, // Disabled by default for all sports
      bracketSize: 4,
      participants: []
    }]);
    setNewCatName('');
  };

  const toggleCategoryFlag = (idx: number, flag: 'hasGroups' | 'hasBrackets') => {
    const newCats = [...categories];
    newCats[idx][flag] = !newCats[idx][flag];
    setCategories(newCats);
  };

  const removeCategory = (index: number) => {
    const newCats = [...categories];
    newCats.splice(index, 1);
    setCategories(newCats);
  };



  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          location,
          startDate,
          endDate,
          sport,
          description,
          creatorId: user?.id,
          categories: categories.map(cat => ({
            ...cat,
            participants: [] // No participants added during creation anymore
          }))
        })
      });

      if (response.ok) {
        const data = await response.json();
        navigate(`/tournament/${data.id}`);
      }
    } catch (error) {
      console.error('Error creating tournament:', error);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step === 1) {
      if (!startDate || !endDate) {
        setError('Por favor selecciona ambas fechas (inicio y fin).');
        return;
      }
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [sy, sm, sd] = startDate.split('-').map(Number);
      const start = new Date(sy, sm - 1, sd);

      const [ey, em, ed] = endDate.split('-').map(Number);
      const end = new Date(ey, em - 1, ed);

      if (start < today) {
        setError('La fecha de inicio no puede ser anterior a la fecha actual.');
        return;
      }
      if (end < today) {
        setError('La fecha de fin no puede ser anterior a la fecha actual.');
        return;
      }
      if (end < start) {
        setError('La fecha de fin no puede ser anterior a la fecha de inicio.');
        return;
      }
    }
    setError('');
    setStep(step + 1);
  };

  const prevStep = () => {
    setError('');
    setStep(step - 1);
  };

  return (
    <div style={{
      minHeight: '100vh', padding: '120px 2rem 50px',
      backgroundImage: 'linear-gradient(135deg, #0c0e14 0%, #1a1d23 100%)', color: 'white'
    }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <header style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h1 className="gradient-text" style={{ fontSize: '3.5rem', margin: '0 0 1rem' }}>MatchUp Tournament</h1>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            <StepIndicator current={step} target={1} label="Información" />
            <StepIndicator current={step} target={2} label="Categorías" />
          </div>
        </header>

        <div className="glass-card fadeIn" style={{ padding: '3.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>

          {/* STEP 1: BASIC INFO */}
          {step === 1 && (
            <div className="slideIn">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2.5rem' }}>
                <Trophy color="var(--primary)" size={28} /> Información Básica
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', marginBottom: '0.8rem', opacity: 0.7 }}>Nombre del Torneo</label>
                  <input type="text" className="input-field" placeholder="Ej: Torneo Relámpago 2024" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', marginBottom: '0.8rem', opacity: 0.7 }}>Lugar / Ubicación</label>
                  <div style={{ position: 'relative' }}>
                    <MapPin size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                    <input type="text" className="input-field" style={{ paddingLeft: '40px' }} placeholder="Escribe la ubicación..." value={location} onChange={(e) => setLocation(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.8rem', opacity: 0.7 }}>Fecha Inicio</label>
                  <div style={{ position: 'relative' }}>
                    <Calendar size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                    <input type="date" className="input-field" style={{ paddingLeft: '40px' }} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.8rem', opacity: 0.7 }}>Fecha Fin</label>
                  <div style={{ position: 'relative' }}>
                    <Calendar size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                    <input type="date" className="input-field" style={{ paddingLeft: '40px' }} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                  </div>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', marginBottom: '0.8rem', opacity: 0.7 }}>Deporte</label>
                  <select
                    className="input-field"
                    value={sport}
                    onChange={(e) => {
                      const selectedSport = e.target.value;
                      setSport(selectedSport);
                      if (selectedSport === 'Racquetball') {
                        setShowRacquetModal(true);
                      } else if (selectedSport === 'Pickleball') {
                        setDescription('1 set a 7 puntos minimo');
                        setShowRacquetModal(false);
                      } else {
                        setDescription('');
                        setShowRacquetModal(false);
                      }
                    }}
                  >
                    <option>Basquetball</option>
                    <option disabled style={{ color: 'rgba(255,255,255,0.3)' }}>Front Tenis (Próximamente)</option>
                    <option>Futbol</option>
                    <option disabled style={{ color: 'rgba(255,255,255,0.3)' }}>Padel (Próximamente)</option>
                    <option>Pickleball</option>
                    <option>Racquetball</option>
                    <option disabled style={{ color: 'rgba(255,255,255,0.3)' }}>Squash (Próximamente)</option>
                    <option disabled style={{ color: 'rgba(255,255,255,0.3)' }}>Tenis (Próximamente)</option>
                  </select>
                </div>
              </div>

              {/* Racquetball Rules Modal */}
              {showRacquetModal && (
                <div style={{
                  position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                  background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                  <div className="glass-card fadeIn" style={{ padding: '3rem', maxWidth: '600px', border: '1px solid var(--primary)' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '2rem', textAlign: 'center' }}>Selecciona el Tipo de Torneo de Racquetball</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      <button
                        className="btn-primary"
                        style={{ background: description === '2 de 3 sets a 15 puntos con cambios' ? 'var(--primary)' : 'rgba(255,255,255,0.05)', color: description === '2 de 3 sets a 15 puntos con cambios' ? '#000' : 'white' }}
                        onClick={() => setDescription('2 de 3 sets a 15 puntos con cambios')}
                      >
                        2 de 3 sets a 15 puntos con cambios
                      </button>
                      <button
                        className="btn-primary"
                        style={{ background: description === '3 de 5 sets a 11 puntos, punto directo, con diferencia de dos puntos' ? 'var(--primary)' : 'rgba(255,255,255,0.05)', color: description === '3 de 5 sets a 11 puntos, punto directo, con diferencia de dos puntos' ? '#000' : 'white' }}
                        onClick={() => setDescription('3 de 5 sets a 11 puntos, punto directo, con diferencia de dos puntos')}
                      >
                        3 de 5 sets a 11 puntos, punto directo, con diferencia de dos puntos
                      </button>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '3rem' }}>
                      <button
                        className="btn-primary"
                        onClick={() => {
                          setShowRacquetModal(false);
                          setSport('Tenis');
                          setDescription('');
                        }}
                        style={{ flex: 1, background: 'rgba(255,255,255,0.05)', color: 'white' }}
                      >
                        Cancelar
                      </button>
                      <button
                        className="btn-primary"
                        disabled={!description}
                        onClick={() => setShowRacquetModal(false)}
                        style={{ flex: 2, background: 'var(--primary)', color: '#000' }}
                      >
                        Confirmar Selección
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {error && (
                <div style={{
                  background: 'rgba(255, 75, 43, 0.1)',
                  border: '1px solid rgba(255, 75, 43, 0.3)',
                  color: '#ff4b2b',
                  padding: '1rem',
                  borderRadius: '12px',
                  marginBottom: '2rem',
                  textAlign: 'center',
                  fontSize: '0.9rem'
                }}>
                  {error}
                </div>
              )}
              <button className="btn-primary" onClick={nextStep} disabled={!name} style={{ width: '100%', marginTop: '1rem', padding: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                Continuar a Categorías <ArrowRight size={20} />
              </button>
            </div>
          )}

          {/* STEP 2: CATEGORIES */}
          {step === 2 && (
            <div className="slideIn">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
                <Tags color="var(--primary)" size={28} /> Categorías
              </h2>
              <p style={{ opacity: 0.6, marginBottom: '2.5rem' }}>Define las categorias de competencia (ej: Rama Varonil, Sub-20, etc.)</p>

              <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Nombre de la categoría..."
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addCategory()}
                />
                <button onClick={addCategory} className="btn-primary" style={{ padding: '0 2rem' }}>
                  <Plus size={24} />
                </button>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', minHeight: '100px' }}>
                {categories.map((cat, idx) => (
                  <div key={idx} className="glass-card fadeIn" style={{
                    padding: '0.8rem 1.5rem', display: 'flex', alignItems: 'center', gap: '15px',
                    background: 'rgba(0, 242, 254, 0.05)', border: '1px solid var(--primary)33'
                  }}>
                    <span style={{ fontWeight: 'bold' }}>{cat.name}</span>
                    <button onClick={() => removeCategory(idx)} style={{ background: 'none', border: 'none', color: '#ff4b2b', cursor: 'pointer', display: 'flex' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                {categories.length === 0 && (
                  <div style={{ width: '100%', textAlign: 'center', padding: '2rem', opacity: 0.3, border: '2px dashed rgba(255,255,255,0.1)', borderRadius: '16px' }}>
                    No has añadido ninguna categoría todavía.
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '1.5rem', marginTop: '4rem' }}>
                <button className="btn-primary" onClick={prevStep} style={{ background: 'rgba(255,255,255,0.05)', flex: 1 }}>Atrás</button>
                <button 
                  className="btn-primary" 
                  onClick={handleSubmit} 
                  disabled={categories.length === 0 || loading} 
                  style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                >
                  {loading ? 'Procesando...' : 'Crear Torneo'} <CheckCircle2 size={20} />
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

const StepIndicator = ({ current, target, label }: { current: number, target: number, label: string }) => {
  const isActive = current === target;
  const isCompleted = current > target;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', opacity: isActive || isCompleted ? 1 : 0.35 }}>
      <div style={{
        width: '32px', height: '32px', borderRadius: '50%',
        background: isCompleted ? 'var(--primary)' : (isActive ? 'var(--primary)' : 'transparent'),
        border: '2px solid var(--primary)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem',
        color: isCompleted || isActive ? '#000' : 'var(--primary)',
        fontWeight: 'bold'
      }}>
        {isCompleted ? <CheckCircle2 size={18} /> : target}
      </div>
      <span style={{ fontSize: '1rem', fontWeight: isActive ? 'bold' : 'normal', display: 'inline-block' }}>{label}</span>
      {target < 2 && <ChevronRight size={16} style={{ marginLeft: '5px', opacity: 0.3 }} />}
    </div>
  );
};

export default TournamentCreation;
