// Evidence is a dated research snapshot, not an admission or credit decision.
export const RESEARCH_DATE = '2026-10-04';

const assist = (institution) => `https://assist.org/transfer/results/preview?year=76&institution=${institution}&type=UCTCA&view=transferability&viewBy=dept&viewSendingAgreements=false&viewByKey=all`;

export const COLLEGES = [
  { id: 'laney', name: 'Laney College', shortName: 'Laney', assistUrl: assist(77) },
  { id: 'merritt', name: 'Merritt College', shortName: 'Merritt', assistUrl: assist(13) },
  { id: 'berkeley-city', name: 'Berkeley City College', shortName: 'Berkeley City', assistUrl: assist(58) },
  { id: 'alameda', name: 'College of Alameda', shortName: 'Alameda', assistUrl: assist(111) },
];

export const SOURCES = {
  ucDualEnrollment: { title: 'UC: dual enrollment and first-year students', url: 'https://admission.universityofcalifornia.edu/counselors/preparing-freshman-students/dual-enrollment.html' },
  ucFirstYear: { title: 'UC: first-year requirements', url: 'https://admission.universityofcalifornia.edu/admission-requirements/first-year-requirements/' },
  ncatDatabase: { title: 'N.C. A&T: preliminary transfer articulation database', url: 'https://cms-apps.ncat.edu/transfer-articulation/' },
  ncatFaq: { title: 'N.C. A&T: transfer credit FAQ', url: 'https://www.ncat.edu/admissions/transfer-admissions/transfer-credit-faq.php' },
  ncatCredits: { title: 'N.C. A&T: transfer credits', url: 'https://www.ncat.edu/admissions/transfer-admissions/transfer-credits.php' },
};

const ucCampuses = [
  ['uc-berkeley', 'UC Berkeley', 'Berkeley'],
  ['uc-davis', 'UC Davis', 'Davis'],
  ['uc-irvine', 'UC Irvine', 'Irvine'],
  ['uc-los-angeles', 'UCLA', 'UCLA'],
  ['uc-merced', 'UC Merced', 'Merced'],
  ['uc-riverside', 'UC Riverside', 'Riverside'],
  ['uc-san-diego', 'UC San Diego', 'San Diego'],
  ['uc-santa-barbara', 'UC Santa Barbara', 'Santa Barbara'],
  ['uc-santa-cruz', 'UC Santa Cruz', 'Santa Cruz'],
];

export const DESTINATIONS = [
  ...ucCampuses.map(([id, name, shortName]) => ({
    id, name, shortName, type: 'UC', policyUrl: SOURCES.ucDualEnrollment.url,
    policyNote: 'College courses taken during high school, including the summer immediately after graduation, use the first-year applicant route. UC unit transferability does not establish campus GE or major fulfillment.',
  })),
  {
    id: 'spelman', name: 'Spelman College', shortName: 'Spelman', type: 'HBCU',
    policyUrl: 'https://www.spelman.edu/admissions/admitted-students/after-acceptance.html',
    policyNote: 'Admitted students are asked to submit dual-enrollment transcripts. No exact Peralta matches were verified. Applicability of general transfer rules to first-year students remains unconfirmed.',
  },
  {
    id: 'howard', name: 'Howard University', shortName: 'Howard', type: 'HBCU',
    policyUrl: 'https://howard.edu/registrar/transfer-credit-articulation-agreements',
    policyNote: 'First-year dual-enrollment students can request a preliminary general-education evaluation using unofficial transcripts. Major credit needs department review, and final evaluation needs official transcripts. No exact Peralta matches were verified.',
  },
  {
    id: 'tuskegee', name: 'Tuskegee University', shortName: 'Tuskegee', type: 'HBCU',
    policyUrl: 'https://www.tuskegee.edu/admissions/Criteria-for-Freshmen.html',
    policyNote: 'High-school dual enrollment uses the freshman route. No exact Peralta matches were verified. The applicability of general course-by-course transfer evaluation rules to first-year students needs confirmation.',
  },
  {
    id: 'morehouse', name: 'Morehouse College', shortName: 'Morehouse', type: 'HBCU',
    policyUrl: 'https://catalog.morehouse.edu/content.php?catoid=7&navoid=327',
    policyNote: 'The 2026-27 catalog provides for first-year dual-enrollment transcript submission for credit. The public equivalency lookup was blocked by CAPTCHA before a Peralta search could be completed. No exact matches were verified.',
  },
  {
    id: 'ncat', name: 'North Carolina A&T State University', shortName: 'N.C. A&T', type: 'HBCU',
    policyUrl: SOURCES.ncatFaq.url,
    policyNote: 'High-school dual enrollment uses the freshman application. Public equivalencies are preliminary and unofficial. An individual final evaluation follows acceptance. The database does not display an effective academic year.',
  },
];

