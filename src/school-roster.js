export const OUSD_DIRECTORY_SOURCE = {
  title: 'OUSD school directory',
  url: 'https://www.ousd.org/our-schools/school-directory',
  checkedDate: '2026-10-04',
};

const schoolUrl = 'https://www.ousd.org/our-schools/school-directory/schools/~board/school-directory/post/';

// Directory membership does not certify graduation requirements for a student or cohort.
// Alternative/independent programs require their own policy review before numeric comparison.
export const OUSD_SCHOOLS = [
  ['castlemont-high-school', 'Castlemont High School', 'comprehensive'],
  ['coliseum-college-prep-academy', 'Coliseum College Prep Academy', 'comprehensive'],
  ['dewey-academy', 'Dewey Academy', 'review-required'],
  ['fremont-high-school', 'Fremont High School', 'comprehensive'],
  ['gateway-to-college-at-laney-college', 'Gateway to College at Laney College', 'review-required'],
  ['life-academy', 'LIFE Academy', 'comprehensive'],
  ['madison-park-academy', 'Madison Park Academy', 'comprehensive'],
  ['mcclymonds-high-school', 'McClymonds High School', 'comprehensive'],
  ['metwest-high-school', 'MetWest High School', 'comprehensive'],
  ['oakland-high-school', 'Oakland High School', 'comprehensive'],
  ['oakland-international-high-school', 'Oakland International High School', 'comprehensive'],
  ['oakland-tech', 'Oakland Technical High School', 'comprehensive', 'oakland-technical-high-school'],
  ['ralph-j-bunche-academy', 'Ralph J. Bunche Academy', 'review-required'],
  ['rudsdale-continuation-high-school', 'Rudsdale Continuation High School', 'review-required'],
  ['skyline', 'Skyline High School', 'comprehensive', 'skyline-high-school'],
  ['sojourner-truth-independent-study', 'Sojourner Truth Independent Study (Online)', 'review-required'],
  ['street-academy', 'Street Academy', 'review-required'],
].map(([id, name, program, slug = id]) => ({ id, name, program, sourceUrl: `${schoolUrl}${slug}` }));
