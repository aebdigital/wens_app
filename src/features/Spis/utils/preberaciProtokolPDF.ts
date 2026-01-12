import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CenovaPonukaItem, SpisFormData, PreberaciProtokolData } from '../types';

export const generatePreberaciProtokolPDF = async (
    item: CenovaPonukaItem,
    formData: SpisFormData,
    protocolData: PreberaciProtokolData
) => {
    const doc = new jsPDF({ orientation: 'portrait' });
    const pageWidth = doc.internal.pageSize.width;

    // Logo Loading
    let logoImg: HTMLImageElement | null = null;
    try {
        const logoUrl = '/logo.png';
        logoImg = await new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.src = logoUrl;
            img.onload = () => resolve(img);
            img.onerror = reject;
        });
    } catch (e) {
        console.warn("Failed to load logo", e);
    }

    // Font Loading (Copied from main generator)
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

    // Set default text color to black
    doc.setTextColor(0, 0, 0);

    // --- Header Table (Logo + Title) ---

    autoTable(doc, {
        startY: 15,
        body: [
            [
                { content: '', styles: { minCellHeight: 15, valign: 'middle' } },
                { content: 'PREBERACÍ PROTOKOL O PREVZATÍ A ODOVZDANÍ DIELA', styles: { fontStyle: 'bold', fontSize: 12, halign: 'center', valign: 'middle', textColor: [0, 0, 0] } }
            ]
        ],
        theme: 'grid',
        styles: {
            lineColor: [0, 0, 0],
            lineWidth: 0,
            cellPadding: 2,
            font: fontName,
            textColor: [0, 0, 0]
        },
        columnStyles: {
            0: { cellWidth: 60 },
            1: { halign: 'center', valign: 'middle' }
        },
        didDrawCell: (data) => {
            if (data.section === 'body' && data.column.index === 0 && logoImg) {
                const imgWidth = logoImg.width;
                const imgHeight = logoImg.height;
                // Fit image in cell maintaining aspect ratio
                const cellWidth = data.cell.width - 4; // padding
                const cellHeight = data.cell.height - 4;

                let targetWidth = cellWidth;
                let targetHeight = (imgHeight / imgWidth) * targetWidth;

                if (targetHeight > cellHeight) {
                    targetHeight = cellHeight;
                    targetWidth = (imgWidth / imgHeight) * targetHeight;
                }

                const x = data.cell.x + 2 + (cellWidth - targetWidth) / 2;
                const y = data.cell.y + 2 + (cellHeight - targetHeight) / 2;

                doc.addImage(logoImg, 'PNG', x, y, targetWidth, targetHeight);
            }
        }
    });

    let yPos = (doc as any).lastAutoTable.finalY;

    // --- Parties Table (Zhotoviteľ vs Objednávateľ) ---

    const zhotovitelData = [
        'Zhotoviteľ:',
        'WENS door s.r.o.',
        'Vápenická 12',
        '971 01 Prievidza',
        'IČO: 36792942',
        'IČ DPH: SK2022396904',
        'zap.v OR SR Trenčín od.Sro, Vl.č. 17931 / R',
        'tel./fax.:046/542 2057 e-mail.: info@wens.sk'
    ].join('\n');

    // Construct Objednávateľ string
    const customerName = formData.firma ? formData.firma : `${formData.priezvisko} ${formData.meno}`;
    const customerAddress = `${formData.ulica}\n${formData.psc} ${formData.mesto}`;
    const customerContact = [
        formData.ico ? `IČO: ${formData.ico}` : '',
        formData.icDph ? `IČ DPH: ${formData.icDph}` : '',
        formData.dic ? `DIČ: ${formData.dic}` : '',
        formData.telefon ? `Mobil: ${formData.telefon}` : '',
        formData.email ? `Email: ${formData.email}` : ''
    ].filter(Boolean).join('\n');

    const objednavatelData = [
        'Objednávateľ:',
        customerName,
        customerAddress,
        '',
        customerContact
    ].join('\n');

    autoTable(doc, {
        startY: yPos,
        body: [
            [
                { content: zhotovitelData, styles: { halign: 'left', valign: 'top' } },
                { content: objednavatelData, styles: { halign: 'left', valign: 'top' } }
            ]
        ],
        theme: 'grid',
        styles: {
            lineColor: [0, 0, 0],
            lineWidth: 0,
            fontSize: 9,
            cellPadding: 2,
            font: fontName,
            valign: 'top',
            overflow: 'linebreak',
            textColor: [0, 0, 0]
        },
        columnStyles: {
            0: { cellWidth: pageWidth / 2 - 14 },
            1: { cellWidth: pageWidth / 2 - 14 }
        }
    });

    yPos = (doc as any).lastAutoTable.finalY;

    // --- Bank Info / IČO DIČ row ---
    autoTable(doc, {
        startY: yPos,
        body: [
            [
                { content: 'PRIMABANKA Slovensko a.s. č.ú.: 4520001507/3100\nIBAN: SK4431000000004520001507,\nBIC (SWIFT): LUBASKBX', styles: { halign: 'left' } },
                { content: `IČO: ${formData.ico || ''}\nDIČ: ${formData.dic || ''}`, styles: { halign: 'left', valign: 'middle' } }
            ]
        ],
        theme: 'grid',
        styles: {
            lineColor: [0, 0, 0],
            lineWidth: 0,
            fontSize: 8,
            cellPadding: 2,
            font: fontName,
            textColor: [0, 0, 0]
        },
        columnStyles: {
            0: { cellWidth: pageWidth / 2 - 14 },
            1: { cellWidth: pageWidth / 2 - 14 }
        }
    });

    yPos = (doc as any).lastAutoTable.finalY + 5;

    // --- Details Table (Kontakt, Mobil, Miesto, Predmet) ---

    const detailsBody = [
        ['Kontaktná osoba:', protocolData.kontaktnaOsoba || ''],
        ['Mobil:', protocolData.mobil || ''],
        ['Miesto dodávky:', protocolData.miestoDodavky || ''],
        ['Predmet diela:', protocolData.predmetDiela || '']
    ];

    autoTable(doc, {
        startY: yPos,
        body: detailsBody,
        theme: 'grid',
        styles: {
            lineColor: [0, 0, 0],
            lineWidth: 0,
            fontSize: 10,
            cellPadding: 3,
            font: fontName,
            textColor: [0, 0, 0]
        },
        columnStyles: {
            0: { cellWidth: 40, fontStyle: 'bold' },
            1: { fontStyle: 'normal' }
        }
    });

    yPos = (doc as any).lastAutoTable.finalY + 5;

    // --- Agreement Text Sections ---

    // Section 1
    autoTable(doc, {
        startY: yPos,
        body: [
            [
                { content: '1.', styles: { halign: 'center', valign: 'middle', fontStyle: 'bold', cellWidth: 10 } },
                {
                    content: `Na základe cenovej ponuky číslo: ${item.cisloCP} zhotoviteľ odovzdáva objednávateľovi a objednávateľ prijíma dohodnutý predmet diela.\nDňom prebratia začína plynúť záručná doba.`,
                    styles: { halign: 'left' }
                }
            ]
        ],
        theme: 'grid',
        styles: {
            lineColor: [0, 0, 0],
            lineWidth: 0,
            fontSize: 10,
            cellPadding: 3,
            font: fontName,
            textColor: [0, 0, 0]
        }
    });

    yPos = (doc as any).lastAutoTable.finalY;

    // Section 2
    autoTable(doc, {
        startY: yPos,
        body: [
            [
                { content: '2.', styles: { halign: 'center', valign: 'middle', fontStyle: 'bold', cellWidth: 10 } },
                {
                    content: 'V čase odovzdania predmetu diela jeho stav je nový a nepoškodený a objednávateľ toto dielo prijíma s nasledovným vyjadrením:\n\nSo zhotovením diela je objednávateľ spokojný, nie je si vedomý žiadnych námietok proti zhotovenému dielu a preto s odovzdaním súhlasí a toto dielo preberá.',
                    styles: { halign: 'left', minCellHeight: 40 }
                }
            ]
        ],
        theme: 'grid',
        styles: {
            lineColor: [0, 0, 0],
            lineWidth: 0,
            fontSize: 10,
            cellPadding: 3,
            font: fontName,
            valign: 'top',
            textColor: [0, 0, 0]
        }
    });

    yPos = (doc as any).lastAutoTable.finalY;

    // --- Signatures ---

    // Add more space if needed to push signatures to bottom or just below
    const pageHeight = doc.internal.pageSize.height;

    // Ensure we have space
    if (yPos > pageHeight - 60) {
        doc.addPage();
        yPos = 20;
    } else {
        yPos += 20; // Some gap
    }

    // Use autoTable for layout of signatures to keep borders if desired, 
    // or just text lines. The screenshot shows borders.

    const signaturePlace = protocolData.miestoDatum || (protocolData.miestoDodavky ? protocolData.miestoDodavky.split(',')[0] : 'Prievidza');
    const signatureDate = protocolData.datum || new Date().toLocaleDateString('sk-SK');
    const signatureDvadsa = `Miesto a dátum: ${signaturePlace}, ${signatureDate}`;

    autoTable(doc, {
        startY: yPos,
        body: [
            [
                { content: signatureDvadsa, colSpan: 2, styles: { valign: 'top', minCellHeight: 15 } }
            ],
            [
                { content: 'Podpis - Zhotoviteľ', styles: { valign: 'bottom', minCellHeight: 25 } },
                { content: 'Podpis - Objednávateľ', styles: { valign: 'bottom', minCellHeight: 25 } }
            ]
        ],
        theme: 'grid',
        styles: {
            lineColor: [0, 0, 0],
            lineWidth: 0.1,
            fontSize: 10,
            cellPadding: 2,
            font: fontName,
            textColor: [0, 0, 0]
        },
        columnStyles: {
            0: { cellWidth: pageWidth / 2 - 14 },
            1: { cellWidth: pageWidth / 2 - 14 }
        }
    });

    // Output
    return doc.output('bloburl') as unknown as string;
};
