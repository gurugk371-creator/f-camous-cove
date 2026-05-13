/* ============================================================
   CampusVote — Frontend Client Logic
   Connected to Node.js Express API
   ============================================================ */

// Auto-detect API location: Use localhost for dev, relative path for production (Vercel/Render)
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5500/api' 
    : window.location.origin + '/api';

// ==================== CONSTANTS ====================
const COURSES = [
    { id: 'President', name: 'President', fullName: 'Student Council', icon: '👑', color: '#6366f1' },
    { id: 'Vice President', name: 'Vice President', fullName: 'Student Council', icon: '⭐', color: '#8b5cf6' },
    { id: 'Sports President', name: 'Sports President', fullName: 'Sports Council', icon: '🏆', color: '#06b6d4' },
    { id: 'Sports Vice President', name: 'Sports Vice President', fullName: 'Sports Council', icon: '🏅', color: '#10b981' },
    { id: 'Technical Head', name: 'Technical Head', fullName: 'Technical Council', icon: '⚙️', color: '#ec4899' },
    { id: 'Coding Club Lead', name: 'Coding Club Lead', fullName: 'Coding Club', icon: '💻', color: '#ef4444' },
    { id: 'Social Media Coordinator', name: 'Social Media Coordinator', fullName: 'Media & PR', icon: '📸', color: '#14b8a6' }
];

// ==================== STATE MANAGEMENT ====================
let currentUser = null;           // { name, email, mobile, rollNo, course, role }
let facultyToken = null;          // Used for auth headers
let selectedCandidateId = null;
let editingCandidate = null;      // { courseId, candidateId }
let activeResultsCourse = 'President';
let logoutTimer = null;

// Loaded data cache from server
let cachedCandidates = {};        // Loaded on student login/faculty views

// ==================== API HELPERS ====================

async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    
    // Attach auth header if faculty is logged in
    if (facultyToken) {
        options.headers = {
            ...options.headers,
            'Authorization': `Bearer ${facultyToken}`
        };
    }

    if (options.body && typeof options.body === 'object') {
        options.headers = {
            ...options.headers,
            'Content-Type': 'application/json'
        };
        options.body = JSON.stringify(options.body);
    }

    try {
        const response = await fetch(url, options);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || `HTTP Error ${response.status}`);
        }
        return data;
    } catch (error) {
        console.error(`API Error [${url}]:`, error);
        throw error;
    }
}

// ==================== INITIAL LOAD ====================
async function initAppData() {
    try {
        // Pre-fetch all candidates for initial load
        const data = await apiRequest('/candidates');
        cachedCandidates = data.candidates || {};
    } catch (error) {
        showToast('Unable to connect to server', 'error');
    }
}

// ==================== STUDENT LOGIN & VALIDATION ====================

