# 🏗️ Agent BTP Template - Système d'Agents IA

Système automatisé d'agents IA pour gérer les devis et chantiers dans le secteur BTP.

## 📋 Fonctionnalités

### 🤖 Agents Intelligents

#### Agent 1 : Relance des Devis
- **Fréquence** : Tous les soirs à 20h00
- **Fonction** : Identifie les devis en attente depuis plus de 3 jours
- **Action** : Génère un message de relance personnalisé avec Claude et l'envoie sur Telegram

#### Agent 2 : Calcul du CA Hebdomadaire
- **Fréquence** : Tous les lundis à 8h00
- **Fonction** : Calcule le chiffre d'affaires prévu pour la semaine
- **Action** : Génère un résumé motivant avec Claude et l'envoie sur Telegram

### 📊 Dashboard Next.js
- Vue d'ensemble des devis en attente
- Statistiques du CA prévu
- Liste des chantiers à venir
- Interface moderne et responsive

## ⚡ Démarrage Rapide

1. **Installez les dépendances** : `npm install`
2. **Configurez Supabase** :
   - Exécutez `supabase-schema.sql` ➡️ Crée les tables
   - Exécutez `supabase-rls-policies.sql` ➡️ **IMPORTANT** pour débloquer l'accès aux données
3. **Configurez .env** : Copiez `.env.example` et remplissez les valeurs
4. **Testez la connexion** : `npm run test:db`
5. **Lancez les agents** : `npm start`

> ⚠️ **Problème courant** : Si les agents trouvent 0 devis, c'est que `supabase-rls-policies.sql` n'a pas été exécuté !

## 🚀 Installation Détaillée

### 1. Prérequis

- Node.js 18+ installé
- Un compte Supabase
- Une clé API Claude (Anthropic)
- Un bot Telegram

### 2. Configuration de Supabase

