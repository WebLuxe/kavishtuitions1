/* ─────────────────────────────────────────────────────────────
   EVERY CHAPTER ON THE SITE, by grade and course.

   Adding real notes: put the PDF in notes/<course id>/ and name it
   like the chapter, e.g. notes/o-maths/16-variation.pdf. Run the build.
   The build prints which chapters have real notes and which still show a sample.
   Files with other names (like class notes) go in the chapter's  files  list.

   Chapter fields: [title, [what it covers], options]
     options.free  : true  → open to everyone without an unlock key
     options.yt    : "ID"  → a YouTube video for that chapter
     options.files : more notes for the chapter, e.g. class notes, as
                     [["file name.pdf", "Label shown on the site"], ...]

   Changing a chapter title changes its file name and resets saved progress for it.
   ───────────────────────────────────────────────────────────── */

/* Where the notes are served from. "notes/" = this website (GitHub Pages).
   To move them to Cloudflare R2 later, put the bucket's public address here,
   e.g. "https://notes.kavishtuitions.com/", and upload the notes/ folder there. */
const NOTES_BASE = 'notes/';

const DEMO_VIDEO = 'M7lc1UVf-VE'; // sample video, not a real lesson

const stages = [
  {
    id: 'g9', label: 'Grade 9', exam: 'NCE',
    courses: [
      { id: 'nce-maths', name: 'Mathematics', board: 'National Certificate of Education', code: 'NCE',
        note: 'Follows the Grade 9 NCE topic areas. Kavish adjusts the order to the school year.',
        parts: [
          ['Number', [
            ['Integers and real numbers', ['Directed numbers', 'Rational and irrational numbers', 'Order of operations'], { free: true, yt: DEMO_VIDEO }],
            ['Fractions, decimals and percentages', ['Converting between forms', 'Recurring decimals', 'Percentage change'], { free: true }],
            ['Ratio, rate and proportion', ['Sharing in a ratio', 'Speed and other rates', 'Direct proportion']],
            ['Indices and standard form', ['Laws of indices', 'Zero and negative indices', 'Standard form']],
            ['Approximation and estimation', ['Decimal places and significant figures', 'Estimating calculations']],
            ['Consumer arithmetic', ['Profit and loss', 'Simple and compound interest', 'VAT, discount and hire purchase']]
          ]],
          ['Algebra', [
            ['Algebraic expressions', ['Expanding brackets', 'Factorising common terms', 'Substitution']],
            ['Linear equations and inequalities', ['Solving linear equations', 'Forming equations', 'Inequalities on a number line']],
            ['Simultaneous equations', ['Elimination', 'Substitution', 'Word problems']],
            ['Sequences and patterns', ['Term-to-term rules', 'The nth term']],
            ['Sets', ['Set notation', 'Venn diagrams', 'Union, intersection and complement']],
            ['Linear graphs', ['Tables of values', 'Gradient and intercept', 'y = mx + c']]
          ]],
          ['Geometry and measure', [
            ['Angles and polygons', ['Angles on parallel lines', 'Interior and exterior angles']],
            ['Constructions and loci', ['Bisectors', 'Constructing triangles', 'Scale drawings']],
            ['Pythagoras’ theorem', ['Finding a side', 'Problems in context']],
            ['Congruence and similarity', ['Congruent triangles', 'Similar shapes and scale factors']],
            ['Transformations', ['Reflection and rotation', 'Translation and enlargement']],
            ['Mensuration', ['Area of plane shapes', 'Circles', 'Volume and surface area of prisms']]
          ]],
          ['Statistics and probability', [
            ['Statistics', ['Collecting and presenting data', 'Mean, median, mode and range']],
            ['Probability', ['The probability scale', 'Listing outcomes', 'Relative frequency']]
          ]]
        ] }
    ]
  },
  {
    id: 'sc', label: 'Grades 10–11', exam: 'SC / O Level',
    courses: [
      { id: 'o-maths', name: 'Mathematics', board: 'Cambridge O Level Mathematics', code: '4024',
        note: 'Taught over Grades 10 and 11 for the School Certificate.',
        parts: [
          ['Number', [
            ['Types of number', ['Primes, factors and multiples', 'HCF and LCM', 'Rational and irrational numbers'], { free: true, yt: DEMO_VIDEO }],
            ['Sets', ['Set notation', 'Venn diagrams with two and three sets'], { free: true }],
            ['Powers, roots and indices', ['Squares, cubes and roots', 'Laws of indices', 'Fractional indices']],
            ['Fractions, decimals and percentages', ['Equivalence and ordering', 'Calculations without a calculator']],
            ['Standard form and estimation', ['Standard form', 'Rounding and estimating']],
            ['Limits of accuracy', ['Upper and lower bounds', 'Bounds in calculations']],
            ['Ratio, proportion and rates', ['Ratio', 'Rates and speed', 'Best buys']],
            ['Percentages and money', ['Percentage increase and decrease', 'Reverse percentages', 'Simple and compound interest', 'Exponential growth and decay']],
            ['Surds', ['Simplifying surds', 'Rationalising the denominator']]
          ]],
          ['Algebra and graphs', [
            ['Algebraic manipulation', ['Expanding', 'Factorising', 'Changing the subject']],
            ['Algebraic fractions', ['Simplifying', 'Adding and subtracting', 'Equations with fractions']],
            ['Linear and simultaneous equations', ['Linear equations', 'Simultaneous linear equations', 'One linear and one quadratic']],
            ['Quadratic equations', ['Factorising', 'The quadratic formula', 'Completing the square']],
            ['Inequalities', ['Solving linear inequalities', 'Regions on a graph']],
            ['Sequences', ['Linear and quadratic sequences', 'The nth term']],
            ['Variation', ['Direct variation', 'Inverse variation', 'Finding the constant']],
            ['Functions', ['Function notation', 'Composite functions', 'Inverse functions']],
            ['Graphs of functions', ['Quadratic, cubic and reciprocal graphs', 'Exponential graphs', 'Solving equations with graphs', 'Gradient of a curve']],
            ['Graphs in practical situations', ['Distance–time graphs', 'Speed–time graphs', 'Conversion graphs']]
          ]],
          ['Coordinate geometry', [
            ['Straight-line graphs', ['Gradient and length of a line', 'Midpoint', 'Equation of a line', 'Parallel and perpendicular lines']]
          ]],
          ['Geometry', [
            ['Geometrical terms and constructions', ['Constructions with ruler and compasses', 'Scale drawings', 'Bearings']],
            ['Similarity and congruence', ['Similar triangles', 'Areas and volumes of similar shapes', 'Congruent triangles']],
            ['Angle properties', ['Parallel lines', 'Polygons', 'Symmetry']],
            ['Circle theorems', ['Angles in circles', 'Tangents and chords', 'Cyclic quadrilaterals']]
          ]],
          ['Mensuration', [
            ['Perimeter and area', ['Plane shapes', 'Arcs and sectors', 'Compound shapes']],
            ['Surface area and volume', ['Prisms and cylinders', 'Pyramids, cones and spheres']]
          ]],
          ['Trigonometry', [
            ['Pythagoras and right-angled triangles', ['Pythagoras’ theorem', 'Sine, cosine and tangent', 'Angles of elevation and depression']],
            ['Non-right-angled triangles', ['The sine rule', 'The cosine rule', 'Area = ½ab sin C', 'Problems in three dimensions']]
          ]],
          ['Transformations and vectors', [
            ['Transformations', ['Reflection, rotation, translation', 'Enlargement', 'Describing a transformation fully']],
            ['Vectors', ['Vector notation', 'Adding and scaling vectors', 'Vector geometry']]
          ]],
          ['Probability and statistics', [
            ['Probability', ['Single and combined events', 'Tree diagrams', 'Conditional probability']],
            ['Statistical diagrams and averages', ['Bar charts, pie charts and scatter diagrams', 'Averages from tables']],
            ['Cumulative frequency and histograms', ['Cumulative frequency curves', 'Median and quartiles', 'Histograms with unequal widths']]
          ]]
        ] },
      { id: 'add-maths', name: 'Add Maths', board: 'Cambridge O Level Additional Mathematics', code: '4037',
        note: 'Taken alongside O Level Mathematics in Grades 10 and 11.',
        parts: [
          ['Algebra', [
            ['Functions', ['Domain and range', 'Composite and inverse functions', 'Modulus functions'], { free: true, yt: DEMO_VIDEO }],
            ['Quadratic functions', ['Completing the square', 'The discriminant', 'Quadratic inequalities'], { free: true }],
            ['Factors of polynomials', ['The remainder theorem', 'The factor theorem', 'Solving cubic equations']],
            ['Equations, inequalities and graphs', ['Modulus equations and inequalities', 'Sketching cubic graphs']],
            ['Simultaneous equations', ['One linear and one non-linear equation']],
            ['Logarithmic and exponential functions', ['Laws of logarithms', 'Solving exponential equations', 'Graphs of eˣ and ln x']]
          ]],
          ['Geometry and trigonometry', [
            ['Straight-line graphs', ['Converting to linear form', 'Midpoints, gradients and lengths']],
            ['Coordinate geometry of the circle', ['Equation of a circle', 'Intersections of lines and circles']],
            ['Circular measure', ['Radians', 'Arc length and sector area']],
            ['Trigonometry', ['The six trigonometric functions', 'Graphs of trigonometric functions', 'Identities and equations'], { free: true, files: [
              ['G10 AM 09.10.26.pdf', 'Class notes, 9 Oct: equations, sec, cosec and cot'],
              ['G10 AM 14.10.26.pdf', 'Class notes, 14 Oct: solving equations, identities'],
              ['G10 AM 15.10.26-1.pdf', 'Class notes, 15 Oct: proving identities']
            ] }]
          ]],
          ['Counting and series', [
            ['Permutations and combinations', ['Arrangements', 'Selections']],
            ['Series', ['The binomial expansion', 'Arithmetic progressions', 'Geometric progressions']]
          ]],
          ['Vectors and calculus', [
            ['Vectors in two dimensions', ['Position vectors', 'Unit vectors and magnitude', 'Relative velocity']],
            ['Differentiation', ['Product, quotient and chain rules', 'Tangents and normals', 'Stationary points', 'Rates of change']],
            ['Integration', ['Indefinite integrals', 'Definite integrals', 'Area under a curve']],
            ['Kinematics', ['Displacement, velocity and acceleration with calculus']]
          ]]
        ] }
    ]
  },
  {
    id: 'hsc', label: 'Grades 12–13', exam: 'HSC / A Level',
    courses: [
      { id: 'p1', name: 'Pure 1', board: 'Cambridge A Level Mathematics, Paper 1', code: '9709',
        note: 'Usually taken in Grade 12 for the AS part of HSC.',
        parts: [['Pure Mathematics 1', [
          ['Quadratics', ['Completing the square', 'The discriminant', 'Quadratic inequalities'], { free: true, yt: DEMO_VIDEO }],
          ['Functions', ['Domain and range', 'Composite and inverse functions', 'Transformations of graphs'], { free: true }],
          ['Coordinate geometry', ['Straight lines', 'Equation of a circle', 'Intersections']],
          ['Circular measure', ['Radians', 'Arc length and sector area']],
          ['Trigonometry', ['Exact values', 'Graphs and inverse functions', 'Identities and equations']],
          ['Series', ['The binomial expansion', 'Arithmetic and geometric progressions', 'Sum to infinity']],
          ['Differentiation', ['The chain rule', 'Tangents and normals', 'Stationary points', 'Connected rates of change']],
          ['Integration', ['Integration as the reverse of differentiation', 'Definite integrals', 'Areas and volumes of revolution']]
        ]]] },
      { id: 'p3', name: 'Pure 3', board: 'Cambridge A Level Mathematics, Paper 3', code: '9709',
        note: 'Usually taken in Grade 13 for the full A Level.',
        parts: [['Pure Mathematics 3', [
          ['Algebra', ['Modulus', 'Polynomial division', 'Partial fractions', 'Binomial series'], { free: true }],
          ['Logarithmic and exponential functions', ['Laws of logarithms', 'Linear forms', 'Equations and inequalities']],
          ['Trigonometry', ['sec, cosec and cot', 'Compound and double angle formulae', 'R cos(θ − α)']],
          ['Differentiation', ['Products, quotients and the chain rule', 'Implicit and parametric differentiation']],
          ['Integration', ['Standard integrals', 'Integration by parts', 'Substitution', 'Partial fractions']],
          ['Numerical solution of equations', ['Locating roots', 'Iteration']],
          ['Vectors', ['Lines in three dimensions', 'Scalar product', 'Intersections and angles']],
          ['Differential equations', ['Separating variables', 'Forming equations from context']],
          ['Complex numbers', ['Arithmetic of complex numbers', 'The Argand diagram', 'Modulus–argument form', 'Loci']]
        ]]] },
      { id: 'm1', name: 'Mechanics', board: 'Cambridge A Level Mathematics, Mechanics', code: '9709',
        parts: [['Mechanics', [
          ['Forces and equilibrium', ['Resolving forces', 'Friction', 'Equilibrium of a particle'], { free: true }],
          ['Kinematics of motion in a straight line', ['Displacement–time and velocity–time graphs', 'Constant acceleration equations', 'Variable acceleration']],
          ['Momentum', ['Conservation of momentum', 'Collisions']],
          ['Newton’s laws of motion', ['F = ma', 'Connected particles', 'Pulleys and inclined planes']],
          ['Energy, work and power', ['Work done', 'Kinetic and potential energy', 'Power']]
        ]]] },
      { id: 's1', name: 'Statistics', board: 'Cambridge A Level Mathematics, Probability & Statistics 1', code: '9709',
        parts: [['Probability & Statistics 1', [
          ['Representation of data', ['Stem-and-leaf, box plots and histograms', 'Measures of centre and spread'], { free: true }],
          ['Permutations and combinations', ['Arrangements with restrictions', 'Selections']],
          ['Probability', ['Addition and multiplication rules', 'Conditional probability', 'Independent events']],
          ['Discrete random variables', ['Probability distributions', 'Expectation and variance', 'Binomial and geometric distributions']],
          ['The normal distribution', ['Standardising', 'Using tables', 'Normal approximation to the binomial']]
        ]]] }
    ]
  }
];

module.exports = { NOTES_BASE, stages };
