# 🎓 HtLearn — Plateforme E-Learning

Deployment on Vercel + Render + MongoDB Atlas + Cloudflare R2:
see [DEPLOYMENT.md](DEPLOYMENT.md).

Plateforme d'apprentissage en ligne moderne où les **enseignants** créent des cours structurés en chapitres avec leçons multimédias et examens, et où les **étudiants** apprennent à leur rythme avec un suivi de progression complet.

> Projet de fin d'année — Stack : **React + Node.js + MongoDB + Docker**

---

## ✨ Fonctionnalités

### 👨‍🎓 Étudiants
- Catalogue de cours avec recherche & filtres par catégorie
- Inscription aux cours en un clic, mise en favoris (bookmarks)
- Cours organisés **chapitre par chapitre** : leçons puis examen de chapitre
- Leçons de 4 types : **texte (Markdown)**, **PDF**, **audio** et **vidéo** (avec transcription)
- Flashcards de révision générées par IA à partir du contenu des leçons
- Assistant IA (tuteur) qui répond aux questions sur la leçon en cours
- Quiz d'entraînement avec correction immédiate et explications
- **Examen final chronométré**, débloqué uniquement après avoir réussi tous les examens de chapitre (≥ 60 %)
- Tableau de bord avec statistiques de progression
- Avis / notation des cours, signalement de contenu
- Notifications (ex. examen corrigé), mode clair / sombre

### 👩‍🏫 Enseignants
- Création / édition / suppression de cours
- Organisation en **chapitres** (réordonnables) et leçons (ordre, durée, contenu, média)
- Éditeur de quiz visuel prenant en charge **5 types de questions** :
  QCM (`mcq`), Vrai/Faux (`tf`), texte à trous (`fill`), remise en ordre (`order`), réponse libre (`text`)
- Génération de questions et de flashcards assistée par IA
- 3 niveaux d'évaluation : quiz d'entraînement, examen de chapitre, examen final
- File de **correction manuelle** pour les questions à réponse libre des examens finaux
- Statistiques par cours : inscriptions, score moyen, taux de complétion, graphiques

### 🛡️ Administration & Sécurité
- Espace admin (gestion des utilisateurs, modération des signalements)
- Authentification JWT, hashage des mots de passe (bcrypt)
- Forçage du changement de mot de passe pour les comptes créés par l'admin
- Validation des entrées (Zod) côté serveur
- Quiz : les bonnes réponses ne sont **jamais** envoyées au front avant validation ; le score est calculé côté serveur

---

## 🛠️ Stack technique

| Couche | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, TailwindCSS, React Router, TanStack Query, Zustand, Recharts, lucide-react |
| **Backend** | Node.js, Express, TypeScript, Mongoose, JWT, bcryptjs, Zod, Multer |
| **Base de données** | MongoDB |
| **Intégrations (optionnelles)** | Groq LLM (tuteur IA + génération de quiz/flashcards), Cloudflare R2 / S3 (uploads), SMTP via Nodemailer (emails) |
| **Déploiement** | Docker + Docker Compose, Nginx |

> Les intégrations optionnelles sont activées par variables d'environnement. En leur absence, le code se dégrade proprement (les fonctionnalités concernées sont simplement désactivées).

---

## 🚀 Démarrage rapide

### Option 1 — Avec Docker (recommandé)

```bash
docker-compose up --build
```

Puis ouvrir 👉 http://localhost:5173

Pour charger les données de démo :
```bash
docker-compose exec server npm run seed
```

### Option 2 — Sans Docker

**Prérequis** : Node.js 20+, MongoDB tournant sur `localhost:27017`.

```bash
# Backend
cd server
cp .env.example .env     # MONGO_URI et JWT_SECRET requis ; clés Groq/R2/SMTP optionnelles
npm install
npm run seed             # données de démo (réinitialise la base)
npm run dev              # http://localhost:5000

# Frontend (dans un autre terminal)
cd client
npm install
npm run dev              # http://localhost:5173 (proxy /api et /uploads vers :5000)
```

---

## 👥 Comptes de démo

| Rôle | Nom | Email | Mot de passe |
|---|---|---|---|
| 🛡️ Admin | Admin | `admin@HtLearn.edu` | `admin123` |
| 👨‍🏫 Enseignant | M. Mohammed | `mohammed@HtLearn.edu` | `teacher123` |
| 👨‍🏫 Enseignant | M. Taha | `taha@HtLearn.edu` | `teacher123` |
| 👨‍🎓 Étudiant | Aymane | `aymane@HtLearn.edu` | `student123` |

