import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import '../auth-modern.css';

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

  const { loginUser, registerUser, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

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
      await registerUser(registerEmail, registerPassword, registerName);
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
          <form onSubmit={handleRegister}>
            <h1>Create Account</h1>
            <div className="social-icons">
              <a href="#" className="icon" onClick={(e) => { e.preventDefault(); handleGoogleAuth(); }}><i className="fa-brands fa-google-plus-g"></i></a>
              <a href="#" className="icon" onClick={(e) => e.preventDefault()}><i className="fa-brands fa-facebook-f"></i></a>
              <a href="#" className="icon" onClick={(e) => e.preventDefault()}><i className="fa-brands fa-github"></i></a>
              <a href="#" className="icon" onClick={(e) => e.preventDefault()}><i className="fa-brands fa-linkedin-in"></i></a>
            </div>
            <span>or use your email for registration</span>
            <input type="text" placeholder="Name" value={registerName} onChange={e => setRegisterName(e.target.value)} />
            <input type="email" placeholder="Email" value={registerEmail} onChange={e => setRegisterEmail(e.target.value)} />
            <input type="password" placeholder="Password" value={registerPassword} onChange={e => setRegisterPassword(e.target.value)} />
            <button type="submit" disabled={isRegistering}>
              {isRegistering ? 'Signing Up...' : 'Sign Up'}
            </button>
            {/* Mobile-only toggle button */}
            <button type="button" className="mobile-toggle" onClick={() => setIsRightPanelActive(false)}>
              Already have an account? Sign In
            </button>
          </form>
        </div>

        {/* Sign In Form */}
        <div className="modern-form-container sign-in">
          <form onSubmit={handleLogin}>
            <h1>Sign In</h1>
            <div className="social-icons">
              <a href="#" className="icon" onClick={(e) => { e.preventDefault(); handleGoogleAuth(); }}><i className="fa-brands fa-google-plus-g"></i></a>
              <a href="#" className="icon" onClick={(e) => e.preventDefault()}><i className="fa-brands fa-facebook-f"></i></a>
              <a href="#" className="icon" onClick={(e) => e.preventDefault()}><i className="fa-brands fa-github"></i></a>
              <a href="#" className="icon" onClick={(e) => e.preventDefault()}><i className="fa-brands fa-linkedin-in"></i></a>
            </div>
            <span>or use your email password</span>
            <input type="email" placeholder="Email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} />
            <input type="password" placeholder="Password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} />
            <Link to="/forgot-password">Forget Your Password?</Link>
            <button type="submit" disabled={isLoggingIn}>
              {isLoggingIn ? 'Signing In...' : 'Sign In'}
            </button>
            {/* Mobile-only toggle button */}
            <button type="button" className="mobile-toggle" onClick={() => setIsRightPanelActive(true)}>
              New here? Sign Up
            </button>
          </form>
        </div>

        {/* Desktop Toggle Panel */}
        <div className="modern-toggle-container">
          <div className="toggle">
            <div className="toggle-panel toggle-left">
              <h1>Welcome Back!</h1>
              <p>Enter your personal details to use all of site features</p>
              <button type="button" className="ghost-btn" onClick={() => setIsRightPanelActive(false)}>
                Sign In
              </button>
            </div>
            <div className="toggle-panel toggle-right">
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
