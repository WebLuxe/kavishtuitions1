# KavishTuitions

Maths and Add Maths tuition with Kavish Sunassee, Moka, Mauritius.

A fast static site with no framework and no server. GSAP handles motion, and a small custom WebGL engine draws the 3D world.

## Everyday edits

Almost everything lives in **`js/content.js`**, and changes appear on the site by themselves:

| To change | Edit |
| --- | --- |
| Phone, WhatsApp, email | `phone`, `whatsapp`, `email` |
| Kavish's photo | Upload to `images/`, then set `photo: "images/kavish.jpg"` |
| Qualifications and certificates | `education`, `certifications`. Replace the title, place and year, and delete `slot: true` |
| Work history | `experience` |
| Lessons, videos and notes | `levels`. Set `PDF` and `YT`, or give a lesson its own IDs |
| Unlock keys | `keys` |
| Homepage posts | `posts` |

## Editing page text or layout

| To change | Edit |
| --- | --- |
| Words and structure of a page | `src/sections/` |
| Colours | The `TOKENS` list at the top of `src/make.js` |
| Spacing and layout | `src/css/site.css` |
| Behaviour | `src/js/app.js` |
| The maths figures | `src/js/figs.js` |
| The 3D world | `src/js/cosmos.js` |

After editing any of these, rebuild:

```
npm install
npm run build
```

The build writes the pages in the top folder, plus `css/site.css`, `js/site.min.js` and `sw.js`. They are committed because GitHub Pages serves them directly, so edit the files in `src/`, not these.

## How it's put together

- `index.html` (profile), `tuition.html`, `courses.html`, `lab.html`, `pricing.html` and `contact.html` are real pages that work on their own.
- With JavaScript on, only the page content is swapped, so the 3D canvas and dock never reload.
- Every page is a stack of full-screen sections with a scroll lock. One swipe, wheel notch or arrow key moves exactly one section.
- Each section measures itself and fills its screen. Text grows on large screens. On small ones, optional text hides and the layout tightens so nothing is cut off.
- `sw.js` stores the site after the first visit, so repeat visits open instantly and pages work offline. Its cache name changes with every build, so visitors get updates by themselves.
- If WebGL, JavaScript or a script file fails, the pages are still readable.

## Known limit

There is no backend, so unlock keys and video IDs can be read in the page source. Protecting paid lessons properly needs a server.