**Cours de démo inclus :** Introduction à JavaScript, Algèbre linéaire essentielle, HTML & CSS Modernes, ainsi que trois cours complets structurés en chapitres (chapitres → leçons texte/PDF/audio/vidéo → examens de chapitre → examen final) :
- 🐍 **Python pour Débutants** (M. Mohammed)
- 🇫🇷 **Français pour Débutants** (M. Taha)
- 🇬🇧 **Anglais pour Débutants** (M. Mohammed)

---

## 📁 Structure du projet

```
elearning/
├── client/                     # Frontend React + Vite
│   ├── src/
│   │   ├── components/         # Navbar, CourseCard, MediaViewer, Flashcards, LessonTutor, ...
│   │   ├── pages/              # Pages publiques + dashboard (CourseDetail, LessonView, Quiz, ...)
│   │   │   └── teacher/        # Espace enseignant (édition de cours, correction, étudiants)
│   │   ├── lib/                # api.ts, utils.ts
│   │   ├── store/              # Zustand (auth, theme, sound)
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── Dockerfile
│
├── server/                     # Backend Express
│   ├── src/
│   │   ├── models/             # Mongoose : User, Course, Chapter, Lesson, Quiz, Enrollment, QuizAttempt, Review, Notification, Report
│   │   ├── routes/             # auth, courses, chapters, lessons, quizzes, enrollments, stats, uploads, tutor, flashcards, admin, reports, notifications
│   │   ├── middleware/         # auth.ts (JWT + rôles + gate changement de mot de passe)
│   │   ├── lib/                # groq.ts (IA), intégrations
│   │   ├── seed/               # Données de démo
│   │   └── index.ts
│   └── Dockerfile
│
└── docker-compose.yml          # mongo + server + client
```

---

## 🔌 API — endpoints principaux

### Authentification
- `POST /api/auth/register` — inscription
- `POST /api/auth/login` — connexion
- `GET  /api/auth/me` — utilisateur courant

### Cours & chapitres
- `GET  /api/courses` — liste publique (filtres `?search=&category=`)
- `GET  /api/courses/mine` — mes cours (enseignant)
- `GET  /api/courses/:id` — détail (cours + leçons + quiz)
- `POST /api/courses` · `PUT /api/courses/:id` · `DELETE /api/courses/:id`
- `GET  /api/chapters/course/:courseId` — chapitres d'un cours
- `POST /api/chapters` · `PUT /api/chapters/:id` · `POST /api/chapters/reorder` · `DELETE /api/chapters/:id`

### Leçons
- `GET /api/lessons/:id`
- `POST /api/lessons` · `PUT /api/lessons/:id` · `DELETE /api/lessons/:id`

### Quiz & examens
- `GET  /api/quizzes/:id` — version étudiant (sans réponses)
- `GET  /api/quizzes/:id/full` — version enseignant (avec réponses)
- `POST /api/quizzes` — créer (quiz d'entraînement, examen de chapitre ou examen final)
- `POST /api/quizzes/generate` — génération de questions par IA
- `GET  /api/quizzes/:id/can-attempt` — éligibilité à l'examen final
- `POST /api/quizzes/:id/attempt` — soumettre des réponses → score + corrigé
- `GET  /api/quizzes/attempts/pending` · `POST /api/quizzes/attempts/:id/grade` — correction manuelle (enseignant)

### Inscriptions & progression
- `GET  /api/enrollments` — mes inscriptions
- `POST /api/enrollments/:courseId` — s'inscrire
- `POST /api/enrollments/:courseId/complete-lesson/:lessonId`

### IA, médias & divers
- `POST /api/tutor` — assistant IA (Groq)
- `POST /api/flashcards/generate` — flashcards par IA
- `POST /api/uploads` — upload de fichiers (local ou Cloudflare R2)
- `GET  /api/stats/student` · `GET /api/stats/teacher`
- `GET  /api/notifications` — notifications utilisateur
- `POST /api/reports` — signalement de contenu
- `/api/admin/*` — gestion (admin)

---

## 🎨 Design

- **Police** : Inter (Google Fonts)
- **Couleurs** : palette de marque HtLearn — `ht-yellow`, `ht-red`, `ht-black` + slate pour la neutralité
- **Icônes** : lucide-react (ex. médaille pour les examens de chapitre, trophée pour l'examen final)
- **Animations** : fade-in, slide-up, transitions sur hover
- **Responsive** : mobile-first, breakpoints Tailwind
- **Mode sombre** : toggle dans la navbar, persistant via `localStorage`

---

## 🔮 Pistes d'amélioration

- [ ] Génération de certificats PDF en fin de cours
- [ ] Notifications en temps réel (Socket.io)
- [ ] Tests automatisés (Jest, Vitest)
- [ ] Internationalisation (i18n) — français / anglais / arabe
- [ ] Application mobile

---

## 📝 Licence

Projet académique — usage libre pour fins éducatives.
