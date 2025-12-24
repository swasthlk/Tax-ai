
import React, { useState } from 'react';
import { useAuth } from '../App';
import { ICONS } from '../constants';

type AuthView = 'signin' | 'signup' | 'forgot';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [view, setView] = useState<AuthView>('signin');
  const [isOfficial, setIsOfficial] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const getRegisteredUsers = () => {
    const users = localStorage.getItem('taxwatch_users');
    return users ? JSON.parse(users) : [];
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    const officialEmailRegex = /^off\.[a-zA-Z0-9._%+-]+@gmail\.com$/;
    const isValidEmail = isOfficial ? officialEmailRegex.test(email) : emailRegex.test(email);

    if (!isValidEmail) {
      setError(isOfficial ? 'Official Gmail must start with "off." and end with @gmail.com' : 'Citizen Gmail must end with @gmail.com');
      setLoading(false);
      return;
    }

    const users = getRegisteredUsers();

    if (view === 'signup') {
      const userExists = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
      if (userExists) {
        setError('This Gmail account is already registered. Please sign in instead.');
        setLoading(false);
        return;
      }

      if (isOfficial && password !== 'official.123') {
        setError('Official verification failed. Password must be "official.123" for demo purposes.');
        setLoading(false);
        return;
      }

      const newUser = {
        uid: Math.random().toString(36).substring(2, 9),
        email: email.toLowerCase(),
        password, // In production, hash this!
        role: isOfficial ? 'official' : 'citizen',
        displayName: email.split('@')[0],
        photoURL: '', // No default profile picture
        createdAt: new Date().toISOString()
      };

      const updatedUsers = [...users, newUser];
      localStorage.setItem('taxwatch_users', JSON.stringify(updatedUsers));
      setSuccess('Account created successfully! You can now sign in.');
      setView('signin');
      setLoading(false);
    } else if (view === 'signin') {
      // Find user matching both email AND password strictly
      const user = users.find((u: any) => 
        u.email.toLowerCase() === email.toLowerCase() && 
        u.password === password
      );
      
      if (!user) {
        setError('Invalid credentials. Please ensure your email and password are correct, or sign up if you haven\'t yet.');
        setLoading(false);
        return;
      }

      if (user.role !== (isOfficial ? 'official' : 'citizen')) {
        setError(`This account is registered as a ${user.role}. Please switch to the ${user.role} portal.`);
        setLoading(false);
        return;
      }

      setTimeout(() => {
        login(user);
        setLoading(false);
      }, 800);
    }
  };

  const handleForgot = (e: React.FormEvent) => {
    e.preventDefault();
    const users = getRegisteredUsers();
    const user = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      setError('No account found with this Gmail address.');
      return;
    }

    setSuccess(`Restoration successful! Your password is: ${user.password}. (Demo simulated restoration)`);
    setTimeout(() => {
      setView('signin');
      setPassword(user.password);
    }, 5000);
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 bg-gradient-to-br from-[#0a1929] to-[#132f4c]">
      <div className="w-full max-w-md glossy-card rounded-[24px] p-8 space-y-6 shadow-2xl relative overflow-hidden transition-all duration-500">
        
        {/* Animated Glows */}
        <div className={`absolute -top-10 -right-10 w-32 h-32 blur-3xl rounded-full opacity-20 transition-all duration-700 ${isOfficial ? 'bg-[#ff00aa]' : 'bg-[#00d4ff]'}`}></div>
        <div className={`absolute -bottom-10 -left-10 w-32 h-32 blur-3xl rounded-full opacity-10 transition-all duration-700 ${isOfficial ? 'bg-[#ff00aa]' : 'bg-[#00d4ff]'}`}></div>

        <div className="text-center relative z-10">
          <h2 className={`text-4xl font-extrabold tracking-tight transition-all duration-500 ${isOfficial ? 'text-[#ff00aa]' : 'text-[#00d4ff]'}`}>
            TaxWatch AI
          </h2>
          <p className="text-gray-400 mt-2 text-lg">
            {isOfficial ? 'Official Security Command' : 'Citizen Transparency Portal'}
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-3 p-3 bg-red-900/20 border border-red-500/50 rounded-xl text-red-200 text-sm animate-pulse">
            <ICONS.Alert />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-3 p-3 bg-green-900/20 border border-green-500/50 rounded-xl text-green-200 text-sm">
            <ICONS.Check />
            <span>{success}</span>
          </div>
        )}

        {view !== 'forgot' ? (
          <form onSubmit={handleAuth} className="space-y-4 relative z-10">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 ml-1">Gmail Account</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full px-4 py-3 bg-[#0a1929]/50 border border-gray-700 rounded-xl focus:ring-2 outline-none transition-all placeholder-gray-600 ${isOfficial ? 'focus:ring-[#ff00aa]' : 'focus:ring-[#00d4ff]'}`}
                placeholder={isOfficial ? "off.name@gmail.com" : "name@gmail.com"}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 ml-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full px-4 py-3 bg-[#0a1929]/50 border border-gray-700 rounded-xl focus:ring-2 outline-none transition-all placeholder-gray-600 ${isOfficial ? 'focus:ring-[#ff00aa]' : 'focus:ring-[#00d4ff]'}`}
                placeholder="••••••••"
              />
              {view === 'signin' && (
                <button 
                  type="button" 
                  onClick={() => setView('forgot')}
                  className="text-xs text-gray-500 hover:text-[#00d4ff] mt-2 ml-1"
                >
                  Forgot Password?
                </button>
              )}
            </div>

            <div className="pt-4 flex flex-col gap-3">
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 px-4 rounded-xl font-bold text-white transition-all transform active:scale-95 shadow-lg ${
                  loading ? 'bg-gray-700 cursor-not-allowed' : 
                  isOfficial ? 'bg-gradient-to-r from-[#ff00aa] to-[#cc0088] magenta-glow' : 'bg-gradient-to-r from-[#00d4ff] to-[#008fb3] cyan-glow'
                }`}
              >
                {loading ? 'Verifying Access...' : (view === 'signin' ? 'Login to Portal' : 'Register Secure Account')}
              </button>
              
              <div className="flex items-center gap-2 my-2 px-10">
                <div className="h-px flex-1 bg-gray-800"></div>
                <span className="text-[10px] text-gray-600 font-bold tracking-widest">AUTHENTICATION</span>
                <div className="h-px flex-1 bg-gray-800"></div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setView(view === 'signin' ? 'signup' : 'signin');
                  setError('');
                  setSuccess('');
                }}
                className="w-full py-3 px-4 rounded-xl font-bold text-gray-300 border border-gray-700 hover:bg-white/5 transition-all text-sm"
              >
                {view === 'signin' ? 'Create a New Account' : 'Already have an account? Sign In'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleForgot} className="space-y-4 animate-in fade-in relative z-10">
            <h3 className="text-xl font-bold text-white">Forgot Password?</h3>
            <p className="text-sm text-gray-400">Enter your unique Gmail account to recover your credentials.</p>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-[#0a1929]/50 border border-gray-700 rounded-xl focus:ring-2 focus:ring-[#00d4ff] outline-none"
              placeholder="your.email@gmail.com"
            />
            <button type="submit" className="w-full py-3 bg-[#00d4ff] text-white rounded-xl font-bold cyan-glow">
              Restore Account
            </button>
            <button type="button" onClick={() => setView('signin')} className="w-full text-xs text-gray-500 mt-2 hover:text-white transition-colors">
              Back to Login
            </button>
          </form>
        )}

        <div className="pt-6 mt-6 border-t border-gray-800 text-center relative z-10">
          <button 
            onClick={() => {
              setIsOfficial(!isOfficial);
              setError('');
              setSuccess('');
            }}
            className={`text-xs font-bold uppercase tracking-widest transition-colors ${isOfficial ? 'text-[#00d4ff]' : 'text-[#ff00aa]'}`}
          >
            {isOfficial ? '← Switch to Citizen Hub' : 'Open Official Portal →'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
