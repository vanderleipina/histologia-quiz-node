// Quiz App - Pure JavaScript
class QuizApp {
    constructor() {
        this.currentTheme = null;
        this.currentQuestion = 0;
        this.score = 0;
        this.selectedAnswer = null;
        this.answered = false;
        this.questions = [];
        this.themes = [
            'sistema-endocrino',
            'endocrino-1',
            'tiroides',
            'paratiroides',
            'suprarrenal',
            'sistema-tegumentario'
        ];
        this.themeData = {};
        this.stats = this.loadStats();
        this.currentStudent = this.loadCurrentStudent();
        this.students = this.loadStudents();
        this.init();
    }

    init() {
        if (this.currentStudent) {
            this.renderHome();
            this.loadThemes();
        } else {
            this.renderLogin();
        }
    }

    loadStudents() {
        const saved = localStorage.getItem('students');
        return saved ? JSON.parse(saved) : [];
    }

    saveStudents() {
        localStorage.setItem('students', JSON.stringify(this.students));
    }

    loadCurrentStudent() {
        const saved = localStorage.getItem('currentStudent');
        return saved ? JSON.parse(saved) : null;
    }

    saveCurrentStudent(student) {
        this.currentStudent = student;
        localStorage.setItem('currentStudent', JSON.stringify(student));
    }

    renderLogin() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="login-container">
                <div class="login-box">
                    <h1>Histología Quiz</h1>
                    <p class="login-subtitle">Ingresa tu nombre para comenzar</p>
                    
                    <div class="form-group">
                        <input type="text" id="studentName" placeholder="Tu nombre completo" class="input-field">
                    </div>
                    
                    <button onclick="app.loginStudent()" class="btn btn-primary btn-large">Ingresar</button>
                    
