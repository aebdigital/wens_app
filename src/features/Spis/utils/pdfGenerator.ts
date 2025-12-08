import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CenovaPonukaItem, SpisFormData } from '../types';

export const generatePDF = async (item: CenovaPonukaItem, formData: SpisFormData) => {
  const doc = new jsPDF({ orientation: 'landscape' });
  const pageWidth = doc.internal.pageSize.width;
  
  // Helper for text alignment
  const centerText = (text: string, y: number) => {
    const textWidth = doc.getTextWidth(text);
    doc.text(text, (pageWidth - textWidth) / 2, y);
  };

  // Font Loading
  let fontName = 'Helvetica'; // Default fallback
  try {
      const fontBaseUrl = 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/';
      const loadFont = async (filename: string, weight: string) => {
          const response = await fetch(fontBaseUrl + filename);
          const buffer = await response.arrayBuffer();
          let binary = '';
          const bytes = new Uint8Array(buffer);
          const len = bytes.byteLength;
          for (let i = 0; i < len; i++) {
              binary += String.fromCharCode(bytes[i]);
          }
          const base64 = btoa(binary);
          doc.addFileToVFS(filename, base64);
          doc.addFont(filename, 'Roboto', weight);
      };

      await Promise.all([
          loadFont('Roboto-Regular.ttf', 'normal'),
          loadFont('Roboto-Medium.ttf', 'bold')
      ]);
      fontName = 'Roboto';
      doc.setFont('Roboto');
  } catch (e) {
      console.warn("Failed to load custom fonts, falling back to Helvetica.", e);
  }

  // Logo
  try {
    const logoUrl = '/logo.png';
    const logoImg = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.src = logoUrl;
      img.onload = () => resolve(img);
      img.onerror = reject;
    });
    
    // Calculate aspect ratio to prevent squashing
    const imgWidth = logoImg.width;
    const imgHeight = logoImg.height;
    const targetWidth = 40;
    const targetHeight = (imgHeight / imgWidth) * targetWidth;
    
    doc.addImage(logoImg, 'PNG', 14, 10, targetWidth, targetHeight);
  } catch (e) {
    doc.setFontSize(18);
    doc.setTextColor(225, 27, 40);
    doc.text('WENS DOOR', 14, 20);
  }

  // Header Info
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text('Cenová ponuka č.: ' + item.cisloCP, pageWidth - 14, 18, { align: 'right' });
  
  doc.setDrawColor(200);
  doc.line(14, 25, pageWidth - 14, 25);

  // Company Info (Left)
  let yPos = 35;
  doc.setFontSize(9);
  doc.setTextColor(0);
  doc.setFont(fontName, 'bold');
  doc.text('Dodávateľ:', 14, yPos);
  doc.setFont(fontName, 'normal');
  yPos += 5;
  doc.text('WENS DOOR, s.r.o.', 14, yPos);
  yPos += 5;
  doc.text('Vápenická 12, 971 01 Prievidza', 14, yPos);
  yPos += 5;
  doc.text('IČO: 36792942', 14, yPos);
  yPos += 5;
  doc.text('IČ DPH: SK2022396904', 14, yPos);
  yPos += 5;
  doc.text('email: info@wens.sk', 14, yPos);
  yPos += 5;
  doc.text('tel: 046 / 542 2057', 14, yPos);

  // Client Info (Right)
  yPos = 35;
  const rightColX = pageWidth / 2 + 10;
  doc.setFont(fontName, 'bold');
  doc.text('Odberateľ:', rightColX, yPos);
  doc.setFont(fontName, 'normal');
  yPos += 5;
  const clientName = formData.firma || `${formData.priezvisko} ${formData.meno}`;
  doc.text(clientName, rightColX, yPos);
  yPos += 5;
  doc.text(`${formData.ulica}`, rightColX, yPos);
  yPos += 5;
  doc.text(`${formData.mesto} ${formData.psc}`, rightColX, yPos);
  if (formData.telefon) {
      yPos += 5;
      doc.text(`Tel: ${formData.telefon}`, rightColX, yPos);
  }
  if (formData.email) {
      yPos += 5;
      doc.text(`Email: ${formData.email}`, rightColX, yPos);
  }

  yPos = 80;

  if (item.typ === 'dvere' && item.data) {
    const data = item.data;
    
    // Description
    if (data.popisVyrobkov) {
        doc.setFontSize(9);
        const splitPopis = doc.splitTextToSize('Popis výrobkov: ' + data.popisVyrobkov, pageWidth - 28);
        doc.text(splitPopis, 14, yPos);
        yPos += (splitPopis.length * 5) + 5;
    }

    // Tables
    const tableStyles = { 
        fontSize: 8, 
        cellPadding: 2,
        font: fontName, // Ensure table uses the custom font
        fontStyle: 'normal' as 'normal'
    };
    const headStyles = { 
        fillColor: [225, 27, 40] as [number, number, number], 
        fontStyle: 'bold' as 'bold', 
        halign: 'center' as 'center',
        font: fontName // Ensure header uses custom font
    };

    // 1. Výrobky
    doc.setFont(fontName, 'bold');
    doc.text('Výrobky', 14, yPos);
    yPos += 3;

    const vyrobkyRows = data.vyrobky.filter((v: any) => v.ks > 0 || v.ksZarubna > 0).map((v: any, i: number) => [
      i + 1,
      v.miestnost,
      `${v.dvereTypRozmer}\n${v.dvereOtvor}`,
      v.pL,
      v.zamok,
      v.sklo,
      v.povrch,
      `${v.poznamkaDvere}\n${v.poznamkaZarubna}`,
      `${v.ks}\n${v.ksZarubna}`,
      `${v.cenaDvere} €\n${v.cenaZarubna} €`,
      `${(v.ks * v.cenaDvere + v.ksZarubna * v.cenaZarubna).toFixed(2)} €`
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['#', 'Miestnosť', 'Typ / Rozmer', 'P/Ľ', 'Zámok', 'Sklo', 'Povrch', 'Poznámka', 'Ks', 'Cena/ks', 'Spolu']],
      body: vyrobkyRows,
      styles: tableStyles,
      headStyles: headStyles,
      columnStyles: {
          0: { cellWidth: 8, halign: 'center' },
          1: { halign: 'left' }, // Miestnosť
          2: { cellWidth: 35, halign: 'left' }, // Typ
          3: { cellWidth: 15, halign: 'center' }, // P/Ľ
          4: { cellWidth: 20, halign: 'center' }, // Zámok
          5: { halign: 'left' }, // Sklo
          6: { halign: 'left' }, // Povrch
          7: { halign: 'left' }, // Poznámka
          8: { halign: 'center' }, // Ks
          9: { halign: 'right' },  // Cena
          10: { halign: 'right' }  // Spolu
      }
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;

    // 2. Príplatky
    if (data.priplatky.some((p: any) => p.ks > 0)) {
        doc.setFont(fontName, 'bold');
        doc.text('Príplatky', 14, yPos);
        yPos += 3;
        
        const priplatkyRows = data.priplatky
          .filter((p: any) => p.ks > 0)
          .map((p: any, i: number) => [
            i + 1,
            p.nazov,
            p.ks,
            `${p.cenaKs.toFixed(2)} €`,
            `${p.cenaCelkom.toFixed(2)} €`
          ]);

        autoTable(doc, {
          startY: yPos,
          head: [['#', 'Názov', 'Ks', 'Cena/ks', 'Spolu']],
          body: priplatkyRows,
          styles: tableStyles,
          headStyles: headStyles,
          columnStyles: {
              0: { cellWidth: 8, halign: 'center' },
              1: { halign: 'left' },
              2: { halign: 'center' },
              3: { halign: 'right' },
              4: { halign: 'right' }
          }
        });
        yPos = (doc as any).lastAutoTable.finalY + 10;
    }

    // 3. Kovanie
    if (data.kovanie.some((k: any) => k.ks > 0)) {
        doc.setFont(fontName, 'bold');
        doc.text('Kovanie', 14, yPos);
        yPos += 3;
        
        const kovanieRows = data.kovanie
          .filter((k: any) => k.ks > 0)
          .map((k: any, i: number) => [
            i + 1,
            k.nazov,
            k.ks,
            `${k.cenaKs.toFixed(2)} €`,
            `${k.cenaCelkom.toFixed(2)} €`
          ]);

        autoTable(doc, {
          startY: yPos,
          head: [['#', 'Názov', 'Ks', 'Cena/ks', 'Spolu']],
          body: kovanieRows,
          styles: tableStyles,
          headStyles: headStyles,
          columnStyles: {
              0: { cellWidth: 8, halign: 'center' },
              1: { halign: 'left' },
              2: { halign: 'center' },
              3: { halign: 'right' },
              4: { halign: 'right' }
          }
        });
        yPos = (doc as any).lastAutoTable.finalY + 10;
    }

    // 4. Montaz
    if (data.montaz.some((m: any) => m.ks > 0)) {
        doc.setFont(fontName, 'bold');
        doc.text('Montáž', 14, yPos);
        yPos += 3;
        
        const montazRows = data.montaz
          .filter((m: any) => m.ks > 0)
          .map((m: any, i: number) => [
            i + 1,
            m.nazov,
            m.ks,
            `${m.cenaKs.toFixed(2)} €`,
            `${m.cenaCelkom.toFixed(2)} €`
          ]);

        autoTable(doc, {
          startY: yPos,
          head: [['#', 'Názov', 'Ks', 'Cena/ks', 'Spolu']],
          body: montazRows,
          styles: tableStyles,
          headStyles: headStyles,
          columnStyles: {
              0: { cellWidth: 8, halign: 'center' },
              1: { halign: 'left' },
              2: { halign: 'center' },
              3: { halign: 'right' },
              4: { halign: 'right' }
          }
        });
        yPos = (doc as any).lastAutoTable.finalY + 10;
    }

    if (yPos > doc.internal.pageSize.height - 40) {
        doc.addPage();
        yPos = 20;
    }

    // Totals & Footer
    const startYTotals = yPos;
    const rightEdge = pageWidth - 14;
    
    // Right side - Totals
    doc.setFontSize(10);
    doc.setFont(fontName, 'normal');
    
    doc.text(`Cena bez DPH: ${item.cenaBezDPH.toFixed(2)} €`, rightEdge, yPos, { align: 'right' });
    yPos += 5;
    doc.text(`DPH 23%: ${(item.cenaBezDPH * 0.23).toFixed(2)} €`, rightEdge, yPos, { align: 'right' });
    yPos += 7;
    doc.setFont(fontName, 'bold');
    doc.setFontSize(12);
    doc.text(`Cena s DPH: ${item.cenaSDPH.toFixed(2)} €`, rightEdge, yPos, { align: 'right' });

    // Left side info - Wrapped to avoid collision
    yPos = startYTotals;
    const maxLeftWidth = pageWidth - 14 - 70; // 70mm reserved for totals on right
    
    doc.setFontSize(9);
    doc.setFont(fontName, 'normal');
    
    const printWrappedLine = (label: string, value: string) => {
      const text = `${label} ${value}`;
      const lines = doc.splitTextToSize(text, maxLeftWidth);
      doc.text(lines, 14, yPos);
      yPos += lines.length * 5;
    };

    printWrappedLine('Platnosť ponuky:', data.platnostPonuky || '-');
    printWrappedLine('Termín dodania:', data.terminDodania || '-');
    printWrappedLine('Vypracoval:', formData.vypracoval);

  } else {
      doc.text('Detailný náhľad pre tento typ položky nie je implementovaný.', 14, yPos);
  }

  // Footer (Page numbers)
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      centerText(`Strana ${i} / ${pageCount}`, doc.internal.pageSize.height - 10);
  }

  doc.save(`CP_${item.cisloCP}.pdf`);
};
