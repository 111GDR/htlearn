import "dotenv/config";
import mongoose from "mongoose";
import { User } from "../models/User.js";
import { Course } from "../models/Course.js";
import { Chapter } from "../models/Chapter.js";
import { Lesson } from "../models/Lesson.js";
import { Quiz } from "../models/Quiz.js";
import { Enrollment } from "../models/Enrollment.js";
import { QuizAttempt } from "../models/QuizAttempt.js";

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/elearning";

const run = async () => {
  await mongoose.connect(MONGO_URI);
  console.log("Connecté à MongoDB");

  await Promise.all([
    User.deleteMany({}),
    Course.deleteMany({}),
    Chapter.deleteMany({}),
    Lesson.deleteMany({}),
    Quiz.deleteMany({}),
    Enrollment.deleteMany({}),
    QuizAttempt.deleteMany({}),
  ]);
  console.log("Base nettoyée");

  const admin = await User.create({
    name: "Admin",
    email: "admin@HtLearn.edu",
    password: "admin123",
    role: "admin",
    mustChangePassword: false,
  });

  const teacher = await User.create({
    name: "M. Mohammed",
    email: "mohammed@HtLearn.edu",
    password: "teacher123",
    role: "teacher",
    mustChangePassword: false,
    bio: "Professeur d'informatique passionné par le partage des connaissances.",
  });

  const teacher2 = await User.create({
    name: "M. Taha",
    email: "taha@HtLearn.edu",
    password: "teacher123",
    role: "teacher",
    mustChangePassword: false,
    bio: "Expert en mathématiques, 10 ans d'expérience.",
  });

  const student = await User.create({
    name: "Aymane",
    email: "aymane@HtLearn.edu",
    password: "student123",
    role: "student",
    studentId: "HT-2025-001",
    grade: "L1",
    mustChangePassword: false,
  });

  // --- Course 1: JavaScript ---
  const course1 = await Course.create({
    title: "Introduction à JavaScript",
    description:
      "Apprenez les bases de JavaScript : variables, fonctions, objets et manipulation du DOM. Idéal pour débuter en développement web.",
    category: "Informatique",
    level: "Débutant",
    teacher: teacher._id,
    published: true,
    thumbnail: "https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=800",
  });

  const l1 = await Lesson.create({
    course: course1._id,
    title: "Variables et types",
    order: 1,
    duration: 15,
    content: `# Variables et types en JavaScript

En JavaScript, on déclare des variables avec **let**, **const** ou **var**.

\`\`\`js
let nom = "Taha";
const age = 20;
\`\`\`

## Les types principaux
- **String** : texte
- **Number** : nombres
- **Boolean** : true / false
- **Array** : listes
- **Object** : objets clé/valeur

JavaScript est un langage à typage dynamique : une variable peut changer de type.`,
  });

  const l2 = await Lesson.create({
    course: course1._id,
    title: "Fonctions",
    order: 2,
    duration: 20,
    content: `# Les fonctions

Une fonction permet de regrouper du code réutilisable.

\`\`\`js
function saluer(nom) {
  return "Bonjour " + nom;
}

const saluer2 = (nom) => \`Bonjour \${nom}\`;
\`\`\`

Les **arrow functions** (=>) sont une syntaxe moderne et concise.`,
  });

  const l3 = await Lesson.create({
    course: course1._id,
    title: "Le DOM",
    order: 3,
    duration: 25,
    content: `# Manipulation du DOM

Le **DOM** (Document Object Model) représente la structure HTML de la page.

\`\`\`js
const titre = document.querySelector("h1");
titre.textContent = "Nouveau titre";
titre.style.color = "blue";
\`\`\`

On peut écouter des événements :

\`\`\`js
button.addEventListener("click", () => alert("Cliqué !"));
\`\`\``,
  });

  await Quiz.create({
    course: course1._id,
    lesson: l1._id,
    title: "Quiz : Variables",
    passingScore: 60,
    questions: [
      {
        text: "Quel mot-clé déclare une constante ?",
        options: ["var", "let", "const", "def"],
        correctIndex: 2,
        explanation: "const déclare une variable dont la valeur ne peut pas être réassignée.",
      },
      {
        text: "Quel est le type de la valeur 42 ?",
        options: ["String", "Number", "Boolean", "Object"],
        correctIndex: 1,
        explanation: "42 est un nombre, donc de type Number.",
      },
      {
        text: "JavaScript est un langage à typage statique.",
        options: ["Vrai", "Faux"],
        correctIndex: 1,
        explanation: "JavaScript est à typage dynamique : le type d'une variable peut changer.",
      },
    ],
  });

  await Quiz.create({
    course: course1._id,
    lesson: l2._id,
    title: "Quiz : Fonctions",
    passingScore: 60,
    questions: [
      {
        text: "Quelle est la syntaxe d'une arrow function ?",
        options: ["function() {}", "() => {}", "=> function {}", "func() {}"],
        correctIndex: 1,
        explanation: "Les arrow functions utilisent la syntaxe () => {}.",
      },
      {
        text: "Que fait une fonction sans return ?",
        options: ["Erreur", "Renvoie undefined", "Renvoie 0", "Renvoie null"],
        correctIndex: 1,
        explanation: "Sans return explicite, une fonction renvoie undefined.",
      },
    ],
  });

  // --- Course 2: Math ---
  const course2 = await Course.create({
    title: "Algèbre linéaire essentielle",
    description:
      "Comprenez vecteurs, matrices et leurs applications dans le monde réel et en informatique.",
    category: "Mathématiques",
    level: "Intermédiaire",
    teacher: teacher2._id,
    published: true,
    thumbnail: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800",
  });

  const m1 = await Lesson.create({
    course: course2._id,
    title: "Vecteurs",
    order: 1,
    duration: 20,
    content: `# Vecteurs

Un vecteur est une grandeur définie par une **direction** et une **norme**.

Dans R², un vecteur s'écrit (x, y).

## Opérations
- Addition : (a,b) + (c,d) = (a+c, b+d)
- Produit scalaire : a·b = a₁b₁ + a₂b₂

Les vecteurs sont fondamentaux en physique, en infographie et en machine learning.`,
  });

  await Quiz.create({
    course: course2._id,
    lesson: m1._id,
    title: "Quiz : Vecteurs",
    passingScore: 70,
    questions: [
      {
        text: "Que vaut (1, 2) + (3, 4) ?",
        options: ["(4, 6)", "(3, 8)", "(4, 8)", "(2, 4)"],
        correctIndex: 0,
        explanation: "On additionne composante par composante.",
      },
      {
        text: "Le produit scalaire de (1,0) et (0,1) vaut :",
        options: ["1", "0", "-1", "indéfini"],
        correctIndex: 1,
        explanation: "1·0 + 0·1 = 0. Les vecteurs sont orthogonaux.",
      },
    ],
  });

  // --- Course 3: Web ---
  const course3 = await Course.create({
    title: "HTML & CSS Modernes",
    description:
      "Construisez des pages web élégantes et responsives avec HTML5 et CSS3 (Flexbox, Grid).",
    category: "Informatique",
    level: "Débutant",
    teacher: teacher._id,
    published: true,
    thumbnail: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800",
  });

  const h1 = await Lesson.create({
    course: course3._id,
    title: "Structure HTML",
    order: 1,
    duration: 15,
    content: `# Structure d'un document HTML

\`\`\`html
<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8">
    <title>Ma page</title>
  </head>
  <body>
    <h1>Bonjour</h1>
  </body>
</html>
\`\`\`

Les balises sémantiques : **header**, **nav**, **main**, **footer**.`,
  });

  await Quiz.create({
    course: course3._id,
    lesson: h1._id,
    title: "Quiz : HTML",
    passingScore: 60,
    questions: [
      {
        text: "Quelle balise contient le titre de l'onglet ?",
        options: ["<header>", "<title>", "<h1>", "<head>"],
        correctIndex: 1,
        explanation: "<title> définit le titre affiché dans l'onglet du navigateur.",
      },
    ],
  });

  // --- Course 4: Python (full demo — chapters, all lesson types, chapter & final exams) ---
  const course4 = await Course.create({
    title: "Python pour Débutants",
    description:
      "Un parcours complet pour apprendre Python de zéro : variables, structures de données, boucles et premier projet. Comprend des leçons texte, PDF, audio et vidéo, des examens de chapitre et un examen final.",
    category: "Informatique",
    level: "Débutant",
    teacher: teacher._id,
    published: true,
    thumbnail: "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800",
  });

  // ===== Chapitre 1 =====
  const ch1 = await Chapter.create({
    course: course4._id,
    title: "Premiers pas en Python",
    description: "Installation, syntaxe de base et tout premier programme.",
    order: 1,
  });

  const c1l1 = await Lesson.create({
    course: course4._id,
    chapter: ch1._id,
    title: "Introduction et installation",
    kind: "text",
    order: 1,
    duration: 12,
    content: `# Bienvenue en Python

Python est un langage **simple à lire** et très populaire en science des données, en web et en automatisation.

## Installer Python
1. Rendez-vous sur python.org et téléchargez la dernière version.
2. Cochez « Add Python to PATH » pendant l'installation.
3. Vérifiez dans un terminal :

\`\`\`bash
python --version
\`\`\`

## Votre premier affichage

\`\`\`python
print("Bonjour le monde !")
\`\`\`

La fonction **print()** affiche du texte à l'écran.`,
  });

  await Lesson.create({
    course: course4._id,
    chapter: ch1._id,
    title: "Aide-mémoire de la syntaxe (PDF)",
    kind: "pdf",
    order: 2,
    duration: 8,
    content: "Une fiche récapitulative à garder sous la main pendant vos exercices.",
    mediaUrl: "https://python.sdv.u-paris.fr/cours-python.pdf",
    mediaSource: "url",
  });

  await Lesson.create({
    course: course4._id,
    chapter: ch1._id,
    title: "Podcast — Pourquoi apprendre Python ?",
    kind: "audio",
    order: 3,
    duration: 6,
    content: "Un court épisode audio sur les usages de Python dans l'industrie.",
    mediaUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    mediaSource: "url",
    transcript:
      "Dans cet épisode, nous expliquons pourquoi Python est l'un des langages les plus demandés : sa lisibilité, sa grande communauté et ses bibliothèques pour la data, le web et l'IA.",
  });

  await Lesson.create({
    course: course4._id,
    chapter: ch1._id,
    title: "Démo vidéo — votre premier programme",
    kind: "video",
    order: 4,
    duration: 10,
    content: "Démonstration pas à pas de l'écriture et de l'exécution d'un script Python.",
    mediaUrl:
      "https://youtu.be/dOKiZYodyz0",
    mediaSource: "url",
  });

  await Quiz.create({
    course: course4._id,
    chapter: ch1._id,
    kind: "chapter",
    title: "Examen du chapitre 1 : Premiers pas",
    passingScore: 60,
    questions: [
      {
        type: "mcq",
        text: "Quelle fonction permet d'afficher du texte à l'écran ?",
        options: ["echo()", "print()", "console.log()", "display()"],
        correctIndex: 1,
        explanation: "En Python, print() affiche une valeur sur la sortie standard.",
      },
      {
        type: "tf",
        text: "Python est un langage à typage dynamique.",
        correctBool: true,
        explanation: "Le type d'une variable est déterminé à l'exécution.",
      },
      {
        type: "fill",
        text: "Pour vérifier la version installée, on tape la commande python ___ dans le terminal.",
        blanks: ["--version"],
        explanation: "python --version affiche la version de l'interpréteur.",
      },
      {
        type: "order",
        text: "Remettez dans l'ordre les étapes d'installation de Python.",
        items: [
          "Télécharger Python depuis python.org",
          "Cocher « Add Python to PATH »",
          "Lancer l'installation",
          "Vérifier avec python --version",
        ],
        explanation: "On télécharge, on configure le PATH, on installe puis on vérifie.",
      },
      {
        type: "mcq",
        text: "Quel symbole commence un commentaire sur une ligne en Python ?",
        options: ["//", "#", "<!--", "--"],
        correctIndex: 1,
        explanation: "Le caractère # introduit un commentaire en Python.",
      },
    ],
  });

  // ===== Chapitre 2 =====
  const ch2 = await Chapter.create({
    course: course4._id,
    title: "Structures de données et logique",
    description: "Listes, dictionnaires, conditions et boucles.",
    order: 2,
  });

  const c2l1 = await Lesson.create({
    course: course4._id,
    chapter: ch2._id,
    title: "Listes et dictionnaires",
    kind: "text",
    order: 1,
    duration: 18,
    content: `# Listes et dictionnaires

## Les listes
Une **liste** est une collection ordonnée et modifiable.

\`\`\`python
fruits = ["pomme", "banane", "cerise"]
fruits.append("orange")
print(fruits[0])  # pomme
\`\`\`

## Les dictionnaires
Un **dictionnaire** associe des clés à des valeurs.

\`\`\`python
etudiant = {"nom": "Taha", "age": 20}
print(etudiant["nom"])  # Taha
\`\`\``,
  });

  await Lesson.create({
    course: course4._id,
    chapter: ch2._id,
    title: "Fiche — boucles et conditions (PDF)",
    kind: "pdf",
    order: 2,
    duration: 9,
    content: "Résumé visuel des structures if/else et des boucles for/while.",
    mediaUrl: "https://dept-info.labri.fr/~baudon/Licence/CHS/TD1.pdf",
    mediaSource: "url",
  });

  await Lesson.create({
    course: course4._id,
    chapter: ch2._id,
    title: "Podcast — Penser comme un développeur",
    kind: "audio",
    order: 3,
    duration: 7,
    content: "Comment décomposer un problème avant d'écrire du code.",
    mediaUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    mediaSource: "url",
    transcript:
      "Avant de coder, décrivez le problème en français, identifiez les entrées et les sorties, puis traduisez chaque étape en instructions simples.",
  });

  await Lesson.create({
    course: course4._id,
    chapter: ch2._id,
    title: "Démo vidéo — un mini-projet",
    kind: "video",
    order: 4,
    duration: 14,
    content: "On combine listes, boucles et conditions pour construire une petite application.",
    mediaUrl:
      "https://youtu.be/xLlkIZwASfc",
    mediaSource: "url",
  });

  await Quiz.create({
    course: course4._id,
    chapter: ch2._id,
    kind: "chapter",
    title: "Examen du chapitre 2 : Données et logique",
    passingScore: 60,
    questions: [
      {
        type: "mcq",
        text: "Comment accède-t-on au premier élément d'une liste `fruits` ?",
        options: ["fruits[1]", "fruits[0]", "fruits.first", "fruits(0)"],
        correctIndex: 1,
        explanation: "Les index commencent à 0 en Python.",
      },
      {
        type: "tf",
        text: "Un dictionnaire associe des clés à des valeurs.",
        correctBool: true,
        explanation: "C'est exactement le rôle d'un dictionnaire (clé → valeur).",
      },
      {
        type: "fill",
        text: "Pour ajouter un élément à la fin d'une liste, on utilise la méthode .___().",
        blanks: ["append"],
        explanation: "liste.append(x) ajoute x à la fin de la liste.",
      },
      {
        type: "order",
        text: "Ordonnez les étapes pour parcourir une liste et afficher chaque élément.",
        items: [
          "Créer la liste",
          "Écrire la boucle for",
          "Récupérer l'élément courant",
          "Afficher l'élément avec print()",
        ],
        explanation: "On crée la liste, on itère, on récupère puis on affiche.",
      },
      {
        type: "tf",
        text: "Les index d'une liste Python commencent à 1.",
        correctBool: false,
        explanation: "Ils commencent à 0.",
      },
    ],
  });

  // ===== Examen final =====
  await Quiz.create({
    course: course4._id,
    kind: "final",
    title: "Examen final : Python pour Débutants",
    passingScore: 60,
    timeLimitSec: 30 * 60, // 30 minutes
    questions: [
      {
        type: "mcq",
        text: "Quel type de données utilise des paires clé/valeur ?",
        options: ["list", "tuple", "dict", "set"],
        correctIndex: 2,
        explanation: "Le dictionnaire (dict) stocke des paires clé/valeur.",
      },
      {
        type: "tf",
        text: "La fonction print() peut afficher plusieurs valeurs séparées par des virgules.",
        correctBool: true,
        explanation: "print(a, b) affiche a et b séparés par une espace.",
      },
      {
        type: "fill",
        text: "Une boucle qui répète tant qu'une condition est vraie s'écrit avec le mot-clé ___.",
        blanks: ["while"],
        explanation: "while répète le bloc tant que la condition est vraie.",
      },
      {
        type: "order",
        text: "Remettez dans l'ordre logique l'écriture d'un programme simple.",
        items: [
          "Définir les variables",
          "Écrire la logique (conditions / boucles)",
          "Afficher le résultat",
          "Tester le programme",
        ],
        explanation: "On déclare, on traite, on affiche puis on teste.",
      },
      {
        type: "text",
        text: "Expliquez avec vos propres mots la différence entre une liste et un dictionnaire en Python.",
        expectedAnswer:
          "Une liste est une collection ordonnée accessible par index numérique ; un dictionnaire associe des clés (souvent des chaînes) à des valeurs et n'est pas indexé par position.",
        explanation: "Question à réponse libre — corrigée par l'enseignant.",
      },
    ],
  });

  // --- Course 5: Français débutant (full demo — chapters, all lesson types, chapter & final exams) ---
  const course5 = await Course.create({
    title: "Français pour Débutants",
    description:
      "Apprenez les bases de la langue française : alphabet, salutations, articles et premières phrases. Comprend des leçons texte, PDF, audio et vidéo, deux examens de chapitre et un examen final.",
    category: "Langues",
    level: "Débutant",
    teacher: teacher2._id,
    published: true,
    thumbnail: "https://images.unsplash.com/photo-1431274172761-fca41d930114?w=800",
  });

  // ===== Chapitre 1 =====
  const fch1 = await Chapter.create({
    course: course5._id,
    title: "L'alphabet et les salutations",
    description: "Les lettres, les sons et comment dire bonjour.",
    order: 1,
  });

  const fc1l1 = await Lesson.create({
    course: course5._id,
    chapter: fch1._id,
    title: "L'alphabet et la prononciation",
    kind: "text",
    order: 1,
    duration: 12,
    content: `# L'alphabet français

L'alphabet français compte **26 lettres**, comme l'alphabet anglais, mais la prononciation est différente.

## Les voyelles
**a, e, i, o, u, y** — auxquelles s'ajoutent des accents : é, è, ê, à, ç.

## Quelques salutations
- **Bonjour** : pour dire bonjour en journée
- **Bonsoir** : le soir
- **Salut** : informel, entre amis
- **Au revoir** : pour partir

Astuce : en français, on prononce rarement la dernière consonne d'un mot.`,
  });

  await Lesson.create({
    course: course5._id,
    chapter: fch1._id,
    title: "Fiche des salutations courantes (PDF)",
    kind: "pdf",
    order: 2,
    duration: 8,
    content: "Une fiche à imprimer avec les salutations et formules de politesse essentielles.",
    mediaUrl: "https://parlonsfrancais.francophonie.org/app/uploads/2025/02/Vietnam_Fiches-dactivites_Niveau-A1.1.pdf",
    mediaSource: "url",
  });

  await Lesson.create({
    course: course5._id,
    chapter: fch1._id,
    title: "Écoute — se présenter",
    kind: "audio",
    order: 3,
    duration: 6,
    content: "Écoutez un court dialogue où deux personnes se présentent.",
    mediaUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    mediaSource: "url",
    transcript:
      "— Bonjour ! Je m'appelle Marie. Et vous ? — Bonjour Marie, je m'appelle Paul. Enchanté ! — Enchantée également.",
  });

  await Lesson.create({
    course: course5._id,
    chapter: fch1._id,
    title: "Vidéo — dialogue de présentation",
    kind: "video",
    order: 4,
    duration: 10,
    content: "Regardez une mise en situation : faire connaissance pour la première fois.",
    mediaUrl:
      "https://youtu.be/tCd_4uCD5eo",
    mediaSource: "url",
  });

  await Quiz.create({
    course: course5._id,
    chapter: fch1._id,
    kind: "chapter",
    title: "Examen du chapitre 1 : Alphabet et salutations",
    passingScore: 60,
    questions: [
      {
        type: "mcq",
        text: "Comment dit-on bonjour le soir ?",
        options: ["Bonjour", "Bonsoir", "Salut", "Au revoir"],
        correctIndex: 1,
        explanation: "« Bonsoir » s'emploie le soir.",
      },
      {
        type: "tf",
        text: "L'alphabet français contient 26 lettres.",
        correctBool: true,
        explanation: "Comme l'alphabet latin standard, il compte 26 lettres.",
      },
      {
        type: "fill",
        text: "Pour se présenter, on dit : « Je m'___ Paul ».",
        blanks: ["appelle"],
        explanation: "Le verbe pronominal « s'appeler » : je m'appelle.",
      },
      {
        type: "order",
        text: "Remettez ce mini-dialogue dans l'ordre.",
        items: [
          "Bonjour !",
          "Je m'appelle Marie.",
          "Et vous ?",
          "Je m'appelle Paul, enchanté.",
        ],
        explanation: "On salue, on se présente, on pose la question, l'autre répond.",
      },
      {
        type: "mcq",
        text: "Quelle salutation est informelle (entre amis) ?",
        options: ["Bonjour", "Bonsoir", "Salut", "Au revoir"],
        correctIndex: 2,
        explanation: "« Salut » est familier.",
      },
    ],
  });

  // ===== Chapitre 2 =====
  const fch2 = await Chapter.create({
    course: course5._id,
    title: "Les bases de la grammaire",
    description: "Articles, genre des noms et verbes être et avoir.",
    order: 2,
  });

  const fc2l1 = await Lesson.create({
    course: course5._id,
    chapter: fch2._id,
    title: "Les articles et le genre des noms",
    kind: "text",
    order: 1,
    duration: 18,
    content: `# Les articles

En français, chaque nom a un **genre** : masculin ou féminin.

## Articles définis
- **le** (masculin) : le livre
- **la** (féminin) : la table
- **les** (pluriel) : les livres

## Articles indéfinis
- **un** (masculin) : un chat
- **une** (féminin) : une maison
- **des** (pluriel) : des amis

Astuce : il faut apprendre le genre en même temps que le mot.`,
  });

  await Lesson.create({
    course: course5._id,
    chapter: fch2._id,
    title: "Conjugaison — être et avoir (PDF)",
    kind: "pdf",
    order: 2,
    duration: 9,
    content: "Tableau de conjugaison au présent des deux verbes les plus importants.",
    mediaUrl: "https://ecole-perjakezhelias-cledenpoher.ac-rennes.fr/sites/ecole-perjakezhelias-cledenpoher.ac-rennes.fr/IMG/pdf/conjugaison_mardi_ce2.pdf",
    mediaSource: "url",
  });

  await Lesson.create({
    course: course5._id,
    chapter: fch2._id,
    title: "Écoute — au café",
    kind: "audio",
    order: 3,
    duration: 7,
    content: "Un dialogue pour commander une boisson au café.",
    mediaUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    mediaSource: "url",
    transcript:
      "— Bonjour, je voudrais un café, s'il vous plaît. — Bien sûr. Et avec ceci ? — Ce sera tout, merci. — Voilà, bonne journée !",
  });

  await Lesson.create({
    course: course5._id,
    chapter: fch2._id,
    title: "Vidéo — conjuguer au présent",
    kind: "video",
    order: 4,
    duration: 14,
    content: "Explication visuelle de la conjugaison des verbes être et avoir au présent.",
    mediaUrl:
      "https://youtu.be/5noY8tSjmDk",
    mediaSource: "url",
  });

  await Quiz.create({
    course: course5._id,
    chapter: fch2._id,
    kind: "chapter",
    title: "Examen du chapitre 2 : Grammaire de base",
    passingScore: 60,
    questions: [
      {
        type: "mcq",
        text: "Quel article accompagne un nom féminin singulier défini ?",
        options: ["le", "la", "les", "un"],
        correctIndex: 1,
        explanation: "« la » est l'article défini féminin singulier (la table).",
      },
      {
        type: "tf",
        text: "En français, tous les noms ont un genre (masculin ou féminin).",
        correctBool: true,
        explanation: "Chaque nom est soit masculin, soit féminin.",
      },
      {
        type: "fill",
        text: "Conjuguez le verbe être : « Je ___ étudiant ».",
        blanks: ["suis"],
        explanation: "Je suis, tu es, il/elle est…",
      },
      {
        type: "order",
        text: "Ordonnez la conjugaison du verbe avoir au présent.",
        items: ["j'ai", "tu as", "il a", "nous avons"],
        explanation: "j'ai, tu as, il a, nous avons, vous avez, ils ont.",
      },
      {
        type: "tf",
        text: "L'article « des » est un article indéfini pluriel.",
        correctBool: true,
        explanation: "« des » est la forme indéfinie au pluriel (des amis).",
      },
    ],
  });

  // ===== Examen final =====
  await Quiz.create({
    course: course5._id,
    kind: "final",
    title: "Examen final : Français pour Débutants",
    passingScore: 60,
    timeLimitSec: 30 * 60, // 30 minutes
    questions: [
      {
        type: "mcq",
        text: "Comment se présente-t-on poliment ?",
        options: ["Salut, ça va ?", "Bonjour, je m'appelle…", "Au revoir !", "Merci beaucoup"],
        correctIndex: 1,
        explanation: "« Bonjour, je m'appelle… » est une présentation correcte.",
      },
      {
        type: "tf",
        text: "« le » et « la » sont des articles définis.",
        correctBool: true,
        explanation: "Ce sont les articles définis masculin et féminin.",
      },
      {
        type: "fill",
        text: "Complétez : « Nous ___ des étudiants » (verbe être).",
        blanks: ["sommes"],
        explanation: "Nous sommes (verbe être au présent, 1re personne du pluriel).",
      },
      {
        type: "order",
        text: "Remettez les mots dans l'ordre pour former une phrase correcte.",
        items: ["Je", "voudrais", "un", "café"],
        explanation: "« Je voudrais un café » est l'ordre correct.",
      },
      {
        type: "text",
        text: "Présentez-vous en français en deux ou trois phrases (nom, nationalité, profession ou études).",
        expectedAnswer:
          "Exemple : Bonjour, je m'appelle Aymane. Je suis marocain et je suis étudiant.",
        explanation: "Question à réponse libre — corrigée par l'enseignant.",
      },
    ],
  });

  // --- Course 6: Anglais débutant (full demo — chapters, all lesson types, chapter & final exams) ---
  const course6 = await Course.create({
    title: "Anglais pour Débutants",
    description:
      "Initiez-vous à la langue anglaise : alphabet, salutations, articles et premières phrases. Comprend des leçons texte, PDF, audio et vidéo, deux examens de chapitre et un examen final.",
    category: "Langues",
    level: "Débutant",
    teacher: teacher._id,
    published: true,
    thumbnail: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800",
  });

  // ===== Chapitre 1 =====
  const ech1 = await Chapter.create({
    course: course6._id,
    title: "Greetings and the alphabet",
    description: "L'alphabet, les sons et les salutations de base en anglais.",
    order: 1,
  });

  const ec1l1 = await Lesson.create({
    course: course6._id,
    chapter: ech1._id,
    title: "The alphabet and basic greetings",
    kind: "text",
    order: 1,
    duration: 12,
    content: `# The English alphabet

L'alphabet anglais compte **26 lettres**. La prononciation diffère du français.

## Greetings (salutations)
- **Hello** : bonjour (général)
- **Good morning** : bonjour (le matin)
- **Good evening** : bonsoir
- **Hi** : salut (informel)
- **Goodbye / Bye** : au revoir

## Se présenter
- **My name is Paul.** : Je m'appelle Paul.
- **Nice to meet you.** : Enchanté.`,
  });

  await Lesson.create({
    course: course6._id,
    chapter: ech1._id,
    title: "Common greetings sheet (PDF)",
    kind: "pdf",
    order: 2,
    duration: 8,
    content: "Une fiche récapitulative des salutations et formules de politesse en anglais.",
    mediaUrl: "https://anglais-rapide.fr/wp-content/uploads/2016/05/Les-salutations-en-anglais.pdf",
    mediaSource: "url",
  });

  await Lesson.create({
    course: course6._id,
    chapter: ech1._id,
    title: "Listening — introducing yourself",
    kind: "audio",
    order: 3,
    duration: 6,
    content: "Écoutez un court dialogue de présentation en anglais.",
    mediaUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    mediaSource: "url",
    transcript:
      "— Hello! My name is Mary. What's your name? — Hi Mary, my name is Paul. Nice to meet you! — Nice to meet you too.",
  });

  await Lesson.create({
    course: course6._id,
    chapter: ech1._id,
    title: "Video — meeting someone",
    kind: "video",
    order: 4,
    duration: 10,
    content: "Regardez une mise en situation : faire connaissance en anglais.",
    mediaUrl:
      "https://youtu.be/W1lkd62mLd4",
    mediaSource: "url",
  });

  await Quiz.create({
    course: course6._id,
    chapter: ech1._id,
    kind: "chapter",
    title: "Examen du chapitre 1 : Greetings",
    passingScore: 60,
    questions: [
      {
        type: "mcq",
        text: "Comment dit-on « bonjour le matin » en anglais ?",
        options: ["Good night", "Good morning", "Goodbye", "Good evening"],
        correctIndex: 1,
        explanation: "« Good morning » s'emploie le matin.",
      },
      {
        type: "tf",
        text: "« Hi » est une salutation informelle.",
        correctBool: true,
        explanation: "« Hi » est l'équivalent familier de « Hello ».",
      },
      {
        type: "fill",
        text: "Pour se présenter, on dit : « My ___ is Paul ».",
        blanks: ["name"],
        explanation: "« My name is… » = « Je m'appelle… ».",
      },
      {
        type: "order",
        text: "Remettez ce mini-dialogue dans l'ordre.",
        items: [
          "Hello!",
          "My name is Mary.",
          "What's your name?",
          "My name is Paul, nice to meet you.",
        ],
        explanation: "On salue, on se présente, on demande, l'autre répond.",
      },
      {
        type: "mcq",
        text: "Que signifie « Nice to meet you » ?",
        options: ["Au revoir", "Enchanté", "Merci", "S'il vous plaît"],
        correctIndex: 1,
        explanation: "« Nice to meet you » = « Enchanté ».",
      },
    ],
  });

  // ===== Chapitre 2 =====
  const ech2 = await Chapter.create({
    course: course6._id,
    title: "Basic grammar",
    description: "Les articles a / an / the et le verbe « to be ».",
    order: 2,
  });

  const ec2l1 = await Lesson.create({
    course: course6._id,
    chapter: ech2._id,
    title: "Articles and the verb \"to be\"",
    kind: "text",
    order: 1,
    duration: 18,
    content: `# Articles and the verb "to be"

## Les articles
- **a** : devant un son consonne — *a cat*
- **an** : devant un son voyelle — *an apple*
- **the** : article défini — *the book*

## Le verbe "to be" (être)
- I **am** — je suis
- You **are** — tu es / vous êtes
- He / She / It **is** — il / elle est
- We / They **are** — nous / ils sommes / sont

Exemple : *I am a student.* (Je suis étudiant.)`,
  });

  await Lesson.create({
    course: course6._id,
    chapter: ech2._id,
    title: "Conjugation of \"to be\" (PDF)",
    kind: "pdf",
    order: 2,
    duration: 9,
    content: "Tableau de conjugaison du verbe « to be » au présent.",
    mediaUrl: "https://www.regent.edu/wp-content/uploads/2021/10/Regent-Writing-Lab-To-Be-Verbs.pdf",
    mediaSource: "url",
  });

  await Lesson.create({
    course: course6._id,
    chapter: ech2._id,
    title: "Listening — at the shop",
    kind: "audio",
    order: 3,
    duration: 7,
    content: "Un dialogue pour faire un achat simple en anglais.",
    mediaUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    mediaSource: "url",
    transcript:
      "— Hello, how much is this? — It's five dollars. — Here you are. — Thank you, have a nice day!",
  });

  await Lesson.create({
    course: course6._id,
    chapter: ech2._id,
    title: "Video — the present simple",
    kind: "video",
    order: 4,
    duration: 14,
    content: "Explication visuelle du présent simple et du verbe « to be ».",
    mediaUrl:
      "https://youtu.be/nvVdIJ0las0",
    mediaSource: "url",
  });

  await Quiz.create({
    course: course6._id,
    chapter: ech2._id,
    kind: "chapter",
    title: "Examen du chapitre 2 : Basic grammar",
    passingScore: 60,
    questions: [
      {
        type: "mcq",
        text: "Quel article place-t-on devant « apple » ?",
        options: ["a", "an", "the", "aucun"],
        correctIndex: 1,
        explanation: "« an » précède un son voyelle : an apple.",
      },
      {
        type: "tf",
        text: "« I am » signifie « je suis ».",
        correctBool: true,
        explanation: "« to be » = être ; I am = je suis.",
      },
      {
        type: "fill",
        text: "Conjuguez « to be » : « She ___ a teacher ».",
        blanks: ["is"],
        explanation: "He / she / it → is.",
      },
      {
        type: "order",
        text: "Ordonnez les mots pour former « I am a student ».",
        items: ["I", "am", "a", "student"],
        explanation: "Sujet + verbe + article + nom.",
      },
      {
        type: "tf",
        text: "On utilise « a » devant un son voyelle.",
        correctBool: false,
        explanation: "Devant un son voyelle on utilise « an ».",
      },
    ],
  });

  // ===== Examen final =====
  await Quiz.create({
    course: course6._id,
    kind: "final",
    title: "Examen final : Anglais pour Débutants",
    passingScore: 60,
    timeLimitSec: 30 * 60, // 30 minutes
    questions: [
      {
        type: "mcq",
        text: "Comment se présente-t-on poliment en anglais ?",
        options: ["Goodbye!", "Hello, my name is…", "Thank you", "See you"],
        correctIndex: 1,
        explanation: "« Hello, my name is… » est une présentation correcte.",
      },
      {
        type: "tf",
        text: "« the » est l'article défini en anglais.",
        correctBool: true,
        explanation: "« the » correspond à « le / la / les ».",
      },
      {
        type: "fill",
        text: "Complétez : « We ___ students » (verbe to be).",
        blanks: ["are"],
        explanation: "We / you / they → are.",
      },
      {
        type: "order",
        text: "Remettez les mots dans l'ordre pour former une question correcte.",
        items: ["What", "is", "your", "name"],
        explanation: "« What is your name? » est l'ordre correct.",
      },
      {
        type: "text",
        text: "Présentez-vous en anglais en deux ou trois phrases (nom, nationalité, profession ou études).",
        expectedAnswer:
          "Exemple : Hello, my name is Aymane. I am Moroccan and I am a student.",
        explanation: "Question à réponse libre — corrigée par l'enseignant.",
      },
    ],
  });

  // Enroll student in course 1
  await Enrollment.create({
    student: student._id,
    course: course1._id,
    completedLessons: [l1._id],
    progress: 33,
  });

  // Enroll student in the English demo course (first lesson of each chapter done)
  await Enrollment.create({
    student: student._id,
    course: course6._id,
    completedLessons: [ec1l1._id, ec2l1._id],
    progress: 25,
  });

  // Enroll student in the French demo course (first lesson of each chapter done)
  await Enrollment.create({
    student: student._id,
    course: course5._id,
    completedLessons: [fc1l1._id, fc2l1._id],
    progress: 25,
  });

  // Enroll student in the full Python demo course (first lesson of each chapter done)
  await Enrollment.create({
    student: student._id,
    course: course4._id,
    completedLessons: [c1l1._id, c2l1._id],
    progress: 25,
  });

  console.log("✅ Données de démo créées :");
  console.log("   Admin    : admin@HtLearn.edu / admin123");
  console.log("   Prof     : mohammed@HtLearn.edu / teacher123");
  console.log("   Prof     : taha@HtLearn.edu / teacher123");
  console.log("   Étudiant : aymane@HtLearn.edu / student123");
  console.log("");
  console.log("   Cours démo complets (chapitres, leçons texte/PDF/audio/vidéo,");
  console.log("   examens de chapitre + examen final) :");
  console.log("      • « Python pour Débutants »   (prof M. Mohammed)");
  console.log("      • « Français pour Débutants » (prof M. Taha)");
  console.log("      • « Anglais pour Débutants »  (prof M. Mohammed)");

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
