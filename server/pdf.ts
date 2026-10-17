import { jsPDF } from 'jspdf';
import type { Edition, EditionItem } from '../shared/types.ts';

/**
 * Generate an authentic newspaper broadsheet PDF for the given edition.
 * Features classic serif typography, multi-story layouts, grounded takeaways,
 * source publisher attributions, and morning recap.
 */
export function generateNewspaperPdf(edition: Edition, readerName = 'Reader'): Buffer {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const addHeaderAndFooter = (pageNum: number, totalPages: number) => {
    // Top running header on subsequent pages
    if (pageNum > 1) {
      doc.setFont('times', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text('DAYBREAK · The Personalized Morning Broadsheet', margin, 10);
      doc.text(edition.formattedDate || edition.editionDate, pageWidth - margin, 10, { align: 'right' });
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.line(margin, 12, pageWidth - margin, 12);
    }

    // Bottom running footer
    doc.setFont('times', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
    doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
    doc.text(`Prepared for ${readerName}`, margin, pageHeight - 8);
    doc.text('daybreak.news', pageWidth - margin, pageHeight - 8, { align: 'right' });
  };

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - 18) {
      doc.addPage();
      y = 18;
      return true;
    }
    return false;
  };

  // ---------------------------------------------------------------------------
  // PAGE 1: MASTHEAD
  // ---------------------------------------------------------------------------
  doc.setTextColor(28, 25, 23); // #1C1917 stone-900

  // Date and volume line above title
  doc.setFont('times', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 95, 90);
  doc.text(edition.formattedDate || edition.editionDate, margin, y);
  doc.text(`VOLUME I · REVISION ${edition.revision || 1}`, pageWidth / 2, y, { align: 'center' });
  doc.text(`EST. 2026 · PERSONAL EDITION`, pageWidth - margin, y, { align: 'right' });
  y += 4;

  // Thin top border
  doc.setDrawColor(28, 25, 23);
  doc.setLineWidth(0.4);
  doc.line(margin, y, pageWidth - margin, y);
  y += 1.5;
  doc.setLineWidth(0.8);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  // Masthead Title
  doc.setFont('times', 'bold');
  doc.setFontSize(36);
  doc.setTextColor(28, 25, 23);
  doc.text('DAYBREAK', pageWidth / 2, y, { align: 'center' });
  y += 5.5;

  // Subtitle / Tagline
  doc.setFont('times', 'italic');
  doc.setFontSize(9.5);
  doc.setTextColor(110, 100, 95);
  doc.text('The Personalized Morning Broadsheet & Finite Daily Reader', pageWidth / 2, y, { align: 'center' });
  y += 4;

  // Double border below masthead
  doc.setLineWidth(0.8);
  doc.line(margin, y, pageWidth - margin, y);
  y += 1.5;
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;

  // Edition Metadata Bar
  doc.setFont('times', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(90, 85, 80);
  const metaText = `CURATED EXCLUSIVELY FOR: ${readerName.toUpperCase()}   ·   READING TIME: ~${edition.readingTimeMinutes || 10} MINUTES   ·   ${edition.items?.length || 0} STORIES   ·   ALL GROUNDED IN VERIFIED REPORTING`;
  doc.text(metaText, pageWidth / 2, y, { align: 'center' });
  y += 3;
  doc.setLineWidth(0.2);
  doc.setDrawColor(180, 175, 170);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // ---------------------------------------------------------------------------
  // "MORNING IN 3" RECAP BOX
  // ---------------------------------------------------------------------------
  if (edition.recapTakeaways && edition.recapTakeaways.length > 0) {
    checkPageBreak(35);
    // Box background
    doc.setFillColor(248, 246, 242);
    doc.setDrawColor(215, 210, 200);
    doc.setLineWidth(0.4);
    const boxY = y;
    const boxHeight = 6 + edition.recapTakeaways.length * 6.5;
    doc.rect(margin, boxY, contentWidth, boxHeight, 'FD');

    // Title badge
    doc.setFont('times', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(140, 45, 25); // terracotta #8C2D19
    doc.text('MORNING IN 3 · ESSENTIAL REALITIES TO CARRY TODAY', margin + 4, boxY + 5);

    doc.setFont('times', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(40, 36, 32);

    let recapY = boxY + 10;
    edition.recapTakeaways.forEach((rt, idx) => {
      const bullet = `• ${rt.title ? rt.title + ': ' : ''}${rt.takeaway}`;
      const wrapped = doc.splitTextToSize(bullet, contentWidth - 8);
      doc.text(wrapped, margin + 4, recapY);
      recapY += wrapped.length * 4.2;
    });

    y = boxY + boxHeight + 6;
  }

  // ---------------------------------------------------------------------------
  // STORIES RENDER
  // ---------------------------------------------------------------------------
  const items = edition.items || [];

  items.forEach((item, index) => {
    // Lead story gets prominent styling
    const isLead = index === 0;
    const neededHeight = isLead ? 45 : 32;
    checkPageBreak(neededHeight);

    // Section & Publisher tag
    doc.setFont('times', 'bold');
    doc.setFontSize(isLead ? 8.5 : 7.5);
    doc.setTextColor(140, 45, 25); // #8C2D19
    const sectionTag = `${(item.section || 'WORLD').toUpperCase()}  ·  ${(item.publisher || 'VERIFIED PUBLISHER').toUpperCase()}`;
    doc.text(sectionTag, margin, y);
    y += 4.5;

    // Headline
    doc.setFont('times', 'bold');
    doc.setFontSize(isLead ? 14 : 11);
    doc.setTextColor(28, 25, 23);
    const wrappedHeadline = doc.splitTextToSize(item.headline, contentWidth);
    doc.text(wrappedHeadline, margin, y);
    y += wrappedHeadline.length * (isLead ? 5.5 : 4.5) + 1.5;

    // Summary / Excerpt
    if (item.briefSummary) {
      doc.setFont('times', 'normal');
      doc.setFontSize(isLead ? 9.5 : 8.5);
      doc.setTextColor(50, 45, 42);
      const wrappedSummary = doc.splitTextToSize(item.briefSummary, contentWidth);
      doc.text(wrappedSummary, margin, y);
      y += wrappedSummary.length * 4.2 + 2;
    }

    // Takeaways / Bullets
    if (item.takeaways && item.takeaways.length > 0) {
      doc.setFont('times', 'normal');
      doc.setFontSize(isLead ? 8.5 : 7.8);
      doc.setTextColor(70, 65, 60);

      item.takeaways.slice(0, 3).forEach((tk) => {
        const bulletLine = `— ${tk}`;
        const wrappedBullet = doc.splitTextToSize(bulletLine, contentWidth - 4);
        checkPageBreak(wrappedBullet.length * 4);
        doc.text(wrappedBullet, margin + 2, y);
        y += wrappedBullet.length * 3.8;
      });
      y += 1.5;
    }

    // Source link note
    if (item.sourceUrl) {
      doc.setFont('times', 'italic');
      doc.setFontSize(7);
      doc.setTextColor(130, 125, 120);
      const sourceNote = `Source: ${item.sourceUrl.slice(0, 90)}${item.sourceUrl.length > 90 ? '…' : ''}`;
      doc.text(sourceNote, margin, y);
      y += 3.5;
    }

    // Separator rule
    doc.setDrawColor(220, 215, 210);
    doc.setLineWidth(0.2);
    doc.line(margin, y, pageWidth - margin, y);
    y += 5.5;
  });

  // ---------------------------------------------------------------------------
  // PERSONAL REFLECTION NOTE (if present)
  // ---------------------------------------------------------------------------
  if (edition.reflectionNote) {
    checkPageBreak(25);
    doc.setFillColor(252, 250, 246);
    doc.setDrawColor(180, 160, 140);
    doc.setLineWidth(0.3);
    const refY = y;
    doc.rect(margin, refY, contentWidth, 20, 'FD');

    doc.setFont('times', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(140, 45, 25);
    doc.text('READER REFLECTION NOTE', margin + 4, refY + 5);

    doc.setFont('times', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(40, 36, 32);
    const wrappedNote = doc.splitTextToSize(`“${edition.reflectionNote}”`, contentWidth - 8);
    doc.text(wrappedNote, margin + 4, refY + 11);
    y = refY + 24;
  }

  // ---------------------------------------------------------------------------
  // PAGE NUMBERS ON ALL PAGES
  // ---------------------------------------------------------------------------
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    addHeaderAndFooter(p, totalPages);
  }

  const arrayBuffer = doc.output('arraybuffer');
  return Buffer.from(arrayBuffer);
}
