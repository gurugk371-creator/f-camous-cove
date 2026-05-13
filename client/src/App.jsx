import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import './index.css';

// ==================== CONSTANTS ====================
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5500/api'
  : window.location.origin + '/api';

const COURSES = [
  { id: 'President', name: 'President', fullName: 'Student Council', icon: '👑', color: '#6366f1' },
  { id: 'Vice President', name: 'Vice President', fullName: 'Student Council', icon: '⭐', color: '#8b5cf6' },
  { id: 'Sports President', name: 'Sports President', fullName: 'Sports Council', icon: '🏆', color: '#06b6d4' },
  { id: 'Sports Vice President', name: 'Sports Vice President', fullName: 'Sports Council', icon: '🏅', color: '#10b981' },
  { id: 'Technical Head', name: 'Technical Head', fullName: 'Technical Council', icon: '⚙️', color: '#ec4899' },
  { id: 'Coding Club Lead', name: 'Coding Club Lead', fullName: 'Coding Club', icon: '💻', color: '#ef4444' },
  { id: 'Social Media Coordinator', name: 'Social Media Coordinator', fullName: 'Media & PR', icon: '📸', color: '#14b8a6' }
];

const BUBBLES = Array.from({ length: 22 }, (_, i) => ({
  id: i,
  size: Math.random() * 25 + 20, // 20px to 45px
  left: Math.random() * 100,
  delay: Math.random() * 12,
  duration: 8 + Math.random() * 10
}));

