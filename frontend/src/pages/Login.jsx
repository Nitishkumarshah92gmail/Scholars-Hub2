import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FcGoogle } from 'react-icons/fc';
import { FaFacebookF, FaGithub, FaLinkedinIn, FaUser, FaLock, FaEnvelope } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import '../auth-modern.css';
import logoImg from '../assets/scholars-circle-logo.png';

export default function Login() {
  const [isRightPanelActive, setIsRightPanelActive] = useState(false);
  
  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  // Register State
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const { loginUser, registerUser, loginWithGoogle, authError, clearAuthError } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (authError) {
      toast.error(authError);
      clearAuthError();
    }
  }, [authError, clearAuthError]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) return toast.error('Please fill in all fields.');
    setIsLoggingIn(true);
    try {
      await loginUser(loginEmail, loginPassword);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      const msg = err.message || 'Login failed.';
      toast.error(msg);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!registerName || !registerEmail || !registerPassword) return toast.error('Please fill in all fields.');
    setIsRegistering(true);
    try {
      await registerUser({ name: registerName, email: registerEmail, password: registerPassword });
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (err) {
      const msg = err.message || 'Registration failed.';
      toast.error(msg);
    } finally {
      setIsRegistering(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      await loginWithGoogle();
    } catch (err) {
      toast.error(err.message || 'Google auth failed.');
    }
  };

  return (
    <div className="auth-modern-wrapper">
      <div className={`modern-container ${isRightPanelActive ? 'active' : ''}`} id="container">
        
        {/* Sign Up Form */}
        <div className="modern-form-container sign-up">
          <div className="mobile-top-header">
            <img src={logoImg} alt="Scholars Hub Logo" className="auth-logo" />
            <h1>Hello, Friend!</h1>
            <p>Already have an account?</p>
            <button type="button" className="ghost-btn" onClick={() => setIsRightPanelActive(false)}>Login</button>
          </div>
          <form onSubmit={handleRegister}>
            <h1>Register</h1>
            <div className="input-container">
              <input type="text" placeholder="Name" value={registerName} onChange={e => setRegisterName(e.target.value)} />
              <FaUser className="input-icon" />
            </div>
            <div className="input-container">
              <input type="email" placeholder="Email" value={registerEmail} onChange={e => setRegisterEmail(e.target.value)} />
              <FaEnvelope className="input-icon" />
            </div>
            <div className="input-container">
              <input type="password" placeholder="Password" value={registerPassword} onChange={e => setRegisterPassword(e.target.value)} />
              <FaLock className="input-icon" />
            </div>
            <button type="submit" disabled={isRegistering} className="submit-btn">
              {isRegistering ? 'Signing Up...' : 'Register'}
            </button>
            <span className="social-text">or register with social platforms</span>
            <button type="button" className="google-btn" onClick={handleGoogleAuth}>
              <FcGoogle size={22} />
              <span>Continue with Google</span>
            </button>
          </form>
        </div>

        {/* Sign In Form */}
        <div className="modern-form-container sign-in">
          <div className="mobile-top-header">
            <img src={logoImg} alt="Scholars Hub Logo" className="auth-logo" />
            <h1>Hello, Welcome!</h1>
            <p>Don't have an account?</p>
            <button type="button" className="ghost-btn" onClick={() => setIsRightPanelActive(true)}>Register</button>
          </div>
          <form onSubmit={handleLogin}>
            <h1>Login</h1>
            <div className="input-container">
              <input type="email" placeholder="Username" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} />
              <FaUser className="input-icon" />
            </div>
            <div className="input-container">
              <input type="password" placeholder="Password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} />
              <FaLock className="input-icon" />
            </div>
            <Link to="/forgot-password" className="forgot-password">Forgot Password?</Link>
            <button type="submit" disabled={isLoggingIn} className="submit-btn">
              {isLoggingIn ? 'Logging In...' : 'Login'}
            </button>
            <span className="social-text">or login with social platforms</span>
            <button type="button" className="google-btn" onClick={handleGoogleAuth}>
              <FcGoogle size={22} />
              <span>Continue with Google</span>
            </button>
          </form>
        </div>

        {/* Desktop Toggle Panel */}
        <div className="modern-toggle-container">
          <div className="toggle">
            <div className="toggle-panel toggle-left">
              <img src={logoImg} alt="Scholars Hub Logo" className="auth-logo" />
              <h1>Welcome Back!</h1>
              <p>Enter your personal details to use all of site features</p>
              <button type="button" className="ghost-btn" onClick={() => setIsRightPanelActive(false)}>
                Sign In
              </button>
            </div>
            <div className="toggle-panel toggle-right">
              <img src={logoImg} alt="Scholars Hub Logo" className="auth-logo" />
              <h1>Hello, Friend!</h1>
              <p>Register with your personal details to use all of site features</p>
              <button type="button" className="ghost-btn" onClick={() => setIsRightPanelActive(true)}>
                Sign Up
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
