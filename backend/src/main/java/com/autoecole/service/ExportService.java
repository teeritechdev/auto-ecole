package com.autoecole.service;

import com.autoecole.dto.CandidatDTOs.CandidatDTO;
import com.autoecole.dto.CaisseDTOs.TransactionCaisseDTO;
import com.autoecole.dto.CaisseDTOs.NatureOperationDTO;
import com.autoecole.dto.ExamenDTOs.BilanExamensCandidatDTO;
import com.autoecole.dto.ExamenDTOs.PassageExamenDTO;
import com.autoecole.dto.ParametrageDTOs.CategoriePermisDTO;
import com.autoecole.dto.ParametrageDTOs.SiteDTO;
import com.autoecole.dto.UtilisateurDTOs.UtilisateurDTO;
import com.autoecole.dto.AuditDTOs.HistoriqueActionDTO;
import com.autoecole.dto.ExamenDTOs.SessionExamenDTO;
import com.autoecole.dto.PaiementDTOs.PaiementDTO;
import com.autoecole.dto.PaiementDTOs.RecuDTO;
import com.autoecole.entity.ConfigurationApplication;
import com.autoecole.entity.enums.TypeEpreuve;
import com.autoecole.repository.ConfigurationApplicationRepository;
import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Element;
import com.lowagie.text.FontFactory;
import com.lowagie.text.Image;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.BaseFont;
import com.lowagie.text.pdf.PdfContentByte;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.HorizontalAlignment;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ExportService {

    private final CandidatService candidatService;
    private final PaiementService paiementService;
    private final RecuService recuService;
    private final CaisseService caisseService;
    private final ExamenService examenService;
    private final ConfigurationApplicationRepository configurationRepository;

    /** Valeur de repli tant qu'aucun nom n'a été saisi par l'ADMIN dans l'onglet Identité
     *  (Paramètres Généraux) ; le nom effectif est ensuite lu dynamiquement en base à
     *  chaque export, sans nécessiter de redémarrage du serveur pour le changer. */
    @Value("${app.etablissement.nom}")
    private String nomEtablissementParDefaut;

    private ConfigurationApplication getConfiguration() {
        return configurationRepository.findById(1L).orElse(null);
    }

    private String getNomEtablissement() {
        ConfigurationApplication config = getConfiguration();
        String nom = config != null ? config.getNomEtablissement() : null;
        return (nom == null || nom.isBlank()) ? nomEtablissementParDefaut : nom;
    }

    private static final Color PRIMARY_COLOR = new Color(24, 76, 120);

    // Charte du reçu de paiement (bandeau navy/orange façon "money receipt")
    private static final Color RECU_NAVY = new Color(19, 43, 74);
    private static final Color RECU_ORANGE = new Color(237, 125, 49);
    private static final Color RECU_BORDER_GRAY = new Color(210, 214, 220);
    private static final Color RECU_SOLDE_BG = new Color(255, 243, 230);
    private static final Color RECU_SOLDE_TEXT = new Color(196, 62, 26);

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

            String[] columns = {"N° Dossier", "Nom", "Prénom", "Téléphone", "Catégorie", "Libellé Catégorie", "Montant (FCFA)", "Total Versé (FCFA)", "Solde Restant (FCFA)", "Statut", "Date Échéance"};
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
                row.createCell(5).setCellValue(sanitizeForExcel(c.getCategoriePermisLibelle() != null ? c.getCategoriePermisLibelle() : ""));
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
            Paragraph title = new Paragraph(getNomEtablissement() + " - LISTE OFFICIELLE DES CANDIDATS", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(15);
            document.add(title);

            PdfPTable table = new PdfPTable(8);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{3f, 4f, 4f, 2.5f, 3f, 3f, 3f, 3f});

            String[] headers = {"N° Dossier", "Nom", "Prénom", "Permis", "Montant", "Total Versé", "Reste Dû", "Statut"};
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
        ConfigurationApplication config = getConfiguration();

        // Marges hautes/basses réservées aux bandeaux navy/orange dessinés en absolu
        Document document = new Document(PageSize.A5, 25, 25, 135, 60);
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try {
            PdfWriter writer = PdfWriter.getInstance(document, out);
            document.open();

            DateTimeFormatter dtf = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
            String dateFormatted = recu.getDateEmission() != null ? recu.getDateEmission().format(dtf) : "";

            PdfContentByte cb = writer.getDirectContent();
            Rectangle pageSize = document.getPageSize();
            drawRecuHeaderBanner(cb, pageSize.getWidth(), pageSize.getHeight(), config, recu.getNumeroRecu(), dateFormatted);
            drawRecuFooterBanner(cb, pageSize.getWidth(), config);

            // Table détails
            PdfPTable table = new PdfPTable(2);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{4f, 6f});

            com.lowagie.text.Font labelFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Color.DARK_GRAY);
            com.lowagie.text.Font valFont = FontFactory.getFont(FontFactory.HELVETICA, 10);

            addRecuRow(table, "N° Dossier Candidat", recu.getCandidatNumeroDossier(), labelFont, valFont);
            addRecuRow(table, "Nom & Prénom", recu.getNomClient(), labelFont, valFont);
            addRecuRow(table, "Formation", recu.getForfaitNom() + " (" + recu.getMontantForfait() + " FCFA)", labelFont, valFont);
            addRecuRow(table, "Mode de règlement", recu.getModeReglement(), labelFont, valFont);
            addRecuRow(table, "MONTANT VERSÉ", recu.getMontant() + " FCFA", labelFont, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11, RECU_NAVY));
            addRecuRow(table, "TOTAL VERSÉ À CE JOUR", recu.getTotalVerse() + " FCFA", labelFont, valFont);

            document.add(table);

            // Encadré mis en avant pour le solde restant dû
            PdfPTable soldeBox = new PdfPTable(2);
            soldeBox.setWidthPercentage(100);
            soldeBox.setWidths(new float[]{6f, 4f});
            soldeBox.setSpacingBefore(10f);

            com.lowagie.text.Font soldeLabelFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11, RECU_NAVY);
            com.lowagie.text.Font soldeValFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 13, RECU_SOLDE_TEXT);

            PdfPCell soldeLabel = new PdfPCell(new Phrase("SOLDE RESTANT DÛ", soldeLabelFont));
            styleSoldeCell(soldeLabel, Element.ALIGN_LEFT);
            PdfPCell soldeValue = new PdfPCell(new Phrase(recu.getSoldeRestant() + " FCFA", soldeValFont));
            styleSoldeCell(soldeValue, Element.ALIGN_RIGHT);

            soldeBox.addCell(soldeLabel);
            soldeBox.addCell(soldeValue);
            document.add(soldeBox);

            // Mention légale libre (agrément, RCCM, IFU...)
            if (config != null && isNotBlank(config.getMentionLegalePied())) {
                Paragraph mention = new Paragraph(config.getMentionLegalePied(), FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 7.5f, Color.GRAY));
                mention.setAlignment(Element.ALIGN_CENTER);
                mention.setSpacingBefore(14f);
                document.add(mention);
            }

            // Opérateur et signature
            PdfPTable signRow = new PdfPTable(2);
            signRow.setWidthPercentage(100);
            signRow.setSpacingBefore(20f);

            PdfPCell recuParCell = new PdfPCell(new Phrase("Reçu par : " + (recu.getImprimePar() != null ? recu.getImprimePar() : "-"), FontFactory.getFont(FontFactory.HELVETICA, 9)));
            recuParCell.setBorder(Rectangle.NO_BORDER);
            PdfPCell signatureCell = new PdfPCell(new Phrase("Signature & Cachet", FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 9)));
            signatureCell.setBorder(Rectangle.NO_BORDER);
            signatureCell.setHorizontalAlignment(Element.ALIGN_RIGHT);

            signRow.addCell(recuParCell);
            signRow.addCell(signatureCell);
            document.add(signRow);

            document.close();
        } catch (Exception e) {
            throw new RuntimeException("Erreur lors de la génération du reçu PDF: " + e.getMessage());
        }

        return out.toByteArray();
    }

    private void styleSoldeCell(PdfPCell cell, int alignment) {
        cell.setBackgroundColor(RECU_SOLDE_BG);
        cell.setBorder(Rectangle.BOX);
        cell.setBorderColor(RECU_ORANGE);
        cell.setBorderWidth(1.2f);
        cell.setPadding(10);
        cell.setHorizontalAlignment(alignment);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
    }

    private boolean isNotBlank(String value) {
        return value != null && !value.isBlank();
    }

    private void appendWithSeparator(StringBuilder builder, String value) {
        if (builder.length() > 0) {
            builder.append("   •   ");
        }
        builder.append(value);
    }

    /** Réduit la taille de police jusqu'à ce que le texte tienne dans maxWidth, pour éviter
     *  qu'une adresse/établissement trop long ne déborde du bandeau (texte en absolu, non wrappé). */
    private float fitFontSize(BaseFont bf, String text, float startSize, float maxWidth, float minSize) {
        float size = startSize;
        while (size > minSize && bf.getWidthPoint(text, size) > maxWidth) {
            size -= 0.5f;
        }
        return size;
    }

    /** Bandeau supérieur façon "money receipt" : bloc navy + accent diagonal orange,
     *  logo de l'auto-école (si défini), nom/slogan, puis sous-barre N° reçu / date. */
    private void drawRecuHeaderBanner(PdfContentByte cb, float pageWidth, float pageHeight, ConfigurationApplication config,
                                       String numeroRecu, String dateFormatted) throws Exception {
        float bannerHeight = 92f;
        float stripHeight = 5f;
        float subBarHeight = 24f;
        float top = pageHeight;

        cb.saveState();
        cb.setColorFill(RECU_NAVY);
        cb.rectangle(0, top - bannerHeight, pageWidth, bannerHeight);
        cb.fill();

        // Accent diagonal orange (coin supérieur droit)
        float wedgeWidth = 110f;
        cb.setColorFill(RECU_ORANGE);
        cb.moveTo(pageWidth - wedgeWidth, top - bannerHeight);
        cb.lineTo(pageWidth, top - bannerHeight);
        cb.lineTo(pageWidth, top);
        cb.lineTo(pageWidth - wedgeWidth + 38, top);
        cb.closePath();
        cb.fill();

        cb.setColorStroke(Color.WHITE);
        cb.setLineWidth(2.5f);
        cb.moveTo(pageWidth - wedgeWidth, top - bannerHeight);
        cb.lineTo(pageWidth - wedgeWidth + 38, top);
        cb.stroke();

        // Liseré orange + sous-barre grise (N° reçu / date)
        cb.setColorFill(RECU_ORANGE);
        cb.rectangle(0, top - bannerHeight - stripHeight, pageWidth, stripHeight);
        cb.fill();

        cb.setColorFill(new Color(245, 246, 248));
        cb.rectangle(0, top - bannerHeight - stripHeight - subBarHeight, pageWidth, subBarHeight);
        cb.fill();
        cb.restoreState();

        // Logo (facultatif, décodé depuis le base64 stocké en config)
        float textStartX = 30f;
        if (config != null && isNotBlank(config.getLogoData())) {
            try {
                String raw = config.getLogoData();
                int comma = raw.indexOf(',');
                byte[] bytes = Base64.getDecoder().decode(comma >= 0 ? raw.substring(comma + 1) : raw);
                Image logo = Image.getInstance(bytes);
                float boxSize = 48f;
                float scale = Math.min(boxSize / logo.getWidth(), boxSize / logo.getHeight()) * 100f;
                logo.scalePercent(scale);
                float logoX = 26f;
                float logoY = top - (bannerHeight / 2f) - (logo.getScaledHeight() / 2f);
                logo.setAbsolutePosition(logoX, logoY);
                cb.addImage(logo);
                textStartX = logoX + boxSize + 12f;
            } catch (Exception ignored) {
                // Logo invalide/corrompu : on affiche le reçu sans logo plutôt que d'échouer
            }
        }

        BaseFont bfBold = BaseFont.createFont(BaseFont.HELVETICA_BOLD, BaseFont.WINANSI, BaseFont.NOT_EMBEDDED);
        BaseFont bfReg = BaseFont.createFont(BaseFont.HELVETICA, BaseFont.WINANSI, BaseFont.NOT_EMBEDDED);
        float headerTextMaxWidth = pageWidth - textStartX - 16f - (wedgeWidth - 38f);

        String nomEtab = getNomEtablissement().toUpperCase();
        cb.beginText();
        cb.setFontAndSize(bfBold, fitFontSize(bfBold, nomEtab, 15f, headerTextMaxWidth, 10f));
        cb.setColorFill(Color.WHITE);
        cb.showTextAligned(Element.ALIGN_LEFT, nomEtab, textStartX, top - 38, 0);
        cb.endText();

        cb.beginText();
        cb.setFontAndSize(bfReg, 10.5f);
        cb.setColorFill(new Color(225, 230, 235));
        cb.showTextAligned(Element.ALIGN_LEFT, "Reçu Officiel de Paiement", textStartX, top - 54, 0);
        cb.endText();

        StringBuilder contact = new StringBuilder();
        if (config != null) {
            if (isNotBlank(config.getTelephone())) appendWithSeparator(contact, config.getTelephone());
            if (isNotBlank(config.getEmail())) appendWithSeparator(contact, config.getEmail());
        }
        if (contact.length() > 0) {
            cb.beginText();
            cb.setFontAndSize(bfReg, fitFontSize(bfReg, contact.toString(), 9f, headerTextMaxWidth, 6.5f));
            cb.setColorFill(new Color(210, 216, 224));
            cb.showTextAligned(Element.ALIGN_LEFT, contact.toString(), textStartX, top - 68, 0);
            cb.endText();
        }

        float subBarTextY = top - bannerHeight - stripHeight - subBarHeight + 8f;
        cb.beginText();
        cb.setFontAndSize(bfBold, 10f);
        cb.setColorFill(RECU_NAVY);
        cb.showTextAligned(Element.ALIGN_LEFT, "N° Reçu : " + numeroRecu, 28f, subBarTextY, 0);
        cb.endText();

        cb.beginText();
        cb.setFontAndSize(bfBold, 10f);
        cb.setColorFill(RECU_NAVY);
        cb.showTextAligned(Element.ALIGN_RIGHT, "Date : " + dateFormatted, pageWidth - 28f, subBarTextY, 0);
        cb.endText();
    }

    /** Bandeau inférieur assorti, avec les coordonnées de l'auto-école en rappel. */
    private void drawRecuFooterBanner(PdfContentByte cb, float pageWidth, ConfigurationApplication config) throws Exception {
        float bannerHeight = 40f;
        float stripHeight = 4f;
        float wedgeWidth = 90f;

        cb.saveState();
        cb.setColorFill(RECU_ORANGE);
        cb.rectangle(0, bannerHeight, pageWidth, stripHeight);
        cb.fill();

        cb.setColorFill(RECU_NAVY);
        cb.rectangle(0, 0, pageWidth, bannerHeight);
        cb.fill();

        // Accent diagonal orange (coin inférieur droit, en écho au bandeau supérieur)
        cb.setColorFill(RECU_ORANGE);
        cb.moveTo(pageWidth - wedgeWidth, 0);
        cb.lineTo(pageWidth, 0);
        cb.lineTo(pageWidth, bannerHeight);
        cb.lineTo(pageWidth - wedgeWidth + 30, bannerHeight);
        cb.closePath();
        cb.fill();
        cb.restoreState();

        StringBuilder line = new StringBuilder();
        if (config != null) {
            if (isNotBlank(config.getAdresseSiege())) appendWithSeparator(line, config.getAdresseSiege());
            if (isNotBlank(config.getTelephone())) appendWithSeparator(line, config.getTelephone());
            if (isNotBlank(config.getEmail())) appendWithSeparator(line, config.getEmail());
        }
        if (line.length() == 0) {
            return;
        }

        BaseFont bfReg = BaseFont.createFont(BaseFont.HELVETICA, BaseFont.WINANSI, BaseFont.NOT_EMBEDDED);
        float maxWidth = pageWidth - 22f - wedgeWidth - 14f;
        cb.beginText();
        cb.setFontAndSize(bfReg, fitFontSize(bfReg, line.toString(), 8f, maxWidth, 6f));
        cb.setColorFill(Color.WHITE);
        cb.showTextAligned(Element.ALIGN_LEFT, line.toString(), 22f, bannerHeight / 2f - 3f, 0);
        cb.endText();
    }

    private void addRecuRow(PdfPTable table, String label, String value, com.lowagie.text.Font labelFont, com.lowagie.text.Font valueFont) {
        PdfPCell labelCell = new PdfPCell(new Phrase(label, labelFont));
        labelCell.setBorder(Rectangle.BOTTOM);
        labelCell.setBorderColor(RECU_BORDER_GRAY);
        labelCell.setBorderWidthBottom(0.75f);
        labelCell.setPaddingTop(6f);
        labelCell.setPaddingBottom(6f);

        PdfPCell valueCell = new PdfPCell(new Phrase(value != null ? value : "-", valueFont));
        valueCell.setBorder(Rectangle.BOTTOM);
        valueCell.setBorderColor(RECU_BORDER_GRAY);
        valueCell.setBorderWidthBottom(0.75f);
        valueCell.setPaddingTop(6f);
        valueCell.setPaddingBottom(6f);
        valueCell.setHorizontalAlignment(Element.ALIGN_RIGHT);

        table.addCell(labelCell);
        table.addCell(valueCell);
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
            addTableRow(synthese, "Formation souscrite :", candidat.getCategoriePermisLibelle() + " (" + candidat.getMontantForfait() + " FCFA)", boldFont, regFont);
            addTableRow(synthese, "Statut du dossier :", candidat.getStatutDossier().name(), boldFont, regFont);
            addTableRow(synthese, "Total déjà versé :", candidat.getTotalVerse() + " FCFA", boldFont, regFont);
            addTableRow(synthese, "Reste à payer :", candidat.getSoldeRestant() + " FCFA", boldFont, boldFont);
            document.add(synthese);

            Paragraph pHist = new Paragraph("\nDétail des versements enregistrés :", boldFont);
            pHist.setSpacingAfter(10);
            document.add(pHist);

            PdfPTable table = new PdfPTable(5);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{3f, 3f, 2.5f, 2.5f, 3f});

            String[] heads = {"Date", "N° Reçu", "Montant", "Reste à payer", "Mode Règlement"};
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
                table.addCell(new Phrase(p.getMontant() + " FCFA", regFont));
                table.addCell(new Phrase(p.getSoldeRestant() != null ? p.getSoldeRestant() + " FCFA" : "-", regFont));
                table.addCell(new Phrase(p.getModeReglement() != null ? p.getModeReglement().name() : "", regFont));
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

            PdfPTable table = new PdfPTable(7);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{3f, 4f, 2f, 5f, 3f, 3f, 3f});

            String[] heads = {"Date", "Nature d'opération", "Mouvement", "Libellé", "N° Facture", "Montant", "Agent"};
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
                table.addCell(new Phrase(tx.getNatureOperation() != null ? tx.getNatureOperation().getLibelle() : "-", regFont));
                table.addCell(new Phrase(tx.getTypeMouvement().name(), regFont));
                table.addCell(new Phrase(tx.getLibelle(), regFont));
                table.addCell(new Phrase(tx.getNumeroFacture() != null ? tx.getNumeroFacture() : "-", regFont));
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
            String[] cols = {"Date", "Nature d'opération", "Plan comptable", "Type Mouvement", "Libellé", "N° Facture", "Montant (FCFA)", "Agent"};
            for (int i = 0; i < cols.length; i++) {
                org.apache.poi.ss.usermodel.Cell cell = headerRow.createCell(i);
                cell.setCellValue(cols[i]);
            }

            int r = 1;
            for (TransactionCaisseDTO tx : transactions) {
                org.apache.poi.ss.usermodel.Row row = sheet.createRow(r++);
                row.createCell(0).setCellValue(tx.getDateTransaction() != null ? tx.getDateTransaction().toString() : "");
                row.createCell(1).setCellValue(sanitizeForExcel(tx.getNatureOperation() != null ? tx.getNatureOperation().getLibelle() : ""));
                row.createCell(2).setCellValue(sanitizeForExcel(tx.getNatureOperation() != null && tx.getNatureOperation().getPlanComptable() != null ? tx.getNatureOperation().getPlanComptable() : ""));
                row.createCell(3).setCellValue(tx.getTypeMouvement().name());
                row.createCell(4).setCellValue(sanitizeForExcel(tx.getLibelle()));
                row.createCell(5).setCellValue(sanitizeForExcel(tx.getNumeroFacture() != null ? tx.getNumeroFacture() : ""));
                row.createCell(6).setCellValue(tx.getMontant().doubleValue());
                row.createCell(7).setCellValue(sanitizeForExcel(tx.getUtilisateurNomComplet()));
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

    // ==========================================
    // EXPORT SESSIONS D'EXAMENS PDF
    // ==========================================
    public byte[] exportSessionsPdf(List<SessionExamenDTO> sessions) {
        Document document = new Document(PageSize.A4, 25, 25, 25, 25);
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            // Titre
            com.lowagie.text.Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 15, PRIMARY_COLOR);
            Paragraph title = new Paragraph(getNomEtablissement() + " - SUIVI PÉDAGOGIQUE & EXAMENS", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(6);
            document.add(title);

            com.lowagie.text.Font subFont = FontFactory.getFont(FontFactory.HELVETICA, 10, Color.DARK_GRAY);
            Paragraph sub = new Paragraph("Liste des sessions d'examens • Édité le " + LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")), subFont);
            sub.setAlignment(Element.ALIGN_CENTER);
            sub.setSpacingAfter(15);
            document.add(sub);

            PdfPTable table = new PdfPTable(5);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{2.5f, 3.5f, 3.5f, 2f, 2.5f});

            String[] headers = {"Date", "Lieu / Site", "Épreuve", "Inscrits", "Statut"};
            com.lowagie.text.Font headFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Color.WHITE);

            for (String h : headers) {
                PdfPCell cell = new PdfPCell(new Phrase(h, headFont));
                cell.setBackgroundColor(PRIMARY_COLOR);
                cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                cell.setPadding(6);
                table.addCell(cell);
            }

            com.lowagie.text.Font bodyFont = FontFactory.getFont(FontFactory.HELVETICA, 9, Color.BLACK);
            DateTimeFormatter dtf = DateTimeFormatter.ofPattern("dd/MM/yyyy");

            for (SessionExamenDTO s : sessions) {
                String dateStr = s.getDatePassage() != null ? s.getDatePassage().format(dtf) : "-";
                String lieuStr = (s.getLieu() != null && !s.getLieu().isBlank()) ? s.getLieu() : (s.getSiteNom() != null ? s.getSiteNom() : "-");
                String epreuveStr = formaterEpreuve(s.getTypeEpreuve());
                int nbInscrits = s.getCandidats() != null ? s.getCandidats().size() : 0;
                String statutStr = formaterStatutSession(s.getStatut());

                PdfPCell c1 = new PdfPCell(new Phrase(dateStr, bodyFont));
                c1.setPadding(5);
                table.addCell(c1);

                PdfPCell c2 = new PdfPCell(new Phrase(lieuStr, bodyFont));
                c2.setPadding(5);
                table.addCell(c2);

                PdfPCell c3 = new PdfPCell(new Phrase(epreuveStr, bodyFont));
                c3.setPadding(5);
                table.addCell(c3);

                PdfPCell c4 = new PdfPCell(new Phrase(nbInscrits + " candidat(s)", bodyFont));
                c4.setPadding(5);
                c4.setHorizontalAlignment(Element.ALIGN_CENTER);
                table.addCell(c4);

                PdfPCell c5 = new PdfPCell(new Phrase(statutStr, bodyFont));
                c5.setPadding(5);
                c5.setHorizontalAlignment(Element.ALIGN_CENTER);
                table.addCell(c5);
            }

            document.add(table);
            document.close();
        } catch (DocumentException e) {
            throw new RuntimeException("Erreur lors de la génération du PDF des sessions d'examens", e);
        }

        return out.toByteArray();
    }

    // ==========================================
    // EXPORT SESSIONS D'EXAMENS EXCEL
    // ==========================================
    public byte[] exportSessionsExcel(List<SessionExamenDTO> sessions) throws IOException {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Sessions d'Examens");

            // Header Style
            org.apache.poi.ss.usermodel.Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());

            CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);

            // Row Header
            Row headerRow = sheet.createRow(0);
            String[] headers = {"Date", "Lieu / Site", "Épreuve", "Nombre d'inscrits", "Statut"};
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // Data Rows
            int rowIdx = 1;
            DateTimeFormatter dtf = DateTimeFormatter.ofPattern("dd/MM/yyyy");
            for (SessionExamenDTO s : sessions) {
                Row row = sheet.createRow(rowIdx++);
                String dateStr = s.getDatePassage() != null ? s.getDatePassage().format(dtf) : "-";
                String lieuStr = (s.getLieu() != null && !s.getLieu().isBlank()) ? s.getLieu() : (s.getSiteNom() != null ? s.getSiteNom() : "-");
                String epreuveStr = formaterEpreuve(s.getTypeEpreuve());
                int nbInscrits = s.getCandidats() != null ? s.getCandidats().size() : 0;
                String statutStr = formaterStatutSession(s.getStatut());

                row.createCell(0).setCellValue(sanitizeForExcel(dateStr));
                row.createCell(1).setCellValue(sanitizeForExcel(lieuStr));
                row.createCell(2).setCellValue(sanitizeForExcel(epreuveStr));
                row.createCell(3).setCellValue(nbInscrits);
                row.createCell(4).setCellValue(sanitizeForExcel(statutStr));
            }

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();
        }
    }

    private String formaterEpreuve(TypeEpreuve type) {
        if (type == null) return "-";
        switch (type) {
            case CODE: return "1. Code de la route";
            case CRENEAU: return "2. Manœuvre / Créneau";
            case CIRCULATION: return "3. Conduite / Circulation";
            default: return type.name();
        }
    }

    private String formaterStatutSession(String statut) {
        if (statut == null) return "Programmé";
        switch (statut.toUpperCase()) {
            case "TERMINE": return "Terminé";
            case "EN_COURS": return "En cours";
            case "PROGRAMME":
            default: return "Programmé";
        }
    }

    // ==========================================
    // RELEVÉ PAIEMENT CANDIDAT EXCEL
    // ==========================================
    public byte[] exportRelevePaiementCandidatExcel(Long candidatId) throws IOException {
        CandidatDTO candidat = candidatService.getCandidatById(candidatId);
        List<PaiementDTO> paiements = paiementService.getPaiementsByCandidat(candidatId);

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Relevé Versements");

            org.apache.poi.ss.usermodel.Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());

            CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);

            Row r0 = sheet.createRow(0);
            r0.createCell(0).setCellValue("Candidat: " + candidat.getNom() + " " + candidat.getPrenom() + " | N° Dossier: " + candidat.getNumeroDossier());
            Row r1 = sheet.createRow(1);
            r1.createCell(0).setCellValue("Formation: " + candidat.getCategoriePermisLibelle() + " | Total Versé: " + candidat.getTotalVerse() + " FCFA | Reste: " + candidat.getSoldeRestant() + " FCFA");

            Row headerRow = sheet.createRow(3);
            String[] headers = {"Date Paiement", "N° Reçu", "Montant (FCFA)", "Solde Restant (FCFA)", "Mode Règlement", "Encaissé par"};
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            int rowIdx = 4;
            DateTimeFormatter dtf = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
            for (PaiementDTO p : paiements) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(sanitizeForExcel(p.getDatePaiement() != null ? p.getDatePaiement().format(dtf) : "-"));
                row.createCell(1).setCellValue(sanitizeForExcel(p.getNumeroRecu() != null ? p.getNumeroRecu() : "-"));
                row.createCell(2).setCellValue(p.getMontant() != null ? p.getMontant().doubleValue() : 0);
                row.createCell(3).setCellValue(p.getSoldeRestant() != null ? p.getSoldeRestant().doubleValue() : 0);
                row.createCell(4).setCellValue(sanitizeForExcel(p.getModeReglement() != null ? p.getModeReglement().name() : "-"));
                row.createCell(5).setCellValue(sanitizeForExcel(p.getUtilisateurNomComplet() != null ? p.getUtilisateurNomComplet() : "-"));
            }

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();
        }
    }

    // ==========================================
    // BILAN EXAMENS CANDIDAT PDF
    // ==========================================
    public byte[] exportBilanExamensCandidatPdf(Long candidatId) {
        CandidatDTO candidat = candidatService.getCandidatById(candidatId);
        BilanExamensCandidatDTO bilan = examenService.getBilanExamensCandidat(candidatId);

        Document document = new Document(PageSize.A4, 25, 25, 25, 25);
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            Paragraph title = new Paragraph("FICHE PÉDAGOGIQUE & SUIVI DES EXAMENS", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 15, PRIMARY_COLOR));
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(15);
            document.add(title);

            PdfPTable synthese = new PdfPTable(2);
            synthese.setWidthPercentage(100);
            com.lowagie.text.Font boldFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10);
            com.lowagie.text.Font regFont = FontFactory.getFont(FontFactory.HELVETICA, 10);

            addTableRow(synthese, "Candidat :", candidat.getNom() + " " + candidat.getPrenom(), boldFont, regFont);
            addTableRow(synthese, "N° Dossier :", candidat.getNumeroDossier(), boldFont, regFont);
            addTableRow(synthese, "Catégorie de Permis :", candidat.getCategoriePermisCode() + " - " + candidat.getCategoriePermisLibelle(), boldFont, regFont);
            addTableRow(synthese, "Site de formation :", candidat.getSiteNom() != null ? candidat.getSiteNom() : "-", boldFont, regFont);
            document.add(synthese);

            Paragraph pStatus = new Paragraph("\nÉtat d'avancement du parcours d'examen :", boldFont);
            pStatus.setSpacingAfter(10);
            document.add(pStatus);

            PdfPTable statusTable = new PdfPTable(3);
            statusTable.setWidthPercentage(100);
            statusTable.setWidths(new float[]{1f, 1f, 1f});

            addStatusCell(statusTable, "1. Épreuve de CODE", bilan.isCodeReussi());
            addStatusCell(statusTable, "2. Épreuve de CRÉNEAU", bilan.isCreneauReussi());
            addStatusCell(statusTable, "3. Épreuve de CIRCULATION", bilan.isCirculationReussi());
            document.add(statusTable);

            Paragraph pDetails = new Paragraph("\nHistorique détaillé des tentatives de passage (Jusqu'à 5 autorisées) :", boldFont);
            pDetails.setSpacingAfter(10);
            document.add(pDetails);

            PdfPTable table = new PdfPTable(5);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{3f, 2f, 2.5f, 2.5f, 4f});

            String[] heads = {"Épreuve", "Passage", "Date", "Résultat", "Observations / Moniteur"};
            for (String h : heads) {
                PdfPCell cell = new PdfPCell(new Phrase(h, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, Color.WHITE)));
                cell.setBackgroundColor(PRIMARY_COLOR);
                cell.setPadding(5);
                table.addCell(cell);
            }

            DateTimeFormatter dtf = DateTimeFormatter.ofPattern("dd/MM/yyyy");
            addPassagesToTable(table, bilan.getPassagesCode(), "Code", regFont, dtf);
            addPassagesToTable(table, bilan.getPassagesCreneau(), "Créneau", regFont, dtf);
            addPassagesToTable(table, bilan.getPassagesCirculation(), "Circulation", regFont, dtf);

            document.add(table);
            document.close();
        } catch (Exception e) {
            throw new RuntimeException("Erreur lors de la génération du bilan d'examens: " + e.getMessage());
        }

        return out.toByteArray();
    }

    private void addStatusCell(PdfPTable table, String epreuve, boolean reussi) {
        PdfPCell cell = new PdfPCell();
        cell.setPadding(8);
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        com.lowagie.text.Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10);
        com.lowagie.text.Font resFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11, reussi ? new Color(21, 128, 61) : new Color(185, 28, 28));
        cell.addElement(new Paragraph(epreuve, titleFont));
        Paragraph pRes = new Paragraph(reussi ? "VALIDÉ" : "NON VALIDÉ", resFont);
        cell.addElement(pRes);
        table.addCell(cell);
    }

    private void addPassagesToTable(PdfPTable table, List<PassageExamenDTO> passages, String epreuveNom, com.lowagie.text.Font regFont, DateTimeFormatter dtf) {
        if (passages == null || passages.isEmpty()) {
            return;
        }
        for (PassageExamenDTO p : passages) {
            table.addCell(new Phrase(epreuveNom, regFont));
            table.addCell(new Phrase(p.getNumeroPassage() != null ? "N° " + p.getNumeroPassage() + "/5" : "-", regFont));
            table.addCell(new Phrase(p.getDatePassage() != null ? p.getDatePassage().format(dtf) : "-", regFont));
            table.addCell(new Phrase(p.getResultat() != null ? p.getResultat().name() : "-", regFont));
            String obs = (p.getObservations() != null ? p.getObservations() : "") + (p.getMoniteurNomComplet() != null ? " (" + p.getMoniteurNomComplet() + ")" : "");
            table.addCell(new Phrase(obs.isBlank() ? "-" : obs, regFont));
        }
    }

    // ==========================================
    // PAIEMENTS PDF & EXCEL
    // ==========================================
    public byte[] exportPaiementsPdf(List<PaiementDTO> paiements) {
        Document document = new Document(PageSize.A4.rotate(), 20, 20, 20, 20);
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            Paragraph title = new Paragraph("JOURNAL DES VERSEMENTS ET ENCAISSEMENTS", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, PRIMARY_COLOR));
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(12);
            document.add(title);

            PdfPTable table = new PdfPTable(8);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{2.5f, 2.5f, 2.5f, 3.5f, 2.5f, 2.5f, 2.5f, 3f});

            String[] heads = {"Date", "N° Reçu", "Dossier", "Candidat", "Montant", "Solde Restant", "Mode", "Encaissé par"};
            for (String h : heads) {
                PdfPCell cell = new PdfPCell(new Phrase(h, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, Color.WHITE)));
                cell.setBackgroundColor(PRIMARY_COLOR);
                cell.setPadding(4);
                table.addCell(cell);
            }

            com.lowagie.text.Font regFont = FontFactory.getFont(FontFactory.HELVETICA, 8);
            DateTimeFormatter dtf = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

            for (PaiementDTO p : paiements) {
                table.addCell(new Phrase(p.getDatePaiement() != null ? p.getDatePaiement().format(dtf) : "-", regFont));
                table.addCell(new Phrase(p.getNumeroRecu() != null ? p.getNumeroRecu() : "-", regFont));
                table.addCell(new Phrase(p.getCandidatNumeroDossier() != null ? p.getCandidatNumeroDossier() : "-", regFont));
                table.addCell(new Phrase(p.getCandidatNomComplet() != null ? p.getCandidatNomComplet() : "-", regFont));
                table.addCell(new Phrase(p.getMontant() != null ? p.getMontant() + " F" : "0 F", regFont));
                table.addCell(new Phrase(p.getSoldeRestant() != null ? p.getSoldeRestant() + " F" : "-", regFont));
                table.addCell(new Phrase(p.getModeReglement() != null ? p.getModeReglement().name() : "-", regFont));
                table.addCell(new Phrase(p.getUtilisateurNomComplet() != null ? p.getUtilisateurNomComplet() : "-", regFont));
            }

            document.add(table);
            document.close();
        } catch (Exception e) {
            throw new RuntimeException("Erreur lors de l'export des paiements en PDF: " + e.getMessage());
        }

        return out.toByteArray();
    }

    public byte[] exportPaiementsExcel(List<PaiementDTO> paiements) throws IOException {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Versements");

            org.apache.poi.ss.usermodel.Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());

            CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);

            Row headerRow = sheet.createRow(0);
            String[] headers = {"Date", "N° Reçu", "N° Dossier", "Nom Candidat", "Montant (FCFA)", "Solde Restant (FCFA)", "Mode Règlement", "Site", "Encaissé par"};
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            int rowIdx = 1;
            DateTimeFormatter dtf = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
            for (PaiementDTO p : paiements) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(sanitizeForExcel(p.getDatePaiement() != null ? p.getDatePaiement().format(dtf) : "-"));
                row.createCell(1).setCellValue(sanitizeForExcel(p.getNumeroRecu() != null ? p.getNumeroRecu() : "-"));
                row.createCell(2).setCellValue(sanitizeForExcel(p.getCandidatNumeroDossier() != null ? p.getCandidatNumeroDossier() : "-"));
                row.createCell(3).setCellValue(sanitizeForExcel(p.getCandidatNomComplet() != null ? p.getCandidatNomComplet() : "-"));
                row.createCell(4).setCellValue(p.getMontant() != null ? p.getMontant().doubleValue() : 0);
                row.createCell(5).setCellValue(p.getSoldeRestant() != null ? p.getSoldeRestant().doubleValue() : 0);
                row.createCell(6).setCellValue(sanitizeForExcel(p.getModeReglement() != null ? p.getModeReglement().name() : "-"));
                row.createCell(7).setCellValue(sanitizeForExcel(p.getSiteNom() != null ? p.getSiteNom() : "-"));
                row.createCell(8).setCellValue(sanitizeForExcel(p.getUtilisateurNomComplet() != null ? p.getUtilisateurNomComplet() : "-"));
            }

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();
        }
    }

    // ==========================================
    // NATURES D'OPÉRATION PDF & EXCEL
    // ==========================================
    public byte[] exportNaturesOperationPdf(List<NatureOperationDTO> natures) {
        Document document = new Document(PageSize.A4, 25, 25, 25, 25);
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            Paragraph title = new Paragraph("CATALOGUE DES NATURES D'OPÉRATION DE CAISSE", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, PRIMARY_COLOR));
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(15);
            document.add(title);

            PdfPTable table = new PdfPTable(5);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{2.5f, 4f, 2.5f, 3f, 2f});

            String[] heads = {"Code", "Libellé", "Sens", "Plan Comptable", "Statut"};
            for (String h : heads) {
                PdfPCell cell = new PdfPCell(new Phrase(h, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, Color.WHITE)));
                cell.setBackgroundColor(PRIMARY_COLOR);
                cell.setPadding(5);
                table.addCell(cell);
            }

            com.lowagie.text.Font regFont = FontFactory.getFont(FontFactory.HELVETICA, 9);
            for (NatureOperationDTO n : natures) {
                table.addCell(new Phrase(n.getCode() != null ? n.getCode() : "-", regFont));
                table.addCell(new Phrase(n.getLibelle() != null ? n.getLibelle() : "-", regFont));
                table.addCell(new Phrase(n.getSens() != null ? (n.getSens() == com.autoecole.entity.enums.TypeMouvementCaisse.ENTREE ? "RECETTE" : "DÉPENSE") : "-", regFont));
                table.addCell(new Phrase(n.getPlanComptable() != null ? n.getPlanComptable() : "-", regFont));
                table.addCell(new Phrase(n.isActif() ? "Active" : "Inactive", regFont));
            }

            document.add(table);
            document.close();
        } catch (Exception e) {
            throw new RuntimeException("Erreur lors de l'export des natures d'opération en PDF: " + e.getMessage());
        }

        return out.toByteArray();
    }

    public byte[] exportNaturesOperationExcel(List<NatureOperationDTO> natures) throws IOException {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Natures d'opération");

            org.apache.poi.ss.usermodel.Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());

            CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);

            Row headerRow = sheet.createRow(0);
            String[] headers = {"Code", "Libellé", "Sens", "Plan Comptable", "Statut", "Description"};
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            int rowIdx = 1;
            for (NatureOperationDTO n : natures) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(sanitizeForExcel(n.getCode() != null ? n.getCode() : "-"));
                row.createCell(1).setCellValue(sanitizeForExcel(n.getLibelle() != null ? n.getLibelle() : "-"));
                row.createCell(2).setCellValue(sanitizeForExcel(n.getSens() != null ? (n.getSens() == com.autoecole.entity.enums.TypeMouvementCaisse.ENTREE ? "RECETTE" : "DÉPENSE") : "-"));
                row.createCell(3).setCellValue(sanitizeForExcel(n.getPlanComptable() != null ? n.getPlanComptable() : "-"));
                row.createCell(4).setCellValue(n.isActif() ? "Active" : "Inactive");
                row.createCell(5).setCellValue(sanitizeForExcel(n.getDescription() != null ? n.getDescription() : ""));
            }

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();
        }
    }

    // ==========================================
    // CATÉGORIES DE PERMIS PDF & EXCEL
    // ==========================================
    public byte[] exportCategoriesPermisPdf(List<CategoriePermisDTO> categories) {
        Document document = new Document(PageSize.A4, 25, 25, 25, 25);
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            Paragraph title = new Paragraph("GRILLE TARIFAIRE DES CATÉGORIES DE PERMIS", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, PRIMARY_COLOR));
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(15);
            document.add(title);

            PdfPTable table = new PdfPTable(5);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{2f, 4f, 3f, 3f, 2f});

            String[] heads = {"Code", "Libellé", "Montant Formation", "Frais d'Examen", "Statut"};
            for (String h : heads) {
                PdfPCell cell = new PdfPCell(new Phrase(h, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, Color.WHITE)));
                cell.setBackgroundColor(PRIMARY_COLOR);
                cell.setPadding(5);
                table.addCell(cell);
            }

            com.lowagie.text.Font regFont = FontFactory.getFont(FontFactory.HELVETICA, 9);
            for (CategoriePermisDTO c : categories) {
                table.addCell(new Phrase(c.getCode() != null ? c.getCode() : "-", regFont));
                table.addCell(new Phrase(c.getLibelle() != null ? c.getLibelle() : "-", regFont));
                table.addCell(new Phrase(c.getMontant() != null ? c.getMontant() + " FCFA" : "0 FCFA", regFont));
                table.addCell(new Phrase(c.getFraisExamen() != null ? c.getFraisExamen() + " FCFA" : "0 FCFA", regFont));
                table.addCell(new Phrase(c.isActif() ? "Active" : "Inactive", regFont));
            }

            document.add(table);
            document.close();
        } catch (Exception e) {
            throw new RuntimeException("Erreur lors de l'export des catégories en PDF: " + e.getMessage());
        }

        return out.toByteArray();
    }

    public byte[] exportCategoriesPermisExcel(List<CategoriePermisDTO> categories) throws IOException {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Catégories de Permis");

            org.apache.poi.ss.usermodel.Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());

            CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);

            Row headerRow = sheet.createRow(0);
            String[] headers = {"Code", "Libellé", "Montant Formation (FCFA)", "Frais d'Examen (FCFA)", "Statut", "Description"};
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            int rowIdx = 1;
            for (CategoriePermisDTO c : categories) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(sanitizeForExcel(c.getCode() != null ? c.getCode() : "-"));
                row.createCell(1).setCellValue(sanitizeForExcel(c.getLibelle() != null ? c.getLibelle() : "-"));
                row.createCell(2).setCellValue(c.getMontant() != null ? c.getMontant().doubleValue() : 0);
                row.createCell(3).setCellValue(c.getFraisExamen() != null ? c.getFraisExamen().doubleValue() : 0);
                row.createCell(4).setCellValue(c.isActif() ? "Active" : "Inactive");
                row.createCell(5).setCellValue(sanitizeForExcel(c.getDescription() != null ? c.getDescription() : ""));
            }

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();
        }
    }

    // ==========================================
    // SITES DE FORMATION PDF & EXCEL
    // ==========================================
    public byte[] exportSitesPdf(List<SiteDTO> sites) {
        Document document = new Document(PageSize.A4, 25, 25, 25, 25);
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            Paragraph title = new Paragraph("LISTE DES SITES DE FORMATION", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, PRIMARY_COLOR));
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(15);
            document.add(title);

            PdfPTable table = new PdfPTable(3);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{4f, 5f, 2f});

            String[] heads = {"Nom du Site", "Adresse", "Statut"};
            for (String h : heads) {
                PdfPCell cell = new PdfPCell(new Phrase(h, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, Color.WHITE)));
                cell.setBackgroundColor(PRIMARY_COLOR);
                cell.setPadding(5);
                table.addCell(cell);
            }

            com.lowagie.text.Font regFont = FontFactory.getFont(FontFactory.HELVETICA, 9);
            for (SiteDTO s : sites) {
                table.addCell(new Phrase(s.getNom() != null ? s.getNom() : "-", regFont));
                table.addCell(new Phrase(s.getAdresse() != null ? s.getAdresse() : "-", regFont));
                table.addCell(new Phrase(s.isActif() ? "Actif" : "Inactif", regFont));
            }

            document.add(table);
            document.close();
        } catch (Exception e) {
            throw new RuntimeException("Erreur lors de l'export des sites en PDF: " + e.getMessage());
        }

        return out.toByteArray();
    }

    public byte[] exportSitesExcel(List<SiteDTO> sites) throws IOException {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Sites de Formation");

            org.apache.poi.ss.usermodel.Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());

            CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);

            Row headerRow = sheet.createRow(0);
            String[] headers = {"Nom du Site", "Adresse", "Statut"};
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            int rowIdx = 1;
            for (SiteDTO s : sites) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(sanitizeForExcel(s.getNom() != null ? s.getNom() : "-"));
                row.createCell(1).setCellValue(sanitizeForExcel(s.getAdresse() != null ? s.getAdresse() : "-"));
                row.createCell(2).setCellValue(s.isActif() ? "Actif" : "Inactif");
            }

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();
        }
    }

    // ==========================================
    // UTILISATEURS PDF & EXCEL
    // ==========================================
    public byte[] exportUtilisateursPdf(List<UtilisateurDTO> utilisateurs) {
        Document document = new Document(PageSize.A4.rotate(), 20, 20, 20, 20);
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            Paragraph title = new Paragraph("LISTE DES UTILISATEURS & DROITS D'ACCÈS", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, PRIMARY_COLOR));
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(15);
            document.add(title);

            PdfPTable table = new PdfPTable(7);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{2.5f, 3.5f, 3.5f, 2.5f, 2.5f, 3.5f, 2f});

            String[] heads = {"Identifiant", "Nom Complet", "Email", "Téléphone", "Rôle", "Sites d'affectation", "Statut"};
            for (String h : heads) {
                PdfPCell cell = new PdfPCell(new Phrase(h, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, Color.WHITE)));
                cell.setBackgroundColor(PRIMARY_COLOR);
                cell.setPadding(5);
                table.addCell(cell);
            }

            com.lowagie.text.Font regFont = FontFactory.getFont(FontFactory.HELVETICA, 8);
            for (UtilisateurDTO u : utilisateurs) {
                table.addCell(new Phrase(u.getUsername() != null ? u.getUsername() : "-", regFont));
                table.addCell(new Phrase((u.getNom() != null ? u.getNom() : "") + " " + (u.getPrenom() != null ? u.getPrenom() : ""), regFont));
                table.addCell(new Phrase(u.getEmail() != null ? u.getEmail() : "-", regFont));
                table.addCell(new Phrase(u.getTelephone() != null ? u.getTelephone() : "-", regFont));
                table.addCell(new Phrase(u.getRoleLibelle() != null ? u.getRoleLibelle() : (u.getRole() != null ? u.getRole() : "-"), regFont));
                String sitesStr = u.getSiteNoms() != null && !u.getSiteNoms().isEmpty() ? String.join(", ", u.getSiteNoms()) : "-";
                table.addCell(new Phrase(sitesStr, regFont));
                table.addCell(new Phrase(u.isActif() ? "Actif" : "Désactivé", regFont));
            }

            document.add(table);
            document.close();
        } catch (Exception e) {
            throw new RuntimeException("Erreur lors de l'export des utilisateurs en PDF: " + e.getMessage());
        }

        return out.toByteArray();
    }

    public byte[] exportUtilisateursExcel(List<UtilisateurDTO> utilisateurs) throws IOException {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Utilisateurs");

            org.apache.poi.ss.usermodel.Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());

            CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);

            Row headerRow = sheet.createRow(0);
            String[] headers = {"Identifiant", "Nom", "Prénom", "Email", "Téléphone", "Rôle", "Sites d'affectation", "Statut"};
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            int rowIdx = 1;
            for (UtilisateurDTO u : utilisateurs) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(sanitizeForExcel(u.getUsername() != null ? u.getUsername() : "-"));
                row.createCell(1).setCellValue(sanitizeForExcel(u.getNom() != null ? u.getNom() : "-"));
                row.createCell(2).setCellValue(sanitizeForExcel(u.getPrenom() != null ? u.getPrenom() : "-"));
                row.createCell(3).setCellValue(sanitizeForExcel(u.getEmail() != null ? u.getEmail() : "-"));
                row.createCell(4).setCellValue(sanitizeForExcel(u.getTelephone() != null ? u.getTelephone() : "-"));
                row.createCell(5).setCellValue(sanitizeForExcel(u.getRoleLibelle() != null ? u.getRoleLibelle() : (u.getRole() != null ? u.getRole() : "-")));
                String sitesStr = u.getSiteNoms() != null && !u.getSiteNoms().isEmpty() ? String.join(", ", u.getSiteNoms()) : "-";
                row.createCell(6).setCellValue(sanitizeForExcel(sitesStr));
                row.createCell(7).setCellValue(u.isActif() ? "Actif" : "Désactivé");
            }

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();
        }
    }

    // ==========================================
    // AUDIT & TRAÇABILITÉ PDF & EXCEL
    // ==========================================
    public byte[] exportAuditPdf(List<HistoriqueActionDTO> logs) {
        Document document = new Document(PageSize.A4.rotate(), 20, 20, 20, 20);
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            Paragraph title = new Paragraph("JOURNAL D'AUDIT & TRAÇABILITÉ (RG10)", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, PRIMARY_COLOR));
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(15);
            document.add(title);

            PdfPTable table = new PdfPTable(7);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{2.5f, 2.5f, 2f, 2.5f, 2f, 4f, 3f});

            String[] heads = {"Date & Heure", "Opérateur", "Action", "Entité Cible", "ID Cible", "Détails", "Motif"};
            for (String h : heads) {
                PdfPCell cell = new PdfPCell(new Phrase(h, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, Color.WHITE)));
                cell.setBackgroundColor(PRIMARY_COLOR);
                cell.setPadding(4);
                table.addCell(cell);
            }

            com.lowagie.text.Font regFont = FontFactory.getFont(FontFactory.HELVETICA, 8);
            DateTimeFormatter dtf = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");

            for (HistoriqueActionDTO l : logs) {
                table.addCell(new Phrase(l.getTimestamp() != null ? l.getTimestamp().format(dtf) : "-", regFont));
                table.addCell(new Phrase(l.getUtilisateurNomComplet() != null ? l.getUtilisateurNomComplet() : "-", regFont));
                table.addCell(new Phrase(l.getAction() != null ? l.getAction() : "-", regFont));
                table.addCell(new Phrase(l.getEntiteCible() != null ? l.getEntiteCible() : "-", regFont));
                table.addCell(new Phrase(l.getIdentifiantCible() != null ? l.getIdentifiantCible() : "-", regFont));
                table.addCell(new Phrase(l.getDetails() != null ? l.getDetails() : "-", regFont));
                table.addCell(new Phrase(l.getMotif() != null ? l.getMotif() : "-", regFont));
            }

            document.add(table);
            document.close();
        } catch (Exception e) {
            throw new RuntimeException("Erreur lors de l'export du journal d'audit en PDF: " + e.getMessage());
        }

        return out.toByteArray();
    }

    public byte[] exportAuditExcel(List<HistoriqueActionDTO> logs) throws IOException {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Journal d'Audit");

            org.apache.poi.ss.usermodel.Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());

            CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);

            Row headerRow = sheet.createRow(0);
            String[] headers = {"Date & Heure", "Opérateur", "Action", "Entité Cible", "ID Cible", "Détails", "Motif"};
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            int rowIdx = 1;
            DateTimeFormatter dtf = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");
            for (HistoriqueActionDTO l : logs) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(sanitizeForExcel(l.getTimestamp() != null ? l.getTimestamp().format(dtf) : "-"));
                row.createCell(1).setCellValue(sanitizeForExcel(l.getUtilisateurNomComplet() != null ? l.getUtilisateurNomComplet() : "-"));
                row.createCell(2).setCellValue(sanitizeForExcel(l.getAction() != null ? l.getAction() : "-"));
                row.createCell(3).setCellValue(sanitizeForExcel(l.getEntiteCible() != null ? l.getEntiteCible() : "-"));
                row.createCell(4).setCellValue(sanitizeForExcel(l.getIdentifiantCible() != null ? l.getIdentifiantCible() : "-"));
                row.createCell(5).setCellValue(sanitizeForExcel(l.getDetails() != null ? l.getDetails() : "-"));
                row.createCell(6).setCellValue(sanitizeForExcel(l.getMotif() != null ? l.getMotif() : "-"));
            }

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();
        }
    }

}
