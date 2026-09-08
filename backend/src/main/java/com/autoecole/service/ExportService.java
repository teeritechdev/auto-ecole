package com.autoecole.service;

import com.autoecole.dto.CandidatDTOs.CandidatDTO;
import com.autoecole.dto.CaisseDTOs.TransactionCaisseDTO;
import com.autoecole.dto.PaiementDTOs.PaiementDTO;
import com.autoecole.dto.PaiementDTOs.RecuDTO;
import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.HorizontalAlignment;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ExportService {

    private final CandidatService candidatService;
    private final PaiementService paiementService;
    private final RecuService recuService;
    private final CaisseService caisseService;

    private static final Color PRIMARY_COLOR = new Color(24, 76, 120);

    // ==========================================
    // 1. EXPORT CANDIDATS EXCEL
    // ==========================================
    public byte[] exportCandidatsExcel(List<CandidatDTO> candidats) throws IOException {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Liste des Candidats");

            // Header Style
            org.apache.poi.ss.usermodel.Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());

            CellStyle headerCellStyle = workbook.createCellStyle();
            headerCellStyle.setFont(headerFont);
            headerCellStyle.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
            headerCellStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerCellStyle.setAlignment(HorizontalAlignment.CENTER);

            String[] columns = {"N° Dossier", "Nom", "Prénom", "Téléphone", "Catégorie", "Forfait", "Montant Forfait (FCFA)", "Total Versé (FCFA)", "Solde Restant (FCFA)", "Statut", "Date Échéance"};
            org.apache.poi.ss.usermodel.Row headerRow = sheet.createRow(0);
            for (int i = 0; i < columns.length; i++) {
                org.apache.poi.ss.usermodel.Cell cell = headerRow.createCell(i);
                cell.setCellValue(columns[i]);
                cell.setCellStyle(headerCellStyle);
            }

            int rowIdx = 1;
            for (CandidatDTO c : candidats) {
                org.apache.poi.ss.usermodel.Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(sanitizeForExcel(c.getNumeroDossier()));
                row.createCell(1).setCellValue(sanitizeForExcel(c.getNom()));
                row.createCell(2).setCellValue(sanitizeForExcel(c.getPrenom()));
                row.createCell(3).setCellValue(sanitizeForExcel(c.getTelephone()));
                row.createCell(4).setCellValue(sanitizeForExcel(c.getCategoriePermisCode() != null ? c.getCategoriePermisCode() : ""));
                row.createCell(5).setCellValue(sanitizeForExcel(c.getForfaitNom() != null ? c.getForfaitNom() : ""));
                row.createCell(6).setCellValue(c.getMontantForfait() != null ? c.getMontantForfait().doubleValue() : 0);
                row.createCell(7).setCellValue(c.getTotalVerse() != null ? c.getTotalVerse().doubleValue() : 0);
                row.createCell(8).setCellValue(c.getSoldeRestant() != null ? c.getSoldeRestant().doubleValue() : 0);
                row.createCell(9).setCellValue(c.getStatutDossier() != null ? c.getStatutDossier().name() : "");
                row.createCell(10).setCellValue(c.getDateEcheance() != null ? c.getDateEcheance().toString() : "");
            }

            for (int i = 0; i < columns.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();
        }
    }

    // ==========================================
    // 2. EXPORT CANDIDATS PDF
    // ==========================================
    public byte[] exportCandidatsPdf(List<CandidatDTO> candidats) {
        Document document = new Document(PageSize.A4.rotate(), 20, 20, 20, 20);
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            // Titre
            com.lowagie.text.Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16, PRIMARY_COLOR);
            Paragraph title = new Paragraph("AUTO-ÉCOLE - LISTE OFFICIELLE DES CANDIDATS", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(15);
            document.add(title);

            PdfPTable table = new PdfPTable(8);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{3f, 4f, 4f, 2.5f, 3f, 3f, 3f, 3f});

            String[] headers = {"N° Dossier", "Nom", "Prénom", "Permis", "Forfait", "Total Versé", "Reste Dû", "Statut"};
            com.lowagie.text.Font headFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Color.WHITE);

            for (String h : headers) {
                PdfPCell cell = new PdfPCell(new Phrase(h, headFont));
                cell.setBackgroundColor(PRIMARY_COLOR);
                cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                cell.setPadding(6);
                table.addCell(cell);
            }

            com.lowagie.text.Font bodyFont = FontFactory.getFont(FontFactory.HELVETICA, 9, Color.BLACK);
            for (CandidatDTO c : candidats) {
                table.addCell(new Phrase(c.getNumeroDossier(), bodyFont));
                table.addCell(new Phrase(c.getNom(), bodyFont));
                table.addCell(new Phrase(c.getPrenom(), bodyFont));
                table.addCell(new Phrase(c.getCategoriePermisCode(), bodyFont));
                table.addCell(new Phrase(c.getMontantForfait() + " FCFA", bodyFont));
                table.addCell(new Phrase(c.getTotalVerse() + " FCFA", bodyFont));
                table.addCell(new Phrase(c.getSoldeRestant() + " FCFA", bodyFont));
                table.addCell(new Phrase(c.getStatutDossier().name(), bodyFont));
            }

            document.add(table);
            document.close();
        } catch (Exception e) {
            throw new RuntimeException("Erreur lors de la génération du PDF des candidats: " + e.getMessage());
        }

        return out.toByteArray();
    }

    // ==========================================
    // 3. EXPORT REÇU ENCAISSEMENT PDF
    // ==========================================
    public byte[] exportRecuPdf(Long recuId) {
        RecuDTO recu = recuService.getRecuById(recuId);
        Document document = new Document(PageSize.A5, 25, 25, 25, 25);
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            // En-tête auto-école
            com.lowagie.text.Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, PRIMARY_COLOR);
            Paragraph entete = new Paragraph("NERWAYA AUTO-ÉCOLE\nREÇU OFFICIEL DE PAIEMENT", headerFont);
            entete.setAlignment(Element.ALIGN_CENTER);
            entete.setSpacingAfter(10);
            document.add(entete);

            com.lowagie.text.Font numRecuFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, Color.DARK_GRAY);
            Paragraph pNum = new Paragraph("N° Reçu : " + recu.getNumeroRecu(), numRecuFont);
            pNum.setAlignment(Element.ALIGN_CENTER);
            pNum.setSpacingAfter(15);
            document.add(pNum);

            // Table détails
            PdfPTable table = new PdfPTable(2);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{4f, 6f});

            com.lowagie.text.Font labelFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10);
            com.lowagie.text.Font valFont = FontFactory.getFont(FontFactory.HELVETICA, 10);

            DateTimeFormatter dtf = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
            String dateFormatted = recu.getDateEmission() != null ? recu.getDateEmission().format(dtf) : "";

            addTableRow(table, "Date d'émission :", dateFormatted, labelFont, valFont);
            addTableRow(table, "N° Dossier Candidat :", recu.getCandidatNumeroDossier(), labelFont, valFont);
            addTableRow(table, "Nom & Prénom :", recu.getNomClient(), labelFont, valFont);
            addTableRow(table, "Forfait choisi :", recu.getForfaitNom() + " (" + recu.getMontantForfait() + " FCFA)", labelFont, valFont);
            addTableRow(table, "Type de versement :", recu.getTypeVersement(), labelFont, valFont);
            addTableRow(table, "Mode de règlement :", recu.getModeReglement(), labelFont, valFont);
            addTableRow(table, "MONTANT VERSÉ :", recu.getMontant() + " FCFA", labelFont, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11, PRIMARY_COLOR));
            addTableRow(table, "TOTAL VERSÉ À CE JOUR :", recu.getTotalVerse() + " FCFA", labelFont, valFont);
            addTableRow(table, "SOLDE RESTANT DÛ :", recu.getSoldeRestant() + " FCFA", labelFont, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11, Color.RED));
            addTableRow(table, "Opérateur / Caisse :", recu.getImprimePar(), labelFont, valFont);

            document.add(table);

            // Mention légale / signature
            Paragraph sign = new Paragraph("\n\nSignature & Cachet de l'Auto-École : ______________________", FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 9));
            sign.setAlignment(Element.ALIGN_RIGHT);
            document.add(sign);

            document.close();
        } catch (Exception e) {
            throw new RuntimeException("Erreur lors de la génération du reçu PDF: " + e.getMessage());
        }

        return out.toByteArray();
    }

    // ==========================================
    // 4. RELEVÉ DE PAIEMENT CANDIDAT PDF
    // ==========================================
    public byte[] exportRelevePaiementCandidatPdf(Long candidatId) {
        CandidatDTO candidat = candidatService.getCandidatById(candidatId);
        List<PaiementDTO> paiements = paiementService.getPaiementsByCandidat(candidatId);

        Document document = new Document(PageSize.A4, 25, 25, 25, 25);
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            Paragraph title = new Paragraph("RELEVÉ DE COMPTE ET HISTORIQUE DES PAIEMENTS", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, PRIMARY_COLOR));
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(15);
            document.add(title);

            // Synthèse candidat
            PdfPTable synthese = new PdfPTable(2);
            synthese.setWidthPercentage(100);
            com.lowagie.text.Font boldFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10);
            com.lowagie.text.Font regFont = FontFactory.getFont(FontFactory.HELVETICA, 10);

            addTableRow(synthese, "Candidat :", candidat.getNom() + " " + candidat.getPrenom(), boldFont, regFont);
            addTableRow(synthese, "N° Dossier :", candidat.getNumeroDossier(), boldFont, regFont);
            addTableRow(synthese, "Téléphone :", candidat.getTelephone(), boldFont, regFont);
            addTableRow(synthese, "Forfait souscrit :", candidat.getForfaitNom() + " (" + candidat.getMontantForfait() + " FCFA)", boldFont, regFont);
            addTableRow(synthese, "Statut du dossier :", candidat.getStatutDossier().name(), boldFont, regFont);
            addTableRow(synthese, "Total déjà versé :", candidat.getTotalVerse() + " FCFA", boldFont, regFont);
            addTableRow(synthese, "Reste à payer :", candidat.getSoldeRestant() + " FCFA", boldFont, boldFont);
            document.add(synthese);

            Paragraph pHist = new Paragraph("\nDétail des versements enregistrés :", boldFont);
            pHist.setSpacingAfter(10);
            document.add(pHist);

            PdfPTable table = new PdfPTable(5);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{3f, 3f, 3f, 2.5f, 2.5f});

            String[] heads = {"Date", "N° Reçu", "Type", "Montant", "Statut"};
            for (String h : heads) {
                PdfPCell cell = new PdfPCell(new Phrase(h, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Color.WHITE)));
                cell.setBackgroundColor(PRIMARY_COLOR);
                cell.setPadding(5);
                table.addCell(cell);
            }

            DateTimeFormatter dtf = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
            for (PaiementDTO p : paiements) {
                table.addCell(new Phrase(p.getDatePaiement() != null ? p.getDatePaiement().format(dtf) : "", regFont));
                table.addCell(new Phrase(p.getNumeroRecu() != null ? p.getNumeroRecu() : "-", regFont));
                table.addCell(new Phrase(p.getTypeVersement() != null ? p.getTypeVersement().name() : "", regFont));
                table.addCell(new Phrase(p.getMontant() + " FCFA", regFont));
                table.addCell(new Phrase(p.getStatut() != null ? p.getStatut().name() : "", regFont));
            }

            document.add(table);
            document.close();
        } catch (Exception e) {
            throw new RuntimeException("Erreur lors de la génération du relevé candidat: " + e.getMessage());
        }

        return out.toByteArray();
    }

    // ==========================================
    // 5. EXPORT CAISSE PDF & EXCEL
    // ==========================================
    public byte[] exportCaissePdf(List<TransactionCaisseDTO> transactions) {
        Document document = new Document(PageSize.A4, 20, 20, 20, 20);
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            Paragraph title = new Paragraph("JOURNAL ET RELEVÉ DES MOUVEMENTS DE CAISSE", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, PRIMARY_COLOR));
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(15);
            document.add(title);

            PdfPTable table = new PdfPTable(6);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{3f, 2f, 5f, 3f, 3f, 3f});

            String[] heads = {"Date", "Mouvement", "Libellé", "Réf. Pièce", "Montant", "Agent"};
            for (String h : heads) {
                PdfPCell cell = new PdfPCell(new Phrase(h, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Color.WHITE)));
                cell.setBackgroundColor(PRIMARY_COLOR);
                cell.setPadding(5);
                table.addCell(cell);
            }

            com.lowagie.text.Font regFont = FontFactory.getFont(FontFactory.HELVETICA, 9);
            DateTimeFormatter dtf = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

            for (TransactionCaisseDTO tx : transactions) {
                table.addCell(new Phrase(tx.getDateTransaction() != null ? tx.getDateTransaction().format(dtf) : "", regFont));
                table.addCell(new Phrase(tx.getTypeMouvement().name(), regFont));
                table.addCell(new Phrase(tx.getLibelle(), regFont));
                table.addCell(new Phrase(tx.getReferencePiece() != null ? tx.getReferencePiece() : "-", regFont));
                table.addCell(new Phrase(tx.getMontant() + " FCFA", regFont));
                table.addCell(new Phrase(tx.getUtilisateurNomComplet(), regFont));
            }

            document.add(table);
            document.close();
        } catch (Exception e) {
            throw new RuntimeException("Erreur lors de la génération du journal de caisse: " + e.getMessage());
        }

        return out.toByteArray();
    }

    public byte[] exportCaisseExcel(List<TransactionCaisseDTO> transactions) throws IOException {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Journal de Caisse");

            org.apache.poi.ss.usermodel.Row headerRow = sheet.createRow(0);
            String[] cols = {"Date", "Type Mouvement", "Libellé", "Catégorie", "Réf Pièce", "Montant (FCFA)", "Agent"};
            for (int i = 0; i < cols.length; i++) {
                org.apache.poi.ss.usermodel.Cell cell = headerRow.createCell(i);
                cell.setCellValue(cols[i]);
            }

            int r = 1;
            for (TransactionCaisseDTO tx : transactions) {
                org.apache.poi.ss.usermodel.Row row = sheet.createRow(r++);
                row.createCell(0).setCellValue(tx.getDateTransaction() != null ? tx.getDateTransaction().toString() : "");
                row.createCell(1).setCellValue(tx.getTypeMouvement().name());
                row.createCell(2).setCellValue(sanitizeForExcel(tx.getLibelle()));
                row.createCell(3).setCellValue(sanitizeForExcel(tx.getCategorie() != null ? tx.getCategorie() : ""));
                row.createCell(4).setCellValue(sanitizeForExcel(tx.getReferencePiece() != null ? tx.getReferencePiece() : ""));
                row.createCell(5).setCellValue(tx.getMontant().doubleValue());
                row.createCell(6).setCellValue(sanitizeForExcel(tx.getUtilisateurNomComplet()));
            }

            for (int i = 0; i < cols.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();
        }
    }

    /**
     * Neutralise l'injection de formules Excel (CSV/Excel Formula Injection) :
     * préfixe d'une apostrophe toute valeur commençant par un caractère
     * interprété comme un déclencheur de formule par Excel/LibreOffice
     * ( = + - @ tab retour-chariot ), pour qu'elle soit toujours traitée
     * comme du texte brut à l'ouverture du fichier.
     */
    private String sanitizeForExcel(String value) {
        if (value == null || value.isEmpty()) {
            return value;
        }
        char first = value.charAt(0);
        if (first == '=' || first == '+' || first == '-' || first == '@' || first == '\t' || first == '\r') {
            return "'" + value;
        }
        return value;
    }

    private void addTableRow(PdfPTable table, String label, String value, com.lowagie.text.Font f1, com.lowagie.text.Font f2) {
        PdfPCell c1 = new PdfPCell(new Phrase(label, f1));
        c1.setBorder(Rectangle.NO_BORDER);
        c1.setPadding(4);

        PdfPCell c2 = new PdfPCell(new Phrase(value != null ? value : "-", f2));
        c2.setBorder(Rectangle.NO_BORDER);
        c2.setPadding(4);

        table.addCell(c1);
        table.addCell(c2);
    }
}
