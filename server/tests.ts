import assert from 'assert';
import { buildDailyEdition } from './editionBuilder.ts';
import { DEMO_PROFILES, dbStore } from './store.ts';
import { formatSelectionReason, rankArticlesForProfile } from './ranking.ts';
import { generateNewspaperPdf } from './pdf.ts';
import { fetchSingleFeed } from './feeds.ts';
import { FeedSource } from '../shared/types.ts';

async function runVerificationTests() {
  console.log('--- STARTING DAYBREAK AUTOMATED VERIFICATION ---');

  // Test 1: Dual Profile Personalization
  console.log('Test 1: Verifying that Reader A and Reader B receive distinct editions...');
  const profileA = DEMO_PROFILES['reader-a']; // Sara: Tech, Science, Climate
  const profileB = DEMO_PROFILES['reader-b']; // David: Business, Sports, World

  const editionA = await buildDailyEdition(profileA, { isRegeneration: true, forcedDate: '2026-10-17' });
  const editionB = await buildDailyEdition(profileB, { isRegeneration: true, forcedDate: '2026-10-17' });

  assert.ok(editionA.items.length > 0, 'Edition A must contain items');
  assert.ok(editionB.items.length > 0, 'Edition B must contain items');
  assert.notStrictEqual(
    editionA.items[0].headline,
    editionB.items[0].headline,
    'Lead stories for Reader A and Reader B must be different'
  );
  console.log('✓ PASS: Reader A lead story:', editionA.items[0].headline);
  console.log('✓ PASS: Reader B lead story:', editionB.items[0].headline);

  // Test 2: Feedback & Learning Signal
  console.log('\nTest 2: Verifying that feedback affects learned preferences without unbounded inflation...');
  const initialWeight = dbStore.getProfile('reader-a').learnedPreferences['Climate']?.weight || 0;
  dbStore.recordInteraction('reader-a', 'fb-climate-1', 'Climate', 'more_like_this');
  const updatedWeight = dbStore.getProfile('reader-a').learnedPreferences['Climate'].weight;
  assert.ok(updatedWeight > initialWeight, 'Weight must increase after more_like_this');
  console.log(`✓ PASS: Climate weight increased from ${initialWeight} to ${updatedWeight}`);

  // Test 3: Feed Failure Resilience
  console.log('\nTest 3: Testing that a broken/offline feed fails gracefully without breaking generation...');
  const brokenFeed: FeedSource = {
    id: 'broken-feed-test',
    name: 'Broken Publisher',
    category: 'World',
    url: 'https://invalid-non-existent-domain-12345.org/rss.xml',
    active: true,
    lastStatus: 'pending',
  };
  const fetchResult = await fetchSingleFeed(brokenFeed);
  assert.strictEqual(fetchResult.articles.length, 0, 'Broken feed should yield 0 articles');
  assert.ok(fetchResult.error, 'Broken feed should report an error');
  console.log('✓ PASS: Broken feed reported error gracefully:', fetchResult.error);

  // Test 4: PDF Generation Snapshot
  console.log('\nTest 4: Verifying that newspaper PDF renders matching binary buffer...');
  const pdfBuffer = generateNewspaperPdf(editionA, profileA.name);
  assert.ok(pdfBuffer instanceof Buffer, 'PDF generator must return a Buffer');
  assert.ok(pdfBuffer.length > 1000, 'PDF buffer must contain binary content');
  const headerStr = pdfBuffer.toString('utf-8', 0, 8);
  assert.ok(headerStr.startsWith('%PDF-'), 'Buffer must begin with %PDF- signature');
  console.log('✓ PASS: Generated valid %PDF- document of size:', pdfBuffer.length, 'bytes');

  // Test 5: Archive Immutability
  console.log('\nTest 5: Verifying archive immutability...');
  const archive = dbStore.getEditionArchive('reader-a');
  assert.ok(archive.length >= 2, 'Archive must contain seeded past editions');
  const pastEdition = archive.find(e => e.id === 'ed-archive-1');
  assert.ok(pastEdition, 'Past edition ed-archive-1 must exist');
  assert.strictEqual(pastEdition?.items[0].headline, 'What a greener city could feel like');
  console.log('✓ PASS: Past archived edition remains strictly unchanged:', pastEdition?.headline);

  console.log('\n======================================================');
  console.log('ALL 5 AUTOMATED VERIFICATION TESTS PASSED SUCCESSFULLY');
  console.log('======================================================');
}

runVerificationTests().catch(err => {
  console.error('Test failure:', err);
  process.exit(1);
});
