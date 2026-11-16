# Brief: write demo notes for one course of the Kavish Maths tuition site

Kavish Maths is a Maths / Add Maths tuition site in Mauritius. Chapters are listed in
`src/syllabus.js` (read it; your course is identified by its `id`). Every chapter needs
original study notes that the build renders into a 2–3 page A4 PDF.

## Step 1: verify the chapter list (use WebSearch / WebFetch)
Check your course's chapters against the official syllabus (Cambridge 2025–2027 syllabus
documents for 4024 / 4037 / 9709; for Grade 9 NCE, the Mauritius MIE / MES Grade 9
curriculum). Look for missing topics, removed topics, or wrong names. Do NOT copy wording
from the syllabus or any other source into notes.

## Step 2: write the notes
ORIGINAL writing only, in your own words, own examples, own numbers. Never copy or
paraphrase closely from websites, textbooks, Save My Exams, PMT, past papers etc.
Write like a friendly, sharp Mauritian tutor talking to a 15–18 year old: clear, short sentences.

Mathematical accuracy is critical. Work every example and every practice answer out
fully, then check it a second time (substitute back, recompute). Prefer nice numbers.

## Output: write ONE JSON file at the path given in your task. Shape:
{
  "course": "<course id>",
  "verified": "1–3 sentences: what official source you checked and what you found",
  "suggestedChanges": [ "plain sentences: add/remove/rename chapters or subtopics, with reason" ],
  "chapters": {
    "<exact chapter title as in src/syllabus.js>": {
      "summary": "1–2 sentences: what this chapter is about and why it matters",
      "sections": [ { "h": "heading", "body": ["paragraph or bullet", "..."], "formulas": ["optional key results"] } ],
      "examples": [ { "q": "question", "steps": ["step 1", "step 2", "..."], "answer": "final answer" } ],
      "practice": [ { "q": "question", "a": "answer" } ],
      "tip": "one exam tip or common mistake"
    }
  }
}
Sizes per chapter: 2–4 sections (2–4 body items each), 2–3 examples (3–6 steps each),
4–6 practice questions. Keep it to what fits in about 2–3 A4 pages.

## Maths notation (plain text, the renderer handles these)
- Use real Unicode: × ÷ − ± ≤ ≥ ≠ ≈ √ π θ α β ° ∞ ∫ Σ → ∴ ² ³ ½ ¼ ¾
- Other powers / indices: x^{4}, e^{2x}, a_{n}, log_{2} 8. Braces required.
- Fractions inline: (x + 1)/(x − 2) or 3/4.
- **bold** for key words. No LaTeX, no HTML, no Markdown headings.
- Diagrams are not possible; describe in words where needed.

Validate the JSON parses (e.g. node -e "JSON.parse(require('fs').readFileSync(PATH,'utf8'))")
before finishing. Every chapter title in your course must have an entry, spelled exactly.
Your final reply: just the suggestedChanges list and any doubts about accuracy (short).
