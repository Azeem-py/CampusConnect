import { PrismaClient, Role, PostStatus, ReportReason, ReportStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('--- STARTING DATABASE SEEDING ---');

  // 1. Clean up database
  console.log('Cleaning up existing data...');
  await prisma.report.deleteMany({});
  await prisma.pollVote.deleteMany({});
  await prisma.pollOption.deleteMany({});
  await prisma.poll.deleteMany({});
  await prisma.event.deleteMany({});
  await prisma.vote.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.post.deleteMany({});
  await prisma.businessProfile.deleteMany({});
  await prisma.user.deleteMany({});
  console.log('Cleanup completed successfully.');

  // 2. Hash Password (rounds = 12, matching NestJS backend auth controller)
  console.log('Hashing default user password...');
  const passwordHash = await bcrypt.hash('Password123#', 12);
  console.log('Password hashed successfully.');

  // 3. Define premium user accounts
  const usersToCreate = [
    {
      email: 'alice.johnson@mit.edu',
      name: 'Alice Johnson',
      username: 'alice_phys',
      password: passwordHash,
      role: Role.STUDENT,
      school: 'Massachusetts Institute of Technology',
      department: 'Physics',
      major: 'Physics & Quantum Engineering',
      graduationYear: 2027,
      bio: 'Quantum computing enthusiast 🌌 Researching superconducting qubits, topological insulators, and non-Abelian anyon braiding. Let\'s make physics elegant.',
      interests: 'Quantum Computing, Condensed Matter Physics, Topological Insulators, LaTeX, Classical Music',
      hobby: 'Stargazing, Chess, Violin',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      banner: 'https://images.unsplash.com/photo-1564981797816-1043664bf78d?w=800&auto=format&fit=crop&q=80',
      reputationScore: 125,
    },
    {
      email: 'bob.chen@mit.edu',
      name: 'Bob Chen',
      username: 'bob_cs',
      password: passwordHash,
      role: Role.STUDENT,
      school: 'Massachusetts Institute of Technology',
      department: 'Computer Science',
      major: 'Computer Science',
      graduationYear: 2026,
      bio: 'Ph.D. candidate in Deep Learning. Focus on Large Language Models, attention mechanisms, hardware acceleration, and training stability. Optimizing the future.',
      interests: 'Deep Learning, NLP, Transformers, PyTorch, High-Performance Computing',
      hobby: 'Biking, Hacking open-source, Specialty Coffee Roasting',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      banner: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=80',
      reputationScore: 98,
    },
    {
      email: 'charlie.davis@stanford.edu',
      name: 'Charlie Davis',
      username: 'charlie_math',
      password: passwordHash,
      role: Role.STUDENT,
      school: 'Stanford University',
      department: 'Mathematics',
      major: 'Mathematics',
      graduationYear: 2028,
      bio: 'Undergrad obsessed with prime numbers, algebraic geometry, and Riemann surfaces. There is a special geometry in everything. Math is the cosmos talking.',
      interests: 'Number Theory, Algebraic Geometry, Graph Theory, Complex Analysis, LaTeX',
      hobby: 'Baking sourdough, Go (Weiqi), Rubik\'s Cubes',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      banner: 'https://images.unsplash.com/photo-1501290741922-b56c0d0884af?w=800&auto=format&fit=crop&q=80',
      reputationScore: 140,
    },
    {
      email: 'diana.prince@stanford.edu',
      name: 'Diana Prince',
      username: 'diana_phys',
      password: passwordHash,
      role: Role.STUDENT,
      school: 'Stanford University',
      department: 'Physics',
      major: 'Astrophysics',
      graduationYear: 2027,
      bio: 'Exploring cosmic strings, FLRW cosmology metrics, dark matter distributions, and general relativity. Always looking up, hunting for gravitational waves.',
      interests: 'Astrophysics, Cosmology, General Relativity, String Theory',
      hobby: 'Hiking, Astrophotography, Rock Climbing',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
      banner: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80',
      reputationScore: 112,
    },
    {
      email: 'elena.rostova@berkeley.edu',
      name: 'Elena Rostova',
      username: 'elena_bio',
      password: passwordHash,
      role: Role.STUDENT,
      school: 'University of California, Berkeley',
      department: 'Biology',
      major: 'Molecular & Cell Biology',
      graduationYear: 2026,
      bio: 'CRISPR-Cas9 target engineering and high-fidelity multiplex editing. Deeply interested in synthetic biology and quantitative bioinformatics models.',
      interests: 'CRISPR Gene Editing, Bioinformatics, Synthetic Biology, Genomics',
      hobby: 'Indoor Gardening, Molecular Gastronomy, Painting',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      banner: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&auto=format&fit=crop&q=80',
      reputationScore: 85,
    },
    {
      email: 'frank.miller@berkeley.edu',
      name: 'Frank Miller',
      username: 'frank_chem',
      password: passwordHash,
      role: Role.STUDENT,
      school: 'University of California, Berkeley',
      department: 'Chemistry',
      major: 'Chemistry',
      graduationYear: 2027,
      bio: 'Organic synthesis researcher. Exploring novel organocatalysts, clean energy photovoltaics, and transition-metal chemistry. Science under the hood.',
      interests: 'Organic Synthesis, Chemistry, Transition-Metals, Renewable Energy',
      hobby: 'Scuba Diving, Home Brewing, Acoustic Guitar',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
      banner: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&auto=format&fit=crop&q=80',
      reputationScore: 60,
    },
    {
      email: 'grace.hopper@cmu.edu',
      name: 'Grace Hopper',
      username: 'grace_eecs',
      password: passwordHash,
      role: Role.STUDENT,
      school: 'Carnegie Mellon University',
      department: 'Electrical Engineering',
      major: 'Computer Engineering & VLSI',
      graduationYear: 2026,
      bio: 'Compiler design, hardware acceleration architectures, and high-speed VLSI routing. Modifying silicon layout algorithms for ultra-low latencies.',
      interests: 'Hardware Design, Compilers, VLSI, Graph Theory, Silicon Routing',
      hobby: 'Sailing, Restoring Vintage Terminals, Carpentry',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      banner: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80',
      reputationScore: 105,
    },
    {
      email: 'henry.cavil@harvard.edu',
      name: 'Henry Cavil',
      username: 'henry_econ',
      password: passwordHash,
      role: Role.STUDENT,
      school: 'Harvard University',
      department: 'Economics',
      major: 'Mathematical Economics',
      graduationYear: 2028,
      bio: 'Exploring game theory models, microeconomic mechanism design, and incentive structures in decentralized protocols. Deciphering economic behaviors.',
      interests: 'Game Theory, Microeconomics, Mechanism Design, Blockchain, Networks',
      hobby: 'Fencing, Ancient Roman History, Texas Hold\'em',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
      banner: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800&auto=format&fit=crop&q=80',
      reputationScore: 50,
    },
    {
      email: 'funding@techinnovations.com',
      name: 'TechInnovations',
      username: 'tech_innovations',
      password: passwordHash,
      role: Role.BUSINESS,
      school: 'Stanford University',
      department: 'Industry Partner',
      bio: 'Empowering student-led research and startups with funding, commercialization pathways, industry mentorship, and cloud hosting credits. Let\'s launch!',
      interests: 'Entrepreneurship, Tech Startups, Venture Capital, Systems Engineering',
      hobby: 'Pitching, Investing, Incubator Networks',
      avatar: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=150&auto=format&fit=crop&q=80',
      banner: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop&q=80',
      reputationScore: 220,
    },
    {
      email: 'orders@campusbooks.edu',
      name: 'CampusBooks',
      username: 'campus_books',
      password: passwordHash,
      role: Role.BUSINESS,
      school: 'Massachusetts Institute of Technology',
      department: 'Student Bookstore',
      bio: 'Your primary source for official university textbooks, math workbooks, reference sheets, lab manuals, and beautiful custom study supplies. Discounted for students!',
      interests: 'Textbooks, Academic Guides, Stationery, Student Services',
      hobby: 'Reading, Archiving Rare Maps',
      avatar: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=150&auto=format&fit=crop&q=80',
      banner: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&auto=format&fit=crop&q=80',
      reputationScore: 190,
    },
    {
      email: 'admin@campusconnect.edu',
      name: 'System Admin',
      username: 'admin',
      password: passwordHash,
      role: Role.ADMIN,
      school: 'Massachusetts Institute of Technology',
      department: 'Administration',
      bio: 'Official CampusConnect Moderation & Security Team.',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      banner: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=80',
      reputationScore: 999,
    },
  ];

  console.log(`Creating ${usersToCreate.length} user accounts...`);
  const createdUsers: Record<string, any> = {};

  for (const userData of usersToCreate) {
    const { email, name, username, password, role, school, department, major, graduationYear, bio, interests, hobby, avatar, banner, reputationScore } = userData;
    
    // Create base user record
    const user = await prisma.user.create({
      data: {
        email,
        name,
        username,
        password,
        role,
        school,
        department,
        major,
        graduationYear,
        bio,
        interests,
        hobby,
        avatar,
        banner,
        reputationScore,
      },
    });

    createdUsers[username] = user;

    // Create BusinessProfile if user role is BUSINESS
    if (role === Role.BUSINESS) {
      await prisma.businessProfile.create({
        data: {
          userId: user.id,
          businessName: name,
          description: bio || '',
          websiteUrl: role === Role.BUSINESS && username === 'tech_innovations' ? 'https://techinnovations-ventures.io' : 'https://mit-bookstore.com',
          services: username === 'tech_innovations' 
            ? '🚀 $15k Student Grants\n☁️ $5,000 AWS & GCP Cloud Credits\n💡 Startup Incubation & IP Filing mentorship\n👔 Paid summer corporate fellowships'
            : '📚 Textbook Rentals & Purchases (Math, CS, Phys, Chem, Bio)\n📓 Graph Paper & Scientific Notebooks\n📐 Professional Drafting & Engineering Tools\n☕ Bookstore Cafe VIP student coupons',
        },
      });
      console.log(`  -> Business profile created for ${username}`);
    }
  }
  console.log('All user accounts created.');

  // 4. Create follower relationships (dense academic social graph)
  console.log('Establishing follower relationships...');
  const followPairs = [
    // Alice (Physics) connections
    ['alice_phys', 'bob_cs'],
    ['alice_phys', 'charlie_math'],
    ['alice_phys', 'diana_phys'],
    ['alice_phys', 'elena_bio'],
    ['alice_phys', 'tech_innovations'],
    
    // Bob (CS) connections
    ['bob_cs', 'alice_phys'],
    ['bob_cs', 'charlie_math'],
    ['bob_cs', 'grace_eecs'],
    ['bob_cs', 'tech_innovations'],

    // Charlie (Math) connections
    ['charlie_math', 'alice_phys'],
    ['charlie_math', 'bob_cs'],
    ['charlie_math', 'diana_phys'],
    ['charlie_math', 'campus_books'],

    // Diana (Astrophysics) connections
    ['diana_phys', 'alice_phys'],
    ['diana_phys', 'charlie_math'],
    ['diana_phys', 'frank_chem'],

    // Elena (Biology) connections
    ['elena_bio', 'alice_phys'],
    ['elena_bio', 'bob_cs'],
    ['elena_bio', 'frank_chem'],

    // Frank (Chemistry) connections
    ['frank_chem', 'elena_bio'],
    ['frank_chem', 'diana_phys'],

    // Grace (EECS) connections
    ['grace_eecs', 'bob_cs'],
    ['grace_eecs', 'charlie_math'],
    ['grace_eecs', 'tech_innovations'],

    // Henry (Econ) connections
    ['henry_econ', 'charlie_math'],
    ['henry_econ', 'bob_cs'],
    ['henry_econ', 'tech_innovations'],
  ];

  for (const [followerUsername, followingUsername] of followPairs) {
    const follower = createdUsers[followerUsername];
    const following = createdUsers[followingUsername];
    if (follower && following) {
      await prisma.user.update({
        where: { id: follower.id },
        data: {
          following: {
            connect: { id: following.id },
          },
        },
      });
    }
  }
  console.log('Follower connections established.');

  // 5. Create rich posts with LaTeX formulas, events, and polls
  console.log('Generating academic posts...');

  const postsData = [
    {
      username: 'alice_phys',
      title: 'Topological Quantum Computation and Anyon Braiding 🌌',
      courseCode: 'PHYS-8.421',
      status: PostStatus.PUBLISHED,
      content: `Just finished summarizing my research on topological quantum computation! 🚀

In a topological qubit, the protection against decoherence comes from the non-local storage of quantum information. The system is governed by a Hamiltonian with degenerate ground states. When we braid non-Abelian anyons, the wave function transforms as:
$$|\\psi\\rangle \\to U_i |\\psi\\rangle$$
where $U_i$ is a unitary representation of the braid group!

Compare this with the standard time-dependent Schrödinger equation:
$$i\\hbar \\frac{\\partial}{\\partial t} |\\psi(t)\\rangle = \\hat{H} |\\psi(t)\\rangle$$

And the Dirac bracket notation for transition probability amplitude:
$$P = |\\langle \\psi_f | \\psi_i \\rangle|^2$$

What are your thoughts on using Majorana zero modes for fault-tolerant gates? Are they truly the holy grail, or are superconducting transmons going to win the scaling race?`,
      // Will attach a Poll
      poll: {
        question: 'Which quantum computing qubit modality is most promising for fault-tolerance?',
        options: [
          'Majorana Anyons / Topological',
          'Superconducting Qubits (Transmon)',
          'Trapped Ions',
          'Photonic Qubits (Silicon)',
        ],
      },
    },
    {
      username: 'bob_cs',
      title: 'Deep Dive: The Mathematics of Attention Mechanisms in Transformers 🤖',
      courseCode: 'CS-6.862',
      status: PostStatus.PUBLISHED,
      content: `Deep dive into the Mathematics of Attention Mechanisms in Transformers!

The core innovation of the Transformer model is the Self-Attention mechanism. Given queries $Q$, keys $K$, and values $V$ of dimension $d_k$, the attention score is computed as:
$$\\text{Attention}(Q, K, V) = \\text{softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right)V$$

During training, we minimize the cross-entropy loss function $\\mathcal{L}(\\theta)$ for a classification task over $N$ training samples across $C$ classes:
$$\\mathcal{L}(\\theta) = -\\frac{1}{N}\\sum_{i=1}^N \\sum_{c=1}^C y_{i,c} \\log(\\hat{y}_{i,c})$$

Using gradient descent with backpropagation, the weight update rule for parameter $\\theta_j$ at learning rate $\\eta$ is:
$$\\theta_j^{(t+1)} = \\theta_j^{(t)} - \\eta \\frac{\\partial \\mathcal{L}}{\\partial \\theta_j}$$

The scaling factor $1/\\sqrt{d_k}$ is critical because for large values of $d_k$, the dot products grow large in magnitude, pushing the softmax function into regions with extremely small gradients (vanishing gradients)!

Let\'s discuss in the comments if you prefer PyTorch or JAX for custom kernel optimization.`,
      // Will attach a Poll
      poll: {
        question: 'Which framework do you prefer for deep learning research and custom kernel writing?',
        options: [
          'PyTorch (with Triton)',
          'JAX (with Equinox)',
          'TensorFlow / Keras',
          'Pure C++ / CUDA (from scratch)',
        ],
      },
    },
    {
      username: 'charlie_math',
      title: 'Revisiting the Riemann Zeta Function and the Prime Number Theorem 🧮',
      courseCode: 'MATH-110',
      status: PostStatus.PUBLISHED,
      content: `Revisiting the Riemann Zeta Function and the Prime Number Theorem.

The Riemann Zeta Function $\\zeta(s)$ is defined for complex numbers $s$ with $\\text{Re}(s) > 1$ as:
$$\\zeta(s) = \\sum_{n=1}^{\\infty} \\frac{1}{n^s}$$

Leonhard Euler discovered the beautiful connection between the zeta function and prime numbers, known as the Euler Product Formula:
$$\\zeta(s) = \\prod_{p \\text{ prime}} \\frac{1}{1 - p^{-s}}$$

By analytic continuation, $\\zeta(s)$ can be extended to a meromorphic function on the entire complex plane. The celebrated Riemann Hypothesis states that all non-trivial zeros of $\\zeta(s)$ lie on the critical line:
$$\\text{Re}(s) = \\frac{1}{2}$$

If true, this gives a remarkably tight bound on the distribution of prime numbers, specified by the prime-counting function $\\pi(x)$:
$$\\pi(x) \\approx \\text{Li}(x) = \\int_{2}^{x} \\frac{dt}{\\ln t}$$

Math is truly the language of pure nature!`,
      // Will attach a Poll
      poll: {
        question: 'Do you think the Riemann Hypothesis will be proven in this decade?',
        options: [
          'Yes, a mathematical breakthrough is close!',
          'No, the tools required are beyond current mathematics.',
          'It is undecidable under the Zermelo–Fraenkel axioms (ZFC).',
        ],
      },
    },
    {
      username: 'diana_phys',
      title: 'Cosmological Metric Expansion and the Friedmann Equations 🌌',
      courseCode: 'PHYS-203',
      status: PostStatus.PUBLISHED,
      content: `Exploring the Einstein Field Equations under a dark energy cosmological model!

The general relativity field equation is written as:
$$G_{\\mu\\nu} + \\Lambda g_{\\mu\\nu} = \\frac{8\\pi G}{c^4} T_{\\mu\\nu}$$

For an isotropic and homogeneous universe, we solve the Friedmann-Lemaître-Robertson-Walker (FLRW) metric:
$$ds^2 = -dt^2 + a(t)^2 \\left( \\frac{dr^2}{1 - kr^2} + r^2 d\\theta^2 + r^2 \\sin^2\\theta d\\phi^2 \\right)$$

Which yields the first Friedmann equation:
$$\\left(\\frac{\\dot{a}}{a}\\right)^2 = \\frac{8\\pi G}{3}\\rho - \\frac{k}{a^2} + \\frac{\\Lambda}{3}$$

Isn\'t it mind-blowing how the expansion rate of the cosmos $\\dot{a}/a$ simplifies so beautifully when modeling the universe as a perfect fluid? 

I am hosting a stargazing and observatory night this Friday on top of the physics roof! Details attached. 👇`,
      // Will attach an Event
      event: {
        title: 'Astrophysics Observation Night 🪐',
        date: '2026-06-05',
        time: '20:30',
        location: 'Campus Observatory Roof (Building 24)',
        description: 'Join the Astrophysics Club for a night under the stars! We will be setting up our Celestron telescopes to observe Jupiter\'s Galilean moons, Saturn\'s rings, and the Ring Nebula. Bring a warm jacket. Warm apple cider will be served!',
      },
    },
    {
      username: 'elena_bio',
      title: 'Bioinformatics & Thermodynamics of CRISPR-Cas9 Target Binding 🧬',
      courseCode: 'BIO-240',
      status: PostStatus.PUBLISHED,
      content: `Analyzing CRISPR-Cas9 Target Selection using Bioinformatics and Statistical Mechanics!

To prevent off-target mutations, we model the binding affinity between the guide RNA (gRNA) sequence $g$ and the target DNA sequence $d$. The probability of binding $P(\\text{bind})$ can be modeled using statistical mechanics and Gibbs free energy $\\Delta G$:
$$P(\\text{bind}) = \\frac{e^{-\\Delta G / (k_B T)}}{1 + e^{-\\Delta G / (k_B T)}}$$

Where the total free energy change $\\Delta G$ is the sum of seed matches, mismatch penalties, and chromatin accessibility:
$$\\Delta G = \\Delta G_{\\text{seed}} + \\sum_{i=1}^{L} \\epsilon(g_i, d_i) + \\Delta G_{\\text{chromatin}}$$

By mapping genomic sequences into O(1) lookups or employing suffix arrays (like the Burrows-Wheeler Transform), we can screen the entire human genome ($3 \\times 10^9$ base-pairs) in seconds!

Join us for the Bioinformatics journal club this Friday afternoon to discuss Cas12a mutations! Pizza is on us! 🍕`,
      // Will attach an Event
      event: {
        title: 'Bioinformatics Journal Club 🧬',
        date: '2026-06-02',
        time: '16:00',
        location: 'Life Sciences Building, Seminar Room 12',
        description: 'We are discussing the recent Nature Biotechnology paper on high-fidelity multiplex CRISPR editing. We will also demo some sequence alignment scripts. Free pizza and refreshments provided!',
      },
    },
    {
      username: 'grace_eecs',
      title: 'Silicon Layout Optimization using the Spectral Graph Laplacian ⚡',
      courseCode: 'EECS-312',
      status: PostStatus.PUBLISHED,
      content: `Graph Theory and Hardware Routing Optimization!

When compiling a circuit onto a silicon wafer or FPGA, we model the physical routing as a graph $G = (V, E)$. The adjacency matrix $A$ represents connections between nodes:
$$A_{ij} = \\begin{cases} 1 & \\text{if } (i, j) \\in E \\\\ 0 & \\text{otherwise} \\end{cases}$$

To find the shortest paths and optimal modular partitions for clock signals, we compute the graph Laplacian $L$:
$$L = D - A$$
where $D$ is the degree matrix defined as $D_{ii} = \\sum_j A_{ij}$.

The second smallest eigenvalue $\\lambda_2$ of $L$, known as the algebraic connectivity or Fiedler value, determines the modularity and bottleneck properties of our network layout:
$$\\lambda_2 = \\min_{x \\perp \\mathbf{1}, x \\neq 0} \\frac{x^T L x}{x^T x}$$

A higher Fiedler value implies a well-connected network, minimizing signal latency in high-speed processors! It is fascinating how spectral graph theory maps directly onto silicon physics.`,
    },
    {
      username: 'campus_books',
      title: 'Annual Academic Textbook Fair - Up to 45% Off! 📚🎓',
      courseCode: 'CC-GENERAL',
      status: PostStatus.PUBLISHED,
      content: `Attention Students! Get ready for the next term with our annual CampusBook Fair! 📚

We are offering massive student discounts on all required textbooks, reference books, and lab gear for the coming semester!
- Math, Physics & Chemistry textbooks: 35% - 45% OFF
- Computer Science books & CUDA programming manuals: 30% OFF
- Custom quad-ruled math notebooks: Buy 1 Get 1 Free!

Bring your student ID or show your CampusConnect profile page to claim an additional 5% discount at the counter! Free donuts and coffee will be served! ☕🍩`,
      // Will attach an Event
      event: {
        title: 'Annual Academic Textbook Fair 📚',
        date: '2026-06-15',
        time: '09:00',
        location: 'Main Quad Bookstore Patio',
        description: 'Get your textbooks early and save big! Over 200 titles in stock, including Calculus, Quantum Physics, Molecular Biology, and Algorithm Design. Trade-ins also welcome.',
      },
    },
    {
      username: 'tech_innovations',
      title: 'Now Accepting Applications for Student Startup Grants! 🚀💡',
      courseCode: 'CC-STARTUPS',
      status: PostStatus.PUBLISHED,
      content: `Calling all student researchers, engineers, and hackers! 💡

TechInnovations is excited to announce the opening of applications for our 2026 Student Innovation Grants! We are awarding:
- $15,000 in equity-free cash grants for promising student projects
- $5,000 in AWS/GCP cloud hosting credits
- 1-on-1 intellectual property (IP) and legal filing mentorship
- Access to our Silicon Valley investor network

Whether you are building a new deep learning pipeline, a biotech hardware device, or a decentralized app, we want to help you take it to the next level. Applied science is the future!

Check out our business profile pinned services for application deadlines!`,
    },
    // Reposts formatted as quote posts using rich markdown
    {
      username: 'frank_chem',
      title: 'Amazing crossover between Bio and Math! 🔄',
      courseCode: 'CHEM-300',
      status: PostStatus.PUBLISHED,
      content: `🔄 **Reposted from @elena_bio**

> Analyzing CRISPR-Cas9 Target Selection using Bioinformatics and Statistical Mechanics!
>
> The probability of binding $P(\\text{bind})$ can be modeled using statistical mechanics and Gibbs free energy $\\Delta G$:
> $$P(\\text{bind}) = \\frac{e^{-\\Delta G / (k_B T)}}{1 + e^{-\\Delta G / (k_B T)}}$$

This is an absolutely brilliant application of statistical thermodynamics! In organic synthesis, we use very similar partition functions to model transition state configurations. It\'s incredible how the same mathematical physics rules apply whether we are synthesizing molecular catalysts or editing genomic DNA. Great work, Elena! 👏`,
    },
    {
      username: 'grace_eecs',
      title: 'A must-read on Quantum Braiding Math! 🔄 Quantum computing is EECS future!',
      courseCode: 'EECS-100',
      status: PostStatus.PUBLISHED,
      content: `🔄 **Reposted from @alice_phys**

> In a topological qubit, the protection against decoherence comes from the non-local storage of quantum information. When we braid non-Abelian anyons, the wave function transforms as:
> $$|\\psi\\rangle \\to U_i |\\psi\\rangle$$

This is the cleanest explanation of topological protection math I\'ve ever seen! As chip architectures shrink towards atomic scales, we will inevitably have to transition from standard silicon gates to quantum braiding gates. Understanding these unitary representations of the braid group is going to be essential for computer engineers in the next 10 years! Highly recommend giving this a read!`,
    },
  ];

  console.log(`Inserting posts, events, and polls...`);
  const createdPosts: Record<string, any> = {};

  for (const postItem of postsData) {
    const { username, title, courseCode, status, content, event, poll } = postItem;
    const author = createdUsers[username];

    if (!author) continue;

    const eventData = event
      ? {
          title: event.title,
          date: new Date(`${event.date}T${event.time}:00`),
          location: event.location,
          description: event.description,
        }
      : undefined;

    const pollData = poll
      ? {
          question: poll.question,
          options: {
            create: poll.options.map((text) => ({ text })),
          },
        }
      : undefined;

    const post = await prisma.post.create({
      data: {
        title,
        content,
        status,
        courseCode,
        authorId: author.id,
        event: eventData ? { create: eventData } : undefined,
        poll: pollData ? { create: pollData } : undefined,
      },
      include: {
        event: true,
        poll: {
          include: { options: true },
        },
      },
    });

    createdPosts[username + '_' + (title ? title.substring(0, 10) : 'post')] = post;
    console.log(`  -> Created post for ${username}: "${title}"`);
  }
  console.log('All posts inserted.');

  // 6. Create realistic comment threads and replies (with LaTeX inside comments)
  console.log('Adding comments and replies...');

  // Helper to find posts
  const aliceQuantumPost = Object.values(createdPosts).find((p) => p.authorId === createdUsers['alice_phys'].id && p.poll);
  const bobDlPost = Object.values(createdPosts).find((p) => p.authorId === createdUsers['bob_cs'].id && p.poll);
  const charlieMathPost = Object.values(createdPosts).find((p) => p.authorId === createdUsers['charlie_math'].id);
  const dianaCosmoPost = Object.values(createdPosts).find((p) => p.authorId === createdUsers['diana_phys'].id);
  const elenaBioPost = Object.values(createdPosts).find((p) => p.authorId === createdUsers['elena_bio'].id);

  // Comments for Alice's Quantum post
  if (aliceQuantumPost) {
    // Comment 1: Bob
    const c1 = await prisma.comment.create({
      data: {
        content: `Wow, Alice! This braiding unitary $U_i$ is a beautiful representation of the braid group. Do you think we can map this braid representation into a unitary matrix in $SU(2)$ to show how single-qubit gates are fully generated?`,
        postId: aliceQuantumPost.id,
        authorId: createdUsers['bob_cs'].id,
      },
    });

    // Reply to Bob from Alice
    await prisma.comment.create({
      data: {
        content: `@bob_cs Exactly! For Fibonacci anyons, the representation is dense in $SU(2)$, which means we can achieve universal single-qubit quantum computation just by braiding! The braiding operator $R$ and the fusion operator $F$ are represented by:
$$R = \\begin{pmatrix} e^{-i 7\\pi/10} & 0 \\\\ 0 & e^{i 3\\pi/10} \\end{pmatrix}, \\quad F = \\begin{pmatrix} \\tau & \\sqrt{\\tau} \\\\ \\sqrt{\\tau} & -\\tau \\end{pmatrix}$$
where $\\tau = \\frac{\\sqrt{5}-1}{2}$ is the golden ratio conjugate. It is incredibly neat!`,
        postId: aliceQuantumPost.id,
        authorId: createdUsers['alice_phys'].id,
      },
    });

    // Comment 2: Charlie
    await prisma.comment.create({
      data: {
        content: `Fascinating work, Alice! The topological protection math looks beautiful. It is amazing how pure topology helps resolve physical hardware decoherence.`,
        postId: aliceQuantumPost.id,
        authorId: createdUsers['charlie_math'].id,
      },
    });
  }

  // Comments for Bob's DL post
  if (bobDlPost) {
    // Comment 1: Alice
    await prisma.comment.create({
      data: {
        content: `Excellent explanation, Bob! Regarding JAX vs PyTorch, the pure functional transform design in JAX makes computing gradients over gradients (e.g., in physics-informed neural networks or PINNs) exceptionally clean. We write:
$$\\nabla^2 f(x) = \\text{grad}(\\text{grad}(f))(x)$$
It\'s so elegant compared to PyTorch\'s autograd.`,
        postId: bobDlPost.id,
        authorId: createdUsers['alice_phys'].id,
      },
    });

    // Comment 2: Grace
    const c2 = await prisma.comment.create({
      data: {
        content: `@bob_cs Brilliant breakdown of the vanishing gradient. When writing custom kernels for Triton on GPUs, have you encountered any compilation bottlenecks with the static memory allocation inside the shared memory block?`,
        postId: bobDlPost.id,
        authorId: createdUsers['grace_eecs'].id,
      },
    });

    // Reply to Grace from Bob
    await prisma.comment.create({
      data: {
        content: `@grace_eecs Yes! Triton relies on block sizes being powers of 2 (e.g., $16 \\times 16$ or $64 \\times 64$) for SRAM layout bounds. If our matrix dimension $d_k$ is not a multiple of block size, we have to pad the inputs, causing memory alignment stalls. The hardware occupancy really depends on minimizing that padding!`,
        postId: bobDlPost.id,
        authorId: createdUsers['bob_cs'].id,
      },
    });
  }

  // Comments for Charlie's Math post
  if (charlieMathPost) {
    // Comment 1: Diana
    const c3 = await prisma.comment.create({
      data: {
        content: `Beautifully explained, Charlie! The Euler product formula:
$$\\zeta(s) = \\prod_{p} (1 - p^{-s})^{-1}$$
is one of my favorite equations in mathematics. It bridges discrete prime structures and continuous complex analysis so perfectly.`,
        postId: charlieMathPost.id,
        authorId: createdUsers['diana_phys'].id,
      },
    });

    // Reply to Diana from Charlie
    await prisma.comment.create({
      data: {
        content: `@diana_phys Thanks Diana! Yes, taking the logarithm on both sides:
$$\\ln \\zeta(s) = -\\sum_{p} \\ln(1 - p^{-s}) = \\sum_{p} \\sum_{n=1}^{\\infty} \\frac{1}{n p^{ns}}$$
is what really reveals the underlying additive prime distribution. It\'s astonishing how the zeros of $\\zeta(s)$ act as "harmonics" for the prime distribution!`,
        postId: charlieMathPost.id,
        authorId: createdUsers['charlie_math'].id,
      },
    });
  }

  // Comments for Diana's Cosmological post
  if (dianaCosmoPost) {
    // Comment 1: Charlie
    await prisma.comment.create({
      data: {
        content: `I love seeing FLRW solved! The curvature parameter $k \\in \\{-1, 0, 1\\}$ is a great topological invariant. Do you think the latest baryon acoustic oscillation data points exactly to flat space ($k=0$)?`,
        postId: dianaCosmoPost.id,
        authorId: createdUsers['charlie_math'].id,
      },
    });

    // Comment 2: Alice
    await prisma.comment.create({
      data: {
        content: `Count me in for the stargazing night! I\'ll bring a thermos of hot cocoa. Hope the sky is clear enough to spot the Ring Nebula! 🌌🔭`,
        postId: dianaCosmoPost.id,
        authorId: createdUsers['alice_phys'].id,
      },
    });
  }
  console.log('Comments and replies inserted successfully.');

  // 7. Cast likes (Votes with value: 1) on posts and comments
  console.log('Casting likes (upvotes) to posts and comments...');
  
  const allPostRecords = await prisma.post.findMany({});
  const allCommentRecords = await prisma.comment.findMany({});
  const allUserRecords = await prisma.user.findMany({});

  // Add likes to posts
  for (const post of allPostRecords) {
    // Randomly select 3-6 users to like this post
    const shuff = [...allUserRecords].sort(() => 0.5 - Math.random());
    const count = Math.floor(Math.random() * 4) + 3; // 3 to 6 likes
    const usersToVote = shuff.slice(0, count);

    for (const voter of usersToVote) {
      // Don't like your own post to be realistic, or actually it's fine
      await prisma.vote.create({
        data: {
          userId: voter.id,
          postId: post.id,
          value: 1, // Upvote
        },
      });

      // Update author reputation score (+5 for upvote)
      await prisma.user.update({
        where: { id: post.authorId },
        data: {
          reputationScore: { increment: 5 },
        },
      });
    }
  }

  // Add likes to comments
  for (const comment of allCommentRecords) {
    // Randomly select 2-4 users to like this comment
    const shuff = [...allUserRecords].sort(() => 0.5 - Math.random());
    const count = Math.floor(Math.random() * 3) + 2; // 2 to 4 likes
    const usersToVote = shuff.slice(0, count);

    for (const voter of usersToVote) {
      await prisma.vote.create({
        data: {
          userId: voter.id,
          commentId: comment.id,
          value: 1, // Upvote
        },
      });

      // Update author reputation score (+5 for upvote on comment too)
      await prisma.user.update({
        where: { id: comment.authorId },
        data: {
          reputationScore: { increment: 5 },
        },
      });
    }
  }
  console.log('Likes and reputations successfully synchronized.');

  // 8. Seed Poll Votes (to make the polls look beautifully populated)
  console.log('Seeding poll votes...');
  const allPolls = await prisma.poll.findMany({
    include: { options: true },
  });

  for (const poll of allPolls) {
    // Let 6-8 random users vote in this poll
    const shuff = [...allUserRecords].sort(() => 0.5 - Math.random());
    const count = Math.floor(Math.random() * 3) + 6; // 6 to 8 voters
    const voters = shuff.slice(0, count);

    for (const voter of voters) {
      // Pick a random option from the poll
      const randomOption = poll.options[Math.floor(Math.random() * poll.options.length)];
      
      await prisma.pollVote.create({
        data: {
          pollId: poll.id,
          pollOptionId: randomOption.id,
          userId: voter.id,
        },
      });
    }
  }
  console.log('Interactive poll votes seeded successfully.');

  // 9. Seed Reports
  console.log('Seeding moderation reports...');
  if (aliceQuantumPost) {
    await prisma.report.create({
      data: {
        reporterId: createdUsers['bob_cs'].id,
        reason: ReportReason.SPAM,
        description: 'Looks like marketing spam for non-Abelian anyon accelerators!',
        status: ReportStatus.PENDING,
        postId: aliceQuantumPost.id,
      },
    });
  }

  const firstComment = allCommentRecords[0];
  if (firstComment) {
    await prisma.report.create({
      data: {
        reporterId: createdUsers['charlie_math'].id,
        reason: ReportReason.HARASSMENT,
        description: 'Using aggressive questioning tactics in deep learning debates!',
        status: ReportStatus.PENDING,
        commentId: firstComment.id,
      },
    });
  }

  await prisma.report.create({
    data: {
      reporterId: createdUsers['grace_eecs'].id,
      reason: ReportReason.HARASSMENT,
      description: 'Henry is posting suspicious game-theory models that feel like phishing attempts.',
      status: ReportStatus.PENDING,
      reportedUserId: createdUsers['henry_econ'].id,
    },
  });
  console.log('Sample moderation reports seeded successfully.');

  console.log('--- DATABASE SEEDING COMPLETED SUCCESSFULLY ---');
  console.log(`Seeded:
  - ${allUserRecords.length} Users
  - ${allPostRecords.length} Posts
  - ${allCommentRecords.length} Comments
  - ${await prisma.vote.count()} Likes (Post & Comment Upvotes)
  - ${allPolls.length} Active Polls with votes
  - ${await prisma.event.count()} Scheduled Events
  `);
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
