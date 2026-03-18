const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();

// Middleware
app.use(express.json());
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Database file path
const DB_PATH = path.join(__dirname, 'db', 'students.json');

// Ensure db directory exists
if (!fs.existsSync(path.join(__dirname, 'db'))) {
    fs.mkdirSync(path.join(__dirname, 'db'));
}

// Load students database
function loadStudents() {
    if (fs.existsSync(DB_PATH)) {
        return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    }
    return [];
}

// Save students database
function saveStudents(students) {
    fs.writeFileSync(DB_PATH, JSON.stringify(students, null, 2));
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

// Routes
app.get('/', (req, res) => {
    res.render('index', { title: 'Histología Quiz' });
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
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
