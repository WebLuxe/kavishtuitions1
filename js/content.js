/* ─────────────────────────────────────────────────────────────
   EDIT THIS FILE to update Kavish's details, credentials and lessons.
   Everything here appears on the site by itself.
   ───────────────────────────────────────────────────────────── */
var PDF = "FILE_ID_HERE";   // Google Drive file ID for the notes PDF
var YT  = "M7lc1UVf-VE";    // YouTube video ID (this is a sample video, not a real lesson)
function lesson(name, free) { return { n: name, pdf: PDF, yt: YT, free: !!free }; }

window.KT = {
  /* ── Contact ── */
  name: "Kavish Sunassee",
  phone: "+230 5923 8436",
  whatsapp: "23059238436",
  email: "",              // add an email here and it appears on the site automatically

  /* ── Photo: upload it to images/ and write the path, e.g. "images/kavish.jpg" ── */
  photo: "",

  /* ── Exams: month is 0-based, so 10 = November ── */
  examMonth: 10,
  examDay: 1,

  /* ── Paste your real Google client ID and the sign-in button appears by itself ── */
  googleClientId: "YOUR_GOOGLE_CLIENT_ID",

  /* ── Unlock keys. Anyone can read these in the page source. ── */
  keys: ["KAVISH-DEMO"],

  /* ── Experience: newest first ── */
  experience: [
    { role: "Maths & Add Maths Tutor", place: "KavishTuitions, Moka", when: "2017 to present",
      note: "Teaching Grade 9 NCE through to HSC / A-Level, with video lessons, notes and worked solutions." }
    /* Add more like this:
    ,{ role: "Job title", place: "School or company", when: "2015 to 2017", note: "One line about it." } */
  ],

  /* ── Credentials: replace these with the real ones.
        An entry with slot: true shows as an empty space waiting to be filled. ── */
  education: [
    { title: "Degree", place: "University", when: "Year", slot: true },
    { title: "Teaching qualification", place: "Institution", when: "Year", slot: true }
  ],
  certifications: [
    { title: "Certificate or award", place: "Issued by", when: "Year", slot: true },
    { title: "Certificate or award", place: "Issued by", when: "Year", slot: true }
  ],

  /* ── Lessons. "id" shows in the link. "key" must stay the same or saved progress is lost. ── */
  levels: [
    { id: "nce", key: "Grade 9 · NCE", label: "Grade 9", exam: "NCE", lessons: [
      lesson("Number & Fractions", 1), lesson("Algebra Basics", 1),
      lesson("Geometry & Angles"), lesson("Statistics & Probability")
    ]},
    { id: "sc", key: "Grade 10–11 · SC / IGCSE", label: "Grades 10–11", exam: "SC / IGCSE", lessons: [
      lesson("Quadratic Functions", 1), lesson("Trigonometry"),
      lesson("Add Maths: Differentiation"), lesson("Add Maths: Vectors"), lesson("Circle Theorems")
    ]},
    { id: "hsc", key: "Grade 12–13 · HSC / A-Level", label: "Grades 12–13", exam: "HSC / A-Level", lessons: [
      lesson("Pure: Calculus", 1), lesson("Pure: Sequences & Series"),
      lesson("Mechanics: Kinematics"), lesson("Mechanics: Forces"), lesson("Statistics: Distributions")
    ]}
  ],

  /* ── Short posts on the homepage. Tap one to read it. ── */
  posts: [
    { title: "Nobody is bad at maths",
      lead: "Maths isn't about being smart.",
      body: ["Maths isn't about being “smart”. It's about clear explanations and practice.",
             "When a student tells me they're bad at maths, what they usually mean is that somebody moved on too fast and nobody went back. So that's what I do. I go back, patiently, one step at a time."] },
    { title: "Ask the silly question",
      lead: "The one you're embarrassed to ask is the one that matters.",
      body: ["The question you're embarrassed to ask is usually the one holding everything else up, and half the class is wondering the same thing.",
             "Never be afraid to ask it. If you'd rather not ask out loud, ask me on WhatsApp."] },
    { title: "Why I show every step",
      lead: "A skipped line is where marks get lost.",
      body: ["My videos break problems down step by step, my notes are clean and to the point, and every worked solution shows exactly how to score full marks.",
             "A skipped line is where students get lost, so I never skip one."] }
  ]
};
