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

  // Section 1: Basic Info
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sport, setSport] = useState('Tenis');
  const [description, setDescription] = useState('');
  const [showRacquetModal, setShowRacquetModal] = useState(false);

  // Section 2: Categories
  const [categories, setCategories] = useState<CategoryConfig[]>([]);
  const [newCatName, setNewCatName] = useState('');

  const addCategory = () => {
    if (!newCatName.trim()) return;
    setCategories([...categories, {
      name: newCatName,
      hasGroups: false, // Default to false as requested to remove config
      groupCount: 0,
      hasBrackets: false,
      bracketSize: 0,
      participants: ['', '']
    }]);
    setNewCatName('');
  };

  const removeCategory = (index: number) => {
    const newCats = [...categories];
    newCats.splice(index, 1);
    setCategories(newCats);
  };

  const handleParticipantChange = (catIdx: number, pIdx: number, value: string) => {
    const newCats = [...categories];
    const newParticipants = [...newCats[catIdx].participants];
    newParticipants[pIdx] = value;
    newCats[catIdx].participants = newParticipants;
    setCategories(newCats);
  };

  const addParticipant = (catIdx: number) => {
    const newCats = [...categories];
    newCats[catIdx].participants.push('');
    setCategories(newCats);
  };

  const removeParticipant = (catIdx: number, pIdx: number) => {
    const newCats = [...categories];
    newCats[catIdx].participants.splice(pIdx, 1);
    setCategories(newCats);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/tournaments', {
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
            participants: cat.participants.filter(p => p.trim() !== '')
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

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

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
            <StepIndicator current={step} target={3} label="Participantes" />
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
                    <option>Front Tenis</option>
                    <option>Futbol</option>
                    <option>Padel</option>
                    <option>Pickleball</option>
                    <option>Racquetball</option>
                    <option>Squash</option>
                    <option>Tenis</option>
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
                    <button 
                      className="btn-primary" 
                      disabled={!description}
                      onClick={() => setShowRacquetModal(false)}
                      style={{ width: '100%', marginTop: '3rem', background: 'var(--primary)', color: '#000' }}
                    >
                      Confirmar Selección
                    </button>
                  </div>
                </div>
              )}
              <button className="btn-primary" onClick={nextStep} disabled={!name} style={{ width: '100%', marginTop: '3rem', padding: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
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
              <p style={{ opacity: 0.6, marginBottom: '2.5rem' }}>Define los grupos de competencia (ej: Rama Varonil, Sub-20, etc.)</p>
              
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
                <button className="btn-primary" onClick={nextStep} disabled={categories.length === 0} style={{ flex: 2 }}>Registrar Participantes</button>
              </div>
            </div>
          )}

          {/* STEP 3: PARTICIPANTS PER CATEGORY */}
          {step === 3 && (
            <div className="slideIn">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2.5rem' }}>
                <Users color="var(--primary)" size={28} /> Registro de Participantes
              </h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                {categories.map((cat, catIdx) => (
                  <div key={catIdx}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                      <h3 style={{ margin: 0 }}>{cat.name}</h3>
                      <button onClick={() => addParticipant(catIdx)} className="btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Plus size={14} /> Añadir
                      </button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      {cat.participants.map((p, pIdx) => (
                        <div key={pIdx} style={{ display: 'flex', gap: '8px' }}>
                          <input 
                            type="text" 
                            className="input-field" 
                            placeholder={`Participante ${pIdx + 1}`} 
                            value={p} 
                            onChange={(e) => handleParticipantChange(catIdx, pIdx, e.target.value)}
                          />
                          {cat.participants.length > 2 && (
                            <button onClick={() => removeParticipant(catIdx, pIdx)} style={{ background: 'none', border: 'none', color: 'rgba(255,75,43,0.5)', cursor: 'pointer' }}>
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '1.5rem', marginTop: '5rem' }}>
                <button className="btn-primary" onClick={prevStep} style={{ background: 'rgba(255,255,255,0.05)', flex: 1 }}>Atrás</button>
                <button 
                  className="btn-primary" 
                  onClick={handleSubmit} 
                  disabled={loading}
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
      {target < 3 && <ChevronRight size={16} style={{ marginLeft: '5px', opacity: 0.3 }} />}
    </div>
  );
};

export default TournamentCreation;
