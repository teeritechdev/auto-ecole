export interface User {
  id: number;
  username: string;
  email: string;
  nom: string;
  prenom: string;
  role: 'ADMIN' | 'SECRETAIRE' | 'CAISSIERE' | 'MONITEUR';
  photoProfile?: string;
  token?: string;
  siteId?: number;
  specialites?: ('CODE' | 'CRENEAU' | 'CIRCULATION')[];
}

export interface UtilisateurDTO {
  id: number;
  username: string;
  email: string;
  nom: string;
  prenom: string;
  telephone?: string;
  photoProfile?: string;
  role: string;
  roleLibelle: string;
  siteId?: number;
  siteNom?: string;
  specialites?: ('CODE' | 'CRENEAU' | 'CIRCULATION')[];
  actif: boolean;
  dateCreation: string;
}

export interface CategoriePermis {
  id: number;
  code: string;
  libelle: string;
  montant: number;
  description?: string;
  actif: boolean;
}

export interface Site {
  id: number;
  nom: string;
  adresse?: string;
  actif: boolean;
}

export interface SiteStat {
  siteId: number;
  siteNom: string;
  nombreCandidatsActifs: number;
  montantEncaisse: number;
  montantRestantDu: number;
}

export interface Candidat {
  id: number;
  numeroDossier: string;
  nom: string;
  prenom: string;
  dateNaissance: string;
  lieuNaissance?: string;
  telephone: string;
  email?: string;
  contactsUrgence?: string;
  dateInscription: string;
  dateReceptionDossier?: string;
  dateDepotDossier?: string;
  dateEcheance: string;
  statutDossier: 'EN_COURS' | 'SOLDE' | 'EXPIRE_NON_SOLDE';
  statutInscription: 'NOUVEAU' | 'REDOUBLANT';
  categoriePermisId: number;
  categoriePermisCode: string;
  categoriePermisLibelle: string;
  siteId?: number;
  siteNom?: string;
  montantForfait: number;
  totalVerse: number;
  soldeRestant: number;
  dateCreation: string;
  procheExpiration: boolean;
  joursRestants: number;
  etapeParcours: 'INSCRIPTION' | 'CODE' | 'EXAMEN_CODE' | 'CRENEAU' | 'EXAMEN_CRENEAU' | 'CIRCULATION' | 'EXAMEN_CIRCULATION' | 'PERMIS_OBTENU' | 'EXPIRE';
  codeReussi: boolean;
  creneauReussi: boolean;
  circulationReussi: boolean;
}

export interface Paiement {
  id: number;
  candidatId: number;
  candidatNumeroDossier: string;
  candidatNomComplet: string;
  utilisateurId: number;
  utilisateurNomComplet: string;
  typeVersement: 'PREMIER_VERSEMENT' | 'VERSEMENT_SUIVANT';
  montant: number;
  datePaiement: string;
  modeReglement: 'ESPECES' | 'VIREMENT' | 'MOBILE_MONEY' | 'CHEQUE';
  statut: 'VALIDE' | 'ANNULE' | 'MODIFIE';
  motifModification?: string;
  dateModification?: string;
  utilisateurModifNom?: string;
  numeroRecu?: string;
  recuId?: number;
}

export interface Recu {
  id: number;
  paiementId: number;
  numeroRecu: string;
  dateEmission: string;
  candidatId: number;
  candidatNumeroDossier: string;
  nomClient: string;
  forfaitNom: string;
  montantForfait: number;
  montant: number;
  totalVerse: number;
  soldeRestant: number;
  modeReglement: string;
  typeVersement: string;
  imprimePar: string;
}

export interface PassageExamen {
  id: number;
  candidatId: number;
  candidatNumeroDossier: string;
  candidatNomComplet: string;
  typeEpreuve: 'CODE' | 'CRENEAU' | 'CIRCULATION';
  numeroPassage: number;
  nombreEchecs: number;
  datePassage: string;
  resultat: 'PROGRAMME' | 'REUSSI' | 'AJOURNE';
  observations?: string;
  moniteurId?: number;
  moniteurNomComplet?: string;
  dateEnregistrement: string;
  statutValidation: 'EN_ATTENTE' | 'VALIDE';
}

export interface SessionExamen {
  id: number;
  typeEpreuve: 'CODE' | 'CRENEAU' | 'CIRCULATION';
  datePassage: string;
  siteId?: number;
  siteNom?: string;
  moniteurId?: number;
  moniteurNomComplet?: string;
  moniteurSpecialites?: ('CODE' | 'CRENEAU' | 'CIRCULATION')[];
  observations?: string;
  datePassee: boolean;
  terminee: boolean;
  candidats: PassageExamen[];
}

export interface BilanExamensCandidat {
  candidatId: number;
  candidatNumeroDossier: string;
  candidatNomComplet: string;
  passagesCode: PassageExamen[];
  passagesCreneau: PassageExamen[];
  passagesCirculation: PassageExamen[];
  codeReussi: boolean;
  creneauReussi: boolean;
  circulationReussi: boolean;
}

export interface TransactionCaisse {
  id: number;
  typeMouvement: 'ENTREE' | 'SORTIE';
  montant: number;
  libelle: string;
  categorie?: string;
  referencePiece?: string;
  dateTransaction: string;
  utilisateurId: number;
  utilisateurNomComplet: string;
  paiementId?: number;
}

export interface RecapCaisse {
  totalEntrees: number;
  totalSorties: number;
  soldeCaisse: number;
  totalEntreesJour: number;
  totalSortiesJour: number;
  soldeJour: number;
}

export interface DashboardStats {
  totalCandidats: number;
  candidatsEnCours: number;
  candidatsSoldes: number;
  candidatsExpiresNonSoldes: number;
  montantTotalEncaisse: number;
  montantGlobalRestantDu: number;
  soldeCaisseActuel: number;
  totalEntreesCaisse: number;
  totalSortiesCaisse: number;
  totalExamensReussis: number;
  totalExamensEchecs: number;
  totalExamensProgrammes: number;
  alertesExpiration: Candidat[];
  prochainsExamens: PassageExamen[];
  derniersPaiements: Paiement[];
  dernieresTransactionsCaisse: TransactionCaisse[];
}

export interface HistoriqueAction {
  id: number;
  utilisateurId?: number;
  utilisateurNomComplet: string;
  action: string;
  entiteCible: string;
  identifiantCible?: string;
  details?: string;
  motif?: string;
  timestamp: string;
  ipAddress?: string;
}
