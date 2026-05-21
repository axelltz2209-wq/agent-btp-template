# New Agents Documentation

## 🆕 Recently Added Agents

### 1. Agent Avis Google (Google Reviews)

**Purpose:** Automatically request Google reviews from clients when their chantiers are completed.

**Schedule:** Daily at 9h00

**How it works:**
1. Checks for chantiers with `statut = "termine"` and `avis_demande = false`
2. For each completed chantier:
   - Generates a personalized SMS message using Claude AI
   - Sends the message via Telegram with client info and phone number
   - Includes the Google review link
   - Marks the chantier as `avis_demande = true` to avoid duplicates

**Database columns added to `chantiers` table:**
- `avis_demande` (BOOLEAN, default false) - Tracks if review was requested
- `telephone` (VARCHAR(20)) - Client phone number for SMS

**Test command:**
```bash
npm run test:avis
```

---

### 2. Agent Rentabilité Chantier (Profitability Analysis)

**Purpose:** Monitor and analyze the profitability of ongoing chantiers in real-time.

**Schedule:** Daily at 21h00

**How it works:**
1. Fetches all chantiers with `statut = "en_cours"`
2. For each chantier, calculates:
   - `coût_main_oeuvre = heures_travaillees × 45€/h`
   - `coût_total = coût_main_oeuvre + depenses`
   - `marge_réelle = montant_devis - coût_total`
   - `marge_% = (marge_réelle / montant_devis) × 100`
3. Sends alerts based on margin:
   - 🔴 **CRITICAL** (marge < 15%): Immediate action required
   - 🟠 **WARNING** (marge 15-25%): Attention needed
   - 🟢 **SUCCESS** (marge > 25%): Good profitability
4. Uses Claude AI to generate recommendations for each chantier

**Database columns added to `chantiers` table:**
- `heures_travaillees` (NUMERIC, default 0) - Total hours worked
- `depenses` (NUMERIC, default 0) - Total expenses (materials, etc.)

**Test command:**
```bash
npm run test:rentabilite
```

---

## 🗄️ Database Migration

To add the new columns to your Supabase database, run the migration:

```bash
# Connect to your Supabase project and run:
psql your_connection_string < migrations/add-chantiers-columns.sql
```

Or manually execute the SQL from the Supabase SQL Editor.

---

## 📊 Test Data

To populate test data for the new agents:

```bash
# Run this SQL in your Supabase SQL Editor:
psql your_connection_string < test-data-new-agents.sql
```

This will add:
- 2 completed chantiers for testing the Avis Google agent
- 3 chantiers en cours with varying profitability levels for testing the Rentabilité agent

---

## 🚀 All Scheduled Agents

| Agent | Schedule | Purpose |
|-------|----------|---------|
| Daily Briefing | 7h00 daily | Morning summary with key metrics |
| Calcul CA | Mondays 8h00 | Weekly revenue forecast |
| Avis Google | 9h00 daily | Request Google reviews for completed work |
| Relance Devis | 20h00 daily | Follow up on pending quotes |
| Rentabilité | 21h00 daily | Profitability analysis of ongoing work |
| Urgent Alert | Every 6h | Alert for quotes waiting >7 days |

---

## 🧪 Testing All Agents

```bash
# Test individual agents
npm run test:relance       # Test quote follow-ups
npm run test:ca            # Test revenue calculation
npm run test:avis          # Test Google review requests ⭐ NEW
npm run test:rentabilite   # Test profitability analysis 💰 NEW

# Start the cron system
npm start
```

---

## 💡 Tips

### Avis Google Agent
- Make sure to add phone numbers to completed chantiers
- The agent automatically marks chantiers to avoid duplicate requests
- Review link should be updated to your actual Google Business profile

### Rentabilité Agent
- Update `heures_travaillees` and `depenses` regularly for accurate analysis
- Red alerts (< 15% margin) require immediate attention
- Use recommendations from Claude to improve profitability

---

## 🔧 Customization

### Modify margin thresholds
Edit `agents/rentabilite-chantier.js`:
```javascript
// Current thresholds
if (margePct < 15) {       // RED - Critical
  status = 'danger'
} else if (margePct < 25) { // ORANGE - Warning
  status = 'warning'
} else {                    // GREEN - Success
  status = 'success'
}
```

### Modify hourly rate
Edit `agents/rentabilite-chantier.js`:
```javascript
// Current rate: 45€/h
const coutMainOeuvre = (chantier.heures_travaillees || 0) * 45
```

### Change Google review link
Edit `agents/avis-google.js`:
```javascript
// Update with your actual Google Business link
'[VOTRE_LIEN_GOOGLE_REVIEW]'
```
