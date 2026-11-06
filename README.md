# KavishTuitions

Maths and Add Maths tuition with Kavish Sunassee, Moka, Mauritius.

A fast static site: no framework, no server. GSAP, ScrollTrigger and Lenis handle motion, and a small custom WebGL engine (`js/cosmos.js`) draws the 3D world.

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

Page bodies are in `src/pages/`, and the shared header, dock and intro are in `src/build.js`. After editing either, rebuild the pages:

```
node src/build.js
```

Colours and spacing are at the top of `css/site.css`.

## How it's put together

- `index.html` profile, `tuition.html`, `courses.html`, `lab.html`, `pricing.html`, `contact.html` are real pages that work on their own.
- With JavaScript on, `js/app.js` swaps only the page content, so the 3D canvas and dock never reload.
- If WebGL, JavaScript or a script file fails, the pages are still readable.

## Known limit

There is no backend, so unlock keys and video IDs can be read in the page source. Protecting paid lessons properly needs a server.
