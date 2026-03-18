const express = require('express');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Database file paths
// Use in-memory database for Vercel compatibility
let usersDB = [];
let studentsDB = [];

const USERS_DB_PATH = path.join(__dirname, 'db', 'users.json');
const STUDENTS_DB_PATH = path.join(__dirname, 'db', 'students.json');

// Ensure db directory exists (only for local development)
if (process.env.NODE_ENV !== 'production') {
    if (!fs.existsSync(path.join(__dirname, 'db'))) {
        fs.mkdirSync(path.join(__dirname, 'db'));
    }
}

// Load users database
function loadUsers() {
    // In production (Vercel), use in-memory database
    if (process.env.NODE_ENV === 'production') {
        return usersDB;
    }
    
    // In development, use file system
    if (fs.existsSync(USERS_DB_PATH)) {
        usersDB = JSON.parse(fs.readFileSync(USERS_DB_PATH, 'utf8'));
    }
    return usersDB;
}

// Save users database
function saveUsers(users) {
    usersDB = users;
    
    // In development, also save to file
    if (process.env.NODE_ENV !== 'production') {
        try {
            fs.writeFileSync(USERS_DB_PATH, JSON.stringify(users, null, 2));
        } catch (err) {
            console.error('Error saving users to file:', err);
        }
    }
}

// Load students database
function loadStudents() {
    // In production (Vercel), use in-memory database
    if (process.env.NODE_ENV === 'production') {
        return studentsDB;
    }
    
    // In development, use file system
    if (fs.existsSync(STUDENTS_DB_PATH)) {
        studentsDB = JSON.parse(fs.readFileSync(STUDENTS_DB_PATH, 'utf8'));
    }
    return studentsDB;
}

// Save students database
function saveStudents(students) {
    studentsDB = students;
    
    // In development, also save to file
    if (process.env.NODE_ENV !== 'production') {
        try {
            fs.writeFileSync(STUDENTS_DB_PATH, JSON.stringify(students, null, 2));
        } catch (err) {
            console.error('Error saving students to file:', err);
        }
    }
}

// Load themes
function loadThemes() {
    const themesDir = path.join(__dirname, 'public', 'themes');
    const themes = {};
    
    if (fs.existsSync(themesDir)) {
        const files = fs.readdirSync(themesDir).filter(f => f.endsWith('.json'));
        files.forEach(file => {
            const themeId = file.replace('.json', '');
            themes[themeId] = JSON.parse(fs.readFileSync(path.join(themesDir, file), 'utf8'));
        });
    }
    
    return themes;
}

// Simple session middleware
const sessions = {};

function createSession(userId) {
    const sessionId = Math.random().toString(36).substring(7);
    sessions[sessionId] = {
        userId: userId,
        createdAt: Date.now()
    };
    return sessionId;
}

function getSession(sessionId) {
    return sessions[sessionId];
}

// Routes
app.get('/', (req, res) => {
    res.render('home');
});

app.get('/index', (req, res) => {
    res.render('index', { title: 'Histología Quiz' });
});

app.get('/index.html', (req, res) => {
    res.render('index', { title: 'Histología Quiz' });
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/signup', (req, res) => {
    res.render('signup');
});

app.post('/api/auth/signup', async (req, res) => {
    try {
        const { name, password } = req.body;
        
        if (!name || !password) {
            return res.status(400).json({ error: 'Nombre y contraseña requeridos' });
        }
        
        if (password.length < 3) {
            return res.status(400).json({ error: 'La contraseña debe tener al menos 3 caracteres' });
        }
        
        let users = loadUsers();
        
        // Check if user already exists
        if (users.find(u => u.name === name)) {
            return res.status(400).json({ error: 'El usuario ya existe' });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const newUser = {
            id: users.length + 1,
            name: name,
            password: hashedPassword,
            createdAt: new Date().toISOString().split('T')[0]
        };
        
        users.push(newUser);
        saveUsers(users);
        
        // Create session
        const sessionId = createSession(newUser.id);
        
        res.json({
            success: true,
            sessionId: sessionId,
            userId: newUser.id,
            name: newUser.name
        });
    } catch (error) {
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { name, password } = req.body;
        
        if (!name || !password) {
            return res.status(400).json({ error: 'Nombre y contraseña requeridos' });
        }
        
        if (password.length < 3) {
            return res.status(400).json({ error: 'La contraseña debe tener al menos 3 caracteres' });
        }
        
        let users = loadUsers();
        const user = users.find(u => u.name === name);
        
        if (!user) {
            return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
        }
        
        // Compare passwords
        const passwordMatch = await bcrypt.compare(password, user.password);
        
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
        }
        
        // Create session
        const sessionId = createSession(user.id);
        
        res.json({
            success: true,
            sessionId: sessionId,
            userId: user.id,
            name: user.name
        });
    } catch (error) {
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

app.get('/api/auth/check', (req, res) => {
    const sessionId = req.query.sessionId;
    const session = getSession(sessionId);
    
    if (!session) {
        return res.json({ authenticated: false });
    }
    
    const users = loadUsers();
    const user = users.find(u => u.id === session.userId);
    
    if (!user) {
        return res.json({ authenticated: false });
    }
    
    res.json({
        authenticated: true,
        userId: user.id,
        name: user.name
    });
});

app.get('/api/students', (req, res) => {
    const students = loadStudents();
    res.json(students);
});

app.post('/api/students/login', (req, res) => {
    const { name } = req.body;
    let students = loadStudents();
    
    let student = students.find(s => s.name === name);
    
    if (!student) {
        const themes = loadThemes();
        student = {
            id: students.length + 1,
            name: name,
            registeredDate: new Date().toISOString().split('T')[0],
            scores: {}
        };
        
        Object.keys(themes).forEach(themeId => {
            student.scores[themeId] = {
                bestScore: 0,
                attempts: 0,
                lastAttempt: null
            };
        });
        
        students.push(student);
        saveStudents(students);
    }
    
    res.json(student);
});

app.get('/api/themes', (req, res) => {
    const themes = loadThemes();
    const themesList = Object.entries(themes).map(([id, data]) => ({
        id,
        name: data.nombre || data.name,
        description: data.descripcion || data.description,
        questionCount: (data.preguntas || data.questions || []).length
    }));
    res.json(themesList);
});

app.get('/api/themes/:id', (req, res) => {
    const themes = loadThemes();
    const theme = themes[req.params.id];
    
    if (!theme) {
        return res.status(404).json({ error: 'Theme not found' });
    }
    
    res.json(theme);
});

app.post('/api/students/:id/score', (req, res) => {
    const { themeId, score, attempts } = req.body;
    let students = loadStudents();
    
    const student = students.find(s => s.id === parseInt(req.params.id));
    
    if (!student) {
        return res.status(404).json({ error: 'Student not found' });
    }
    
    if (!student.scores[themeId]) {
        student.scores[themeId] = {
            bestScore: 0,
            attempts: 0,
            lastAttempt: null
        };
    }
    
    student.scores[themeId].bestScore = Math.max(student.scores[themeId].bestScore, score);
    student.scores[themeId].attempts = (student.scores[themeId].attempts || 0) + 1;
    student.scores[themeId].lastAttempt = new Date().toISOString().split('T')[0];
    
    saveStudents(students);
    res.json(student);
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando en http://localhost:${PORT}`);
});
