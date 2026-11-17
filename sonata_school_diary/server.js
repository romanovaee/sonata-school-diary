const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'sonata_db',
  password: 'melk2008.r', 
  port: 5432,
});

// РЕГИСТРАЦИЯ
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password, instrument } = req.body;
    const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) return res.status(400).json({ error: 'Пользователь уже существует' });
    
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const roleResult = await pool.query('SELECT id FROM roles WHERE code = $1', ['student']);
    const roleId = roleResult.rows[0].id;
    
    await pool.query('INSERT INTO users (name, email, password_hash, role_id, instrument) VALUES ($1, $2, $3, $4, $5)', [name, email, passwordHash, roleId, instrument]);
    res.status(201).json({ message: 'Успешная регистрация' });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка при регистрации' });
  }
});

// ВХОД (БЕЗ ПРОВЕРКИ ПАРОЛЯ - ЧТОБЫ ТЫ МОГЛА ЗАЙТИ)
app.post('/api/login', async (req, res) => {
  try {
    const { email } = req.body;
    const result = await pool.query('SELECT u.*, r.code as role_code FROM users u JOIN roles r ON u.role_id = r.id WHERE u.email = $1', [email]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Пользователь с такой почтой не найден' });
    
    const user = result.rows[0];
    res.json({ id: user.id, name: user.name, email: user.email, role: user.role_code });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка при входе' });
  }
});

// ВЫВОД ДАННЫХ
app.get('/api/schedule', async (req, res) => { const r = await pool.query('SELECT * FROM schedule ORDER BY id'); res.json(r.rows); });
app.get('/api/assignments', async (req, res) => { const r = await pool.query('SELECT * FROM assignments ORDER BY id DESC'); res.json(r.rows); });
app.get('/api/grades', async (req, res) => { const r = await pool.query('SELECT * FROM grades ORDER BY id DESC'); res.json(r.rows); });
app.get('/api/attendance', async (req, res) => { const r = await pool.query('SELECT * FROM attendance ORDER BY id DESC'); res.json(r.rows); });

// ДОБАВЛЕНИЕ ЗАДАНИЙ И ОЦЕНОК
app.post('/api/admin/add-task', async (req, res) => {
  try {
    const { title, subject, due, description } = req.body;
    await pool.query('INSERT INTO assignments (user_id, title, subject, due, description, done) VALUES ($1, $2, $3, $4, $5, $6)', [1, title, subject, due, description, false]);
    res.status(201).json({ message: 'OK' });
  } catch (err) { res.status(500).json({ error: 'Ошибка' }); }
});

app.post('/api/admin/add-grade', async (req, res) => {
  try {
    const { date, subject, work, grade, comment } = req.body;
    await pool.query('INSERT INTO grades (user_id, date, subject, work, grade, comment) VALUES ($1, $2, $3, $4, $5, $6)', [1, date, subject, work, grade, comment]);
    res.status(201).json({ message: 'OK' });
  } catch (err) { res.status(500).json({ error: 'Ошибка' }); }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`СЕРВЕР РАБОТАЕТ: http://localhost:${PORT}`));