document.getElementById('student-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    
    const name = document.getElementById('s-name').value.trim();
    const email = document.getElementById('s-email').value.trim();
    const mobile = document.getElementById('s-mobile').value.trim();
    const rollNo = document.getElementById('s-rollno').value.trim();
    const course = document.getElementById('s-course').value;

    if (!name || !email || !mobile || !rollNo || !course) {
        showToast('Please fill all fields!', 'error');
        return;
    }

    // Basic regex check first
    if (!/^[0-9]{10}$/.test(mobile)) return showToast('Valid 10-digit mobile required!', 'error');
    if (!/^[0-9]{8}$/.test(rollNo)) return showToast('Valid 8-digit roll number required!', 'error');

    const submitBtn = document.getElementById('student-login-btn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>Checking status...</span>';

    try {
        // 1. Server check if already voted
        const checkData = await apiRequest(`/vote/check?email=${encodeURIComponent(email)}&mobile=${mobile}&rollNo=${rollNo}`);
        
        if (checkData.hasVoted) {
            showToast('You have already voted! One person, one vote.', 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span>Proceed to Vote</span> <span class="btn-arrow">→</span>';
            return;
        }

        // 2. Set student session
        currentUser = { name, email, mobile, rollNo, course, role: 'student' };

        // Update UI Display
        document.getElementById('user-display-name').textContent = name;
        document.getElementById('user-avatar').textContent = getInitials(name);
        document.getElementById('course-badge').textContent = course;
        document.getElementById('voting-title').textContent = `${course} — Head Boy Election`;

        // 3. Refresh course candidates and go to vote view
        await fetchCourseCandidates(course);
        renderVotingCandidates(course);
        showView('voting-view');
        showToast(`Welcome, ${name}! 🎓`, 'success');

    } catch (err) {
        showToast(err.message || 'Error checking voter status.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>Proceed to Vote</span> <span class="btn-arrow">→</span>';
    }
});

async function fetchCourseCandidates(courseId) {
    try {
        const data = await apiRequest(`/candidates/${courseId}`);
        cachedCandidates[courseId] = data.candidates;
    } catch (err) {
        console.error('Failed to fetch live candidates', err);
    }
}

// ==================== CAST VOTE ====================

async function castVote() {
    if (!selectedCandidateId || !currentUser) return;

    const voteBtn = document.getElementById('btn-cast-vote');
    const originalText = voteBtn.innerHTML;
    voteBtn.disabled = true;
    voteBtn.textContent = 'Casting Secure Vote...';

    try {
        // Send vote record to secure API endpoint
        const result = await apiRequest('/vote', {
            method: 'POST',
            body: {
                name: currentUser.name,
                email: currentUser.email,
                mobile: currentUser.mobile,
                rollNo: currentUser.rollNo,
                course: currentUser.course,
                candidateId: selectedCandidateId
            }
        });

        document.getElementById('voted-for-name').textContent = result.votedFor;
        
        // Transitions
        showView('thankyou-view');
        launchConfetti();
        startAutoLogout();

    } catch (error) {
        showToast(error.message || 'Voting failed.', 'error');
        if (error.message.includes('already voted')) {
            doLogout();
        }
    } finally {
        voteBtn.disabled = false;
        voteBtn.innerHTML = originalText;
    }
}

// ==================== FACULTY AUTHENTICATION ====================

document.getElementById('faculty-form').addEventListener('submit', async function (e) {
    e.preventDefault();

    const name = document.getElementById('f-name').value.trim();
    const email = document.getElementById('f-email').value.trim();
    const empid = document.getElementById('f-empid').value.trim();

    if (!name || !email || !empid) {
        showToast('Please fill all fields!', 'error');
        return;
    }

    const loginBtn = document.getElementById('faculty-login-btn');
    loginBtn.disabled = true;
    loginBtn.textContent = 'Authenticating...';

    try {
        // Hit our new secure authentication endpoint
        const data = await apiRequest('/auth/faculty-login', {
            method: 'POST',
            body: { name, email, empid }
        });

        // Set token used for subsequent faculty requests
        facultyToken = data.token;
        currentUser = { ...data.faculty, role: 'faculty' };

        // Transition to results view
        populateResultsTabs();
        await loadAllResults(); // Fetches vote stats 
        showView('results-view');
        showToast(data.message, 'success');

    } catch (error) {
        showToast(error.message || 'Access Denied.', 'error');
    } finally {
        loginBtn.disabled = false;
        loginBtn.innerHTML = '<span>View Results Dashboard</span> <span class="btn-arrow">→</span>';
    }
});

// ==================== RESULTS DASHBOARD (FACULTY) ====================

let electionStats = { results: {}, totalVotes: 0, electionOpen: true };

async function loadAllResults() {
    try {
        const data = await apiRequest('/results');
        electionStats = data;
        renderCourseResults(activeResultsCourse);
    } catch (err) {
        showToast('Failed to load results', 'error');
        if (err.message.includes('Authorization')) doLogout();
    }
}

function populateResultsTabs() {
    const tabsContainer = document.getElementById('results-tabs');
    tabsContainer.innerHTML = '';

    COURSES.forEach(course => {
        const tab = document.createElement('button');
        tab.className = 'result-tab' + (course.id === activeResultsCourse ? ' active' : '');
        tab.textContent = course.icon + ' ' + course.name;
        tab.onclick = () => {
            document.querySelectorAll('.result-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            activeResultsCourse = course.id;
            renderCourseResults(course.id);
        };
        tabsContainer.appendChild(tab);
    });
}

function renderCourseResults(courseId) {
    const grid = document.getElementById('results-grid');
    grid.innerHTML = '';

    // Results come enriched from our API
    const candidates = electionStats.results[courseId] || [];
    
    let totalVotes = candidates.reduce((sum, c) => sum + c.votes, 0);
    let maxVotes = candidates.length > 0 ? candidates[0].votes : 0; // Sorted descending from API

    candidates.forEach((cand, idx) => {
        const percentage = totalVotes > 0 ? Math.round((cand.votes / totalVotes) * 100) : 0;
        const barWidth = maxVotes > 0 ? (cand.votes / maxVotes) * 100 : 0;
        const isLeader = cand.votes > 0 && idx === 0;

        const card = document.createElement('div');
        card.className = 'result-card';
        card.style.animation = `viewSlideIn 0.5s ${idx * 0.08}s cubic-bezier(0.16,1,0.3,1) both`;

        card.innerHTML = `
            ${isLeader ? '<div class="leader-badge">👑 Leading</div>' : ''}
            <div class="candidate-photo">
                <img src="${cand.photo}" alt="${cand.name}" 
                     onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(cand.name)}&background=7c3aed&color=fff&size=300&bold=true'">
            </div>
            <div class="candidate-name">${cand.name}</div>
            <div class="vote-count">
                ${cand.votes} <small>votes (${percentage}%)</small>
            </div>
            <div class="vote-bar-bg">
                <div class="vote-bar-fill" style="width: ${barWidth}%"></div>
            </div>
            <button class="btn-edit" onclick="openEditModal('${courseId}', '${cand.id}', '${cand.name.replace(/'/g, "\\'")}')">✏️ Edit</button>
        `;
        grid.appendChild(card);
    });

    animateCounters();
}

// ==================== MANAGE CANDIDATES (FACULTY) ====================

function openAddModal() {
    editingCandidate = { courseId: activeResultsCourse, candidateId: null };
    document.getElementById('modal-title').textContent = 'Add Candidate';
    document.getElementById('edit-name').value = '';
    document.getElementById('edit-photo-file').value = '';
    document.getElementById('photo-file-name').textContent = 'No file chosen';
    uploadedPhotoBase64 = null;

    document.getElementById('btn-delete-candidate').classList.add('hidden');
    document.getElementById('btn-save-candidate').textContent = 'Add Candidate';
    document.getElementById('edit-modal').classList.remove('hidden');
}

function openEditModal(courseId, candidateId, name) {
    editingCandidate = { courseId, candidateId };
    document.getElementById('modal-title').textContent = 'Edit Candidate';
    document.getElementById('edit-name').value = name;

    document.getElementById('edit-photo-file').value = '';
    document.getElementById('photo-file-name').textContent = 'Current photo kept (Upload new to change)';
    uploadedPhotoBase64 = null;

    document.getElementById('btn-delete-candidate').classList.remove('hidden');
    document.getElementById('btn-save-candidate').textContent = 'Save Changes';
    document.getElementById('edit-modal').classList.remove('hidden');
}

function closeEditModal() {
    document.getElementById('edit-modal').classList.add('hidden');
    editingCandidate = null;
}

let uploadedPhotoBase64 = null;
document.getElementById('edit-photo-file').addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check file size limit
    if (file.size > 3 * 1024 * 1024) { // 3MB
        showToast('Image is too large. Use smaller image (<3MB)', 'error');
        this.value = '';
        return;
    }
    
    document.getElementById('photo-file-name').textContent = file.name;
    const reader = new FileReader();
    reader.onload = (evt) => uploadedPhotoBase64 = evt.target.result;
    reader.readAsDataURL(file);
});

document.getElementById('edit-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    if (!editingCandidate) return;

    const newName = document.getElementById('edit-name').value.trim();
    if (!newName) return showToast('Name is required!', 'error');

    const saveBtn = document.getElementById('btn-save-candidate');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    const courseId = editingCandidate.courseId;
    const payload = { name: newName };
    if (uploadedPhotoBase64) payload.photo = uploadedPhotoBase64;

    try {
        if (editingCandidate.candidateId === null) {
            // ADD NEW API
            await apiRequest(`/candidates/${courseId}`, {
                method: 'POST',
                body: payload
            });
            showToast('Candidate added!', 'success');
        } else {
            // UPDATE API
            await apiRequest(`/candidates/${courseId}/${editingCandidate.candidateId}`, {
                method: 'PUT',
                body: payload
            });
            showToast('Candidate updated!', 'success');
        }
        
        closeEditModal();
        await loadAllResults(); // Refresh view
    } catch (error) {
        showToast(error.message || 'Failed to save candidate.', 'error');
    } finally {
        saveBtn.disabled = false;
    }
});

