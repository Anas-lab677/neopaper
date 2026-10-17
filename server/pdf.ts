import { jsPDF } from 'jspdf';
import { Edition } from '../shared/types.ts';

export function generateNewspaperPdf(edition: Edition, readerName: string): Buffer {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4', // 595.28 x 841.89 pt
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;

  let y = margin;

  // Helper to add header/masthead
  const renderMasthead = (pageIndex: number, totalPages: number) => {
    doc.setFont('times', 'bold');
    doc.setFontSize(32);
    doc.setTextColor(37, 43, 39); // #252B27 ink
    doc.text('daybreak.', margin, y + 26);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(92, 100, 94); // muted
    doc.text('A PERSONAL MORNING NEWSPAPER', margin + 140, y + 24);

    const editionMeta = `${edition.formattedDate.toUpperCase()} · ${readerName.toUpperCase()}'S EDITION · REV ${edition.revision}`;
    doc.text(editionMeta, pageWidth - margin, y + 24, { align: 'right' });

    y += 36;
    // Double rule
    doc.setDrawColor(37, 43, 39);
    doc.setLineWidth(1.5);
    doc.line(margin, y, pageWidth - margin, y);
    doc.setLineWidth(0.5);
    doc.line(margin, y + 3, pageWidth - margin, y + 3);
    y += 14;
  };

  const renderFooter = (pageIndex: number) => {
    const footerY = pageHeight - 25;
    doc.setDrawColor(220, 215, 205);
    doc.setLineWidth(0.5);
    doc.line(margin, footerY - 8, pageWidth - margin, footerY - 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(130, 135, 130);
    doc.text('Daybreak — A calm, finite morning edition', margin, footerY);
    doc.text(`Page ${pageIndex}`, pageWidth - margin, footerY, { align: 'right' });
  };

  // --- PAGE 1: Masthead, Lead Story, & Secondary Stories ---
  renderMasthead(1, 2);

  // Lead Story
  const lead = edition.items[0];
  if (lead) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(182, 91, 61); // Terracotta
    doc.text(`FEATURED · ${lead.section.toUpperCase()}`, margin, y);
    y += 14;

    doc.setFont('times', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(37, 43, 39);
    const headlineLines = doc.splitTextToSize(lead.headline, contentWidth);
    doc.text(headlineLines, margin, y);
    y += headlineLines.length * 24 + 4;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(110, 115, 110);
    doc.text(`${lead.publisher} · ${lead.selectionReason}`, margin, y);
    y += 14;

    doc.setFont('times', 'normal');
    doc.setFontSize(10.5);
    doc.setTextColor(45, 50, 47);
    const briefLines = doc.splitTextToSize(lead.briefSummary, contentWidth);
    doc.text(briefLines, margin, y);
    y += briefLines.length * 14 + 10;

    // Lead takeaways
    if (lead.takeaways && lead.takeaways.length > 0) {
      doc.setFillColor(245, 243, 237);
      doc.rect(margin, y, contentWidth, lead.takeaways.length * 15 + 16, 'F');
      let tkY = y + 12;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(90, 95, 90);
      doc.text('KEY TAKEAWAYS:', margin + 10, tkY);
      tkY += 12;

      doc.setFont('times', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(40, 45, 42);
      for (const tk of lead.takeaways) {
        doc.text(`• ${tk}`, margin + 14, tkY);
        tkY += 13;
      }
      y = tkY + 8;
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(182, 91, 61);
    doc.textWithLink('Read full story at publisher →', margin, y, { url: lead.sourceUrl });
    y += 18;

    // Section rule
    doc.setDrawColor(215, 210, 200);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 16;
  }

  // 2-Column secondary stories on Page 1
  const colWidth = (contentWidth - 20) / 2;
  const col2X = margin + colWidth + 20;

  const secondaryStories = edition.items.slice(1, 5);
  let col1Y = y;
  let col2Y = y;

  secondaryStories.forEach((item, idx) => {
    const isCol1 = idx % 2 === 0;
    const curX = isCol1 ? margin : col2X;
    let curY = isCol1 ? col1Y : col2Y;

    if (curY > pageHeight - 100) return;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(182, 91, 61);
    doc.text(item.section.toUpperCase(), curX, curY);
    curY += 10;

    doc.setFont('times', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(37, 43, 39);
    const itemHeadLines = doc.splitTextToSize(item.headline, colWidth);
    doc.text(itemHeadLines, curX, curY);
    curY += itemHeadLines.length * 15 + 4;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(120, 125, 120);
    doc.text(item.publisher, curX, curY);
    curY += 10;

    doc.setFont('times', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(45, 50, 47);
    const itemBrief = doc.splitTextToSize(item.briefSummary, colWidth);
    doc.text(itemBrief.slice(0, 5), curX, curY); // limit height
    curY += Math.min(itemBrief.length, 5) * 12 + 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(182, 91, 61);
    doc.textWithLink('Read full story →', curX, curY, { url: item.sourceUrl });
    curY += 16;

    if (isCol1) col1Y = curY;
    else col2Y = curY;
  });

  renderFooter(1);

  // --- PAGE 2: Additional Stories & "Three Things to Take Into Today" ---
  doc.addPage();
  y = margin;
  renderMasthead(2, 2);

  const remainingStories = edition.items.slice(5);
  if (remainingStories.length > 0) {
    doc.setFont('times', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(37, 43, 39);
    doc.text('More from your morning selection', margin, y);
    y += 16;

    let remCol1Y = y;
    let remCol2Y = y;

    remainingStories.forEach((item, idx) => {
      const isCol1 = idx % 2 === 0;
      const curX = isCol1 ? margin : col2X;
      let curY = isCol1 ? remCol1Y : remCol2Y;

      if (curY > pageHeight - 220) return;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(182, 91, 61);
      doc.text(item.section.toUpperCase(), curX, curY);
      curY += 10;

      doc.setFont('times', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(37, 43, 39);
      const head = doc.splitTextToSize(item.headline, colWidth);
      doc.text(head, curX, curY);
      curY += head.length * 14 + 3;

      doc.setFont('times', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(50, 55, 52);
      const br = doc.splitTextToSize(item.briefSummary, colWidth);
      doc.text(br.slice(0, 4), curX, curY);
      curY += Math.min(br.length, 4) * 11 + 6;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(182, 91, 61);
      doc.textWithLink(`${item.publisher} · Source →`, curX, curY, { url: item.sourceUrl });
      curY += 14;

      if (isCol1) remCol1Y = curY;
      else remCol2Y = curY;
    });

    y = Math.max(remCol1Y, remCol2Y) + 16;
  }

  // "Three Things to Take into Today" Closing Section
  if (y > pageHeight - 200) {
    doc.addPage();
    y = margin;
    renderMasthead(3, 3);
  }

  doc.setDrawColor(37, 43, 39);
  doc.setLineWidth(1);
  doc.line(margin, y, pageWidth - margin, y);
  y += 16;

  doc.setFont('times', 'italic');
  doc.setFontSize(16);
  doc.setTextColor(37, 43, 39);
  doc.text('Three things to take into today.', margin, y);
  y += 16;

  if (edition.recapTakeaways && edition.recapTakeaways.length > 0) {
    edition.recapTakeaways.forEach((rt, idx) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(125, 139, 114); // Sage accent
      doc.text(`0${idx + 1}.  ${rt.title.toUpperCase()}`, margin, y);
      y += 11;

      doc.setFont('times', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(45, 50, 47);
      const tkLines = doc.splitTextToSize(rt.takeaway, contentWidth - 10);
      doc.text(tkLines, margin + 14, y);
      y += tkLines.length * 13 + 6;
    });
  }

  // Reflection box
  y += 8;
  doc.setFillColor(247, 245, 239);
  doc.rect(margin, y, contentWidth, 36, 'F');
  doc.setFont('times', 'italic');
  doc.setFontSize(9.5);
  doc.setTextColor(100, 105, 100);
  doc.text(
    edition.reflectionNote ? `Your Reflection: "${edition.reflectionNote}"` : '“What is one thing you want to remember today?”',
    margin + 12,
    y + 22
  );

  renderFooter(doc.getNumberOfPages());

  return Buffer.from(doc.output('arraybuffer'));
}
