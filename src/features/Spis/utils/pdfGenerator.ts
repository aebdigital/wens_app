import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CenovaPonukaItem, SpisFormData, PuzdraData } from '../types';

interface UserInfo {
  vypracoval: string;
  telefon: string;
  email: string;
}

export const generatePDF = async (item: CenovaPonukaItem, formData: SpisFormData, userInfo?: UserInfo) => {
  const doc = new jsPDF({ orientation: 'portrait' });
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
    
    doc.addImage(logoImg, 'PNG', 14, 13, targetWidth, targetHeight);
  } catch (e) {
    doc.setFontSize(18);
    doc.setTextColor(225, 27, 40);
    doc.text('WENS DOOR', 14, 20);
  }

  // Header Info
  doc.setFontSize(14);
  doc.setTextColor(225, 27, 40);
  doc.setFont(fontName, 'bold');
  doc.text('CENOVÁ PONUKA č.: ' + item.cisloCP, pageWidth - 14, 18, { align: 'right' });
  
  doc.setDrawColor(200);
  doc.line(14, 22, pageWidth - 14, 22);

  // Company Info (Left) - no "Dodávateľ:" label
  let yPos = 27;
  doc.setFontSize(8);
  doc.setTextColor(0);
  doc.setFont(fontName, 'bold');
  doc.text('WENS DOOR s.r.o., Vápenická 12, Prievidza 971 01', 14, yPos);
  doc.setFont(fontName, 'normal');
  yPos += 4;
  doc.text('zap.v OR SR Trenčín od.Sro, Vl.č. 17931 / R', 14, yPos);
  yPos += 4;
  doc.text('IČO: 36792942, IČ DPH: SK2022396904', 14, yPos);
  yPos += 4;
  doc.text('banka: PRIMABANKA Slovensko a.s. č.ú.: 4520 001 507/3100', 14, yPos);
  yPos += 4;
  doc.text('email: info@wens.sk, tel: 046 / 542 2057', 14, yPos);

  // Client Info (Right) - no "Odberateľ:" label
  yPos = 27;
  const rightColX = pageWidth / 2 + 10;

  // Check if architect info exists
  const hasArchitect = formData.architektonickyPriezvisko || formData.architektonickeMeno || formData.architektonickyIco;

  // Check if we should show customer and/or architect info from item data
  const showCustomerInfo = item.data?.showCustomerInfo !== false;
  const showArchitectInfo = item.data?.showArchitectInfo === true && hasArchitect;

  // Calculate column positions based on what's shown
  const customerColX = rightColX;
  const architectColX = pageWidth - 14 - 35; // 35mm for architect column from right edge (moved right)

  if (showCustomerInfo) {
    let customerYPos = yPos;
    // Prioritize person name (priezvisko + meno) over firma, matching the modal display
    const clientName = `${formData.priezvisko || ''} ${formData.meno || ''}`.trim() || formData.firma;
    doc.setFontSize(8);
    doc.setFont(fontName, 'bold');
    doc.text(clientName, customerColX, customerYPos);
    doc.setFont(fontName, 'normal');
    customerYPos += 4;
    doc.text(`${formData.ulica}`, customerColX, customerYPos);
    customerYPos += 4;
    doc.text(`${formData.mesto} ${formData.psc}`, customerColX, customerYPos);
    customerYPos += 4;
    if (formData.telefon) {
        doc.text(`${formData.telefon}`, customerColX, customerYPos);
        customerYPos += 4;
    }
    if (formData.email) {
        doc.text(`${formData.email}`, customerColX, customerYPos);
        customerYPos += 4;
    }
  }

  if (showArchitectInfo) {
    let architectYPos = yPos;
    const archName = `${formData.architektonickyPriezvisko || ''} ${formData.architektonickeMeno || ''}`.trim();
    doc.setFontSize(8);
    doc.setFont(fontName, 'bold');
    if (archName) {
        doc.text(archName, architectColX, architectYPos);
        architectYPos += 4;
    }
    doc.setFont(fontName, 'normal');
    if (formData.architektonickyUlica) {
        doc.text(formData.architektonickyUlica, architectColX, architectYPos);
        architectYPos += 4;
    }
    if (formData.architektonickyMesto || formData.architektonickyPsc) {
        doc.text(`${formData.architektonickyMesto || ''} ${formData.architektonickyPsc || ''}`.trim(), architectColX, architectYPos);
        architectYPos += 4;
    }
    if (formData.architektonickyTelefon) {
        doc.text(`${formData.architektonickyTelefon}`, architectColX, architectYPos);
        architectYPos += 4;
    }
    if (formData.architektonickyEmail) {
        doc.text(`${formData.architektonickyEmail}`, architectColX, architectYPos);
        architectYPos += 4;
    }
  }

  yPos = 50;

  if (item.typ === 'dvere' && item.data) {
    const data = item.data;

    // Tables
    const tableStyles = {
        fontSize: 8,
        cellPadding: 1,
        font: fontName,
        fontStyle: 'normal' as 'normal',
        lineColor: [0, 0, 0] as [number, number, number],
        lineWidth: 0.1,
        textColor: [0, 0, 0] as [number, number, number]
    };
    const headStyles = {
        fillColor: [225, 27, 40] as [number, number, number],
        fontStyle: 'bold' as 'bold',
        halign: 'center' as 'center',
        font: fontName,
        lineColor: [0, 0, 0] as [number, number, number],
        lineWidth: 0.1,
        textColor: [255, 255, 255] as [number, number, number]
    };

    // Popis zakázky - as a table
    autoTable(doc, {
      startY: yPos,
      body: [[data.popisVyrobkov || '']], // Display text, or empty string if null/undefined
      styles: { ...tableStyles, fontSize: 9, halign: 'left' }, // Using size 9 as before
      theme: 'grid', // Keeps borders
      tableWidth: 'auto' // Adjusts to content, or full page if needed
    });
    yPos = (doc as any).lastAutoTable.finalY + 5; // Add some gap, matching other tables

    // Product photos - render on the right side
    const productPhotos = data.productPhotos || [];
    const hasPhotos = productPhotos.length > 0;

    // Calculate layout widths
    const leftMargin = 14;
    const rightMargin = 14;
    const totalWidth = pageWidth - leftMargin - rightMargin;
    const photoSectionWidth = hasPhotos ? 60 : 0; // 60mm for photos (2 photos per row at 28mm each + gap)
    const specSectionWidth = hasPhotos ? totalWidth - photoSectionWidth - 5 : totalWidth; // 5mm gap between sections

    // Store yPos for specs start to align photos
    const specsStartY = yPos;

    // Build specification rows for Výrobky table (Dvere, Zárubňa, Obklad)
    const specRows: any[][] = [];
    let specRowCount = 0;

    // Specifications rows
    if (data.specifications && data.specifications.length > 0) {
        const dvereSpecs = data.specifications.filter((s: any) => s.type === 'dvere');
        const zarubnaSpecs = data.specifications.filter((s: any) => s.type === 'zarubna');
        const obkladSpecs = data.specifications.filter((s: any) => s.type === 'obklad');

        dvereSpecs.forEach((spec: any, idx: number) => {
            specRows.push([
                { content: idx === 0 ? 'Dvere:' : '', styles: { fontStyle: 'bold', halign: 'left', fillColor: [225, 27, 40], textColor: 255 } },
                { content: spec.value || '', colSpan: 10, styles: { halign: 'left' } }
            ]);
            specRowCount++;
        });

        zarubnaSpecs.forEach((spec: any, idx: number) => {
            specRows.push([
                { content: idx === 0 ? 'Zárubňa:' : '', styles: { fontStyle: 'bold', halign: 'left', fillColor: [225, 27, 40], textColor: 255 } },
                { content: spec.value || '', colSpan: 10, styles: { halign: 'left' } }
            ]);
            specRowCount++;
        });

        obkladSpecs.forEach((spec: any, idx: number) => {
            specRows.push([
                { content: idx === 0 ? 'Obklad:' : '', styles: { fontStyle: 'bold', halign: 'left', fillColor: [225, 27, 40], textColor: 255 } },
                { content: spec.value || '', colSpan: 10, styles: { halign: 'left' } }
            ]);
            specRowCount++;
        });
    }

    // Add "Výrobky" as first column with rowSpan for all spec rows
    if (specRowCount > 0 && specRows.length > 0) {
        specRows[0] = [
            { content: 'Výrobky', rowSpan: specRowCount, styles: { fontStyle: 'bold', halign: 'left', valign: 'middle', fillColor: [225, 27, 40], textColor: 255 } },
            ...specRows[0]
        ];
    }

    // 1. Výrobky table with integrated header
    // Build rows with separate lines for each part (Dvere, Zárubňa, Obklad, Prázdne)
    // First row of each miestnosť gets rowSpan for # and Miestnosť columns

    const vyrobkyRows: any[][] = [];
    let itemNumber = 0;

    data.vyrobky
      .filter((v: any) => (v.ks || 0) > 0 || (v.ksZarubna || 0) > 0 || (v.ksObklad || 0) > 0 || (v.ksPrazdne || 0) > 0)
      .forEach((v: any) => {
        itemNumber++;
        const parts: { polozka: string; typ: string; pl: string; zamok: string; sklo: string; povrch: string; poznamka: string; ks: number; cena: number; total: number }[] = [];

        // Dvere part
        if ((v.ks || 0) > 0) {
            parts.push({
                polozka: v.polozkaDvere || 'Dvere',
                typ: v.dvereTypRozmer || '',
                pl: v.pL || v.pLDvere || '',
                zamok: v.zamok || v.zamokDvere || '',
                sklo: v.sklo || '',
                povrch: v.povrch || '',
                poznamka: v.poznamkaDvere || '',
                ks: v.ks,
                cena: v.cenaDvere,
                total: (v.ks || 0) * (v.cenaDvere || 0)
            });
        }
        // Zarubna part
        if ((v.ksZarubna || 0) > 0) {
            parts.push({
                polozka: v.polozkaZarubna || 'Zárubňa',
                typ: v.dvereOtvor || '',
                pl: v.pLZarubna || '',
                zamok: v.zamokZarubna || '',
                sklo: v.skloZarubna || '',
                povrch: v.povrchZarubna || '',
                poznamka: v.poznamkaZarubna || '',
                ks: v.ksZarubna,
                cena: v.cenaZarubna,
                total: (v.ksZarubna || 0) * (v.cenaZarubna || 0)
            });
        }
        // Obklad part
        if ((v.ksObklad || 0) > 0) {
            parts.push({
                polozka: v.polozkaObklad || 'Obklad',
                typ: v.typObklad || '',
                pl: v.pLObklad || '',
                zamok: v.zamokObklad || '',
                sklo: v.skloObklad || '',
                povrch: v.povrchObklad || '',
                poznamka: v.poznamkaObklad || '',
                ks: v.ksObklad,
                cena: v.cenaObklad,
                total: (v.ksObklad || 0) * (v.cenaObklad || 0)
            });
        }
        // Prazdne part
        if ((v.ksPrazdne || 0) > 0) {
            parts.push({
                polozka: v.polozkaPrazdne || 'Prázdne',
                typ: v.typPrazdne || '',
                pl: v.pLPrazdne || '',
                zamok: v.zamokPrazdne || '',
                sklo: v.skloPrazdne || '',
                povrch: v.povrchPrazdne || '',
                poznamka: v.poznamkaPrazdne || '',
                ks: v.ksPrazdne,
                cena: v.cenaPrazdne,
                total: (v.ksPrazdne || 0) * (v.cenaPrazdne || 0)
            });
        }

        // Create separate row for each part
        parts.forEach((part, partIndex) => {
            if (partIndex === 0) {
                // First row gets rowSpan for # and Miestnosť
                vyrobkyRows.push([
                    { content: itemNumber, rowSpan: parts.length, styles: { valign: 'middle' } },
                    { content: v.miestnost, rowSpan: parts.length, styles: { valign: 'middle' } },
                    part.polozka,
                    part.typ,
                    part.pl,
                    part.zamok,
                    part.sklo,
                    part.povrch,
                    part.poznamka,
                    part.ks,
                    `${(part.cena || 0).toFixed(2)} €`,
                    `${(part.total || 0).toFixed(2)} €`
                ]);
            } else {
                // Subsequent rows skip # and Miestnosť columns (handled by rowSpan)
                vyrobkyRows.push([
                    part.polozka,
                    part.typ,
                    part.pl,
                    part.zamok,
                    part.sklo,
                    part.povrch,
                    part.poznamka,
                    part.ks,
                    `${(part.cena || 0).toFixed(2)} €`,
                    `${(part.total || 0).toFixed(2)} €`
                ]);
            }
        });
    });

    // Calculate vyrobky total for summary row
    const vyrobkyTotalCalc = data.vyrobky.reduce((sum: number, v: any) => {
      const dvere = (v.ks || 0) * (v.cenaDvere || 0);
      const zarubna = (v.ksZarubna || 0) * (v.cenaZarubna || 0);
      const obklad = (v.ksObklad || 0) * (v.cenaObklad || 0);
      const prazdne = (v.ksPrazdne || 0) * (v.cenaPrazdne || 0);
      return sum + dvere + zarubna + obklad + prazdne;
    }, 0);

    // First table: Výrobky header info with "Výrobky" spanning left column
    let specsEndY = yPos;
    if (specRows.length > 0) {
        autoTable(doc, {
            startY: yPos,
            body: specRows,
            styles: { ...tableStyles, fontSize: 7 }, // Match header font size
            columnStyles: {
                0: { cellWidth: 20, halign: 'left' }, // # + Miestnosť width for "Výrobky"
                1: { cellWidth: 14, halign: 'left' }, // Same width as Položka column for labels (Dvere, Zárubňa, etc.)
                2: { halign: 'left' } // Rest for value (spans remaining columns)
            },
            theme: 'grid',
            tableWidth: hasPhotos ? specSectionWidth : 'auto'
        });
        specsEndY = (doc as any).lastAutoTable.finalY;
    }

    // Render product photos on the right side of specifications
    // Note: Photos are already cropped to square at upload time in DvereForm
    let photosEndY = specsStartY;
    if (hasPhotos) {
        const photoStartX = leftMargin + specSectionWidth + 5; // Start after specs + gap
        const photoSize = 28; // Size of square photo in mm
        const photoGapX = 4; // Gap between photos horizontally
        const photoGapY = 2; // Reduced gap between rows
        const descHeight = 6; // Space for description
        const photosPerRow = 2;

        let currentPhotoY = specsStartY;

        for (let i = 0; i < productPhotos.length; i++) {
            const photo = productPhotos[i];
            const colIndex = i % photosPerRow;
            const rowIndex = Math.floor(i / photosPerRow);

            // Calculate position
            const photoX = photoStartX + colIndex * (photoSize + photoGapX);
            const photoY = specsStartY + rowIndex * (photoSize + descHeight + photoGapY);

            try {
                // Add the image (already cropped to square at upload)
                doc.addImage(photo.base64, 'JPEG', photoX, photoY, photoSize, photoSize);

                // Add border around photo
                doc.setDrawColor(200);
                doc.rect(photoX, photoY, photoSize, photoSize);

                // Add description below photo if exists
                if (photo.description) {
                    doc.setFontSize(6);
                    doc.setTextColor(0);
                    doc.setFont(fontName, 'normal');
                    const descLines = doc.splitTextToSize(photo.description, photoSize);
                    doc.text(descLines, photoX, photoY + photoSize + 2);
                }

                // Track the bottom position
                currentPhotoY = photoY + photoSize + descHeight;
            } catch (e) {
                console.warn('Failed to add product photo to PDF:', e);
            }
        }

        photosEndY = currentPhotoY;
    }

    // Use the maximum Y position between specs and photos
    yPos = Math.max(specsEndY, photosEndY);

    // Second part: Column headers and data rows
    const headerRow = [
      { content: '#', styles: { halign: 'center' as const } },
      { content: 'Miestnosť', styles: { halign: 'left' as const } },
      { content: 'Položka', styles: { halign: 'left' as const } },
      { content: 'Typ / Rozmer', styles: { halign: 'left' as const } },
      { content: 'P/Ľ', styles: { halign: 'left' as const } },
      { content: 'Zámok', styles: { halign: 'left' as const } },
      { content: 'Sklo', styles: { halign: 'left' as const } },
      { content: 'Povrch', styles: { halign: 'left' as const } },
      { content: 'Poznámka', styles: { halign: 'left' as const } },
      { content: 'Ks', styles: { halign: 'right' as const } },
      { content: 'Cena/ks', styles: { halign: 'right' as const } },
      { content: 'Cena celkom', styles: { halign: 'right' as const } }
    ];
    autoTable(doc, {
      startY: yPos,
      head: specRows.length > 0 ? [headerRow] : [
        [{ content: 'Výrobky', colSpan: 12, styles: { fillColor: [225, 27, 40], fontStyle: 'bold', halign: 'left' } }],
        headerRow
      ],
      body: vyrobkyRows,
      styles: { ...tableStyles, fontSize: 7 },
      headStyles: { ...headStyles, fontSize: 7 },
      columnStyles: {
          0: { cellWidth: 6, halign: 'center' },  // #
          1: { cellWidth: 14, halign: 'left' },   // Miestnosť
          2: { cellWidth: 14, halign: 'left' },   // Položka
          3: { cellWidth: 18, halign: 'left' },   // Typ / Rozmer
          4: { cellWidth: 8, halign: 'left' },    // P/Ľ
          5: { cellWidth: 14, halign: 'left' },   // Zámok
          6: { cellWidth: 14, halign: 'left' },   // Sklo
          7: { cellWidth: 14, halign: 'left' },   // Povrch
          8: { halign: 'left' },                  // Poznámka (auto)
          9: { cellWidth: 10, halign: 'right' },  // Ks
          10: { cellWidth: 18, halign: 'right' }, // Cena/ks
          11: { cellWidth: 28, halign: 'right' }  // Cena celkom (wider)
      }
    });
    yPos = (doc as any).lastAutoTable.finalY;

    // Summary row for Výrobky
    autoTable(doc, {
      startY: yPos,
      body: [['Spolu bez DPH:', `${vyrobkyTotalCalc.toFixed(2)} €`]],
      styles: { ...tableStyles, fontSize: 7, fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 10 + 18, halign: 'right' }, // Ks + Cena/ks width
        1: { cellWidth: 28, halign: 'right' }  // Cena celkom width
      },
      margin: { left: pageWidth - 14 - (10 + 18 + 28) }
    });

    yPos = (doc as any).lastAutoTable.finalY + 5;

    // 2. Príplatky
    if (data.priplatky.some((p: any) => p.ks > 0)) {
        const priplatkyRows = data.priplatky
          .filter((p: any) => p.ks > 0)
          .map((p: any, i: number) => [
            i + 1,
            p.nazov,
            p.ks,
            `${p.cenaKs.toFixed(2)} €`,
            `${p.cenaCelkom.toFixed(2)} €`
          ]);

        // Calculate príplatky total
        const priplatkyTotalCalc = data.priplatky.reduce((sum: number, p: any) => sum + (p.cenaCelkom || 0), 0);

        autoTable(doc, {
          startY: yPos,
          head: [[
            { content: 'Príplatky', colSpan: 2, styles: { halign: 'left' } },
            { content: 'Ks', styles: { halign: 'right' } },
            { content: 'Cena/ks', styles: { halign: 'right' } },
            { content: 'Cena celkom', styles: { halign: 'right' } }
          ]],
          body: priplatkyRows,
          styles: { ...tableStyles, fontSize: 7 },
          headStyles: { ...headStyles, fontSize: 7 },
          columnStyles: {
              0: { cellWidth: 6, halign: 'center' },
              1: { halign: 'left' },
              2: { cellWidth: 10, halign: 'right' },
              3: { cellWidth: 18, halign: 'right' },
              4: { cellWidth: 28, halign: 'right' }  // Cena celkom (wider)
          }
        });
        yPos = (doc as any).lastAutoTable.finalY;

        // Summary row for Príplatky
        autoTable(doc, {
          startY: yPos,
          body: [['Spolu bez DPH:', `${priplatkyTotalCalc.toFixed(2)} €`]],
          styles: { ...tableStyles, fontSize: 7, fontStyle: 'bold' },
          columnStyles: {
            0: { cellWidth: 10 + 18, halign: 'right' },
            1: { cellWidth: 28, halign: 'right' }
          },
          margin: { left: pageWidth - 14 - (10 + 18 + 28) }
        });

        yPos = (doc as any).lastAutoTable.finalY + 5;
    }

    // Calculate totals for summary
    const priplatkyTotal = data.priplatky.reduce((sum: number, p: any) => sum + (p.cenaCelkom || 0), 0);
    const subtotal = vyrobkyTotalCalc + priplatkyTotal;
    const zlavaPercent = data.zlavaPercent || 0;
    const zlavaAmount = subtotal * zlavaPercent / 100;
    const afterZlava = subtotal - zlavaAmount;

    // Summary table row 1 - Cena za výrobky a príplatky spolu
    autoTable(doc, {
      startY: yPos,
      body: [['Cena za výrobky a príplatky spolu:', 'spolu bez DPH', `${subtotal.toFixed(2)} €`]],
      styles: { ...tableStyles, fontSize: 7, fontStyle: 'bold' },
      columnStyles: {
        0: { halign: 'right' },
        1: { cellWidth: 10 + 18, halign: 'right' }, // Aligned with Ks + Cena/ks columns
        2: { cellWidth: 28, halign: 'right' }       // Aligned with Cena celkom column
      }
    });
    yPos = (doc as any).lastAutoTable.finalY;

    // Summary table row 2 - Zľava - larger (fontSize 11)
    autoTable(doc, {
      startY: yPos,
      body: [[`Zľava z ceny výrobkov a príplatkov:`, `${zlavaPercent.toFixed(0)} %`, `${zlavaAmount.toFixed(2)} €`]],
      styles: { ...tableStyles, fontSize: 11, fontStyle: 'bold' },
      columnStyles: {
        0: { halign: 'right' },
        1: { cellWidth: 10 + 18, halign: 'right' }, // Aligned with Ks + Cena/ks columns
        2: { cellWidth: 28, halign: 'right' }       // Aligned with Cena celkom column
      }
    });
    yPos = (doc as any).lastAutoTable.finalY;

    // Summary table row 3 - after discount
    autoTable(doc, {
      startY: yPos,
      body: [['Cena výrobkov a príplatkov po odpočítaní zľavy spolu:', 'spolu bez DPH', `${afterZlava.toFixed(2)} €`]],
      styles: { ...tableStyles, fontSize: 7, fontStyle: 'bold' },
      columnStyles: {
        0: { halign: 'right' },
        1: { cellWidth: 10 + 18, halign: 'right' }, // Aligned with Ks + Cena/ks columns
        2: { cellWidth: 28, halign: 'right' }       // Aligned with Cena celkom column
      }
    });
    yPos = (doc as any).lastAutoTable.finalY + 5;

    // 3. Kovanie
    if (data.kovanie.some((k: any) => k.ks > 0)) {
        const kovanieRows = data.kovanie
          .filter((k: any) => k.ks > 0)
          .map((k: any, i: number) => [
            i + 1,
            k.nazov,
            k.ks,
            `${k.cenaKs.toFixed(2)} €`,
            `${k.cenaCelkom.toFixed(2)} €`
          ]);

        // Calculate kovanie total
        const kovanieTotalCalc = data.kovanie.reduce((sum: number, k: any) => sum + (k.cenaCelkom || 0), 0);

        autoTable(doc, {
          startY: yPos,
          head: [[
            { content: 'Kovanie', colSpan: 2, styles: { halign: 'left' } },
            { content: 'Ks', styles: { halign: 'right' } },
            { content: 'Cena/ks', styles: { halign: 'right' } },
            { content: 'Cena celkom', styles: { halign: 'right' } }
          ]],
          body: kovanieRows,
          styles: { ...tableStyles, fontSize: 7 },
          headStyles: { ...headStyles, fontSize: 7 },
          columnStyles: {
              0: { cellWidth: 6, halign: 'center' },
              1: { halign: 'left' },
              2: { cellWidth: 10, halign: 'right' },
              3: { cellWidth: 18, halign: 'right' },
              4: { cellWidth: 28, halign: 'right' }  // Cena celkom (wider)
          }
        });
        yPos = (doc as any).lastAutoTable.finalY;

        // Summary row for Kovanie
        autoTable(doc, {
          startY: yPos,
          body: [['Spolu bez DPH:', `${kovanieTotalCalc.toFixed(2)} €`]],
          styles: { ...tableStyles, fontSize: 7, fontStyle: 'bold' },
          columnStyles: {
            0: { cellWidth: 10 + 18, halign: 'right' },
            1: { cellWidth: 28, halign: 'right' }
          },
          margin: { left: pageWidth - 14 - (10 + 18 + 28) }
        });

        yPos = (doc as any).lastAutoTable.finalY + 5;
    }

    // 4. Montaz
    if (data.montaz.some((m: any) => m.ks > 0)) {
        const montazRows = data.montaz
          .filter((m: any) => m.ks > 0)
          .map((m: any, i: number) => [
            i + 1,
            m.nazov,
            m.ks,
            `${m.cenaKs.toFixed(2)} €`,
            `${m.cenaCelkom.toFixed(2)} €`
          ]);

        // Calculate montáž total
        const montazTotalCalc = data.montaz.reduce((sum: number, m: any) => sum + (m.cenaCelkom || 0), 0);

        autoTable(doc, {
          startY: yPos,
          head: [[
            { content: 'Montáž', colSpan: 2, styles: { halign: 'left' } },
            { content: 'Ks', styles: { halign: 'right' } },
            { content: 'Cena/ks', styles: { halign: 'right' } },
            { content: 'Cena celkom', styles: { halign: 'right' } }
          ]],
          body: montazRows,
          styles: { ...tableStyles, fontSize: 7 },
          headStyles: { ...headStyles, fontSize: 7 },
          columnStyles: {
              0: { cellWidth: 6, halign: 'center' },
              1: { halign: 'left' },
              2: { cellWidth: 10, halign: 'right' },
              3: { cellWidth: 18, halign: 'right' },
              4: { cellWidth: 28, halign: 'right' }  // Cena celkom (wider)
          }
        });
        yPos = (doc as any).lastAutoTable.finalY;

        // Summary row for Montáž
        autoTable(doc, {
          startY: yPos,
          body: [['Spolu bez DPH:', `${montazTotalCalc.toFixed(2)} €`]],
          styles: { ...tableStyles, fontSize: 7, fontStyle: 'bold' },
          columnStyles: {
            0: { cellWidth: 10 + 18, halign: 'right' },
            1: { cellWidth: 28, halign: 'right' }
          },
          margin: { left: pageWidth - 14 - (10 + 18 + 28) }
        });

        yPos = (doc as any).lastAutoTable.finalY + 5;
    }

    if (yPos > doc.internal.pageSize.height - 70) {
        doc.addPage();
        yPos = 20;
    }

    // Totals & Payment Plan Tables (neutral, no header)
    const cenaSDPH = item.cenaSDPH;

    // Helper to round UP to nearest 10 (matches QuoteFooter display)
    const roundUpToTen = (value: number) => Math.ceil(value / 10) * 10;

    // Check if using default 60/30/10 split
    const isDefaultSplit = data.platba1Percent === 60 && data.platba2Percent === 30 && data.platba3Percent === 10;
    const hasNoManualAmounts = data.platba1Amount == null && data.platba2Amount == null && data.platba3Amount == null;

    // Use saved amounts if available, otherwise calculate with rounding for default split
    let platba1Amount: string, platba2Amount: string, platba3Amount: string;
    if (data.platba1Amount != null) {
      platba1Amount = data.platba1Amount.toFixed(2);
    } else if (isDefaultSplit && hasNoManualAmounts) {
      platba1Amount = roundUpToTen(cenaSDPH * 0.60).toFixed(2);
    } else {
      platba1Amount = (cenaSDPH * (data.platba1Percent || 0) / 100).toFixed(2);
    }

    if (data.platba2Amount != null) {
      platba2Amount = data.platba2Amount.toFixed(2);
    } else if (isDefaultSplit && hasNoManualAmounts) {
      platba2Amount = roundUpToTen(cenaSDPH * 0.30).toFixed(2);
    } else {
      platba2Amount = (cenaSDPH * (data.platba2Percent || 0) / 100).toFixed(2);
    }

    if (data.platba3Amount != null) {
      platba3Amount = data.platba3Amount.toFixed(2);
    } else if (isDefaultSplit && hasNoManualAmounts) {
      // Remainder after rounding
      const p1 = roundUpToTen(cenaSDPH * 0.60);
      const p2 = roundUpToTen(cenaSDPH * 0.30);
      platba3Amount = (cenaSDPH - p1 - p2).toFixed(2);
    } else {
      platba3Amount = (cenaSDPH * (data.platba3Percent || 0) / 100).toFixed(2);
    }

    // Table width: col0 (45) + col1 (28) = 73mm for portrait
    const tableWidth = 73;
    const tableStartX = pageWidth - 14 - tableWidth;
    const startYForBoth = yPos;

    // Price totals table - rows 1 & 2 (normal size, bold)
    autoTable(doc, {
      startY: yPos,
      margin: { left: tableStartX },
      body: [
        ['Cena bez DPH:', `${item.cenaBezDPH.toFixed(2)} €`],
        ['DPH 23%:', `${(item.cenaBezDPH * 0.23).toFixed(2)} €`]
      ],
      styles: { ...tableStyles, fontSize: 7, fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 45, halign: 'right' },
        1: { cellWidth: 28, halign: 'right' }
      }
    });

    // Price totals table - row 3 (Cena s DPH - larger, bold)
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY,
      margin: { left: tableStartX },
      body: [['Cena s DPH:', `${cenaSDPH.toFixed(2)} €`]],
      styles: { ...tableStyles, fontSize: 11, fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 45, halign: 'right' },
        1: { cellWidth: 28, halign: 'right' }
      }
    });

    // Payment plan table (with gap)
    const paymentRows = [
      [{ content: '1. záloha - pri objednávke', styles: { halign: 'right' as const } }, `${(data.platba1Percent || 0).toFixed(0)} %`, `${platba1Amount} €`],
      [{ content: '2. platba - pred montážou', styles: { halign: 'right' as const } }, `${(data.platba2Percent || 0).toFixed(0)} %`, `${platba2Amount} €`],
      [{ content: '3. platba - po montáži', styles: { halign: 'right' as const } }, `${(data.platba3Percent || 0).toFixed(0)} %`, `${platba3Amount} €`]
    ];

    // Payment table width: 45 + 12 + 28 = 85mm
    const paymentTableWidth = 85;
    
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 5,
      margin: { left: pageWidth - 14 - paymentTableWidth }, // Right-aligned
      body: paymentRows,
      styles: { ...tableStyles, fontSize: 7 },
      columnStyles: {
        0: { cellWidth: 45 },
        1: { cellWidth: 12, halign: 'right' },
        2: { cellWidth: 28, halign: 'right', fontStyle: 'bold' }
      }
    });

    // Left side info - positioned next to the table
    const maxLeftWidth = tableStartX - 14 - 5; // 5mm gap between text and table

    doc.setFontSize(8);

    let leftYPos = startYForBoth;
    const printLabelValue = (label: string, value: string) => {
      // Print label in bold
      doc.setFont(fontName, 'bold');
      const labelWidth = doc.getTextWidth(label + ' ');
      doc.text(label, 14, leftYPos);

      // Print value in normal
      doc.setFont(fontName, 'normal');
      const valueText = value || '-';
      const remainingWidth = maxLeftWidth - labelWidth;
      const lines = doc.splitTextToSize(valueText, remainingWidth);
      doc.text(lines, 14 + labelWidth, leftYPos);
      leftYPos += Math.max(1, lines.length) * 4;
    };

    printLabelValue('Platnosť ponuky:', data.platnostPonuky || '-');
    printLabelValue('Miesto dodávky:', data.miestoDodavky || '-');
    printLabelValue('Zameranie:', data.zameranie || '-');
    printLabelValue('Termín dodania:', data.terminDodania || '-');
    printLabelValue('Vypracoval:', data.vypracoval !== undefined ? data.vypracoval : (userInfo?.vypracoval || formData.vypracoval));
    printLabelValue('Kontakt:', data.kontakt !== undefined ? data.kontakt : (userInfo?.telefon || '-'));
    printLabelValue('E-mail:', data.emailVypracoval !== undefined ? data.emailVypracoval : (userInfo?.email || '-'));
    printLabelValue('Dátum:', data.datum !== undefined ? data.datum : new Date().toLocaleDateString('sk-SK'));

    yPos = Math.max((doc as any).lastAutoTable.finalY, leftYPos) + 5;

  } else if ((item.typ === 'nabytok' || item.typ === 'schody') && item.data) {
    // Nabytok and Schody have similar structure
    const data = item.data;
    const typLabel = item.typ === 'nabytok' ? 'Nábytok' : 'Schody';

    // Tables - adjusted for portrait
    const tableStyles = {
        fontSize: 7,
        cellPadding: 1,
        font: fontName,
        fontStyle: 'normal' as 'normal',
        lineColor: [0, 0, 0] as [number, number, number],
        lineWidth: 0.1,
        textColor: [0, 0, 0] as [number, number, number]
    };
    const headStyles = {
        fillColor: [225, 27, 40] as [number, number, number],
        fontStyle: 'bold' as 'bold',
        halign: 'center' as 'center',
        font: fontName,
        lineColor: [0, 0, 0] as [number, number, number],
        lineWidth: 0.1,
        textColor: [255, 255, 255] as [number, number, number]
    };

    // Popis zakázky - as a table
    autoTable(doc, {
      startY: yPos,
      body: [[data.popisVyrobkov || '']], // Display text, or empty string if null/undefined
      styles: { ...tableStyles, fontSize: 8, halign: 'left' }, // Using size 8 as before
      theme: 'grid', // Keeps borders
      tableWidth: 'auto' // Adjusts to content, or full page if needed
    });
    yPos = (doc as any).lastAutoTable.finalY + 5; // Add some gap, matching other tables

    // 1. Výrobky table for Nabytok/Schody
    const vyrobkyRows = data.vyrobky.filter((v: any) => v.ks > 0 || v.nazov).map((v: any, i: number) => [
      i + 1,
      v.nazov || '',
      v.rozmer || '',
      v.material || '',
      v.poznamka || '',
      v.ks,
      `${(v.cenaKs || 0).toFixed(2)} €`,
      `${(v.cenaCelkom || 0).toFixed(2)} €`
    ]);

    // Calculate vyrobky total
    const vyrobkyTotalCalc = data.vyrobky.reduce((sum: number, v: any) => sum + (v.cenaCelkom || 0), 0);

    autoTable(doc, {
      startY: yPos,
      head: [
        [{ content: `Výrobky - ${typLabel}`, colSpan: 8, styles: { fillColor: [225, 27, 40], fontStyle: 'bold', halign: 'left' } }],
        ['#', 'Názov', 'Rozmer', 'Materiál', 'Poznámka', 'Ks', 'Cena/ks', 'Cena celkom']
      ],
      body: vyrobkyRows,
      styles: tableStyles,
      headStyles: headStyles,
      columnStyles: {
          0: { cellWidth: 6, halign: 'center' },
          1: { halign: 'left' },
          2: { cellWidth: 22, halign: 'left' },
          3: { cellWidth: 22, halign: 'left' },
          4: { halign: 'left' },
          5: { cellWidth: 10, halign: 'center' },
          6: { cellWidth: 18, halign: 'right' },
          7: { cellWidth: 28, halign: 'right' }
      }
    });
    yPos = (doc as any).lastAutoTable.finalY;

    // Summary row for Výrobky
    autoTable(doc, {
      startY: yPos,
      body: [['Spolu bez DPH:', `${vyrobkyTotalCalc.toFixed(2)} €`]],
      styles: { ...tableStyles, fontSize: 7, fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 10 + 18, halign: 'right' },
        1: { cellWidth: 28, halign: 'right' }
      },
      margin: { left: pageWidth - 14 - (10 + 18 + 28) }
    });

    yPos = (doc as any).lastAutoTable.finalY + 5;

    // 2. Príplatky
    if (data.priplatky.some((p: any) => p.ks > 0)) {
        const priplatkyRows = data.priplatky
          .filter((p: any) => p.ks > 0)
          .map((p: any, i: number) => [
            i + 1,
            p.nazov,
            p.ks,
            `${(p.cenaKs || 0).toFixed(2)} €`,
            `${(p.cenaCelkom || 0).toFixed(2)} €`
          ]);

        const priplatkyTotalCalc = data.priplatky.reduce((sum: number, p: any) => sum + (p.cenaCelkom || 0), 0);

        autoTable(doc, {
          startY: yPos,
          head: [[
            { content: 'Príplatky', colSpan: 2, styles: { halign: 'left' } },
            { content: 'Ks', styles: { halign: 'right' } },
            { content: 'Cena/ks', styles: { halign: 'right' } },
            { content: 'Cena celkom', styles: { halign: 'right' } }
          ]],
          body: priplatkyRows,
          styles: tableStyles,
          headStyles: headStyles,
          columnStyles: {
              0: { cellWidth: 6, halign: 'center' },
              1: { halign: 'left' },
              2: { cellWidth: 10, halign: 'right' },
              3: { cellWidth: 18, halign: 'right' },
              4: { cellWidth: 28, halign: 'right' }
          }
        });
        yPos = (doc as any).lastAutoTable.finalY;

        autoTable(doc, {
          startY: yPos,
          body: [['Spolu bez DPH:', `${priplatkyTotalCalc.toFixed(2)} €`]],
          styles: { ...tableStyles, fontSize: 7, fontStyle: 'bold' },
          columnStyles: {
            0: { cellWidth: 10 + 18, halign: 'right' },
            1: { cellWidth: 28, halign: 'right' }
          },
          margin: { left: pageWidth - 14 - (10 + 18 + 28) }
        });

        yPos = (doc as any).lastAutoTable.finalY + 5;
    }

    // Calculate totals for summary
    const vyrobkyTotal = data.vyrobky.reduce((sum: number, v: any) => sum + (v.cenaCelkom || 0), 0);
    const priplatkyTotal = data.priplatky.reduce((sum: number, p: any) => sum + (p.cenaCelkom || 0), 0);
    const subtotal = vyrobkyTotal + priplatkyTotal;
    const zlavaPercent = data.zlavaPercent || 0;
    const zlavaAmount = subtotal * zlavaPercent / 100;
    const afterZlava = subtotal - zlavaAmount;

    // Summary table row 1 - normal size
    autoTable(doc, {
      startY: yPos,
      body: [['Cena za výrobky a príplatky spolu:', 'spolu bez DPH', `${subtotal.toFixed(2)} €`]],
      styles: { ...tableStyles, fontSize: 7, fontStyle: 'bold' },
      columnStyles: {
        0: { halign: 'right' },
        1: { cellWidth: 22, halign: 'right' },
        2: { cellWidth: 28, halign: 'right' }
      }
    });
    yPos = (doc as any).lastAutoTable.finalY;

    // Summary table row 2 - Zľava - larger (fontSize 11)
    autoTable(doc, {
      startY: yPos,
      body: [[`Zľava z ceny výrobkov a príplatkov:`, `${zlavaPercent.toFixed(0)} %`, `${zlavaAmount.toFixed(2)} €`]],
      styles: { ...tableStyles, fontSize: 11, fontStyle: 'bold' },
      columnStyles: {
        0: { halign: 'right' },
        1: { cellWidth: 28, halign: 'right' },
        2: { cellWidth: 28, halign: 'right' }
      }
    });
    yPos = (doc as any).lastAutoTable.finalY;

    // Summary table row 3 - normal size
    autoTable(doc, {
      startY: yPos,
      body: [['Cena výrobkov a príplatkov po odpočítaní zľavy spolu:', 'spolu bez DPH', `${afterZlava.toFixed(2)} €`]],
      styles: { ...tableStyles, fontSize: 7, fontStyle: 'bold' },
      columnStyles: {
        0: { halign: 'right' },
        1: { cellWidth: 22, halign: 'right' },
        2: { cellWidth: 28, halign: 'right' }
      }
    });
    yPos = (doc as any).lastAutoTable.finalY + 5;

    // 3. Kovanie
    if (data.kovanie.some((k: any) => k.ks > 0)) {
        const kovanieRows = data.kovanie
          .filter((k: any) => k.ks > 0)
          .map((k: any, i: number) => [
            i + 1,
            k.nazov,
            k.ks,
            `${(k.cenaKs || 0).toFixed(2)} €`,
            `${(k.cenaCelkom || 0).toFixed(2)} €`
          ]);

        const kovanieTotalCalc = data.kovanie.reduce((sum: number, k: any) => sum + (k.cenaCelkom || 0), 0);

        autoTable(doc, {
          startY: yPos,
          head: [[
            { content: 'Kovanie', colSpan: 2, styles: { halign: 'left' } },
            { content: 'Ks', styles: { halign: 'right' } },
            { content: 'Cena/ks', styles: { halign: 'right' } },
            { content: 'Cena celkom', styles: { halign: 'right' } }
          ]],
          body: kovanieRows,
          styles: tableStyles,
          headStyles: headStyles,
          columnStyles: {
              0: { cellWidth: 6, halign: 'center' },
              1: { halign: 'left' },
              2: { cellWidth: 10, halign: 'right' },
              3: { cellWidth: 18, halign: 'right' },
              4: { cellWidth: 28, halign: 'right' }
          }
        });
        yPos = (doc as any).lastAutoTable.finalY;

        autoTable(doc, {
          startY: yPos,
          body: [['Spolu bez DPH:', `${kovanieTotalCalc.toFixed(2)} €`]],
          styles: { ...tableStyles, fontSize: 7, fontStyle: 'bold' },
          columnStyles: {
            0: { cellWidth: 10 + 18, halign: 'right' },
            1: { cellWidth: 28, halign: 'right' }
          },
          margin: { left: pageWidth - 14 - (10 + 18 + 28) }
        });

        yPos = (doc as any).lastAutoTable.finalY + 5;
    }

    // 4. Montáž
    if (data.montaz.some((m: any) => m.ks > 0)) {
        const montazRows = data.montaz
          .filter((m: any) => m.ks > 0)
          .map((m: any, i: number) => [
            i + 1,
            m.nazov,
            m.ks,
            `${(m.cenaKs || 0).toFixed(2)} €`,
            `${(m.cenaCelkom || 0).toFixed(2)} €`
          ]);

        const montazTotalCalc = data.montaz.reduce((sum: number, m: any) => sum + (m.cenaCelkom || 0), 0);

        autoTable(doc, {
          startY: yPos,
          head: [[
            { content: 'Montáž', colSpan: 2, styles: { halign: 'left' } },
            { content: 'Ks', styles: { halign: 'right' } },
            { content: 'Cena/ks', styles: { halign: 'right' } },
            { content: 'Cena celkom', styles: { halign: 'right' } }
          ]],
          body: montazRows,
          styles: tableStyles,
          headStyles: headStyles,
          columnStyles: {
              0: { cellWidth: 6, halign: 'center' },
              1: { halign: 'left' },
              2: { cellWidth: 10, halign: 'right' },
              3: { cellWidth: 18, halign: 'right' },
              4: { cellWidth: 28, halign: 'right' }
          }
        });
        yPos = (doc as any).lastAutoTable.finalY;

        autoTable(doc, {
          startY: yPos,
          body: [['Spolu bez DPH:', `${montazTotalCalc.toFixed(2)} €`]],
          styles: { ...tableStyles, fontSize: 7, fontStyle: 'bold' },
          columnStyles: {
            0: { cellWidth: 10 + 18, halign: 'right' },
            1: { cellWidth: 28, halign: 'right' }
          },
          margin: { left: pageWidth - 14 - (10 + 18 + 28) }
        });

        yPos = (doc as any).lastAutoTable.finalY + 5;
    }

    if (yPos > doc.internal.pageSize.height - 70) {
        doc.addPage();
        yPos = 20;
    }

    // Totals & Payment Plan Tables - adjusted for portrait
    const kovanieTotal = data.kovanie.reduce((sum: number, k: any) => sum + (k.cenaCelkom || 0), 0);
    const montazTotal = data.montaz.reduce((sum: number, m: any) => sum + (m.cenaCelkom || 0), 0);
    const cenaBezDPH = afterZlava + kovanieTotal + montazTotal;
    const cenaSDPH = data.manualCenaSDPH !== undefined && data.manualCenaSDPH !== null
        ? data.manualCenaSDPH
        : cenaBezDPH * 1.23;

    // Helper to round UP to nearest 10 (matches QuoteFooter display)
    const roundUpToTen2 = (value: number) => Math.ceil(value / 10) * 10;

    // Check if using default 60/30/10 split
    const isDefaultSplit2 = data.platba1Percent === 60 && data.platba2Percent === 30 && data.platba3Percent === 10;
    const hasNoManualAmounts2 = data.platba1Amount == null && data.platba2Amount == null && data.platba3Amount == null;

    // Use saved amounts if available, otherwise calculate with rounding for default split
    let platba1Amount: string, platba2Amount: string, platba3Amount: string;
    if (data.platba1Amount != null) {
      platba1Amount = data.platba1Amount.toFixed(2);
    } else if (isDefaultSplit2 && hasNoManualAmounts2) {
      platba1Amount = roundUpToTen2(cenaSDPH * 0.60).toFixed(2);
    } else {
      platba1Amount = (cenaSDPH * (data.platba1Percent || 0) / 100).toFixed(2);
    }

    if (data.platba2Amount != null) {
      platba2Amount = data.platba2Amount.toFixed(2);
    } else if (isDefaultSplit2 && hasNoManualAmounts2) {
      platba2Amount = roundUpToTen2(cenaSDPH * 0.30).toFixed(2);
    } else {
      platba2Amount = (cenaSDPH * (data.platba2Percent || 0) / 100).toFixed(2);
    }

    if (data.platba3Amount != null) {
      platba3Amount = data.platba3Amount.toFixed(2);
    } else if (isDefaultSplit2 && hasNoManualAmounts2) {
      // Remainder after rounding
      const p1 = roundUpToTen2(cenaSDPH * 0.60);
      const p2 = roundUpToTen2(cenaSDPH * 0.30);
      platba3Amount = (cenaSDPH - p1 - p2).toFixed(2);
    } else {
      platba3Amount = (cenaSDPH * (data.platba3Percent || 0) / 100).toFixed(2);
    }

    // Table width: col0 (45) + col1 (28) = 73mm for portrait
    const tableWidth = 73;
    const tableStartX = pageWidth - 14 - tableWidth;
    const startYForBoth = yPos;

    // Price totals table - rows 1 & 2 (normal size, bold)
    autoTable(doc, {
      startY: yPos,
      margin: { left: tableStartX },
      body: [
        ['Cena bez DPH:', `${cenaBezDPH.toFixed(2)} €`],
        ['DPH 23%:', `${(cenaBezDPH * 0.23).toFixed(2)} €`]
      ],
      styles: { ...tableStyles, fontSize: 7, fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 45, halign: 'right' },
        1: { cellWidth: 28, halign: 'right' }
      }
    });

    // Price totals table - row 3 (Cena s DPH - larger, bold)
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY,
      margin: { left: tableStartX },
      body: [['Cena s DPH:', `${cenaSDPH.toFixed(2)} €`]],
      styles: { ...tableStyles, fontSize: 11, fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 45, halign: 'right' },
        1: { cellWidth: 28, halign: 'right' }
      }
    });

    // Payment plan table (with gap)
    const paymentRows = [
      [{ content: '1. záloha - pri objednávke', styles: { halign: 'right' as const } }, `${(data.platba1Percent || 0).toFixed(0)} %`, `${platba1Amount} €`],
      [{ content: '2. platba - pred montážou', styles: { halign: 'right' as const } }, `${(data.platba2Percent || 0).toFixed(0)} %`, `${platba2Amount} €`],
      [{ content: '3. platba - po montáži', styles: { halign: 'right' as const } }, `${(data.platba3Percent || 0).toFixed(0)} %`, `${platba3Amount} €`]
    ];

    // Payment table width: 45 + 12 + 28 = 85mm
    const paymentTableWidth = 85;

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 5,
      margin: { left: pageWidth - 14 - paymentTableWidth }, // Right-aligned
      body: paymentRows,
      styles: { ...tableStyles, fontSize: 7 },
      columnStyles: {
        0: { cellWidth: 45 },
        1: { cellWidth: 12, halign: 'right' },
        2: { cellWidth: 28, halign: 'right', fontStyle: 'bold' }
      }
    });

    // Left side info - positioned next to the table
    const maxLeftWidth = tableStartX - 14 - 5;

    doc.setFontSize(8);

    let leftYPos = startYForBoth;
    const printLabelValue = (label: string, value: string) => {
      doc.setFont(fontName, 'bold');
      const labelWidth = doc.getTextWidth(label + ' ');
      doc.text(label, 14, leftYPos);
      doc.setFont(fontName, 'normal');
      const valueText = value || '-';
      const remainingWidth = maxLeftWidth - labelWidth;
      const lines = doc.splitTextToSize(valueText, remainingWidth);
      doc.text(lines, 14 + labelWidth, leftYPos);
      leftYPos += Math.max(1, lines.length) * 4;
    };

    printLabelValue('Platnosť ponuky:', data.platnostPonuky || '-');
    printLabelValue('Miesto dodávky:', data.miestoDodavky || '-');
    printLabelValue('Zameranie:', data.zameranie || '-');
    printLabelValue('Termín dodania:', data.terminDodania || '-');
    printLabelValue('Vypracoval:', data.vypracoval !== undefined ? data.vypracoval : (userInfo?.vypracoval || formData.vypracoval));
    printLabelValue('Kontakt:', data.kontakt !== undefined ? data.kontakt : (userInfo?.telefon || '-'));
    printLabelValue('E-mail:', data.emailVypracoval !== undefined ? data.emailVypracoval : (userInfo?.email || '-'));
    printLabelValue('Dátum:', data.datum !== undefined ? data.datum : new Date().toLocaleDateString('sk-SK'));

    yPos = Math.max((doc as any).lastAutoTable.finalY, leftYPos) + 5;

  } else {
      doc.text('Detailný náhľad pre tento typ položky nie je implementovaný.', 14, yPos);
  }

  // Footer (Page numbers)
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(0);
      centerText(`Strana ${i} / ${pageCount}`, doc.internal.pageSize.height - 10);
  }

  return doc.output('bloburl').toString();
};

