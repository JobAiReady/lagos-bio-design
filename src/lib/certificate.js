/**
 * Certificate PDF generator using jspdf.
 * Dynamically imported to keep it out of the main bundle (~300KB).
 */

export async function generateCertificatePDF(studentName, completionDate, verificationCode) {
    const { jsPDF } = await import('jspdf');

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const w = doc.internal.pageSize.getWidth();
    const h = doc.internal.pageSize.getHeight();

    // Background
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, w, h, 'F');

    // Border
    doc.setDrawColor(16, 185, 129); // emerald-500
    doc.setLineWidth(1.5);
    doc.roundedRect(10, 10, w - 20, h - 20, 4, 4, 'S');
    doc.setLineWidth(0.5);
    doc.roundedRect(14, 14, w - 28, h - 28, 3, 3, 'S');

    // Header accent line
    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(0.8);
    doc.line(50, 50, w - 50, 50);

    // Title
    doc.setTextColor(16, 185, 129);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('LAGOS BIO-DESIGN BOOTCAMP', w / 2, 40, { align: 'center' });

    // Certificate of Completion
    doc.setTextColor(226, 232, 240); // slate-200
    doc.setFontSize(32);
    doc.setFont('helvetica', 'bold');
    doc.text('Certificate of Completion', w / 2, 68, { align: 'center' });

    // "This is to certify that"
    doc.setTextColor(148, 163, 184); // slate-400
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('This is to certify that', w / 2, 85, { align: 'center' });

    // Student name
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text(studentName, w / 2, 100, { align: 'center' });

    // Name underline
    const nameWidth = doc.getTextWidth(studentName);
    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(0.5);
    doc.line(w / 2 - nameWidth / 2 - 5, 103, w / 2 + nameWidth / 2 + 5, 103);

    // Description
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(
        'has successfully completed all five modules of the Lagos Bio-Design Bootcamp,',
        w / 2, 116, { align: 'center' }
    );
    doc.text(
        'demonstrating proficiency in generative protein design using AlphaFold, RFDiffusion, and ProteinMPNN.',
        w / 2, 123, { align: 'center' }
    );

    // Modules completed
    const modules = [
        'Module 1: The New Paradigm',
        'Module 2: The Engineer\'s Toolkit',
        'Module 3: Generative AI',
        'Module 4: Solving African Challenges',
        'Module 5: Biosecurity & Ethics',
    ];
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139); // slate-500
    const moduleY = 135;
    modules.forEach((mod, i) => {
        doc.text(`\u2713 ${mod}`, w / 2, moduleY + i * 5.5, { align: 'center' });
    });

    // Footer line
    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(0.8);
    doc.line(50, h - 45, w - 50, h - 45);

    // Date and verification
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(10);
    doc.text(`Issued: ${completionDate}`, 50, h - 35);

    doc.setTextColor(100, 116, 139);
    doc.setFontSize(8);
    doc.text(`Verify: bootcamp.jobaiready.ai/verify/${verificationCode}`, 50, h - 28);

    // Powered by
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(8);
    doc.text('Powered by JobAI Ready', w - 50, h - 28, { align: 'right' });

    return doc.output('blob');
}
