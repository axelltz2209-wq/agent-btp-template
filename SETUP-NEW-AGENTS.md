# Setup Guide for New Agents

## ⚠️ Important: Database Migration Required

The new agents require additional columns in the `chantiers` table. Follow these steps to activate them.

---

## 📋 Step-by-Step Setup

### Step 1: Run Database Migration

Go to your Supabase dashboard → SQL Editor → New query

Copy and paste this SQL:

```sql
-- Add telephone column
ALTER TABLE chantiers
ADD COLUMN IF NOT EXISTS telephone VARCHAR(20);

-- Add avis_demande column (for tracking Google review requests)
ALTER TABLE chantiers
ADD COLUMN IF NOT EXISTS avis_demande BOOLEAN DEFAULT false;

-- Add heures_travaillees column (for profitability calculations)
ALTER TABLE chantiers
ADD COLUMN IF NOT EXISTS heures_travaillees NUMERIC DEFAULT 0;

-- Add depenses column (for profitability calculations)
ALTER TABLE chantiers
ADD COLUMN IF NOT EXISTS depenses NUMERIC DEFAULT 0;

-- Create index for avis_demande to speed up queries
CREATE INDEX IF NOT EXISTS idx_chantiers_avis_demande ON chantiers(avis_demande);

-- Update existing records to set default values
UPDATE chantiers
SET
  avis_demande = COALESCE(avis_demande, false),
  heures_travaillees = COALESCE(heures_travaillees, 0),
  depenses = COALESCE(depenses, 0)
WHERE avis_demande IS NULL
   OR heures_travaillees IS NULL
   OR depenses IS NULL;
```

Click **Run** to execute.

---

### Step 2: (Optional) Add Test Data

To test the agents with realistic data, run this SQL:

```sql
-- Add completed chantiers for testing avis-google agent
INSERT INTO chantiers (client_nom, montant_devis, date_debut, statut, telephone, avis_demande, heures_travaillees, depenses)
VALUES
  ('Fontaine Marc', 14000.00, CURRENT_DATE - INTERVAL '30 days', 'termine', '0632333435', false, 95, 1200),
  ('Beaumont Claire', 8500.00, CURRENT_DATE - INTERVAL '25 days', 'termine', '0636373839', false, 62, 950);

-- Add chantiers en cours with varying profitability
INSERT INTO chantiers (client_nom, montant_devis, date_debut, statut, telephone, heures_travaillees, depenses, avis_demande)
VALUES
  ('Rousseau Pierre', 12000.00, CURRENT_DATE - INTERVAL '15 days', 'en_cours', '0624252627', 150, 3500, false),
  ('Legrand Julie', 18000.00, CURRENT_DATE - INTERVAL '10 days', 'en_cours', '0628293031', 220, 3200, false),
  ('Lambert Sophie', 25000.00, CURRENT_DATE - INTERVAL '12 days', 'en_cours', '0640414243', 180, 2500, false);
```

This will add:
- **2 completed chantiers** → Will trigger avis-google agent
- **3 ongoing chantiers** → Will be analyzed by rentabilite agent:
  - Rousseau Pierre: ~14.6% margin (🔴 CRITICAL)
  - Legrand Julie: ~27.2% margin (🟢 SUCCESS)
  - Lambert Sophie: ~57.6% margin (🟢 EXCELLENT)

---

### Step 3: Test the Agents

Once the database is updated, test both agents:

```bash
# Test Google review requests
npm run test:avis

# Test profitability analysis
npm run test:rentabilite
```

Expected output:

**Agent Avis Google:**
- Should find 2 completed chantiers (Fontaine Marc, Beaumont Claire)
- Generate personalized SMS messages with Claude
- Send Telegram notifications with client phone numbers
- Mark chantiers as `avis_demande = true`

**Agent Rentabilité:**
- Should find 3 chantiers en cours
- Calculate real margins for each
- Send alerts:
  - 🔴 RED alert for Rousseau Pierre (low margin)
  - 🟢 GREEN confirmations for the others
- Include Claude-generated recommendations

---

### Step 4: Start the Cron System

Once tests pass, start the automated system:

```bash
npm start
```

All 6 agents will now run on their schedules:
- ✅ 7h00: Daily Briefing
- ✅ 8h00 (Mondays): Weekly Revenue
- ✅ 9h00: Google Review Requests ⭐ NEW
- ✅ 20h00: Quote Follow-ups
- ✅ 21h00: Profitability Analysis 💰 NEW
- ✅ Every 6h: Urgent Alerts

---

## 🔧 Updating Chantier Data

### For Profitability Tracking

Update chantiers regularly with actual hours and expenses:

```sql
-- Example: Update hours worked and expenses
UPDATE chantiers
SET
  heures_travaillees = 95,
  depenses = 1250.50
WHERE client_nom = 'Durand Marie' AND statut = 'en_cours';
```

You can also do this programmatically or through the dashboard.

### When a Chantier is Completed

Change the status to trigger the avis-google agent:

```sql
UPDATE chantiers
SET statut = 'termine'
WHERE client_nom = 'Durand Marie';
```

The next day at 9h00, the agent will automatically request a Google review.

---

## 🎯 What Happens Next

### Avis Google Agent (9h00 daily)
1. Checks for newly completed chantiers
2. Generates personalized SMS for each
3. Sends to Telegram with client phone number
4. You manually send the SMS to the client
5. Agent marks it as processed to avoid duplicates

### Rentabilité Agent (21h00 daily)
1. Analyzes all ongoing chantiers
2. Calculates real-time profitability
3. Sends color-coded alerts:
   - 🔴 Critical: Take action immediately
   - 🟠 Warning: Monitor closely
   - 🟢 Success: Keep up the good work
4. Provides AI-generated recommendations

---

## 📊 Dashboard Integration

The new columns are already integrated in the updated schema. If you rebuild the dashboard, you can add:

1. **Profitability widget** showing real-time margins
2. **Review tracking** showing which clients were asked for reviews
3. **Hours/expenses input forms** for easy updates

---

## ⚡ Quick Troubleshooting

**Error: "column chantiers.avis_demande does not exist"**
→ You need to run Step 1 (database migration)

**Agent finds 0 chantiers**
→ Make sure you have data with the right status:
- `statut = 'termine'` and `avis_demande = false` for avis agent
- `statut = 'en_cours'` for rentabilite agent

**No Telegram messages**
→ Check your `.env` file has correct Telegram credentials

---

## 🎉 You're All Set!

Your agents are now fully autonomous and will:
- ✅ Request reviews automatically
- ✅ Monitor profitability in real-time
- ✅ Alert you to problems before they become losses
- ✅ Help you maintain healthy margins on every chantier

Questions? Check `NEW-AGENTS-README.md` for detailed documentation.