                    <div class="students-list" id="studentsList">
                        <h3>Estudiantes Registrados</h3>
                        <div id="studentsContainer"></div>
                    </div>
                </div>
            </div>
        `;
        this.renderStudentsList();
        document.getElementById('studentName').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.loginStudent();
        });
    }

    renderStudentsList() {
        const container = document.getElementById('studentsContainer');
        if (this.students.length === 0) {
            container.innerHTML = '<p class="no-students">No hay estudiantes registrados aún</p>';
            return;
        }
        container.innerHTML = this.students.map(student => `
            <div class="student-item" onclick="app.selectStudent('${student.name}')">
                <div class="student-info">
                    <strong>${student.name}</strong>
                    <small>Registrado: ${student.registeredDate}</small>
                </div>
                <div class="student-stats">
                    <span class="stat-badge">${Object.values(student.scores).filter(s => s.bestScore > 0).length} temas</span>
                </div>
            </div>
        `).join('');
    }

    selectStudent(name) {
        const student = this.students.find(s => s.name === name);
        if (student) {
            this.saveCurrentStudent(student);
            this.renderHome();
            this.loadThemes();
        }
    }

    loginStudent() {
        const nameInput = document.getElementById('studentName');
        const name = nameInput.value.trim();
        
        if (!name) {
            alert('Por favor ingresa tu nombre');
            return;
        }
        
        let student = this.students.find(s => s.name === name);
        
        if (!student) {
            student = {
                id: this.students.length + 1,
                name: name,
                registeredDate: new Date().toISOString().split('T')[0],
                scores: {}
            };
            this.themes.forEach(theme => {
                student.scores[theme] = {
                    bestScore: 0,
                    attempts: 0,
                    lastAttempt: null
                };
            });
            this.students.push(student);
            this.saveStudents();
        }
        
        this.saveCurrentStudent(student);
        this.renderHome();
        this.loadThemes();
    }

    logoutStudent() {
        this.currentStudent = null;
        localStorage.removeItem('currentStudent');
        this.renderLogin();
    }

    loadStats() {
        const saved = localStorage.getItem('quizStats');
        return saved ? JSON.parse(saved) : {};
    }

    saveStats() {
        localStorage.setItem('quizStats', JSON.stringify(this.stats));
    }

    async loadThemes() {
        for (const themeId of this.themes) {
            try {
                const response = await fetch(`themes/${themeId}.json`);
                if (response.ok) {
                    this.themeData[themeId] = await response.json();
                }
            } catch (err) {
                console.error(`Error loading theme ${themeId}:`, err);
            }
        }
        this.renderHome();
    }

    renderHome() {
        const app = document.getElementById('app');
        
        let themesHTML = '';
        for (const themeId of this.themes) {
            const theme = this.themeData[themeId];
            if (!theme) continue;

            const themeName = theme.nombre || theme.name;
            const themeDescription = theme.descripcion || theme.description;
            const questionCount = (theme.preguntas || theme.questions || []).length;
            const themeStats = this.stats[themeId] || { bestScore: 0, attempts: 0 };
            
            const scoreClass = themeStats.bestScore > 5 ? 'green' : (themeStats.bestScore > 0 ? 'red' : '');
            const scoreDisplay = themeStats.bestScore > 0 ? themeStats.bestScore : '-';

            themesHTML += `
                <div class="theme-card">
                    <h2>${themeName}</h2>
                    <p>${themeDescription}</p>
                    <div class="theme-stats">
                        <div class="stat-box">
                            <div class="stat-label">Preguntas</div>
                            <div class="stat-value">${questionCount}</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-label">Mejor Puntuación</div>
                            <div class="stat-value ${scoreClass}">${scoreDisplay}</div>
                        </div>
                    </div>
                    <div class="theme-attempts">
                        ${themeStats.attempts === 0 ? 'Sin intentos' : `${themeStats.attempts} intento${themeStats.attempts !== 1 ? 's' : ''}`}
                    </div>
                    <div class="theme-buttons">
                        <button class="btn-start" onclick="app.startQuiz('${themeId}')">Iniciar Prueba</button>
                    </div>
                </div>
            `;
        }

        app.innerHTML = `
            <div class="home-page">
                <div class="container">
                    <div class="header">
                        <h1><span class="icon">📚</span> Histología</h1>
                        <p>Plataforma de pruebas de múltiple opción para histología</p>
                    </div>
                    <button class="add-theme-btn" onclick="app.showUploadModal()">+ Agregar Nuevo Tema</button>
                    <div class="themes-grid">
                        ${themesHTML}
                    </div>
                </div>
            </div>
            <div id="uploadModal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">Importar Nuevo Tema</div>
                    <div class="modal-body">
                        <p>Sube un archivo JSON con un nuevo tema. Formato esperado:</p>
                        <pre>{
  "id": "mi-tema",
  "name": "Nombre del Tema",
  "description": "Descripción",
  "questions": [
    {
      "id": 1,
      "question": "¿Pregunta?",
      "options": ["Op1", "Op2", "Op3", "Op4"],
      "correctIndex": 0,
      "explanation": "Explicación..."
    }
  ]
}</pre>
                        <input type="file" id="fileInput" accept=".json" onchange="app.handleFileUpload(event)">
                        <div id="uploadMessage"></div>
                    </div>
                    <div class="modal-actions">
                        <button class="btn-close" onclick="app.hideUploadModal()">Cerrar</button>
                    </div>
                </div>
            </div>
        `;
    }

    showUploadModal() {
        document.getElementById('uploadModal').classList.add('show');
    }

    hideUploadModal() {
        document.getElementById('uploadModal').classList.remove('show');
        document.getElementById('uploadMessage').innerHTML = '';
        document.getElementById('fileInput').value = '';
    }

    handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const themeData = JSON.parse(e.target.result);
                
                if (!themeData.id || !themeData.name || !Array.isArray(themeData.questions)) {
                    this.showUploadMessage('El archivo debe contener: id, name, description, y questions (array).', 'error');
                    return;
                }

                const allValid = themeData.questions.every(q =>
                    q.id && q.question && Array.isArray(q.options) &&
                    q.options.length >= 2 && typeof q.correctIndex === 'number' && q.explanation
                );

                if (!allValid) {
                    this.showUploadMessage('Algunas preguntas no tienen la estructura correcta.', 'error');
                    return;
                }

                if (this.themeData[themeData.id]) {
                    this.showUploadMessage('Ya existe un tema con este ID. Por favor, usa un ID diferente.', 'error');
                    return;
                }

                this.themeData[themeData.id] = themeData;
                this.showUploadMessage(`✓ Tema "${themeData.name}" agregado exitosamente con ${themeData.questions.length} preguntas.`, 'success');
                
                setTimeout(() => {
                    this.hideUploadModal();
                    this.renderHome();
                }, 2000);
            } catch (err) {
                this.showUploadMessage('Error al procesar el archivo JSON. Verifica su formato.', 'error');
            }
        };
        reader.readAsText(file);
    }

    showUploadMessage(message, type) {
        const msgDiv = document.getElementById('uploadMessage');
        msgDiv.className = `modal-message ${type}`;
        msgDiv.textContent = message;
    }

    startQuiz(themeId) {
        const theme = this.themeData[themeId];
        if (!theme) return;

        this.currentTheme = themeId;
        this.questions = theme.preguntas || theme.questions || [];
        this.currentQuestion = 0;
        this.score = 0;
        this.selectedAnswer = null;
        this.answered = false;

        this.renderQuiz();
    }

    renderQuiz() {
        if (this.currentQuestion >= this.questions.length) {
            this.renderResults();
            return;
        }

        const theme = this.themeData[this.currentTheme];
        const themeName = theme.nombre || theme.name;
        const question = this.questions[this.currentQuestion];
        const questionText = question.pregunta || question.question;
        const options = question.opciones || question.options || [];
        
        const progress = ((this.currentQuestion + 1) / this.questions.length) * 100;

        let optionsHTML = '';
        options.forEach((option, index) => {
            let className = 'option-btn';
            let icon = '';

            if (this.answered) {
                const correctIndex = question.respuestaCorrecta !== undefined ? question.respuestaCorrecta : question.correctIndex;
                if (index === correctIndex) {
                    className += ' correct';
                    icon = '<span class="option-icon">✓</span>';
                } else if (index === this.selectedAnswer && index !== correctIndex) {
                    className += ' incorrect';
                    icon = '<span class="option-icon">✗</span>';
                }
            } else if (index === this.selectedAnswer) {
                className += ' selected';
            }

            optionsHTML += `
                <button class="${className}" onclick="app.selectAnswer(${index})" ${this.answered ? 'disabled' : ''}>
                    <span>${option}</span>
                    ${icon}
                </button>
            `;
        });

        const correctIndex = question.respuestaCorrecta !== undefined ? question.respuestaCorrecta : question.correctIndex;
        const isCorrect = this.selectedAnswer === correctIndex;
        const explanation = question.explicacion || question.explanation;

        let explanationHTML = '';
        if (this.answered) {
            const explanationClass = isCorrect ? 'explanation-correct' : 'explanation-incorrect';
            const explanationTitle = isCorrect ? '¡Correcto!' : 'Incorrecto';
            
            explanationHTML = `
                <div class="explanation show">
                    <div class="explanation-title ${explanationClass}">${explanationTitle}</div>
                    ${!isCorrect ? `<div class="correct-answer">Respuesta correcta: ${options[correctIndex]}</div>` : ''}
                    <div class="explanation-text">${explanation}</div>
                </div>
            `;
        }

        let actionButtonHTML = '';
        if (!this.answered) {
            actionButtonHTML = `
                <div class="button-group">
                    <button class="btn-submit" onclick="app.submitAnswer()" ${this.selectedAnswer === null ? 'disabled' : ''}>
                        Responder
                    </button>
                    <button class="btn-skip" onclick="app.skipQuestion()">
                        Pular
                    </button>
                </div>
            `;
        } else {
            const isLastQuestion = this.currentQuestion === this.questions.length - 1;
            const buttonText = isLastQuestion ? 'Ver Resultado' : 'Siguiente';
            actionButtonHTML = `
                <button class="btn-next" onclick="app.nextQuestion()">
                    ${buttonText}
                    <span>→</span>
                </button>
            `;
        }

        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="quiz-page" style="display: block;">
                <div class="container">
                    <div class="quiz-header">
                        <div class="header-top">
                            <h1>${themeName}</h1>
                            <button class="btn-home" onclick="app.goHome()">
                                <span>🏠</span> Inicio
                            </button>
                        </div>
                        <p>Prueba de múltipla opción</p>
                    </div>

                    <div class="progress-section">
                        <div class="progress-info">
                            <span>Pregunta ${this.currentQuestion + 1} de ${this.questions.length}</span>
                            <span class="progress-score">Aciertos: ${this.score}</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progress}%"></div>
                        </div>
                    </div>

                    <div class="question-card">
                        <div class="question-text">${questionText}</div>
                        <div class="options-list">
                            ${optionsHTML}
                        </div>
                        ${explanationHTML}
                    </div>

                    <div class="quiz-actions">
                        ${actionButtonHTML}
                    </div>
                </div>
            </div>
        `;
    }

    selectAnswer(index) {
        if (!this.answered) {
            this.selectedAnswer = index;
            this.renderQuiz();
        }
    }

    submitAnswer() {
        if (this.selectedAnswer === null) return;

        const question = this.questions[this.currentQuestion];
        const correctIndex = question.respuestaCorrecta !== undefined ? question.respuestaCorrecta : question.correctIndex;
        
        if (this.selectedAnswer === correctIndex) {
            this.score++;
        }

        this.answered = true;
        this.renderQuiz();
    }

    nextQuestion() {
        this.currentQuestion++;
        this.selectedAnswer = null;
        this.answered = false;

        if (this.currentQuestion >= this.questions.length) {
            this.saveQuizStats();
            this.renderResults();
        } else {
            this.renderQuiz();
        }
    }

    skipQuestion() {
        this.currentQuestion++;
        this.selectedAnswer = null;
        this.answered = false;

        if (this.currentQuestion >= this.questions.length) {
            this.saveQuizStats();
            this.renderResults();
        } else {
            this.renderQuiz();
        }
    }

    saveQuizStats() {
        if (!this.stats[this.currentTheme]) {
            this.stats[this.currentTheme] = { bestScore: 0, attempts: 0 };
        }

        this.stats[this.currentTheme].bestScore = Math.max(
            this.stats[this.currentTheme].bestScore,
            this.score
        );
        this.stats[this.currentTheme].attempts++;

        this.saveStats();
    }

    renderResults() {
        const theme = this.themeData[this.currentTheme];
        const themeName = theme.nombre || theme.name;
        const percentage = Math.round((this.score / this.questions.length) * 100);
        
        let message = '';
        if (percentage >= 80) {
            message = '¡Excelente trabajo!';
        } else if (percentage >= 60) {
            message = '¡Buen desempeño!';
        } else {
            message = 'Sigue practicando';
        }

        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="results-page" style="display: block;">
                <div class="container">
                    <div class="results-card">
                        <div class="score-display">
                            <div class="score-number">${this.score}/${this.questions.length}</div>
                            <div class="score-percentage">${percentage}%</div>
                            <div class="score-message">${message}</div>
                            <div class="score-theme">${themeName}</div>
                        </div>
                        <div class="results-actions">
                            <button class="btn-retry" onclick="app.startQuiz('${this.currentTheme}')">
                                <span>🔄</span> Reintentar
                            </button>
                            <button class="btn-back" onclick="app.goHome()">
                                <span>🏠</span> Volver al Inicio
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    goHome() {
        this.renderHome();
    }
}

// Initialize the app when DOM is ready
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new QuizApp();
});
