/**
 * Google Gemini 1.5 Flash AI Pitch Generator (Free Tier)
 * Generates hyper-personalized cold outreach angles based on real lead data.
 */

const generateAiPitch = async ({
  businessName,
  category,
  city,
  rating,
  reviews,
  senderName = 'Outreach Specialist',
  tone = 'professional',
}) => {
  const apiKey = process.env.GEMINI_API_KEY;

  const prompt = `You are a cold email outreach specialist writing a high-converting email to a local business that does not currently have an active website.

Business Information:
- Business Name: ${businessName}
- Category / Industry: ${category || 'Local Business'}
- City: ${city || 'your city'}
- Google Rating: ${rating ? `${rating} / 5 stars` : 'Not listed'}
- Total Google Reviews: ${reviews ? `${reviews} customer reviews` : 'Not listed'}
- Sender Name: ${senderName}
- Tone: ${tone} (e.g., professional, friendly, direct)

Requirements:
1. Provide a catchy, non-spammy Subject Line.
2. Provide a 3-4 sentence personalized email body.
3. Mention their specific reputation or neighborhood context (e.g., praise their customer reviews or highlight local search volume).
4. Point out the exact opportunity they are missing by not having an active website (e.g., online bookings, showcasing their work).
5. Propose a casual, zero-pressure call-to-action (e.g., "Would you like me to send over a 1-minute visual concept?").
6. Return JSON format with keys: "subject" and "body". Do not include markdown code block backticks if possible.`;

  if (apiKey) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              responseMimeType: 'application/json',
            },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          try {
            const parsed = JSON.parse(rawText.trim());
            return {
              success: true,
              mode: 'GEMINI_AI',
              subject: parsed.subject,
              body: parsed.body,
            };
          } catch (e) {
            // If json parse failed, use extracted text
            return {
              success: true,
              mode: 'GEMINI_AI',
              subject: `Website proposal for ${businessName}`,
              body: rawText,
            };
          }
        }
      } else {
        const errData = await response.text();
        console.warn('[Gemini API Warning]', errData);
      }
    } catch (err) {
      console.error('[Gemini Service Error]', err.message);
      if (err.name === 'AbortError') {
        console.warn('[Gemini API Warning] Request timed out after 8s, falling back to smart heuristic.');
      } else {
        console.error('[Gemini Service Error]', err.message);
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // Smart Heuristic Personalization Fallback (100% Free, Zero Setup)
  let openingHook = `I noticed that ${businessName} in ${city || 'your area'} doesn't currently have an active website.`;
  if (rating && rating >= 4.5 && reviews && reviews > 30) {
    openingHook = `Congratulations on maintaining an impressive ${rating}-star rating with over ${reviews} reviews on Google Maps! Your local reputation in ${city || 'the area'} is clearly stellar, but potential new customers searching online still can't find a dedicated website for ${businessName}.`;
  } else if (reviews && reviews > 10) {
    openingHook = `I came across ${businessName} while researching top-rated ${category || 'local businesses'} in ${city || 'the area'} and noticed your strong customer reviews. However, I noticed you don't have an active website yet.`;
  }

  const subject = `Quick question regarding website for ${businessName}`;
  const body = `Hi ${businessName},

${openingHook}

Most local customers looking for ${category || 'your services'} prefer to check services, business hours, and request appointments directly online before visiting. A clean, mobile-friendly website would help you capture more of that inbound demand.

I put together a free 1-minute visual concept preview of what a modern site could look like for ${businessName}. Would you be open to taking a quick look?

Best regards,
${senderName}`;

  return {
    success: true,
    mode: 'SMART_HEURISTIC',
    subject,
    body,
    note: apiKey ? undefined : 'Add GEMINI_API_KEY in server/.env to unlock Google Gemini Flash AI generation.',
  };
};

module.exports = {
  generateAiPitch,
};

