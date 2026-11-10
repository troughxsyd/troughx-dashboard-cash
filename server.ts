import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Gemini AI Budget Analysis endpoint
app.post('/api/analyze-budget', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY is not configured on the server. Please configure it in AI Studio secrets.',
      });
    }

    const { budgetData, promptContext } = req.body;

    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = `You are the financial modeling and event cashflow intelligence engine for TROUGH X SYDNEY, located at 273 Crown Street, Surry Hills NSW 2010.

### Venue Operational Constraints
- Total Licensed Capacity: Strictly capped at 300 persons maximum (one-in, one-out once reached).
- Basement Occupancy Limit: Strictly capped at 60 persons maximum (one-in, one-out once reached).
- Beverage Cost of Goods Sold (COGS) Target: Strictly capped at or below 22.0% of bar gross turnover.
- Superannuation Guarantee: 11.5% applied to all non-contracted/eligible employees.

### Staffing Roster & IFA Wage Rates (BOOT Test Compliant)
- Venue Duty Manager: $55.00/hr (super eligible) — Licensing, Clover POS reporting, incident escalation.
- Assistant Lead / Floor Supervisor: $55.00/hr (super eligible) — Basement 60-pax capacity control, door sync.
- Senior Bartenders: $45.00/hr (super eligible) — Main bar & basement bar service.
- Door / Ticket Scanners & Cloak Attendants: $35.00/hr (super eligible).
- Floor Support / Glassies / Amenities: $35.00/hr (super eligible).
- Post-Event Bio Cleaning Crew: $35.00/hr (super eligible).
- Crowd Control / Security: $55.00/hr (contracted agency, super exempt) — 1:100 ratio (2 guards up to 250 pax, 3 guards at 250+ pax).
- Dedicated Trained On-Site Medic: $50.00/hr (contracted, super exempt) — Harm minimisation room.

### Commercial Operating Models
1. Promoter Hosted Night ($5.00 Ticket Clip):
   - Venue Retains: Flat $5.00 clip per ticket sold + 100% of beverage bar turnover + 100% of cloakroom receipts ($5.00/item).
   - Venue Absorbs: Complete operational staffing roster (all wages), merchant processing (1.5%), and waste reinstatement.
   - Promoter Retains: Remaining ticket balance; promoter pays talent/DJs, sound, external marketing.
   - Breakeven Metric: Base breakeven is exactly 144 attendees. With the mandatory $550 booking deposit collected, breakeven lowers to 121 attendees.
2. Trough Owned Party (100% Revenue Retention):
   - Venue Retains: 100% ticket revenue, 100% bar revenue, 100% cloak receipts.
   - Venue Covers: All operational wages, beverage COGS, payment processing (2.5%), and direct overheads (DJs ~$900, AV engineer ~$350, marketing ~$400, staging ~$250).

### Objectives
Provide strict mathematical analysis, contribution margin percentages, wage ratios, breakeven thresholds, and risk audits. Always highlight whether a proposed night meets the target wage threshold (<30% for owned, <50% for hosted). Format your response with clear markdown headers, bullet points, exact dollar figures (AUD $), and percentages.`;

    const userPrompt = `Analyze the following Trough X Sydney (273 Crown St, Surry Hills) Event Financial & Roster Model:
${JSON.stringify(budgetData, null, 2)}

User Request / Audit Focus:
${promptContext || 'Perform a full mathematical audit of this event night, evaluating contribution margin %, wage ratio compliance (<30% Owned / <50% Hosted), COGS <=22% compliance, 250+ pax security trigger, basement 60-pax control, and breakeven thresholds.'}

Provide:
1. Executive Financial Verdict & Compliance Status (Wage Ratio % vs Target, Beverage COGS % vs 22% Cap, Security 1:100 Ratio & Basement 60-Pax Control)
2. Contribution Margin & Unit Economics Breakdown (Per-Attendee Venue Yield, Variable Costs, Net Contribution per Head)
3. Breakeven Analysis (Exact Breakeven Pax without deposit vs with $550 booking deposit for Promoter Hosted, or full overhead breakeven for Trough Owned)
4. Roster & IFA Wage Optimization (Superannuation 11.5% impact, shift length efficiency, 250-pax 3rd guard step-cost analysis)
5. Actionable Recommendations for Brent & Venue Operations at 273 Crown St.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userPrompt,
      config: {
        systemInstruction,
        temperature: 0.2,
      },
    });

    const reply = response.text || 'Unable to generate analysis at this time.';

    return res.json({ analysis: reply });
  } catch (error: any) {
    console.error('Error during budget analysis:', error);
    return res.status(500).json({
      error: error?.message || 'Internal server error while analyzing budget.',
    });
  }
});

async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${port}`);
  });
}

startServer();
