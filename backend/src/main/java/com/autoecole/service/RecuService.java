package com.autoecole.service;

import com.autoecole.dto.PaiementDTOs.RecuDTO;
import com.autoecole.entity.Candidat;
import com.autoecole.entity.Inscription;
import com.autoecole.entity.Paiement;
import com.autoecole.entity.Recu;
import com.autoecole.exception.ResourceNotFoundException;
import com.autoecole.repository.RecuRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class RecuService {

    private final RecuRepository recuRepository;

    public RecuDTO getRecuById(Long id) {
        Recu recu = recuRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reçu introuvable avec l'id: " + id));
        return mapToDTO(recu);
    }

    public RecuDTO getRecuByNumero(String numeroRecu) {
        Recu recu = recuRepository.findByNumeroRecu(numeroRecu)
                .orElseThrow(() -> new ResourceNotFoundException("Reçu introuvable avec le numéro: " + numeroRecu));
        return mapToDTO(recu);
    }

    public RecuDTO getRecuByPaiementId(Long paiementId) {
        Recu recu = recuRepository.findByPaiementId(paiementId)
                .orElseThrow(() -> new ResourceNotFoundException("Reçu introuvable pour le paiement: " + paiementId));
        return mapToDTO(recu);
    }

    public RecuDTO mapToDTO(Recu r) {
        Paiement p = r.getPaiement();
        Inscription i = (p != null) ? p.getInscription() : null;
        Candidat c = (i != null) ? i.getCandidat() : null;

        return RecuDTO.builder()
                .id(r.getId())
                .paiementId(p != null ? p.getId() : null)
                .numeroRecu(r.getNumeroRecu())
                .dateEmission(r.getDateEmission())
                .candidatId(c != null ? c.getId() : null)
                .candidatNumeroDossier(c != null ? c.getNumeroDossier() : "")
                .nomClient(r.getNomClient())
                .forfaitNom(i != null && i.getForfait() != null ? i.getForfait().getNom() : "")
                .montantForfait(i != null ? i.getMontantForfait() : null)
                .montant(r.getMontant())
                .totalVerse(i != null ? i.getTotalVerse() : null)
                .soldeRestant(r.getSoldeRestant())
                .modeReglement(p != null ? p.getModeReglement().name() : "")
                .typeVersement(p != null ? p.getTypeVersement().name() : "")
                .imprimePar(r.getImprimePar())
                .build();
    }
}
