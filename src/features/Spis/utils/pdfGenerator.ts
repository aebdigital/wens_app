import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
import { CenovaPonukaItem, SpisFormData, PuzdraData } from '../types';
import { NOTES_DVERE, NOTES_NABYTOK, NOTES_SCHODY } from './legalTexts';

interface UserInfo {
  vypracoval: string;
  telefon: string;
  email: string;
}

interface GeneratePDFOptions {
  includeQRCode?: boolean; // Default true for preview, false for download
}

export const generatePDF = async (item: CenovaPonukaItem, formData: SpisFormData, userInfo?: UserInfo, options?: GeneratePDFOptions) => {
  const includeQRCode = options?.includeQRCode ?? true; // Default to true (for preview)
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

  const displayZakazka = item.cisloZakazky || formData.cisloZakazky;
  const headerText = item.cisloCP.replace(/^CP/, 'Cenová ponuka č. ') + (displayZakazka ? ` / ${displayZakazka}` : '');
  doc.text(headerText, pageWidth - 14, 18, { align: 'right' });

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
  doc.text('zap. v OR OS Trenčín od.Sro, Vl.č. 17931 / R', 14, yPos);
  yPos += 4;
  doc.text('IČO: 36792942, IČ DPH: SK2022396904', 14, yPos);
  yPos += 4;
  doc.text('banka: PRIMABANKA Slovensko a.s. č.ú.: 4520 001 507/3100', 14, yPos);
  yPos += 4;
  doc.text('email: info@wens.sk, tel: 046 / 542 2057', 14, yPos);

  // Client Info (Right) - no "Odberateľ:" label
  yPos = 27;

  // Check if architect info exists
  const hasArchitect = formData.architektonickyPriezvisko || formData.architektonickeMeno || formData.architektonickyIco;

  // Check if we should show customer, architect and/or billing info from item data
  const showCustomerInfo = 'showCustomerInfo' in (item.data || {}) ? (item.data as any).showCustomerInfo !== false : true;
  const showArchitectInfo = 'showArchitectInfo' in (item.data || {}) ? (item.data as any).showArchitectInfo === true : false && hasArchitect;
  const showBillingInfo = 'showBillingInfo' in (item.data || {}) ? (item.data as any).showBillingInfo === true : false;

  // Calculate column positions based on what's shown
  // We spread them out across the rest of the page (from approx center to pageWidth-14)
  const customerColX = 95;
  const architectColX = 165;
  const billingColX = 130;

  if (showCustomerInfo) {
    let customerYPos = yPos;
    // Prioritize person name (priezvisko + meno) over firma, matching the modal display
    const clientName = `${formData.priezvisko || ''} ${formData.meno || ''}`.trim() || formData.firma;
    doc.setFontSize(8);
    doc.setFont(fontName, 'bold');
    doc.text('Konečný zákazník:', customerColX, customerYPos);
    customerYPos += 4;
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

  if (showBillingInfo) {
    // If architect layout is simple, use fixed middle position
    const currentBillingX = billingColX;

    let billingYPos = yPos;
    const billingName = `${formData.fakturaciaPriezvisko || ''} ${formData.fakturaciaMeno || ''}`.trim();
    doc.setFontSize(8);
    doc.setFont(fontName, 'bold');
    doc.text('Fakturačná firma:', currentBillingX, billingYPos);
    billingYPos += 4;
    if (billingName) {
      doc.text(billingName, currentBillingX, billingYPos);
      billingYPos += 4;
    }
    doc.setFont(fontName, 'normal');
    if (formData.fakturaciaAdresa) {
      doc.text(formData.fakturaciaAdresa, currentBillingX, billingYPos);
      billingYPos += 4;
    }
    if (formData.fakturaciaIco) {
      doc.text(`IČO: ${formData.fakturaciaIco}`, currentBillingX, billingYPos);
      billingYPos += 4;
    }
    if (formData.fakturaciaDic) {
      doc.text(`DIČ: ${formData.fakturaciaDic}`, currentBillingX, billingYPos);
      billingYPos += 4;
    }
    if (formData.fakturaciaIcDph) {
      doc.text(`IČ DPH: ${formData.fakturaciaIcDph}`, currentBillingX, billingYPos);
      billingYPos += 4;
    }
  }

  if (showArchitectInfo) {
    let architectYPos = yPos;
    const archName = `${formData.architektonickyPriezvisko || ''} ${formData.architektonickeMeno || ''}`.trim();
    doc.setFontSize(8);
    doc.setFont(fontName, 'bold');
    doc.text('Architekt:', architectColX, architectYPos);
    architectYPos += 4;
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
      const photoGapX = 0; // Gap between photos horizontally
      const photoGapY = 0; // Reduced gap between rows
      const descHeight = 0; // No space for description
      const photosPerRow = 2;

      let currentPhotoY = specsStartY;

      for (let i = 0; i < productPhotos.length; i++) {
        const photo = productPhotos[i];
        const colIndex = i % photosPerRow;
        const rowIndex = Math.floor(i / photosPerRow);

        // Calculate position
        const photoX = photoStartX + colIndex * (photoSize + photoGapX);
        const photoY = specsStartY + rowIndex * (photoSize + photoGapY);

        try {
          // Calculate dimensions to fit within square while maintaining aspect ratio (contain)
          const imgProps = await new Promise<{ width: number; height: number; ratio: number }>((resolve) => {
            const img = new Image();
            img.onload = () => {
              resolve({
                width: img.naturalWidth,
                height: img.naturalHeight,
                ratio: img.naturalWidth / img.naturalHeight
              });
            };
            img.onerror = () => resolve({ width: photoSize, height: photoSize, ratio: 1 }); // Fallback
            img.src = photo.base64;
          });

          let drawW = photoSize;
          let drawH = photoSize;
          let offX = 0;
          let offY = 0;

          // If image is wider than tall (relative to square target)
          if (imgProps.ratio > 1) {
            drawH = photoSize / imgProps.ratio;
            offY = (photoSize - drawH) / 2;
          } else {
            // Taller or square
            drawW = photoSize * imgProps.ratio;
            offX = (photoSize - drawW) / 2;
          }

          // Add the image centered
          doc.addImage(photo.base64, 'JPEG', photoX + offX, photoY + offY, drawW, drawH);

          // Add border around the full square frame (not just the image)
          doc.setDrawColor(200);
          doc.rect(photoX, photoY, photoSize, photoSize);

          // Add description if exists (inside photo area, black text, no overlay)
          if (photo.description) {
            doc.setFontSize(6);
            doc.setFont(fontName, 'normal');
            doc.setTextColor(0, 0, 0);

            const descLines = doc.splitTextToSize(photo.description, photoSize - 2);
            const lineCount = descLines.length;
            const overlayHeight = lineCount * 2.5 + 1.5;

            doc.text(descLines, photoX + 1, photoY + photoSize - overlayHeight + 2.2);
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
    const hiddenColumns = data.hiddenColumns || [];
    const isColumnVisible = (key: string) => !hiddenColumns.includes(key);

    // Define all columns - use 'auto' for flexible columns, fixed numbers for price columns
    const fullHeaderRow: Array<{ key: string; content: string; styles: { halign: 'left' | 'center' | 'right' }; width: number | 'auto' }> = [
      { key: '#', content: '#', styles: { halign: 'center' }, width: 6 },
      { key: 'miestnost', content: 'Miestnosť', styles: { halign: 'left' }, width: 'auto' },
      { key: 'polozka', content: 'Položka', styles: { halign: 'left' }, width: 'auto' },
      { key: 'typRozmer', content: 'Typ / Rozmer', styles: { halign: 'left' }, width: 'auto' },
      { key: 'pl', content: 'P/Ľ', styles: { halign: 'left' }, width: 8 },
      { key: 'zamok', content: 'Zámok', styles: { halign: 'left' }, width: 'auto' },
      { key: 'sklo', content: 'Sklo', styles: { halign: 'left' }, width: 'auto' },
      { key: 'povrch', content: 'Povrch', styles: { halign: 'left' }, width: 'auto' },
      { key: 'poznamka', content: 'Poznámka', styles: { halign: 'left' }, width: 'auto' },
      { key: 'ks', content: 'Ks', styles: { halign: 'right' }, width: 10 },
      { key: 'cenaKs', content: 'Cena/ks', styles: { halign: 'right' }, width: 18 },
      { key: 'cenaCelkom', content: 'Cena celkom', styles: { halign: 'right' }, width: 28 }
    ];

    const visibleHeaders = fullHeaderRow.filter(h =>
      ['#', 'miestnost', 'polozka', 'typRozmer', 'ks', 'cenaKs', 'cenaCelkom'].includes(h.key) || isColumnVisible(h.key)
    );

    const headerRow = visibleHeaders.map(h => ({ content: h.content, styles: h.styles }));

    // Rebuild vyrobkyRows respecting visibility
    const filteredVyrobkyRows = vyrobkyRows.map(row => {
      // Row structure: 0:#, 1:Miestnost, 2:Polozka, 3:Typ, 4:PL, 5:Zamok, 6:Sklo, 7:Povrch, 8:Poznamka, 9:Ks, 10:Price, 11:Total
      // If row has 12 items (first row of group)
      if (row.length === 12) {
        const [idx_col, miestnost_col, polozka, typ, pl, zamok, sklo, povrch, poznamka, ks, price, total] = row;
        const items = [];
        items.push(idx_col); // #
        items.push(miestnost_col); // Miestnost
        items.push(polozka); // Polozka
        items.push(typ); // Typ
        if (isColumnVisible('pl')) items.push(pl);
        if (isColumnVisible('zamok')) items.push(zamok);
        if (isColumnVisible('sklo')) items.push(sklo);
        if (isColumnVisible('povrch')) items.push(povrch);
        if (isColumnVisible('poznamka')) items.push(poznamka);
        items.push(ks); // Ks
        items.push(price); // Price
        items.push(total); // Total
        return items;
      } else {
        // Subsequent rows (10 items): 0:Polozka, 1:Typ, 2:PL, 3:Zamok, 4:Sklo, 5:Povrch, 6:Poznamka, 7:Ks, 8:Price, 9:Total
        const [polozka, typ, pl, zamok, sklo, povrch, poznamka, ks, price, total] = row;
        const items = [];
        items.push(polozka);
        items.push(typ);
        if (isColumnVisible('pl')) items.push(pl);
        if (isColumnVisible('zamok')) items.push(zamok);
        if (isColumnVisible('sklo')) items.push(sklo);
        if (isColumnVisible('povrch')) items.push(povrch);
        if (isColumnVisible('poznamka')) items.push(poznamka);
        items.push(ks);
        items.push(price);
        items.push(total);
        return items;
      }
    });

    const columnStyles: any = {};
    visibleHeaders.forEach((h, index) => {
      if (h.width === 'auto') {
        columnStyles[index] = { halign: h.styles.halign };
      } else {
        columnStyles[index] = { cellWidth: h.width, halign: h.styles.halign };
      }
    });

    autoTable(doc, {
      startY: yPos,
      head: specRows.length > 0 ? [headerRow] : [
        [{ content: 'Výrobky', colSpan: visibleHeaders.length, styles: { fillColor: [225, 27, 40], fontStyle: 'bold', halign: 'left' } }],
        headerRow
      ],
      body: filteredVyrobkyRows,
      styles: { ...tableStyles, fontSize: 7 },
      headStyles: { ...headStyles, fontSize: 7 },
      columnStyles: columnStyles
    });
    yPos = (doc as any).lastAutoTable.finalY;

    // Summary row for Výrobky
    autoTable(doc, {
      startY: yPos,
      body: [['Spolu bez DPH:', `${vyrobkyTotalCalc.toFixed(2)} €`]],
      styles: { ...tableStyles, fontSize: 7, fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 10 + 18, halign: 'right' }, // Ks + Cena/ks width (approx)
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

    // Support both percentage and EUR discounts
    const useZlavaPercent = data.useZlavaPercent !== false; // Default true for backwards compatibility
    const useZlavaEur = data.useZlavaEur || false;
    const zlavaPercent = data.zlavaPercent || 0;
    const zlavaEur = data.zlavaEur || 0;

    const percentDiscount = useZlavaPercent ? subtotal * (zlavaPercent / 100) : 0;
    const eurDiscount = useZlavaEur ? zlavaEur : 0;
    const zlavaAmount = percentDiscount + eurDiscount;
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
    // Build the discount display string based on which discounts are active
    let zlavaDisplayStr = '';
    if (useZlavaPercent && zlavaPercent > 0) {
      zlavaDisplayStr = `${zlavaPercent.toFixed(0)} %`;
    }
    if (useZlavaEur && zlavaEur > 0) {
      if (zlavaDisplayStr) {
        zlavaDisplayStr += ` + ${zlavaEur.toFixed(2)} €`;
      } else {
        zlavaDisplayStr = `${zlavaEur.toFixed(2)} €`;
      }
    }
    if (!zlavaDisplayStr) {
      zlavaDisplayStr = '0 %';
    }

    autoTable(doc, {
      startY: yPos,
      body: [[`Zľava z ceny výrobkov a príplatkov:`, zlavaDisplayStr, `${zlavaAmount.toFixed(2)} €`]],
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
          { content: data.montazLabel || "Montáž - Neumožnená kompletná montáž z dôvodu nepripravenosti stavby bude spoplatnená dopravou.", colSpan: 2, styles: { halign: 'left' } },
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

    // Use dynamic deposits if available
    let paymentRows: any[][] = [];

    // Determine the base calculation amount once
    let paymentBase = cenaSDPH;
    if (data.cenaDohodou && data.cenaDohodouValue) {
      paymentBase = data.cenaDohodouValue;
    } else if (data.prenesenieDP) {
      const kovanieTotal = data.kovanie?.reduce((sum: number, k: any) => sum + (k.cenaCelkom || 0), 0) || 0;
      const montazTotal = data.montaz?.reduce((sum: number, m: any) => sum + (m.cenaCelkom || 0), 0) || 0;
      const fullNetTotal = (vyrobkyTotalCalc + (data.priplatky?.reduce((sum: number, p: any) => sum + (p.cenaCelkom || 0), 0) || 0) + kovanieTotal + montazTotal) - zlavaAmount;
      paymentBase = fullNetTotal;
    }

    // Check if deposits array exists (including empty array which means user explicitly removed all)
    if (data.deposits !== undefined) {
      // If deposits array exists but is empty, show no payment rows
      if (data.deposits.length > 0) {
        paymentRows = data.deposits.map((d: any) => {
          let amount = d.amount;
          // Recalculate if amount is missing and percent exists
          if (amount == null || amount === undefined) {
            amount = paymentBase * (d.percent / 100);
          }
          return [
            { content: d.label, styles: { halign: 'right' as const } },
            `${(d.percent || 0).toFixed(0)} %`,
            `${(amount || 0).toFixed(2)} €`
          ];
        });
      }
      // If deposits is empty array, paymentRows remains empty (no payment schedule in PDF)
    } else {
      // Legacy fallback
      const isDefaultSplit = data.platba1Percent === 60 && data.platba2Percent === 30 && data.platba3Percent === 10;
      const hasNoManualAmounts = data.platba1Amount == null && data.platba2Amount == null && data.platba3Amount == null;

      let platba1Amount: string, platba2Amount: string, platba3Amount: string;
      if (data.platba1Amount != null) {
        platba1Amount = data.platba1Amount.toFixed(2);
      } else if (isDefaultSplit && hasNoManualAmounts) {
        platba1Amount = roundUpToTen(paymentBase * 0.60).toFixed(2);
      } else {
        platba1Amount = (paymentBase * (data.platba1Percent || 0) / 100).toFixed(2);
      }

      if (data.platba2Amount != null) {
        platba2Amount = data.platba2Amount.toFixed(2);
      } else if (isDefaultSplit && hasNoManualAmounts) {
        platba2Amount = roundUpToTen(paymentBase * 0.30).toFixed(2);
      } else {
        platba2Amount = (paymentBase * (data.platba2Percent || 0) / 100).toFixed(2);
      }

      if (data.platba3Amount != null) {
        platba3Amount = data.platba3Amount.toFixed(2);
      } else if (isDefaultSplit && hasNoManualAmounts) {
        // Remainder after rounding
        const p1 = roundUpToTen(paymentBase * 0.60);
        const p2 = roundUpToTen(paymentBase * 0.30);
        platba3Amount = (paymentBase - p1 - p2).toFixed(2);
      } else {
        platba3Amount = (paymentBase * (data.platba3Percent || 0) / 100).toFixed(2);
      }

      paymentRows = [
        [{ content: '1. záloha - pri objednávke', styles: { halign: 'right' as const } }, `${(data.platba1Percent || 0).toFixed(0)} %`, `${platba1Amount} €`],
        [{ content: '2. platba - pred montážou', styles: { halign: 'right' as const } }, `${(data.platba2Percent || 0).toFixed(0)} %`, `${platba2Amount} €`],
        [{ content: '3. platba - po montáži', styles: { halign: 'right' as const } }, `${(data.platba3Percent || 0).toFixed(0)} %`, `${platba3Amount} €`]
      ];
    }


    // Table width: col0 (45) + col1 (28) = 73mm for portrait
    const tableWidth = 73;
    const tableStartX = pageWidth - 14 - tableWidth;
    const startYForBoth = yPos;

    // Generate QR Code if place exists and includeQRCode is true (only for preview)
    let qrDataUrl = '';
    let qrWidth = 0;
    const miestoQR = data.miestoDodavky || '';
    if (miestoQR && includeQRCode) {
      try {
        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(miestoQR)}`;
        qrDataUrl = await QRCode.toDataURL(mapsUrl, { margin: 0 });
        qrWidth = 25; // 25mm
        const qrX = tableStartX - qrWidth - 5;
        doc.addImage(qrDataUrl, 'PNG', qrX, startYForBoth, qrWidth, qrWidth);
      } catch (e) {
        console.error('Failed to generate QR', e);
      }
    }

    const isPrenesenieDP = !!data.prenesenieDP;

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
        0: { cellWidth: 45, halign: 'right', fontSize: isPrenesenieDP ? 11 : 7 }, // Highlight if prenesenieDP
        1: { cellWidth: 28, halign: 'right', fontSize: isPrenesenieDP ? 11 : 7 }
      }
    });

    // Add "Prenesenie daňovej povinnosti" if applicable
    const lastY = (doc as any).lastAutoTable.finalY;
    if (isPrenesenieDP) {
      doc.setFontSize(9);
      doc.setFont(fontName, 'bold');
      doc.setTextColor(220, 38, 38); // Red color for emphasis
      doc.text('PRENESENIE DAŇOVEJ POVINNOSTI', pageWidth - 14, lastY + 3, { align: 'right' });
      doc.setTextColor(0); // Reset to black
    }

    // Price totals table - row 3 (Final price - larger, bold)
    // Show negotiated price if cenaDohodou is enabled, otherwise show cenaSDPH
    const isCenaDohodou = data.cenaDohodou && data.cenaDohodouValue;
    const finalPriceLabel = isCenaDohodou ? 'Cena dohodou:' : 'Cena s DPH:';
    const finalPriceValue = isCenaDohodou ? (data.cenaDohodouValue || 0) : cenaSDPH;
    // If prenesenieDP is enabled, the final row should be smaller; if cenaDohodou, highlight it
    const finalRowFontSize = isPrenesenieDP ? 7 : 11;

    autoTable(doc, {
      startY: lastY + (isPrenesenieDP ? 5 : 0),
      margin: { left: tableStartX },
      body: [[finalPriceLabel, `${finalPriceValue.toFixed(2)} €`]],
      styles: { ...tableStyles, fontSize: finalRowFontSize, fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 45, halign: 'right' },
        1: { cellWidth: 28, halign: 'right' }
      }
    });

    // Payment table width: same as Totals table = 73mm
    const paymentTableWidth = 73;

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 5,
      margin: { left: pageWidth - 14 - paymentTableWidth }, // Right-aligned matching totals table
      body: paymentRows,
      styles: { ...tableStyles, fontSize: 7 },
      columnStyles: {
        0: { cellWidth: 33 }, // Adjusted to fit 73mm total (33 + 12 + 28 = 73)
        1: { cellWidth: 12, halign: 'right' },
        2: { cellWidth: 28, halign: 'right', fontStyle: 'bold' }
      }
    });

    // Left side info - positioned next to the table
    // If QR code exists, subtract its width and gap from available width
    const maxLeftWidth = tableStartX - 14 - 5 - (qrWidth > 0 ? qrWidth + 5 : 0);

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
    if (data.poznamkaKAdrese) {
      printLabelValue('Poznámka k adrese:', data.poznamkaKAdrese);
    }
    printLabelValue('Zameranie:', data.zameranie || '-');

    // Termín dodania - custom rendering for full paragraph flow
    doc.setFont(fontName, 'bold');
    const tdLabel = 'Termín dodania: ';
    const tdLabelWidth = doc.getTextWidth(tdLabel);

    doc.text(tdLabel, 14, leftYPos);
    doc.setFont(fontName, 'normal');

    // We want the text to flow after the label on the first line, then wrap to start of line (x=14)
    // To do this simply, we can just print the label, then the text.
    // Ideally, we treat everything as one string "Termín dodania: value" but bolding just the label is tricky in jsPDF without html methods.
    // A simple hack usually works: print label, then print value starting at label end.
    // If value is long, we need splitTextToSize.
    // However, clean wrapping UNDER the label requires the lines to start at x=14.

    // Custom wrapper:


    // Using a simpler approach: Render "Termín dodania:" bold. 
    // Then render the rest as normal text, but manually positioning the first word(s) to line up?
    // Too complex.

    // User probably just wants the text NOT to hang indent.
    // Simple fix: 
    // 1. Print label.
    // 2. Print value.
    // 3. If value wraps, subsequent lines set X to 14.

    // Let's effectively render it as a single block of text where we just prepend the label to the value string, 
    // and rely on the fact that PDF consumers won't notice if the whole thing is bold/normal mixed?
    // No, bold label is important.

    // Let's try explicit line breaking.

    // Actually, let's just use doc.splitTextToSize on "Termín dodania: " + value.
    // Then render first line with mixed bold/normal (hard).

    // Better idea:
    // Just render "Termín dodania:" bold.
    // Then render the value text.
    // If the value text is long, use `splitTextToSize`.
    // But we need the first line of value to start at `labelWidth`, and subsequent lines at `0`.
    // JS does NOT support this natively in one call.

    // We will construct the lines manually.
    // Line 1: "Termín dodania: " + start of value
    // Line 2+: rest of value

    // Step 1: Split full value text into lines assuming FULL width (starting at x=14)
    // doc.setFont(fontName, 'normal');
    // const valueLines = doc.splitTextToSize(" " + tdValue, maxLeftWidth);
    //
    // This isn't quite right because the first line has the label taking up space.

    // Revised logic:
    // 1. Calculate space remaining on line 1: `maxLeftWidth - labelWidth`.
    // 2. Fit as many words as possible into that space.
    // 3. Move remaining words to subsequent lines with full `maxLeftWidth`.

    const tdRemainingFirstLine = maxLeftWidth - tdLabelWidth;
    let tdValueRest = data.terminDodania || '-';

    // Split text into lines compliant with widths [firstLineWidth, otherLineWidths...]
    // jsPDF doesn't make this easy.
    // We'll use a crude approximation or simple word wrap loop.

    const tdWords = tdValueRest.split(' ');
    let line1Value = '';
    let remainingWords: string[] = [];

    doc.setFont(fontName, 'normal'); // Set font for width calc

    // Fill first line
    let i = 0;
    while (i < tdWords.length) {
      const word = tdWords[i];
      const testLine = line1Value + (line1Value ? ' ' : '') + word;
      if (doc.getTextWidth(testLine) < tdRemainingFirstLine) {
        line1Value = testLine;
        i++;
      } else {
        // First line full
        break;
      }
    }
    remainingWords = tdWords.slice(i);

    // Print Label
    doc.setFont(fontName, 'bold');
    doc.text(tdLabel, 14, leftYPos);

    // Print first line value
    doc.setFont(fontName, 'normal');
    doc.text(line1Value, 14 + tdLabelWidth, leftYPos);

    // Prepare remaining lines
    if (remainingWords.length > 0) {
      const restText = remainingWords.join(' ');
      const restLines = doc.splitTextToSize(restText, maxLeftWidth);

      leftYPos += 4; // Move to next line
      doc.text(restLines, 14, leftYPos);
      leftYPos += (restLines.length - 1) * 4; // Advance Y pos by number of extra lines
    }

    leftYPos += 4; // Advance for next item


    printLabelValue('Vypracoval:', data.vypracoval !== undefined ? data.vypracoval : (userInfo?.vypracoval || formData.vypracoval));
    printLabelValue('Kontakt:', data.kontakt !== undefined ? data.kontakt : (userInfo?.telefon || '-'));
    printLabelValue('E-mail:', data.emailVypracoval !== undefined ? data.emailVypracoval : (userInfo?.email || '-'));
    printLabelValue('Dátum:', data.datum !== undefined ? data.datum : new Date().toLocaleDateString('sk-SK'));

    yPos = Math.max((doc as any).lastAutoTable.finalY, leftYPos) + 5;

    // Legal Text
    // Legal Text
    const defaultLegalText = NOTES_DVERE;
    const legalText = (data as any).legalText ?? defaultLegalText;

    if (legalText) {
      doc.setFontSize(7);
      doc.setFont(fontName, 'normal');
      doc.setTextColor(60);

      // Calculate remaining height to check if page break is needed
      const pageHeight = doc.internal.pageSize.height;
      // Start below the tables or left info, whichever is lower
      let legalYPos = yPos;

      const legalLines = doc.splitTextToSize(legalText, pageWidth - 28);
      const legalBlockHeight = legalLines.length * 3;

      if (legalYPos + legalBlockHeight > pageHeight - 15) {
        doc.addPage();
        legalYPos = 20;
      }

      doc.text(legalLines, 14, legalYPos);
    }

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

    // Support both percentage and EUR discounts
    const useZlavaPercentNS = data.useZlavaPercent !== false; // Default true for backwards compatibility
    const useZlavaEurNS = data.useZlavaEur || false;
    const zlavaPercentNS = data.zlavaPercent || 0;
    const zlavaEurNS = data.zlavaEur || 0;

    const percentDiscountNS = useZlavaPercentNS ? subtotal * (zlavaPercentNS / 100) : 0;
    const eurDiscountNS = useZlavaEurNS ? zlavaEurNS : 0;
    const zlavaAmountNS = percentDiscountNS + eurDiscountNS;
    const afterZlava = subtotal - zlavaAmountNS;

    // Build the discount display string based on which discounts are active
    let zlavaDisplayStrNS = '';
    if (useZlavaPercentNS && zlavaPercentNS > 0) {
      zlavaDisplayStrNS = `${zlavaPercentNS.toFixed(0)} %`;
    }
    if (useZlavaEurNS && zlavaEurNS > 0) {
      if (zlavaDisplayStrNS) {
        zlavaDisplayStrNS += ` + ${zlavaEurNS.toFixed(2)} €`;
      } else {
        zlavaDisplayStrNS = `${zlavaEurNS.toFixed(2)} €`;
      }
    }
    if (!zlavaDisplayStrNS) {
      zlavaDisplayStrNS = '0 %';
    }

    // Summary table row 1 - normal size
    autoTable(doc, {
      startY: yPos,
      body: [['Cena za výrobky a príplatky spolu:', 'spolu bez DPH', `${subtotal.toFixed(2)} €`]],
      styles: { ...tableStyles, fontSize: 7, fontStyle: 'bold' },
      columnStyles: {
        0: { halign: 'right' },
        1: { cellWidth: 28, halign: 'right' },
        2: { cellWidth: 28, halign: 'right' }
      }
    });
    yPos = (doc as any).lastAutoTable.finalY;

    // Summary table row 2 - Zľava - larger (fontSize 11)
    autoTable(doc, {
      startY: yPos,
      body: [[`Zľava z ceny výrobkov a príplatkov:`, zlavaDisplayStrNS, `${zlavaAmountNS.toFixed(2)} €`]],
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
        1: { cellWidth: 28, halign: 'right' },
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
          { content: data.montazLabel || "Montáž - Neumožnená kompletná montáž z dôvodu nepripravenosti stavby bude spoplatnená dopravou.", colSpan: 2, styles: { halign: 'left' } },
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

    // Determine the base calculation amount (cenaDohodou takes priority)
    let paymentBase2 = cenaSDPH;
    if (data.cenaDohodou && data.cenaDohodouValue) {
      paymentBase2 = data.cenaDohodouValue;
    }

    // Check if using default 60/30/10 split
    const isDefaultSplit2 = data.platba1Percent === 60 && data.platba2Percent === 30 && data.platba3Percent === 10;
    const hasNoManualAmounts2 = data.platba1Amount == null && data.platba2Amount == null && data.platba3Amount == null;

    // Use saved amounts if available, otherwise calculate with rounding for default split
    let platba1Amount: string, platba2Amount: string, platba3Amount: string;
    if (data.platba1Amount != null) {
      platba1Amount = data.platba1Amount.toFixed(2);
    } else if (isDefaultSplit2 && hasNoManualAmounts2) {
      platba1Amount = roundUpToTen2(paymentBase2 * 0.60).toFixed(2);
    } else {
      platba1Amount = (paymentBase2 * (data.platba1Percent || 0) / 100).toFixed(2);
    }

    if (data.platba2Amount != null) {
      platba2Amount = data.platba2Amount.toFixed(2);
    } else if (isDefaultSplit2 && hasNoManualAmounts2) {
      platba2Amount = roundUpToTen2(paymentBase2 * 0.30).toFixed(2);
    } else {
      platba2Amount = (paymentBase2 * (data.platba2Percent || 0) / 100).toFixed(2);
    }

    if (data.platba3Amount != null) {
      platba3Amount = data.platba3Amount.toFixed(2);
    } else if (isDefaultSplit2 && hasNoManualAmounts2) {
      // Remainder after rounding
      const p1 = roundUpToTen2(paymentBase2 * 0.60);
      const p2 = roundUpToTen2(paymentBase2 * 0.30);
      platba3Amount = (paymentBase2 - p1 - p2).toFixed(2);
    } else {
      platba3Amount = (paymentBase2 * (data.platba3Percent || 0) / 100).toFixed(2);
    }

    // Table width: col0 (45) + col1 (28) = 73mm for portrait
    const tableWidth = 73;
    const tableStartX = pageWidth - 14 - tableWidth;
    const startYForBoth = yPos;

    // Generate QR Code if place exists and includeQRCode is true (only for preview)
    let qrDataUrl = '';
    let qrWidth = 0;
    const miestoQR = data.miestoDodavky || '';
    if (miestoQR && includeQRCode) {
      try {
        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(miestoQR)}`;
        qrDataUrl = await QRCode.toDataURL(mapsUrl, { margin: 0 });
        qrWidth = 25; // 25mm
        const qrX = tableStartX - qrWidth - 5;
        doc.addImage(qrDataUrl, 'PNG', qrX, startYForBoth, qrWidth, qrWidth);
      } catch (e) {
        console.error('Failed to generate QR', e);
      }
    }

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

    // Price totals table - row 3 (Final price - larger, bold)
    // Show negotiated price if cenaDohodou is enabled, otherwise show cenaSDPH
    const isCenaDohodou2 = data.cenaDohodou && data.cenaDohodouValue;
    const finalPriceLabel2 = isCenaDohodou2 ? 'Cena dohodou:' : 'Cena s DPH:';
    const finalPriceValue2 = isCenaDohodou2 ? (data.cenaDohodouValue || 0) : cenaSDPH;

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY,
      margin: { left: tableStartX },
      body: [[finalPriceLabel2, `${finalPriceValue2.toFixed(2)} €`]],
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

    // Payment table width: same as Totals table = 73mm
    const paymentTableWidth = 73;

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 5,
      margin: { left: pageWidth - 14 - paymentTableWidth }, // Right-aligned matching totals table
      body: paymentRows,
      styles: { ...tableStyles, fontSize: 7 },
      columnStyles: {
        0: { cellWidth: 33 }, // Adjusted to fit 73mm total (33 + 12 + 28 = 73)
        1: { cellWidth: 12, halign: 'right' },
        2: { cellWidth: 28, halign: 'right', fontStyle: 'bold' }
      }
    });

    // Left side info - positioned next to the table
    // If QR code exists, subtract its width and gap from available width
    const maxLeftWidth = tableStartX - 14 - 5 - (qrWidth > 0 ? qrWidth + 5 : 0);

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
    if (data.poznamkaKAdrese) {
      printLabelValue('Poznámka k adrese:', data.poznamkaKAdrese);
    }
    printLabelValue('Zameranie:', data.zameranie || '-');

    // Termín dodania - custom rendering for full paragraph flow
    doc.setFont(fontName, 'bold');
    const tdLabel2 = 'Termín dodania: ';
    const tdLabelWidth2 = doc.getTextWidth(tdLabel2);

    doc.text(tdLabel2, 14, leftYPos);
    doc.setFont(fontName, 'normal');

    const tdValue2 = data.terminDodania || '-';

    const tdRemainingFirstLine2 = maxLeftWidth - tdLabelWidth2;
    const tdWords2 = tdValue2.split(' ');
    let line1Value2 = '';

    let j = 0;
    while (j < tdWords2.length) {
      const word = tdWords2[j];
      const testLine = line1Value2 + (line1Value2 ? ' ' : '') + word;
      if (doc.getTextWidth(testLine) < tdRemainingFirstLine2) {
        line1Value2 = testLine;
        j++;
      } else {
        break;
      }
    }
    const remainingWords2 = tdWords2.slice(j);

    doc.text(line1Value2, 14 + tdLabelWidth2, leftYPos);

    if (remainingWords2.length > 0) {
      const restText = remainingWords2.join(' ');
      const restLines = doc.splitTextToSize(restText, maxLeftWidth);

      leftYPos += 4;
      doc.text(restLines, 14, leftYPos);
      leftYPos += (restLines.length - 1) * 4;
    }

    leftYPos += 4;

    printLabelValue('Vypracoval:', data.vypracoval !== undefined ? data.vypracoval : (userInfo?.vypracoval || formData.vypracoval));
    printLabelValue('Kontakt:', data.kontakt !== undefined ? data.kontakt : (userInfo?.telefon || '-'));
    printLabelValue('E-mail:', data.emailVypracoval !== undefined ? data.emailVypracoval : (userInfo?.email || '-'));
    printLabelValue('Dátum:', data.datum !== undefined ? data.datum : new Date().toLocaleDateString('sk-SK'));

    yPos = Math.max((doc as any).lastAutoTable.finalY, leftYPos) + 5;

    // Legal Text
    // Legal Text
    const defaultLegalText = item.typ === 'schody' ? NOTES_SCHODY : NOTES_NABYTOK;
    const legalText = (data as any).legalText ?? defaultLegalText;

    if (legalText) {
      doc.setFontSize(7);
      doc.setFont(fontName, 'normal');
      doc.setTextColor(60);

      const pageHeight = doc.internal.pageSize.height;
      let legalYPos = yPos;

      const legalLines = doc.splitTextToSize(legalText, pageWidth - 28);
      const legalBlockHeight = legalLines.length * 3;

      if (legalYPos + legalBlockHeight > pageHeight - 15) {
        doc.addPage();
        legalYPos = 20;
      }

      doc.text(legalLines, 14, legalYPos);
    }

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

  // Create blob URL properly for PDF preview
  const pdfBlob = doc.output('blob');
  const blobUrl = URL.createObjectURL(pdfBlob);
  return blobUrl;
};

// Backward compatible function that saves the PDF (without QR code)
export const generateAndSavePDF = async (item: CenovaPonukaItem, formData: SpisFormData, userInfo?: UserInfo) => {
  const blobUrl = await generatePDF(item, formData, userInfo, { includeQRCode: false });
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

  // Zakazka Table (Objednávame u Vás)
  if (data.zakazka) {
    autoTable(doc, {
      startY: yPos,
      body: [[`Objednávame u Vás: ${data.zakazka}`]],
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

  // Create blob URL properly for PDF preview
  const pdfBlob = doc.output('blob');
  const blobUrl = URL.createObjectURL(pdfBlob);
  return blobUrl;
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
