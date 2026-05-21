# Summary of Changes - New Agents Added

## ✅ What Was Created

### 1. New Agent Files
- ✅ `agents/avis-google.js` - Google review request agent
- ✅ `agents/rentabilite-chantier.js` - Profitability analysis agent

### 2. Updated Files
- ✅ `cron.js` - Added schedules for both new agents
- ✅ `package.json` - Added test commands: `test:avis` and `test:rentabilite`
- ✅ `supabase-schema.sql` - Added new columns to chantiers table

### 3. New Documentation Files
- ✅ `NEW-AGENTS-README.md` - Complete documentation for both agents
- ✅ `SETUP-NEW-AGENTS.md` - Step-by-step setup guide
- ✅ `CHANGES-SUMMARY.md` - This file
- ✅ `migrations/add-chantiers-columns.sql` - Database migration script
- ✅ `test-data-new-agents.sql` - Test data for trying out the agents

---

## 🗄️ Database Changes Required

### New Columns Added to `chantiers` Table:

| Column | Type | Default | Purpose |
|--------|------|---------|---------|
| `telephone` | VARCHAR(20) | NULL | Client phone for SMS |
| `avis_demande` | BOOLEAN | false | Tracks if Google review was requested |
| `heures_travaillees` | NUMERIC | 0 | Hours worked on chantier |
| `depenses` | NUMERIC | 0 | Total expenses (materials, etc.) |

**New Index:**
- `idx_chantiers_avis_demande` on `avis_demande` column

---

## 📅 New Cron Schedules

| Time | Agent | Action |
|------|-------|--------|
| 7h00 | Daily Briefing | Morning summary |
| 8h00 (Mon) | Calcul CA | Weekly revenue |
| **9h00** | **Avis Google** ⭐ | **Request Google reviews** |
| 20h00 | Relance Devis | Follow up quotes |
| **21h00** | **Rentabilité** 💰 | **Analyze profitability** |
| Every 6h | Urgent Alert | Alert >7 day quotes |

---

## 🚀 How to Activate

### Step 1: Run Database Migration
```bash
# Open Supabase SQL Editor and run:
migrations/add-chantiers-columns.sql
```

### Step 2: (Optional) Add Test Data
```bash
# In Supabase SQL Editor, run:
test-data-new-agents.sql
```

### Step 3: Test the Agents
```bash
npm run test:avis          # Should find completed chantiers
npm run test:rentabilite   # Should analyze ongoing chantiers
```

### Step 4: Start the System
```bash
npm start                  # All 6 agents now active
```

---

## 🎯 What Each Agent Does

### Agent Avis Google (9h00 daily)

**Triggers:** When `chantiers.statut = 'termine'` AND `avis_demande = false`

**Process:**
1. Fetches completed chantiers without review requests
2. Uses Claude AI to generate personalized SMS messages
3. Sends via Telegram with:
   - Client name and phone number
   - Suggested SMS text
   - Google review link
4. Marks chantier as `avis_demande = true`

**Example Output:**
```
⭐ DEMANDE AVIS GOOGLE

📋 Client : Fontaine Marc
💰 Montant du chantier : 14000€
📞 Téléphone : 0632333435

📱 Message SMS à envoyer :
Je voulais vous remercier pour votre confiance sur ce
projet de 14000€. Si vous êtes satisfait du résultat,
votre avis Google serait très apprécié !
https://g.page/r/patrick-maconnerie/review
```

---

### Agent Rentabilité (21h00 daily)

**Triggers:** All `chantiers.statut = 'en_cours'`

**Calculates:**
- `coût_main_oeuvre = heures_travaillees × 45€/h`
- `coût_total = coût_main_oeuvre + depenses`
- `marge_réelle = montant_devis - coût_total`
- `marge_% = (marge_réelle / montant_devis) × 100`

**Alerts:**
- 🔴 **marge < 15%** → CRITICAL (stop losses immediately)
- 🟠 **marge 15-25%** → WARNING (improve efficiency)
- 🟢 **marge > 25%** → SUCCESS (maintain good work)

**Example Output:**
```
🔴 ALERTE CRITIQUE - RENTABILITÉ

📋 Chantier : Rousseau Pierre
💰 Montant devis : 12000€

📊 Coûts actuels :
• Main d'œuvre : 150h × 45€ = 6750€
• Dépenses : 3500€
• Total coûts : 10250€

💸 Marge réelle : 1750€ (14.6%)

🔍 Analyse :
Ce chantier est en difficulté avec une marge critique de 14.6%.
Arrêtez immédiatement tout dépassement d'heures et renégociez
les prix fournisseurs si possible. Action urgente requise.
```

---

## 📊 Key Features

### Avis Google Agent
✅ Fully automated Google review requests
✅ Personalized messages using AI
✅ Never asks the same client twice
✅ Includes client phone for easy SMS sending
✅ Professional, friendly tone

### Rentabilité Agent
✅ Real-time profitability tracking
✅ Color-coded alerts (red/orange/green)
✅ AI-generated recommendations
✅ Prevents losses before they happen
✅ Helps maintain 25%+ margins

---

## 🧪 Test Commands

```bash
npm run test:avis          # Test Google review agent
npm run test:rentabilite   # Test profitability agent
npm run test:relance       # Test quote follow-ups
npm run test:ca            # Test revenue calculation
```

---

## 📚 Documentation Files

- `NEW-AGENTS-README.md` → Full feature documentation
- `SETUP-NEW-AGENTS.md` → Step-by-step setup guide
- `CHANGES-SUMMARY.md` → This file (what changed)

---

## ⚡ Next Steps

1. ✅ Database migration (required)
2. ✅ Add test data (optional)
3. ✅ Test both agents
4. ✅ Start the cron system
5. 🎉 Enjoy automated review requests and profitability monitoring!

---

## 🎯 Expected Results

After setup, you'll have:

1. **Automatic Google Reviews**
   - Requests sent the day after chantier completion
   - More 5-star reviews → Better online reputation

2. **Real-Time Profitability**
   - Daily insights into every ongoing chantier
   - Early warning system for unprofitable work
   - Data-driven decisions to maintain margins

3. **Complete Automation**
   - 6 agents running 24/7
   - No manual intervention needed
   - Full visibility via Telegram

---

## 🔥 Pro Tips

1. **Update hours/expenses daily** for accurate profitability
2. **Add phone numbers** to all completed chantiers
3. **Customize Google review link** to your actual business page
4. **Adjust margin thresholds** if 15%/25% doesn't fit your business model
5. **Monitor Telegram** for all agent notifications

---

## 🎉 Success!

Your agent system now has 6 fully autonomous agents working for you:

1. ☀️ Daily Briefing (7h00)
2. 📊 Weekly Revenue (8h00 Mon)
3. ⭐ **Google Reviews (9h00)** - NEW!
4. 📞 Quote Follow-ups (20h00)
5. 💰 **Profitability (21h00)** - NEW!
6. 🚨 Urgent Alerts (every 6h)

Welcome to fully automated construction business management! 🚀
