# Histología Quiz - Node.js Version

Aplicación de quiz interactiva con backend Node.js/Express y frontend modular.

## Características

- ✅ 6 temas con 50 preguntas cada uno
- ✅ Sistema de login de alumnos
- ✅ Rastreamiento de puntuaciones por tema
- ✅ Backend Node.js con Express
- ✅ Templates EJS modulares
- ✅ Base de datos JSON

## Instalación Local

```bash
# Clonar el repositorio
git clone https://github.com/vanderleipina/histologia-quiz-node.git
cd histologia-quiz-node

# Instalar dependencias
npm install

# Ejecutar el servidor
npm start
```

El servidor estará disponible en `http://localhost:3000`

## Desplegar en Vercel

### Opción 1: Desde GitHub (Recomendado)

1. Ve a https://vercel.com
2. Haz clic en "Sign Up" y crea una cuenta (puedes usar GitHub)
3. Haz clic en "New Project"
4. Selecciona "Import Git Repository"
5. Busca `histologia-quiz-node` en tu GitHub
6. Haz clic en "Import"
7. Vercel detectará automáticamente que es un proyecto Node.js
8. Haz clic en "Deploy"

### Opción 2: Desde la CLI de Vercel

```bash
npm install -g vercel
vercel
```

Sigue las instrucciones en pantalla.

## Estructura del Proyecto

```
histologia-quiz-node/
├── server.js              # Servidor Express principal
├── vercel.json            # Configuración de Vercel
├── package.json           # Dependencias
├── views/
│   └── index.ejs         # Template principal
├── public/
│   ├── app.js            # Lógica del frontend
│   ├── styles.css        # Estilos
│   └── themes/           # Archivos JSON de temas
└── db/
    └── students.json     # Base de datos de alumnos
```

## API Endpoints

- `GET /` - Página principal
- `GET /api/students` - Lista de alumnos
- `POST /api/students/login` - Login de alumno
- `GET /api/themes` - Lista de temas
- `GET /api/themes/:id` - Obtener tema específico
- `POST /api/students/:id/score` - Guardar puntuación

## Tecnologías

- **Backend**: Node.js, Express
- **Frontend**: HTML, CSS, JavaScript puro
- **Templates**: EJS
- **Base de datos**: JSON (archivo)
- **Hosting**: Vercel

## Licencia

MIT