1. Créez un nouveau projet sur [Supabase](https://supabase.com)
2. Dans l'éditeur SQL de Supabase, exécutez **dans l'ordre** :
   - **D'abord** : `supabase-schema.sql` (crée les tables et données de test)
   - **Ensuite** : `supabase-rls-policies.sql` (configure les politiques de sécurité)
3. Notez votre `SUPABASE_URL` et `SUPABASE_ANON_KEY`

> ⚠️ **IMPORTANT** : Les deux scripts SQL sont nécessaires ! Le second configure les politiques RLS qui permettent à l'application de lire/écrire les données.

### 3. Configuration de Claude API

1. Créez un compte sur [Anthropic](https://console.anthropic.com/)
2. Générez une clé API
3. Notez votre `ANTHROPIC_API_KEY`

### 4. Configuration du Bot Telegram

1. Créez un bot via [@BotFather](https://t.me/botfather) sur Telegram
2. Notez le token du bot (`TELEGRAM_BOT_TOKEN`)
3. Démarrez une conversation avec votre bot
4. Récupérez votre `TELEGRAM_CHAT_ID` en visitant :
   ```
   https://api.telegram.org/bot<VOTRE_TOKEN>/getUpdates
   ```
   (Envoyez un message à votre bot puis visitez ce lien)

### 5. Installation des dépendances

#### Backend (Agents)
```bash
npm install
```

#### Dashboard
```bash
cd dashboard
npm install
```

### 6. Configuration des variables d'environnement

#### Pour le backend
Copiez `.env.example` vers `.env` et remplissez les valeurs :
```bash
cp .env.example .env
```

Éditez `.env` :
```env
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_ANON_KEY=votre-cle-supabase
ANTHROPIC_API_KEY=sk-ant-votre-cle-anthropic
TELEGRAM_BOT_TOKEN=votre-token-telegram
TELEGRAM_CHAT_ID=votre-chat-id
NODE_ENV=development
```

#### Pour le dashboard
```bash
cd dashboard
cp .env.local.example .env.local
```

Éditez `dashboard/.env.local` :
```env
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-cle-supabase
```

## 🎯 Utilisation

### Démarrer les agents

#### Mode production (avec cron)
```bash
npm start
```

#### Mode développement (avec hot-reload)
```bash
npm run dev
```

### Tester la connexion Supabase

Avant de lancer les agents, testez votre connexion à Supabase :
```bash
npm run test:db
```

Ce test vérifie :
- ✅ La connexion à Supabase
- ✅ L'accès aux tables `devis` et `chantiers`
- ✅ Les politiques RLS
- ✅ Les données présentes dans la base

### Tester les agents individuellement

#### Test de l'agent de relance
```bash
npm run test:relance
```

#### Test de l'agent de calcul CA
```bash
npm run test:ca
```

### Démarrer le dashboard

#### Mode développement
```bash
cd dashboard
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

#### Mode production
```bash
cd dashboard
npm run build
npm start
```

## 📁 Structure du Projet

```
agent-btp-test/
├── agents/                     # Agents IA
│   ├── relance-devis.js       # Agent de relance des devis
│   └── calcul-ca.js           # Agent de calcul CA
├── lib/                        # Modules utilitaires
│   ├── supabase.js            # Client Supabase
│   ├── claude.js              # Client Claude API
│   └── telegram.js            # Client Telegram
├── dashboard/                  # Dashboard Next.js
│   ├── app/                   # Pages et composants
│   ├── package.json
│   └── .env.local.example
├── cron.js                     # Planificateur cron
├── package.json
├── .env.example
├── supabase-schema.sql        # Schéma de base de données
├── supabase-rls-policies.sql  # Politiques de sécurité RLS
└── README.md
```

## 🗄️ Base de Données

### Tables

#### `devis`
- `id` : UUID (clé primaire)
- `client_nom` : Nom du client
- `montant` : Montant du devis
- `date_envoi` : Date d'envoi du devis
- `statut` : Statut (en_attente, accepte, refuse)
- `telephone` : Numéro de téléphone du client

#### `chantiers`
- `id` : UUID (clé primaire)
- `client_nom` : Nom du client
- `montant_devis` : Montant du chantier
- `date_debut` : Date de début du chantier
- `statut` : Statut (prevu, en_cours, termine)

## 🔧 Configuration des Cron Jobs

Les tâches planifiées sont configurées dans `cron.js` :

```javascript
// Agent Relance : tous les jours à 20h00
cron.schedule('0 20 * * *', ...)

// Agent CA : tous les lundis à 8h00
cron.schedule('0 8 * * 1', ...)
```

Pour modifier les horaires, éditez les expressions cron selon vos besoins.

## 📱 Notifications Telegram

Les agents envoient automatiquement des notifications sur Telegram :

- ✅ Message de démarrage du système
- 🔔 Relances de devis avec messages personnalisés
- 📊 Résumés hebdomadaires du CA
- ⚠️ Alertes en cas d'erreur

## 🛠️ Dépannage

### Les agents ne s'exécutent pas
- Vérifiez que le processus `npm start` est bien actif
- Vérifiez les logs dans la console
- Vérifiez que les variables d'environnement sont correctement configurées

### Erreur de connexion Supabase
- Vérifiez que `SUPABASE_URL` et `SUPABASE_ANON_KEY` sont corrects
- Vérifiez que les tables existent dans Supabase
- Vérifiez que les RLS (Row Level Security) sont désactivées ou correctement configurées

### L'agent trouve 0 devis/chantiers alors qu'il y en a dans la base
**Cause** : Les politiques RLS (Row Level Security) bloquent la lecture des données.

**Solution** :
1. Allez dans l'éditeur SQL de Supabase
2. Exécutez le fichier `supabase-rls-policies.sql`
3. Vérifiez que les politiques sont créées avec :
   ```sql
   SELECT * FROM pg_policies WHERE tablename IN ('devis', 'chantiers');
   ```
4. Vous devriez voir 8 politiques au total (4 par table)

**Alternative** : Désactiver complètement RLS (non recommandé en production) :
```sql
ALTER TABLE devis DISABLE ROW LEVEL SECURITY;
ALTER TABLE chantiers DISABLE ROW LEVEL SECURITY;
```

### Messages Telegram non reçus
- Vérifiez que le bot est bien démarré (envoyez `/start` au bot)
- Vérifiez que le `TELEGRAM_CHAT_ID` est correct
- Testez manuellement avec :
  ```bash
  curl "https://api.telegram.org/bot<TOKEN>/sendMessage?chat_id=<CHAT_ID>&text=Test"
  ```

### Erreur Claude API
- Vérifiez que votre clé API est valide
- Vérifiez que vous avez des crédits API disponibles
- Vérifiez les limites de taux de votre plan

## 🚀 Déploiement en Production

### Option 1 : VPS/Serveur dédié

1. Installez Node.js et npm sur le serveur
2. Clonez le projet
3. Configurez les variables d'environnement
4. Installez les dépendances
5. Utilisez PM2 pour gérer le processus :
   ```bash
   npm install -g pm2
   pm2 start cron.js --name "agent-btp-template"
   pm2 save
   pm2 startup
   ```

### Option 2 : Docker

Créez un `Dockerfile` :
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npm", "start"]
```

Construisez et lancez :
```bash
docker build -t agent-btp-template .
docker run -d --env-file .env agent-btp-template
```

## 📝 Licence

MIT

## 👨‍💻 Auteur

Projet template pour entrepreneurs du BTP avec ❤️