const baseCourses = [
  { suffix: 'engl-c1000', code: 'ENGL C1000', title: 'Academic Reading and Writing', units: 4, subject: 'English', family: 'engl-c1000', ucUnits: 4 },
  { suffix: 'stat-c1000', code: 'STAT C1000', title: 'Introduction to Statistics', units: 4, subject: 'Statistics', family: 'stat-c1000', ucUnits: 4 },
  { suffix: 'math-3a', code: 'MATH 3A', title: 'Calculus I', units: 5, subject: 'Mathematics', family: 'math-3a', ucUnits: 5, ncat: { equivalents: [{ code: 'MATH 131', title: 'Calculus I', units: 4 }], note: 'The database displays 4 destination credits for this exact source code. The local course carries 5 semester units. The FAQ says awarded hours follow the transcript, so this difference needs individual review, not an assumed one-unit loss.' } },
  { suffix: 'psyc-c1000', code: 'PSYC C1000', title: 'Introduction to Psychology', units: 3, subject: 'Psychology', family: 'psyc-c1000', ucUnits: 3 },
];

const historicalCourses = [
  { suffix: 'historical-engl-1a', code: 'ENGL 1A', title: 'Historical English course code', subject: 'English', equivalents: [{ code: 'ENGL 100', title: 'Ideas & Their Expressions I', units: 3 }] },
  { suffix: 'historical-math-13', code: 'MATH 13', title: 'Historical statistics course code', subject: 'Statistics', equivalents: [{ code: 'MATH 224', title: 'Intro Probability & Statistics', units: 3 }] },
  { suffix: 'historical-posci-1', code: 'POSCI 1', title: 'Historical political science course code', subject: 'Political science', equivalents: [{ code: 'POLI 110', title: 'Amer Government & Politics', units: 3 }] },
  { suffix: 'historical-psych-1a', code: 'PSYCH 1A', title: 'Historical psychology course code', subject: 'Psychology', equivalents: [{ code: 'PSYC 101', title: 'General Psychology', units: 3 }] },
];

export const COURSES = [
  ...COLLEGES.flatMap((college) => baseCourses.map(({ suffix, ...course }) => ({
    ...course, id: `${college.id}-${suffix}`, collegeId: college.id,
    ucYear: '2025-26', historical: false, suggestionEligible: true,
    ucNote: course.code === 'STAT C1000' && college.id === 'alameda'
      ? 'At College of Alameda, STAT C1000 and SOCSC 125 receive UC credit for only one course. SOCSC 125 is outside this prototype catalog.'
      : course.code === 'MATH 3A'
        ? 'Calculus alternatives can have one-series credit limits. Other calculus alternatives are outside this prototype catalog.'
        : '',
  }))),
  ...['laney', 'merritt'].map((collegeId) => ({
    id: `${collegeId}-engl-c1000e`, collegeId, code: 'ENGL C1000E',
    title: 'Academic Reading and Writing (supported course)',
    units: 5, subject: 'English', family: 'engl-c1000', ucUnits: 4,
    ucYear: '2025-26', historical: false, suggestionEligible: false,
    ucNote: 'This supported course carries 5 local units and is capped at 4 UC units. ENGL C1000 and ENGL C1000E duplicate credit; do not add their UC units together.',
  })),
  ...COLLEGES.flatMap((college) => historicalCourses.map(({ suffix, equivalents, ...course }) => ({
    ...course, id: `${college.id}-${suffix}`, collegeId: college.id,
    units: null, family: suffix, historical: true, suggestionEligible: false,
    catalogNote: 'Historical source code from the N.C. A&T database. Local title, units and current availability were not verified. It is not automatically equivalent to a renumbered course.',
    ncat: {
      equivalents: college.id === 'berkeley-city' && course.code === 'MATH 13'
        ? [...equivalents, { code: 'ECON 206', title: 'Alternative listed in database', units: 3 }]
        : equivalents,
      note: college.id === 'berkeley-city' && course.code === 'MATH 13'
        ? 'The database lists ECON 206 OR MATH 224, not both. Confirm the appropriate equivalent in the individual evaluation. This historical source identity does not establish an equivalency for STAT C1000.'
        : 'This match applies only to the exact historical source code and source college. A match for this code does not establish an equivalency for a renumbered current course.',
    },
  }))),
];