// Backward compatible function that saves the PDF
export const generateAndSavePDF = async (item: CenovaPonukaItem, formData: SpisFormData, userInfo?: UserInfo) => {
  const blobUrl = await generatePDF(item, formData, userInfo);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = `CP_${item.cisloCP}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(blobUrl);
};

export interface OrderPDFData {
  orderNumber: string;
  nazov: string;
  data: PuzdraData;
  headerInfo: {
    vypracoval: string;
    telefon: string;
    email: string;
  };
}

export const generateOrderPDF = async (orderData: OrderPDFData) => {
  const doc = new jsPDF({ orientation: 'portrait' });
  const pageWidth = doc.internal.pageSize.width;
  const { data, orderNumber, headerInfo } = orderData;

  // Helper for text alignment
  const centerText = (text: string, y: number) => {
    const textWidth = doc.getTextWidth(text);
    doc.text(text, (pageWidth - textWidth) / 2, y);
  };

  // Font Loading
  let fontName = 'Helvetica';
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

    const imgWidth = logoImg.width;
    const imgHeight = logoImg.height;
    const targetWidth = 35;
    const targetHeight = (imgHeight / imgWidth) * targetWidth;

    doc.addImage(logoImg, 'PNG', 14, 13, targetWidth, targetHeight);
  } catch (e) {
    doc.setFontSize(18);
    doc.setTextColor(225, 27, 40);
    doc.text('WENS DOOR', 14, 20);
  }

  // Header
  doc.setFontSize(14);
  doc.setTextColor(225, 27, 40);
  doc.setFont(fontName, 'bold');
  doc.text(`OBJEDNÁVKA #${orderNumber}`, pageWidth - 14, 18, { align: 'right' });

  doc.setDrawColor(200);
  doc.line(14, 22, pageWidth - 14, 22);

  let yPos = 27;
  const rightColX = pageWidth / 2 + 10;

  // Company Info
  let yPosLeft = yPos;
  doc.setFontSize(8);
  doc.setTextColor(0);
  doc.setFont(fontName, 'bold');
  doc.text('Odberateľ:', 14, yPosLeft);
  doc.setFont(fontName, 'normal');
  yPosLeft += 4;
  doc.text('WENS DOOR s.r.o., Vápenická 12, Prievidza 971 01', 14, yPosLeft);
  yPosLeft += 4;
  doc.text('zap.v OR SR Trenčín od.Sro, Vl.č. 17931 / R', 14, yPosLeft);
  yPosLeft += 4;
  doc.text('IČO: 36792942, IČ DPH: SK2022396904', 14, yPosLeft);
  yPosLeft += 4;
  doc.text('banka: PRIMABANKA Slovensko a.s. č.ú.: 4520 001 507/3100', 14, yPosLeft);
  yPosLeft += 4;
  doc.text('IBAN: SK4431000000004520001507, BIC: LUBASKBX', 14, yPosLeft);
  yPosLeft += 4;
  doc.text('tel/fax: 046/542 2057, e-mail: info@wens.sk', 14, yPosLeft);
  yPosLeft += 4; // After the last line on left side.

  // Supplier Info (Right)
  let yPosRight = yPos; // yPos is 27 from line 673
  doc.setFontSize(8); // Ensure consistency
  doc.setFont(fontName, 'bold');
  doc.text('Dodávateľ:', rightColX, yPosRight);
  doc.setFont(fontName, 'normal');
  yPosRight += 4;
  if (data.dodavatel?.nazov) doc.text(data.dodavatel.nazov, rightColX, yPosRight);
  yPosRight += 4;
  if (data.dodavatel?.ulica) doc.text(data.dodavatel.ulica, rightColX, yPosRight);
  yPosRight += 4;
  if (data.dodavatel?.mesto) doc.text(data.dodavatel.mesto, rightColX, yPosRight);
  yPosRight += 4;
  if (data.dodavatel?.tel) doc.text(`${data.dodavatel.tel}`, rightColX, yPosRight);
  yPosRight += 4;
  if (data.dodavatel?.email) doc.text(`${data.dodavatel.email}`, rightColX, yPosRight);
  yPosRight += 4; // After the last line of supplier info

  // Calculate the new yPos for the next section
  yPos = Math.max(yPosLeft, yPosRight) + 5;

  // Items Table Styles
  const tableStyles = {
    fontSize: 9,
    cellPadding: 1.5,
    font: fontName,
    fontStyle: 'normal' as 'normal',
    lineColor: [0, 0, 0] as [number, number, number],
    lineWidth: 0.1,
    textColor: [0, 0, 0] as [number, number, number]
  };
  const headStyles = {
    fillColor: [225, 27, 40] as [number, number, number],
    fontStyle: 'bold' as 'bold',
    halign: 'center' as 'center',
    font: fontName,
    lineColor: [0, 0, 0] as [number, number, number],
    lineWidth: 0.1,
    textColor: [255, 255, 255] as [number, number, number]
  };

  // Zakazka Table (Objednávame u nás)
  if (data.zakazka) {
    autoTable(doc, {
        startY: yPos,
        body: [[`Objednávame u nás: ${data.zakazka}`]],
        styles: { ...tableStyles, fontSize: 9, halign: 'left', fontStyle: 'bold' },
        theme: 'grid',
        tableWidth: 'auto'
    });
    yPos = (doc as any).lastAutoTable.finalY + 5;
  }

  doc.setFont(fontName, 'bold');
  doc.setFontSize(10);
  doc.text('Objednávame u Vás:', 14, yPos);
  yPos += 5;

  const polozkyRows = data.polozky
    .filter((p: any) => p.nazov || p.mnozstvo > 0)
    .map((p: any, i: number) => [
      i + 1,
      p.nazov || '',
      p.kod || '',
      p.mnozstvo
    ]);

  if (polozkyRows.length > 0) {
    autoTable(doc, {
      startY: yPos,
      head: [['#', 'Názov tovaru', 'Kód', 'Množstvo']],
      body: polozkyRows,
      styles: tableStyles,
      headStyles: headStyles,
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { halign: 'left' },
        2: { cellWidth: 35, halign: 'left' },
        3: { cellWidth: 25, halign: 'center' }
      }
    });
    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  // Footer Info - Left side: contact info, Right side: delivery address
  const footerStartY = yPos;
  doc.setFontSize(8); // Match other font sizes
  doc.setFont(fontName, 'normal');

  const datumValue = data.datum || new Date().toLocaleDateString('sk-SK');
  const spracovalValue = data.spracoval !== undefined ? data.spracoval : headerInfo.vypracoval;
  const kontaktValue = data.kontakt !== undefined ? data.kontakt : headerInfo.telefon;
  const emailValue = data.emailSpracoval !== undefined ? data.emailSpracoval : headerInfo.email;

  // Left side - contact info
  doc.text(`Dátum: ${datumValue}`, 14, yPos);
  yPos += 4;
  doc.text(`Spracoval: ${spracovalValue}`, 14, yPos);
  yPos += 4;
  doc.text(`Kontakt: ${kontaktValue}`, 14, yPos);
  yPos += 4;
  doc.text(`Email: ${emailValue}`, 14, yPos);

  // Right side - Delivery address
  if (data.tovarDorucitNaAdresu) {
    let rightYPos = footerStartY;
    doc.setFont(fontName, 'bold');
    doc.text('Tovar doručiť na adresu:', rightColX, rightYPos);
    doc.setFont(fontName, 'normal');
    rightYPos += 4;
    doc.text(data.tovarDorucitNaAdresu.firma || '', rightColX, rightYPos);
    rightYPos += 4;
    doc.text(data.tovarDorucitNaAdresu.ulica || '', rightColX, rightYPos);
    rightYPos += 4;
    doc.text(data.tovarDorucitNaAdresu.mesto || '', rightColX, rightYPos);
  }

  // Footer (Page numbers)
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(0);
    centerText(`Strana ${i} / ${pageCount}`, doc.internal.pageSize.height - 10);
  }

  return doc.output('bloburl').toString();
};

// Backward compatible function that saves the Order PDF
export const generateAndSaveOrderPDF = async (orderData: OrderPDFData) => {
  const blobUrl = await generateOrderPDF(orderData);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = `Objednavka_${orderData.orderNumber}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(blobUrl);
};
