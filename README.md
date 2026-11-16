# Kavish Maths

Maths and Add Maths tuition with Kavish Sunassee, Moka, Mauritius.

A fast static site with no framework and no server. GSAP handles the intro and small motion. The only 3D is the pair of cubes in the homepage hero, which the browser draws by itself.

## Everyday edits

Almost everything lives in **`js/content.js`**, and changes appear on the site by themselves:

| To change | Edit |
| --- | --- |
| Phone, WhatsApp, email | `phone`, `whatsapp`, `email` |
| Kavish's photo | Upload to `images/`, then set `photo: "images/kavish.jpg"` |
| Qualifications and certificates | `education`, `certifications`. Replace the title, place and year, and delete `slot: true`. They stay hidden until then |
| Unlock keys | `keys` |

## Chapters and notes

| To change | Do this |
| --- | --- |
| Chapters, free chapters, videos | Edit `src/syllabus.js`, then rebuild |
| Add a chapter's notes | Put the PDF in `notes/<course>/` named like `16-variation.pdf`, then rebuild |
| Add class notes with any name | Put them in `notes/<course>/` and list them in that chapter's `files` in `src/syllabus.js` |

The build prints which chapters have real notes. Every chapter without them gets a labelled sample PDF in `notes/samples/`, made by the build. Notes open in a reader inside the site (PDF.js, copied to `js/pdf/` by the build), so they work on phones. To serve notes from Cloudflare R2 later, change `NOTES_BASE` in `src/syllabus.js`.

## Editing page text or layout

| To change | Edit |
| --- | --- |
| Words and structure of a page | `src/sections/` |
| Colours | The `TOKENS` list at the top of `src/make.js` |
| Spacing and layout | `src/css/site.css` |
| Behaviour | `src/js/app.js` |

After editing any of these, rebuild:

```
npm install
npm run build
```

The build writes the pages in the top folder, plus `css/site.css`, `js/site.min.js` and `sw.js`. They are committed because GitHub Pages serves them directly, so edit the files in `src/`, not these.

## How it's put together

- `index.html` (home), `courses.html`, `pricing.html`, `lab.html` and `contact.html` are real pages that work on their own.
- `tuition.html` only forwards old links to the "How it works" part of the homepage.
- With JavaScript on, only the page content is swapped, so the top bar and phone menu never reload.
- Pages scroll normally. Each section eases in the first time it is seen.
- The full intro plays on a first visit to the homepage. After that a short one plays.
- `sw.js` stores the site after the first visit, so repeat visits open instantly and pages work offline. Its cache name changes with every build, so visitors get updates by themselves.
- If WebGL, JavaScript or a script file fails, the pages are still readable.

## Known limit

There is no backend, so unlock keys, video IDs and the notes PDFs can all be reached by anyone who reads the page source. Protecting paid notes properly needs a server, for example Cloudflare R2 behind a Worker that checks the key.