async function deleteCandidate() {
    if (!editingCandidate || !editingCandidate.candidateId) return;

    if (!confirm('Are you sure? This removes the candidate and ALL their votes forever.')) return;

    try {
        await apiRequest(`/candidates/${editingCandidate.courseId}/${editingCandidate.candidateId}`, {
            method: 'DELETE'
        });
        showToast('Candidate deleted successfully.', 'success');
        closeEditModal();
        await loadAllResults();
    } catch (err) {
        showToast(err.message || 'Failed to delete candidate', 'error');
    }
}

// ==================== RENDERING LOGIC (Voting View) ====================

function renderVotingCandidates(courseId) {
    const container = document.getElementById('candidates-container');
    container.innerHTML = '';
    selectedCandidateId = null;
    document.getElementById('vote-action-bar').classList.add('hidden');

    const candidates = cachedCandidates[courseId] || [];

    if (candidates.length === 0) {
        container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; opacity: 0.6; padding: 3rem;">No candidates found for this course yet.</div>';
        return;
    }

    candidates.forEach((cand, idx) => {
        const card = document.createElement('div');
        card.className = 'candidate-card';
        card.setAttribute('data-id', cand.id);
        card.style.animation = `viewSlideIn 0.5s ${idx * 0.1}s cubic-bezier(0.16,1,0.3,1) both`;

        card.innerHTML = `
            <div class="candidate-photo">
                <img src="${cand.photo}" alt="${cand.name}" 
                     onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(cand.name)}&background=7c3aed&color=fff&size=300&bold=true'">
            </div>
            <div class="candidate-name">${cand.name}</div>
            <div class="candidate-tag">Candidate #${idx + 1}</div>
        `;

        card.addEventListener('click', (e) => {
            document.querySelectorAll('.candidate-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            selectedCandidateId = cand.id;
            document.getElementById('selected-candidate-name').textContent = cand.name;
            document.getElementById('vote-action-bar').classList.remove('hidden');
            createInkRipple(e, card);
        });

        // 3D Tilt Card Hover Effect
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left, y = e.clientY - rect.top;
            card.style.setProperty('--mx', `${x}px`);
            card.style.setProperty('--my', `${y}px`);
            
            const centerX = rect.width / 2, centerY = rect.height / 2;
            const rotateX = ((y - centerY) / centerY) * -8;
            const rotateY = ((x - centerX) / centerX) * 8;
            card.style.transform = `translateY(-8px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        });
        card.addEventListener('mouseleave', () => { card.style.transform = ''; });

        container.appendChild(card);
    });
}

// ==================== CORE SYSTEM UTILITIES ====================

function showView(viewId) {
    const current = document.querySelector('.view.active');
    const target = document.getElementById(viewId);
    if (!target) return;

    if (current && current.id !== viewId) {
        current.classList.add('view-exit');
        setTimeout(() => {
            current.classList.remove('active', 'view-exit');
            target.classList.add('active');
        }, 200);
    } else {
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        target.classList.add('active');
    }
}

function switchRole(role) {
    document.querySelectorAll('.role-tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`[data-role="${role}"]`).classList.add('active');

    document.querySelectorAll('.login-form').forEach(f => f.classList.remove('active-form'));
    document.getElementById(role === 'student' ? 'student-form' : 'faculty-form').classList.add('active-form');
}

function doLogout() {
    clearInterval(logoutTimer);
    currentUser = null;
    facultyToken = null; // Wipe token
    selectedCandidateId = null;

    document.getElementById('student-form').reset();
    document.getElementById('faculty-form').reset();
    document.getElementById('vote-action-bar').classList.add('hidden');

    showView('login-view');
    showToast('Session ended.', 'success');
}

function showToast(msg, type = '') {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toast-msg');
    toast.className = 'toast ' + type;
    toastMsg.textContent = msg;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3500);
}

function getInitials(name) {
    const parts = name.trim().split(' ');
    return (parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]) : name.substring(0, 2)).toUpperCase();
}

function createInkRipple(e, element) {
    const rect = element.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'ink-ripple';
    const size = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
    ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
    element.appendChild(ripple);
    setTimeout(() => ripple.remove(), 700);
}

function startAutoLogout() {
    let countdown = 5;
    document.getElementById('logout-countdown').textContent = countdown;
    const bar = document.getElementById('logout-progress');
    bar.style.animation = 'none';
    bar.offsetHeight; 
    bar.style.animation = 'progressShrink 5s linear forwards';

    clearInterval(logoutTimer);
    logoutTimer = setInterval(() => {
        countdown--;
        document.getElementById('logout-countdown').textContent = countdown;
        if (countdown <= 0) { doLogout(); }
    }, 1000);
}

// ==================== UI EFFECTS & VIZ ====================

function launchConfetti() {
    const container = document.getElementById('confetti-container');
    container.innerHTML = '';
    const colors = ['#7c3aed', '#06b6d4', '#ec4899', '#f59e0b', '#10b981', '#6366f1', '#ef4444'];
    for (let i = 0; i < 80; i++) {
        const piece = document.createElement('div');
        piece.className = 'confetti-piece';
        piece.style.left = Math.random() * 100 + '%';
        piece.style.background = colors[Math.floor(Math.random() * colors.length)];
        piece.style.animationDuration = (Math.random() * 2 + 1.5) + 's';
        piece.style.width = (Math.random() * 8 + 6) + 'px';
        piece.style.height = (Math.random() * 10 + 8) + 'px';
        piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
        container.appendChild(piece);
    }
}

let mouseX = 0, mouseY = 0;
function initParticles() {
    const canvas = document.getElementById('particles-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let particles = [];
    function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
    resize(); window.addEventListener('resize', resize);
    document.addEventListener('mousemove', (e) => { mouseX = e.clientX; mouseY = e.clientY; });

    for (let i = 0; i < 35; i++) {
        particles.push({
            x: Math.random() * canvas.width, y: Math.random() * canvas.height,
            size: Math.random() * 2.5 + 0.5, speedX: (Math.random() - 0.5) * 0.3, speedY: (Math.random() - 0.5) * 0.3,
            opacity: Math.random() * 0.4 + 0.1
        });
    }
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
            p.x += p.speedX; p.y += p.speedY;
            if (p.x < 0 || p.x > canvas.width) p.speedX *= -1;
            if (p.y < 0 || p.y > canvas.height) p.speedY *= -1;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(124, 58, 237, ${p.opacity})`; ctx.fill();
        });
        requestAnimationFrame(animate);
    }
    animate();
}

