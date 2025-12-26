
import React, { useState } from 'react';
import { useAuth } from '../App';
import { ICONS } from '../constants';

type AuthView = 'signin' | 'signup' | 'forgot_find' | 'forgot_verify' | 'forgot_reset';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [forgotUsername, setForgotUsername] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [view, setView] = useState<AuthView>('signin');
  const [isOfficial, setIsOfficial] = useState(false);
  const [loading, setLoading] = useState(false);
  const [foundUser, setFoundUser] = useState<any>(null);
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

    const users = getRegisteredUsers();

    if (view === 'signup') {
      if (!isValidEmail) {
        setError(isOfficial ? 'Official Gmail must start with "off." and end with @gmail.com' : 'Citizen Gmail must end with @gmail.com');
        setLoading(false);
        return;
      }
      if (!username || username.length < 3) {
        setError('Username must be at least 3 characters.');
        setLoading(false);
        return;
      }
      
      const userExists = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
      const usernameExists = users.find((u: any) => u.username?.toLowerCase() === username.toLowerCase());
      
      if (userExists) {
        setError('This Gmail account is already registered.');
        setLoading(false);
        return;
      }
      if (usernameExists) {
        setError('This username is already taken.');
        setLoading(false);
        return;
      }

      if (isOfficial && password !== 'official.123') {
        setError('Official verification failed. Use password "official.123".');
        setLoading(false);
        return;
      }

      const newUser = {
        uid: 'U' + Math.random().toString(36).substring(2, 9).toUpperCase(),
        email: email.toLowerCase(),
        password, 
        username: username.toLowerCase(),
        role: isOfficial ? 'official' : 'citizen',
        displayName: username,
        photoURL: '', 
        createdAt: new Date().toISOString(),
        taxPaid: isOfficial ? 0 : Math.floor(Math.random() * 200000) + 50000,
        isPrivate: false,
        tourCompleted: false
      };

      localStorage.setItem('taxwatch_users', JSON.stringify([...users, newUser]));
      setSuccess('Account created! Authenticating...');
      setTimeout(() => {
        login(newUser);
        setLoading(false);
      }, 1000);
    } else if (view === 'signin') {
      const user = users.find((u: any) => 
        u.email.toLowerCase() === email.toLowerCase() && 
        u.password === password
      );
      
      if (!user) {
        setError('Invalid credentials.');
        setLoading(false);
        return;
      }

      if (user.role !== (isOfficial ? 'official' : 'citizen')) {
        setError(`Access denied: Mismatch portal.`);
        setLoading(false);
        return;
      }

      login(user);
      setLoading(false);
    }
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const users = getRegisteredUsers();

    if (view === 'forgot_find') {
      const user = users.find((u: any) => u.username.toLowerCase() === forgotUsername.toLowerCase());
      if (!user) {
        setError('Username not found in national registry.');
        return;
      }
      setFoundUser(user);
      setSuccess(`Code transmitted to ${user.email}`);
      setView('forgot_verify');
    } else if (view === 'forgot_verify') {
      if (verificationCode === '123456') { // Mock verification code
        setView('forgot_reset');
      } else {
        setError('Invalid verification code.');
      }
    } else if (view === 'forgot_reset') {
      const updatedUsers = users.map((u: any) => 
        u.username.toLowerCase() === foundUser.username.toLowerCase() ? { ...u, password: newPassword } : u
      );
      localStorage.setItem('taxwatch_users', JSON.stringify(updatedUsers));
      setSuccess('Credentials reset successfully. Protocol updated.');
      setTimeout(() => {
        setView('signin');
        setFoundUser(null);
        setForgotUsername('');
        setVerificationCode('');
      }, 1500);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 bg-[#030812]">
      <div className="w-full max-w-md glossy-card rounded-[32px] p-10 space-y-8 shadow-2xl relative overflow-hidden">
        <div className="text-center relative z-10">
          <h2 className={`text-4xl font-black tracking-tighter ${isOfficial ? 'text-[#ff00aa]' : 'text-[#00d4ff]'}`}>TaxWatch AI</h2>
          <p className="text-gray-500 mt-2 font-medium uppercase tracking-widest text-xs">{isOfficial ? 'Command Hub' : 'Citizen Portal'}</p>
        </div>

        {error && <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-xs font-bold text-center animate-shake">{error}</div>}
        {success && <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-2xl text-green-400 text-xs font-bold text-center">{success}</div>}

        {view === 'signin' || view === 'signup' ? (
          <form onSubmit={handleAuth} className="space-y-5">
            {view === 'signup' && (
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">Username</label>
                <input type="text" required value={username} onChange={e => setUsername(e.target.value)} className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-[#00d4ff] outline-none text-white text-sm" placeholder="Unique identifier" />
              </div>
            )}
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">Gmail</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-[#00d4ff] outline-none text-white text-sm" placeholder="email@gmail.com" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">Security Key</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-[#00d4ff] outline-none text-white text-sm" placeholder="••••••••" />
            </div>

            <button type="submit" disabled={loading} className={`w-full py-5 rounded-2xl font-bold text-white transition-all transform active:scale-95 shadow-xl ${isOfficial ? 'bg-[#ff00aa]' : 'bg-[#00d4ff] text-black'}`}>
              {loading ? 'Processing...' : (view === 'signin' ? 'Login' : 'Initialize Account')}
            </button>
            
            <div className="flex flex-col gap-3 items-center">
              <button type="button" onClick={() => setView(view === 'signin' ? 'signup' : 'signin')} className="text-xs font-bold text-gray-500 hover:text-white transition-colors uppercase tracking-widest">
                {view === 'signin' ? 'Need an identity? Sign Up' : 'Already have one? Sign In'}
              </button>
              {view === 'signin' && (
                <button type="button" onClick={() => setView('forgot_find')} className="text-[10px] font-bold text-gray-600 hover:text-white transition-colors uppercase tracking-widest">
                  Forgotten Security Key?
                </button>
              )}
            </div>
          </form>
        ) : (
          <form onSubmit={handleForgotPassword} className="space-y-5">
            <h3 className="text-white font-bold text-center uppercase tracking-widest text-sm">Recovery Protocol</h3>
            {view === 'forgot_find' && (
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">Username</label>
                <input type="text" required value={forgotUsername} onChange={e => setForgotUsername(e.target.value)} className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-[#00d4ff] outline-none text-white text-sm" placeholder="Enter your username" />
                <button type="submit" className="w-full py-5 bg-[#00d4ff] text-black rounded-2xl font-black mt-4">Find User</button>
              </div>
            )}
            {view === 'forgot_verify' && (
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">Verification Code</label>
                <input type="text" required value={verificationCode} onChange={e => setVerificationCode(e.target.value)} className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-[#00d4ff] outline-none text-white text-sm" placeholder="Enter 6-digit code (use 123456)" />
                <button type="submit" className="w-full py-5 bg-[#00d4ff] text-black rounded-2xl font-black mt-4">Verify Identity</button>
              </div>
            )}
            {view === 'forgot_reset' && (
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">New Security Key</label>
                <input type="password" required value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-[#00d4ff] outline-none text-white text-sm" placeholder="New Password" />
                <button type="submit" className="w-full py-5 bg-[#00d4ff] text-black rounded-2xl font-black mt-4">Reset Credentials</button>
              </div>
            )}
            <button type="button" onClick={() => setView('signin')} className="w-full text-[10px] font-bold text-gray-600 hover:text-white uppercase">Abort Recovery</button>
          </form>
        )}

        <div className="pt-6 border-t border-white/5 text-center">
          <button onClick={() => { setIsOfficial(!isOfficial); setView('signin'); setError(''); setSuccess(''); }} className={`text-[10px] font-black uppercase tracking-widest ${isOfficial ? 'text-[#00d4ff]' : 'text-[#ff00aa]'}`}>
            {isOfficial ? 'Switch to Citizen Access' : 'Switch to Official Command'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
