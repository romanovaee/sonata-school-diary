const USERKEY = 'sonataSchoolUser';

function currentUser() {
    try { return JSON.parse(localStorage.getItem(USERKEY)); } catch (e) { return null; }
}
function setUser(u) { localStorage.setItem(USERKEY, JSON.stringify(u)); }
function logout() { localStorage.removeItem(USERKEY); location.href = 'index.html'; }
function esc(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;','<': '&lt;','>': '&gt;','"': '&quot;',"'": '&#39;'}[c])); }

function initHeader() {
    const u = currentUser(), login = document.getElementById('headerLogin'), profile = document.getElementById('headerProfile');
    if (u && login) {
        login.textContent = 'Выйти';
        login.href = '#';
        login.onclick = e => { e.preventDefault(); logout(); };
    }
    if (profile) profile.style.display = u ? '' : 'none';
}

document.addEventListener('DOMContentLoaded', () => {
    initHeader();

    const loginForm = document.getElementById('loginForm');
    if (loginForm) loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value.trim().toLowerCase();
        const password = document.getElementById('password').value;
        
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await response.json();

            if (!response.ok) {
                alert(data.error || 'Ошибка входа');
                return;
            }

            setUser(data);
            location.href = (data.role === 'admin' || data.role === 'teacher') ? 'admin.html' : 'profile.html';
            
        } catch (err) {
            alert('Сервер не отвечает. Убедитесь, что node server.js запущен.');
        }
    });

    const regForm = document.getElementById('registerForm');
    if (regForm) regForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('fullName').value.trim();
        const email = document.getElementById('regEmail').value.trim().toLowerCase();
        const password = document.getElementById('regPassword').value;
        const instrument = document.getElementById('instrument').value.trim();

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, instrument })
            });
            const data = await response.json();

            if (!response.ok) {
                alert(data.error || 'Ошибка регистрации');
                return;
            }

            alert('Аккаунт создан! Теперь войдите.');
            location.href = 'login.html';

        } catch (err) {
            alert('Сервер не отвечает. Убедитесь, что node server.js запущен.');
        }
    });

    renderPage();
});

function renderPage() {
    const u = currentUser();

    if (document.getElementById('scheduleRows')) {
        fetch('/api/schedule').then(r => r.json()).then(rows => {
            document.getElementById('scheduleRows').innerHTML = rows.map(x => `<tr><td>${esc(x.day)}</td><td>${esc(x.time)}</td><td>${esc(x.subject)}</td><td>${esc(x.teacher)}</td><td>${esc(x.room)}</td></tr>`).join('');
        });
    }

    if (document.getElementById('attendanceRows')) {
        fetch('/api/attendance').then(r => r.json()).then(rows => {
            document.getElementById('attendanceRows').innerHTML = rows.map(x => `<tr><td>${esc(x.date)}</td><td>${esc(x.subject)}</td><td>${esc(x.teacher)}</td><td><span class="status ${x.status === 'Присутствовал' ? 'good' : x.status === 'Опоздал' ? 'warn' : 'bad'}">${esc(x.status)}</span></td><td>${esc(x.comment)}</td></tr>`).join('');
        });
    }

    if (document.getElementById('assignmentList')) {
        fetch('/api/assignments').then(r => r.json()).then(rows => {
            document.getElementById('assignmentList').innerHTML = rows.map(x => `<article class="panel panel-pad"><div class="eyebrow">${esc(x.subject)} · до ${esc(x.due)}</div><h3 class="panel-title" style="margin-top:9px">${esc(x.title)}</h3><p class="muted small">${esc(x.description)}</p></article>`).join('');
        });
    }

    if (document.getElementById('gradeRows')) {
        fetch('/api/grades').then(r => r.json()).then(rows => {
            document.getElementById('gradeRows').innerHTML = rows.map(x => `<tr><td>${esc(x.date)}</td><td>${esc(x.subject)}</td><td>${esc(x.work)}</td><td><strong>${esc(x.grade)}</strong></td><td>${esc(x.comment)}</td></tr>`).join('');
        });
    }

    if (document.getElementById('profileContent')) {
        const el = document.getElementById('profileContent');
        if (!u) el.innerHTML = '<div class="empty">Войдите в систему.</div>';
        else el.innerHTML = `<div class="profile-grid"><aside class="profile-card"><div class="avatar">${esc(u.name.split(' ').map(x => x[0]).slice(0, 2).join(''))}</div><h2>${esc(u.name)}</h2><div class="profile-meta">${u.role === 'admin' ? 'Администратор' : 'Ученик'}</div></aside><section class="panel panel-pad"><h2 class="panel-title">Личные данные</h2><p>Почта: <strong>${esc(u.email)}</strong></p></section></div>`;
    }
}