function initBubbles() {
    const container = document.getElementById('bubbles-container');
    if (!container) return;
    for (let i = 0; i < 10; i++) {
        const bubble = document.createElement('div');
        bubble.className = 'bubble';
        const size = Math.random() * 25 + 10;
        bubble.style.width = bubble.style.height = size + 'px';
        bubble.style.left = Math.random() * 100 + '%';
        bubble.style.animationDuration = (Math.random() * 8 + 6) + 's';
        container.appendChild(bubble);
    }
}

function toggleTheme() {
    document.body.classList.toggle('light-mode');
    const isLight = document.body.classList.contains('light-mode');
    document.getElementById('theme-icon').textContent = isLight ? '☀️' : '🌙';
    localStorage.setItem('au-vote-theme', isLight ? 'light' : 'dark');
}

function loadSavedTheme() {
    if (localStorage.getItem('au-vote-theme') === 'light') {
        document.body.classList.add('light-mode');
        document.getElementById('theme-icon').textContent = '☀️';
    }
}

function typewriterEffect() {
    const el = document.getElementById('tagline-text');
    if (!el) return;
    const text = 'Your Voice. Your Leader. Your Campus.';
    let i = 0; el.textContent = '';
    function type() {
        if (i < text.length) { el.textContent += text.charAt(i++); setTimeout(type, 50); }
    }
    setTimeout(type, 600);
}

function animateCounters() {
    document.querySelectorAll('.vote-count').forEach(el => {
        const text = el.textContent.trim();
        const match = text.match(/^(\d+)/);
        if (!match || parseInt(match[1]) === 0) return;
        const target = parseInt(match[1]);
        const small = el.querySelector('small');
        const smallText = small ? small.innerHTML : '';
        let curr = 0;
        function count() {
            curr += Math.ceil(target / 20);
            if (curr >= target) { el.innerHTML = `${target} <small>${smallText}</small>`; return; }
            el.innerHTML = `${curr} <small>${smallText}</small>`;
            requestAnimationFrame(count);
        }
        count();
    });
}

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', async () => {
    loadSavedTheme();
    initParticles();
    typewriterEffect();
    
    if (window.requestIdleCallback) window.requestIdleCallback(() => initBubbles());
    else setTimeout(initBubbles, 300);

    // Get initial candidates list passively
    await initAppData();

    const mobileInput = document.getElementById('s-mobile');
    if (mobileInput) {
        mobileInput.addEventListener('input', function() {
            this.value = this.value.replace(/[^0-9]/g, '').slice(0, 10);
        });
    }
});
