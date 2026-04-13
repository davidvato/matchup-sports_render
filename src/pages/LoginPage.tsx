import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import bgImage from '../assets/login-bg.png';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaTask, setCaptchaTask] = useState({ a: 0, b: 0, result: 0 });
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    generateCaptcha();
  }, []);

  const generateCaptcha = () => {
    const a = Math.floor(Math.random() * 10) + 1;
    const b = Math.floor(Math.random() * 10) + 1;
    setCaptchaTask({ a, b, result: a + b });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (parseInt(captchaInput) !== captchaTask.result) {
      setError('Respuesta del Captcha incorrecta.');
      generateCaptcha();
      setCaptchaInput('');
      return;
    }

    const success = await login(username, password);
    if (success) {
      navigate('/create');
    } else {
      setError('Credenciales incorrectas o error de servidor.');
    }
  };

  return (
    <div style={{
      minHeight: '100vh', width: '100%',
      backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.8)), url(${bgImage})`,
      backgroundSize: 'cover', backgroundPosition: 'center',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      padding: '2rem'
    }}>
      <div className="glass-card fadeIn" style={{
        width: '100%', maxWidth: '450px', padding: '3rem',
        backgroundColor: 'rgba(18, 20, 27, 0.9)', backdropFilter: 'blur(15px)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            background: 'rgba(0, 242, 254, 0.1)', borderRadius: '50%',
            width: '80px', height: '80px', display: 'flex', alignItems: 'center',
            justifyContent: 'center', margin: '0 auto 1.5rem',
            border: '1px solid rgba(0, 242, 254, 0.2)'
          }}>
            <Lock color="#00f2fe" size={40} />
          </div>
          <h1 className="gradient-text" style={{ margin: 0, fontSize: '2.5rem' }}>
            MatchUp
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', marginTop: '0.5rem' }}>
            Inicia sesión para gestionar tus torneos
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>Usuario</label>
            <input
              type="text"
              className="input-field"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ejemplo: xxxxx"
              required
              style={{ backgroundColor: 'rgba(255,255,255,0.05)', height: '48px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>Contraseña</label>
            <input
              type="password"
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{ backgroundColor: 'rgba(255,255,255,0.05)', height: '48px' }}
            />
          </div>

          <div className="glass-card" style={{ padding: '1.2rem', textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.03)' }}>
            <p style={{ margin: '0 0 0.8rem', fontSize: '1.1rem', color: 'white' }}>
              Captcha: <strong>{captchaTask.a} + {captchaTask.b} = ?</strong>
            </p>
            <input
              type="number"
              className="input-field"
              value={captchaInput}
              onChange={(e) => setCaptchaInput(e.target.value)}
              placeholder="Resultado"
              required
              style={{ textAlign: 'center', fontSize: '1.2rem' }}
            />
          </div>

          {error && (
            <p style={{ 
              color: '#ff4b2b', 
              margin: 0, textAlign: 'center', fontSize: '0.9rem',
              backgroundColor: 'rgba(255,255,255,0.05)', padding: '0.8rem', borderRadius: '8px'
            }}>
              {error}
            </p>
          )}

          <button type="submit" className="btn-primary" style={{ width: '100%', height: '52px', fontSize: '1.1rem', marginTop: '0.5rem' }}>
            Iniciar Sesión
          </button>

          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '1rem' }}>
            <button 
              type="button" 
              onClick={() => navigate('/')}
              style={{ 
                background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', 
                cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '5px'
              }}
            >
              <ArrowLeft size={16} /> Volver al Inicio
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