function App() {
  // ==================== STATE ====================
  const [view, setView] = useState('login'); // 'login' | 'voting' | 'thankyou' | 'results'
  const [role, setRole] = useState('student'); // 'student' | 'faculty'
  const [theme, setTheme] = useState(localStorage.getItem('au-vote-theme') || 'dark');
  
  // Auth & Token
  const [currentUser, setCurrentUser] = useState(null);
  const [facultyToken, setFacultyToken] = useState(null);

  // Student Flow states
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [votedFor, setVotedFor] = useState('');
  const [logoutCountdown, setLogoutCountdown] = useState(5);

  // Faculty Dashboard states
  const [results, setResults] = useState({});
  const [activeResultsCourse, setActiveResultsCourse] = useState('President');
  const [showModal, setShowModal] = useState(false);
  const [editCandidateData, setEditCandidateData] = useState({ id: null, name: '', photo: null });
  
  // Election Timing & Auto Controls state
  const [electionConfigs, setElectionConfigs] = useState({});
  const [currentTime, setCurrentTime] = useState(new Date());

  // Toast state
  const [toast, setToast] = useState({ msg: '', type: '', visible: false });
  const toastTimeout = useRef(null);

  // Effect: Real-Time Direct Sync Engine
  useEffect(() => {
    const socketUrl = API_BASE.replace('/api', '');
    const socket = io(socketUrl, { 
      transports: ['websocket', 'polling'],
      reconnection: true
    });

    socket.on('connect', () => {
      console.log('⚡ Connected to Live Election Data Stream:', socket.id);
    });

    // Listen for real-time vote ticks
    socket.on('voteUpdate', (data) => {
      const { candidateId, votes, course } = data;
      console.log('🔔 Received real-time vote sync:', candidateId, votes);
      
      setResults(prevResults => {
        if (!prevResults || !prevResults[course]) return prevResults;
        
        const updatedList = prevResults[course].map(cand => {
          // Match against standard _id and normalized ID schemas
          if (cand.id === candidateId || cand._id === candidateId) {
            return { ...cand, votes: votes };
          }
          return cand;
        });

        // Keep sorting dynamically perfect
        updatedList.sort((a, b) => b.votes - a.votes);

        return {
          ...prevResults,
          [course]: updatedList
        };
      });

      // Also update the student-facing candidates array state if active
      setCandidates(prevCands => {
        if (!prevCands || prevCands.length === 0) return prevCands;
        return prevCands.map(cand => {
          if (cand.id === candidateId || cand._id === candidateId) {
            return { ...cand, votes: votes };
          }
          return cand;
        });
      });
    });

    // Listen for global clearing signals
    socket.on('votesReset', () => {
      console.log('♻️ Global tallies reset by Faculty.');
      setResults(prevResults => {
        if (!prevResults) return prevResults;
        const wiped = {};
        Object.keys(prevResults).forEach(course => {
          wiped[course] = prevResults[course].map(cand => ({ ...cand, votes: 0 }));
        });
        return wiped;
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Effect: Timing Clock & Config Synchronizer
  useEffect(() => {
    fetchConfigs();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    const fetchTimer = setInterval(fetchConfigs, 12000); // Keep syncing in real-time
    return () => {
      clearInterval(timer);
      clearInterval(fetchTimer);
    };
  }, []);

  const fetchConfigs = async () => {
    try {
      const url = `${API_BASE}/election/config`;
      const res = await fetch(url).then(r => r.json());
      if (res.success) {
        setElectionConfigs(res.configs);
      }
    } catch (err) {
      console.error('[CONFIG] Sync issue:', err);
    }
  };

  const getElectionStatus = (course) => {
    if (!course) return { status: 'OPEN', message: 'Voting Open', canVote: true };
    const config = electionConfigs[course];
    if (!config) return { status: 'OPEN', message: 'Voting Open', canVote: true };
    
    if (config.manuallyStopped) {
      return { status: 'STOPPED', message: 'Voting Closed (Admin Manual)', canVote: false };
    }
    if (!config.isActive) {
      return { status: 'INACTIVE', message: 'Election Inactive', canVote: false };
    }

    const now = currentTime;
    if (config.startTime && now < new Date(config.startTime)) {
      return { status: 'NOT_STARTED', message: 'Election Not Started Yet', canVote: false };
    }
    if (config.endTime && now > new Date(config.endTime)) {
      return { status: 'CLOSED', message: 'Voting Closed', canVote: false };
    }
    
    let countdownText = '';
    if (config.endTime) {
      const diffMs = new Date(config.endTime) - now;
      if (diffMs > 0) {
        const secs = Math.floor((diffMs / 1000) % 60);
        const mins = Math.floor((diffMs / 1000 / 60) % 60);
        const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const pad = n => String(n).padStart(2, '0');
        countdownText = `Voting Ends In: ${days > 0 ? days + 'd ' : ''}${pad(hours)}:${pad(mins)}:${pad(secs)}`;
      }
    }
    return { 
      status: 'OPEN', 
      message: countdownText || 'Voting Open', 
      canVote: true 
    };
  };

  const handleSaveConfig = async (updates) => {
    try {
      const current = electionConfigs[activeResultsCourse] || {};
      const payload = {
        startTime: updates.startTime !== undefined ? updates.startTime : current.startTime,
        endTime: updates.endTime !== undefined ? updates.endTime : current.endTime,
        isActive: updates.isActive !== undefined ? updates.isActive : (current.isActive !== undefined ? current.isActive : true),
        manuallyStopped: updates.manuallyStopped !== undefined ? updates.manuallyStopped : (current.manuallyStopped || false)
      };
      
      const res = await apiCall(`/election/config/${activeResultsCourse}`, {
        method: 'PUT',
        body: payload
      });

      if (res.success) {
        setElectionConfigs(prev => ({ ...prev, [activeResultsCourse]: res.config }));
        triggerToast('Election Config Updated!');
      }
    } catch (err) {
      triggerToast(err.message, 'error');
    }
  };

  // Effect: Theme handling
  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }
    localStorage.setItem('au-vote-theme', theme);
  }, [theme]);

  // API Wrapper Helper
  const apiCall = async (endpoint, options = {}) => {
    const url = `${API_BASE}${endpoint}`;
    const headers = { ...options.headers };
    
    if (facultyToken) {
      headers['Authorization'] = `Bearer ${facultyToken}`;
    }
    if (options.body && typeof options.body === 'object') {
      headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(options.body);
    }
    
    const response = await fetch(url, { ...options, headers });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'API Error');
    return data;
  };

  const triggerToast = (msg, type = 'success') => {
    setToast({ msg, type, visible: true });
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setToast(t => ({ ...t, visible: false })), 3500);
  };

  // Auto logout effect
  useEffect(() => {
    let interval = null;
    if (view === 'thankyou') {
      setLogoutCountdown(5);
      interval = setInterval(() => {
        setLogoutCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            handleLogout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [view]);

  const handleLogout = () => {
    setView('login');
    setCurrentUser(null);
    setFacultyToken(null);
    setSelectedCandidate(null);
    setCandidates([]);
    setResults({});
    triggerToast('Session ended.');
  };

  // ==================== SUBMIT HANDLERS ====================
  const handleStudentLogin = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const user = Object.fromEntries(formData);

    if (!/^[0-9]{10}$/.test(user.mobile)) return triggerToast('Valid 10-digit mobile required!', 'error');
    if (!/^[0-9]{8}$/.test(user.rollNo)) return triggerToast('Valid 8-digit roll number required!', 'error');

    try {
      const res = await apiCall(`/vote/check?email=${encodeURIComponent(user.email)}&mobile=${user.mobile}&rollNo=${user.rollNo}`);
      if (res.hasVoted) {
        return triggerToast('Already voted! One vote permitted per user.', 'error');
      }
      
      setCurrentUser({ ...user, role: 'student' });
      await fetchConfigs(); // Fetch latest timers before rendering layout
      const candRes = await apiCall(`/candidates/${user.course}`);
      setCandidates(candRes.candidates || []);
      setView('voting');
      triggerToast(`Welcome, ${user.name}! 🎓`);
    } catch (err) {
      triggerToast(err.message, 'error');
    }
  };

  const handleFacultyLogin = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const creds = Object.fromEntries(formData);

    try {
      const data = await apiCall('/auth/faculty-login', { method: 'POST', body: creds });
      setFacultyToken(data.token);
      setCurrentUser({ ...data.faculty, role: 'faculty' });
      
      // Fetch entire results set
      const statsRes = await apiCall('/results', { headers: { 'Authorization': `Bearer ${data.token}` } });
      setResults(statsRes.results || {});
      
      setView('results');
      triggerToast('Login Successful', 'success');
    } catch (err) {
      triggerToast(err.message || 'Faculty login failed', 'error');
    }
  };

  const handleCastVote = async () => {
    if (!selectedCandidate || !currentUser) return;
    try {
      const res = await apiCall('/vote', {
        method: 'POST',
        body: {
          ...currentUser,
          candidateId: selectedCandidate.id
        }
      });
      setVotedFor(selectedCandidate.name);
      setView('thankyou');
      triggerToast('Vote Recorded!', 'success');
    } catch (err) {
      triggerToast(err.message, 'error');
    }
  };

  const fetchAllResults = async () => {
    try {
      const statsRes = await apiCall('/results');
      setResults(statsRes.results || {});
    } catch (err) {
      triggerToast('Failed to sync results', 'error');
    }
  };

  // Modal Ops
  const handleSaveCandidate = async (e) => {
    e.preventDefault();
    try {
      const payload = { name: editCandidateData.name };
      if (editCandidateData.photo) payload.photo = editCandidateData.photo;

      if (!editCandidateData.id) {
        await apiCall(`/candidates/${activeResultsCourse}`, { method: 'POST', body: payload });
        triggerToast('Candidate added!');
      } else {
        await apiCall(`/candidates/${activeResultsCourse}/${editCandidateData.id}`, { method: 'PUT', body: payload });
        triggerToast('Candidate updated!');
      }
      setShowModal(false);
      fetchAllResults();
    } catch (err) {
      triggerToast(err.message, 'error');
    }
  };

  const handleDeleteCandidate = async () => {
    if (!window.confirm('Delete candidate and all votes forever?')) return;
    try {
      await apiCall(`/candidates/${activeResultsCourse}/${editCandidateData.id}`, { method: 'DELETE' });
      triggerToast('Candidate deleted.');
      setShowModal(false);
      fetchAllResults();
    } catch (err) {
      triggerToast(err.message, 'error');
    }
  };

  // File Conversion
  const handleFileRead = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) return triggerToast('Image too big (>3MB)', 'error');
    const reader = new FileReader();
    reader.onload = (ev) => setEditCandidateData(prev => ({ ...prev, photo: ev.target.result }));
    reader.readAsDataURL(file);
  };

  // ==================== VIEW RENDERS ====================
  return (
    <>
      {/* Global Visual Container */}
      <div className="bg-animated">
        <div className="bg-orb bg-orb-1"></div>
        <div className="bg-orb bg-orb-2"></div>
        <div className="bg-orb bg-orb-3"></div>
        <div className="bg-grid"></div>
      </div>

      <button className="theme-toggle" onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}>
        <span className="theme-icon">{theme === 'dark' ? '🌙' : '☀️'}</span>
      </button>

      <main id="app">
        {/* VIEW: LOGIN */}
        {view === 'login' && (
          <section className="view active" id="login-view" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {/* Full Page College Background */}
            <div className="college-bg">
              <img src="/college.jpg" alt="Amrapali University Campus" className="college-bg-img" />
              <div className="college-bg-overlay"></div>
            </div>

            <div className="vote-watermark">VOTE</div>

            <div className="bubbles-container">
              {BUBBLES.map(b => (
                <div 
                  key={b.id} 
                  className="bubble" 
                  style={{ 
                    width: `${b.size}px`, 
                    height: `${b.size}px`, 
                    left: `${b.left}%`, 
                    animationDelay: `${b.delay}s`, 
                    animationDuration: `${b.duration}s` 
                  }} 
                />
              ))}
            </div>
            
            <div className="login-wrapper">
              <div className="brand-header">
                <div className="brand-logo">
                  <span className="logo-icon pulse-glow">🗳️</span>
                  <h1>Amrapali University<span className="brand-accent"> Vote</span></h1>
                </div>
                <p className="brand-tagline">Your Voice. Your Leader. Your Campus.</p>
              </div>

              <div className="role-tabs">
                <button className={`role-tab ${role === 'student' ? 'active' : ''}`} onClick={() => setRole('student')}>
                  <span className="tab-icon">🎓</span> Student
                </button>
                <button className={`role-tab ${role === 'faculty' ? 'active' : ''}`} onClick={() => setRole('faculty')}>
                  <span className="tab-icon">👨‍🏫</span> Faculty
                </button>
              </div>

              {role === 'student' ? (
                <form className="login-form active-form" onSubmit={handleStudentLogin}>
                  <div className="form-grid">
                    <div className="input-group full-width">
                      <label>Full Name</label>
                      <input name="name" type="text" required placeholder="Enter full name" />
                    </div>
                    <div className="input-group">
                      <label>Gmail Address</label>
                      <input name="email" type="email" required placeholder="name@gmail.com" />
                    </div>
                    <div className="input-group">
                      <label>Mobile Number</label>
                      <input name="mobile" type="text" maxLength={10} required placeholder="10-digits" />
                    </div>
                    <div className="input-group">
                      <label>Roll Number</label>
                      <input name="rollNo" type="text" maxLength={8} required placeholder="8-digits" />
                    </div>
                    <div className="input-group full-width">
                      <label>SELECT ELECTION POSITION</label>
                      <select name="course" required>
                        <option value="">-- Choose Election Position --</option>
                        {COURSES.map(c => <option key={c.id} value={c.id}>{c.name} — {c.fullName}</option>)}
                      </select>
                    </div>
                  </div>
                  <button type="submit" className="btn-primary">
                    <span>Proceed to Vote</span> <span className="btn-arrow">→</span>
                  </button>
                </form>
              ) : (
                <form className="login-form active-form" onSubmit={handleFacultyLogin}>
                  <div className="form-grid">
                    <div className="input-group full-width">
                      <label>Full Name</label>
                      <input name="name" type="text" required placeholder="Enter full name" />
                    </div>
                    <div className="input-group">
                      <label>Gmail Address</label>
                      <input name="email" type="email" required placeholder="name@gmail.com" />
                    </div>
                    <div className="input-group">
                      <label>Employee ID</label>
                      <input name="empid" type="text" required placeholder="e.g. FAC-001" />
                    </div>
                  </div>
                  <button type="submit" className="btn-primary">
                    <span>View Dashboard</span> <span className="btn-arrow">→</span>
                  </button>
                </form>
              )}
            </div>
          </section>
        )}

        {/* VIEW: VOTING */}
        {view === 'voting' && (
          <section className="view active" id="voting-view">
            <div className="voting-wrapper">
              <div className="voting-header">
                <div className="voting-header-left">
                  <div className="course-badge">{currentUser?.course}</div>
                  <div>
                    <h2>Head Boy Election</h2>
                    <p className="voting-sub">Select a candidate and cast your vote</p>
                    <div style={{ 
                      marginTop: '10px', 
                      display: 'inline-flex', 
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 14px', 
                      borderRadius: '20px', 
                      background: getElectionStatus(currentUser?.course).canVote ? 'rgba(6, 182, 212, 0.12)' : 'rgba(239, 68, 68, 0.12)', 
                      border: '1px solid ' + (getElectionStatus(currentUser?.course).canVote ? 'rgba(6, 182, 212, 0.3)' : 'rgba(239, 68, 68, 0.3)'),
                      color: getElectionStatus(currentUser?.course).canVote ? 'var(--accent-cyan)' : 'var(--accent-red)',
                      fontSize: '0.85rem',
                      fontWeight: '700',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                    }}>
                      ⏱️ {getElectionStatus(currentUser?.course).message}
                    </div>
                  </div>
                </div>
                <div className="voting-header-right">
                  <div className="user-info">
                    <span className="user-avatar">{currentUser?.name.slice(0,2).toUpperCase()}</span>
                    <span>{currentUser?.name}</span>
                  </div>
                  <button className="btn-logout" onClick={handleLogout}>Logout</button>
                </div>
              </div>

              <div className="candidates-container">
                {candidates.length === 0 ? (
                  <div style={{ gridColumn: '1/-1', textAlign: 'center', opacity: 0.6 }}>No candidates initialized yet.</div>
                ) : (
                  candidates.map((cand, idx) => (
                    <div 
                      key={cand.id} 
                      className={`candidate-card ${selectedCandidate?.id === cand.id ? 'selected' : ''}`}
                      style={{
                        opacity: getElectionStatus(currentUser?.course).canVote ? 1 : 0.6,
                        pointerEvents: getElectionStatus(currentUser?.course).canVote ? 'auto' : 'none'
                      }}
                      onClick={() => getElectionStatus(currentUser?.course).canVote && setSelectedCandidate(cand)}
                    >
                      <div className="candidate-photo">
                        <img 
                          src={cand.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(cand.name)}&background=7c3aed&color=fff`} 
                          alt={cand.name} 
                        />
                      </div>
                      <div className="candidate-name">{cand.name}</div>
                      <div className="candidate-tag">Candidate #{idx + 1}</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {selectedCandidate && getElectionStatus(currentUser?.course).canVote && (
              <div className="vote-action-bar">
                <div className="selected-info">
                  <span>Selected: </span><strong>{selectedCandidate.name}</strong>
                </div>
                <button className="btn-vote" onClick={handleCastVote}>
                  <span className="vote-icon">🗳️</span> Cast My Vote
                </button>
              </div>
            )}
          </section>
        )}

        {/* VIEW: THANK YOU */}
        {view === 'thankyou' && (
          <section className="view active" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="thankyou-card">
              <div className="thankyou-content">
                <div className="success-checkmark">
                  <svg viewBox="0 0 52 52"><circle cx="26" cy="26" r="25" fill="none" stroke="#10b981" strokeWidth="2" /><path fill="none" stroke="#10b981" strokeWidth="3" d="M14.1 27.2l7.1 7.2 16.7-16.8" /></svg>
                </div>
                <h2>Thank You!</h2>
                <p>Vote successfully verified and recorded.</p>
                <div className="vote-receipt">You voted for <strong>{votedFor}</strong></div>
                <div className="auto-logout-bar"><div className="logout-progress"></div></div>
                <p className="logout-timer-text">Auto logout in {logoutCountdown}s</p>
              </div>
            </div>
          </section>
        )}

        {/* VIEW: RESULTS DASHBOARD */}
        {view === 'results' && (
          <section className="view active" id="results-view">
            <div className="results-wrapper">
              <div className="results-header">
                <div>
                  <h2>📊 Election Results Dashboard</h2>
                  <p>Real-time statistics across courses</p>
                </div>
                <div className="results-header-right">
                  <button className="btn-primary" style={{ margin: 0, padding: '0.5rem 1rem' }} onClick={() => {
                    setEditCandidateData({ id: null, name: '', photo: null });
                    setShowModal(true);
                  }}>+ Add</button>
                  <span className="faculty-badge">Admin</span>
                  <button className="btn-logout" onClick={handleLogout}>Logout</button>
                </div>
              </div>

              <div className="results-tabs">
                {COURSES.map(c => (
                  <button 
                    key={c.id}
                    className={`result-tab ${activeResultsCourse === c.id ? 'active' : ''}`}
                    onClick={() => setActiveResultsCourse(c.id)}
                  >
                    {c.icon} {c.name}
                  </button>
                ))}
              </div>

              {/* Faculty Election Timer Configuration Control Board */}
              <div style={{ 
                background: 'var(--bg-card)', 
                border: '1px solid var(--glass-border)', 
                borderRadius: 'var(--radius-md)', 
                padding: '1.25rem', 
                marginBottom: '1.5rem', 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
                gap: '1rem', 
                alignItems: 'end',
                backdropFilter: 'blur(20px)',
                boxShadow: 'var(--shadow-lg)'
              }}>
                <div style={{ gridColumn: '1 / -1', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.6rem', marginBottom: '0.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    ⏱️ {activeResultsCourse} Election Timer Controls
                  </h3>
                  <span style={{ 
                    fontSize: '0.8rem', 
                    background: getElectionStatus(activeResultsCourse).canVote ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)', 
                    color: getElectionStatus(activeResultsCourse).canVote ? 'var(--accent-green)' : 'var(--accent-red)', 
                    padding: '4px 12px', 
                    borderRadius: '20px', 
                    fontWeight: 700,
                    border: `1px solid ${getElectionStatus(activeResultsCourse).canVote ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                  }}>
                    {getElectionStatus(activeResultsCourse).status === 'OPEN' ? '🟢 LIVE' : `🔴 ${getElectionStatus(activeResultsCourse).status}`}
                  </span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Set Start Date & Time</label>
                  <input 
                    type="datetime-local" 
                    style={{ 
                      padding: '0.65rem', 
                      background: 'rgba(0,0,0,0.25)', 
                      border: '1px solid var(--glass-border)', 
                      color: '#fff', 
                      borderRadius: '8px',
                      fontFamily: 'inherit',
                      fontSize: '0.9rem',
                      outline: 'none'
                    }} 
                    value={electionConfigs[activeResultsCourse]?.startTime ? new Date(new Date(electionConfigs[activeResultsCourse].startTime).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
                    onChange={(e) => handleSaveConfig({ startTime: e.target.value })}
                  />
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Set End Date & Time</label>
                  <input 
                    type="datetime-local" 
                    style={{ 
                      padding: '0.65rem', 
                      background: 'rgba(0,0,0,0.25)', 
                      border: '1px solid var(--glass-border)', 
                      color: '#fff', 
                      borderRadius: '8px',
                      fontFamily: 'inherit',
                      fontSize: '0.9rem',
                      outline: 'none'
                    }} 
                    value={electionConfigs[activeResultsCourse]?.endTime ? new Date(new Date(electionConfigs[activeResultsCourse].endTime).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
                    onChange={(e) => handleSaveConfig({ endTime: e.target.value })}
                  />
                </div>
                
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button 
                    className="btn-secondary" 
                    style={{ 
                      flex: 1, 
                      padding: '0.75rem', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      gap: '5px',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                    onClick={() => handleSaveConfig({ manuallyStopped: false, isActive: true })}
                  >
                    ▶️ Start Manual
                  </button>
                  
                  <button 
                    className="btn-secondary" 
                    style={{ 
                      flex: 1, 
                      padding: '0.75rem', 
                      background: 'rgba(239, 68, 68, 0.1)', 
                      color: 'var(--accent-red)', 
                      border: '1px solid var(--accent-red)',
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      gap: '5px',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                    onClick={() => handleSaveConfig({ manuallyStopped: true })}
                  >
                    🛑 Stop Manual
                  </button>
                </div>
              </div>

              <div className="results-grid">
                {(results[activeResultsCourse] || []).length === 0 && <div style={{ textAlign: 'center', gridColumn: '1/-1', opacity: 0.5 }}>No candidates in this course.</div>}
                {(results[activeResultsCourse] || []).map((item, idx, arr) => {
                  const totalVotes = arr.reduce((a, b) => a + b.votes, 0);
                  const percent = totalVotes > 0 ? Math.round((item.votes / totalVotes) * 100) : 0;
                  const maxVotes = Math.max(...arr.map(x => x.votes));
                  const bar = maxVotes > 0 ? (item.votes / maxVotes) * 100 : 0;
                  
                  return (
                    <div className="result-card" key={item.id}>
                      {idx === 0 && item.votes > 0 && <div className="leader-badge">👑 Leading</div>}
                      <div className="candidate-photo">
                        <img src={item.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&background=7c3aed&color=fff`} alt={item.name} />
                      </div>
                      <div className="candidate-name">{item.name}</div>
                      <div className="vote-count">{item.votes} <small>({percent}%)</small></div>
                      <div className="vote-bar-bg"><div className="vote-bar-fill" style={{ width: `${bar}%` }}></div></div>
                      <button className="btn-edit" onClick={() => {
                        setEditCandidateData({ id: item.id, name: item.name, photo: null });
                        setShowModal(true);
                      }}>✏️ Edit</button>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* FACULTY EDIT MODAL */}
        {showModal && (
          <div className="modal-overlay">
            <div className="modal-card">
              <h3>{editCandidateData.id ? 'Edit Candidate' : 'Add Candidate'}</h3>
              <form onSubmit={handleSaveCandidate}>
                <div className="input-group" style={{ marginBottom: '1rem' }}>
                  <label>Name</label>
                  <input 
                    type="text" 
                    value={editCandidateData.name}
                    onChange={e => setEditCandidateData(p => ({ ...p, name: e.target.value }))}
                    required 
                  />
                </div>
                <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                  <label>Photo</label>
                  <input type="file" accept="image/*" onChange={handleFileRead} />
                </div>
                <div className="modal-actions">
                  {editCandidateData.id && (
                    <button type="button" className="btn-secondary" style={{ background: '#431414', color: '#ef4444' }} onClick={handleDeleteCandidate}>
                      🗑️ Delete
                    </button>
                  )}
                  <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn-primary" style={{ margin: 0 }}>Save</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* TOAST NOTIFICATION */}
        <div className={`toast ${toast.type} ${!toast.visible ? 'hidden' : ''}`}>
          <span>{toast.msg}</span>
        </div>

      </main>
    </>
  );
}

export default App;
