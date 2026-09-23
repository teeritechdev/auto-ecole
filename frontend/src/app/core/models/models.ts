export interface User {
  id: number;
  username: string;
  email: string;
  nom: string;
  prenom: string;
  role: 'ADMIN' | 'SECRETAIRE' | 'CAISSIERE' | 'MONITEUR' | 'CANDIDAT';
  permissions?: string[];
  photoProfile?: string;
  token?: string;
  siteIds?: number[];
  specialites?: ('CODE' | 'CRENEAU' | 'CIRCULATION')[];
  candidatId?: number;
  doitChangerMotDePasse?: boolean;
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
  profilId?: number;
  profilNom?: string;
  siteIds?: number[];
  siteNoms?: string[];
  specialites?: ('CODE' | 'CRENEAU' | 'CIRCULATION')[];
  actif: boolean;
  dateCreation: string;
}

export interface PermissionCatalogue {
  id: number;
  code: string;
  module: string;
  libelle: string;
}

export interface Profil {
  id: number;
  nom: string;
  description?: string;
  systeme: boolean;
  roleSysteme?: string;
  verrouille: boolean;
  nombreUtilisateurs: number;
  permissionCodes: string[];
}

export interface CategoriePermis {
  id: number;
  code: string;
  libelle: string;
  montant: number;
  fraisExamen?: number;
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
  nombrePersonnel: number;
  nombreInscriptions: number;
  nombrePaiements: number;
  montantPaiements: number;
  soldeCaisse: number;
}

export interface Candidat {
  id: number;
  numeroDossier: string;
  nom: string;
  prenom: string;
  dateNaissance: string;
  lieuNaissance?: string;
  sexe?: 'HOMME' | 'FEMME';
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
  priseEnChargeExamens: boolean;
  fraisExamen?: number;
  // Renseigné une seule fois, uniquement dans la réponse de création d'un candidat dont
  // le compte de connexion vient d'être généré automatiquement.
  identifiantsCompte?: IdentifiantsCompte;
}

export interface SiteStatSexe {
  siteId?: number;
  siteNom: string;
  hommes: number;
  femmes: number;
  nonRenseigne: number;
  soldes: number;
  nonSoldes: number;
  enCours: number;
  expiresNonSoldes: number;
  total: number;
}

export interface CandidatStatistiques {
  totalHommes: number;
  totalFemmes: number;
  totalNonRenseigne: number;
  totalSoldes: number;
  totalNonSoldes: number;
  totalEnCours: number;
  totalExpiresNonSoldes: number;
  parSite: SiteStatSexe[];
}

export interface IdentifiantsCompte {
  username: string;
  motDePasseTemporaire: string;
}

export interface Paiement {
  id: number;
  candidatId: number;
  candidatNumeroDossier: string;
  candidatNomComplet: string;
  utilisateurId: number;
  utilisateurNomComplet: string;
  typeEpreuve?: 'CODE' | 'CRENEAU' | 'CIRCULATION' | null;
  montant: number;
  soldeRestant?: number;
  datePaiement: string;
  modeReglement: 'ESPECES' | 'VIREMENT' | 'MOBILE_MONEY' | 'CHEQUE';
  statut?: 'VALIDE' | 'ANNULE' | 'MODIFIE' | string;
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
}

export interface SessionExamen {
  id: number;
  typeEpreuve: 'CODE' | 'CRENEAU' | 'CIRCULATION';
  datePassage: string;
  lieu?: string;
  siteId?: number;
  siteNom?: string;
  moniteurId?: number;
  moniteurNomComplet?: string;
  moniteurSpecialites?: ('CODE' | 'CRENEAU' | 'CIRCULATION')[];
  observations?: string;
  datePassee: boolean;
  terminee: boolean;
  statut?: 'PROGRAMME' | 'EN_COURS' | 'TERMINE';
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

export interface NatureOperation {
  id: number;
  code: string;
  libelle: string;
  sens: 'ENTREE' | 'SORTIE';
  planComptable?: string;
  description?: string;
  actif: boolean;
}

export interface CreateNatureOperation {
  code: string;
  libelle: string;
  sens: 'ENTREE' | 'SORTIE';
  planComptable?: string;
  description?: string;
}

export interface UpdateNatureOperation {
  libelle: string;
  planComptable?: string;
  description?: string;
  actif: boolean;
}

export interface TransactionCaisse {
  id: number;
  natureOperation: NatureOperation;
  typeMouvement: 'ENTREE' | 'SORTIE';
  montant: number;
  libelle: string;
  numeroFacture?: string;
  dateTransaction: string;
  utilisateurId: number;
  utilisateurNomComplet: string;
  siteId?: number;
  siteNom?: string;
}

export interface CreateTransactionCaisse {
  natureOperationId: number;
  montant: number;
  libelle: string;
  numeroFacture?: string;
  siteId?: number;
}

export interface RecapCaisse {
  totalEntrees: number;
  totalSorties: number;
  soldeCaisse: number;
  totalEntreesJour: number;
  totalSortiesJour: number;
  soldeJour: number;
}

export interface ResumePaiementsParSite {
  siteId?: number | null;
  siteNom: string;
  totalEncaisse: number;
  totalReste: number;
}

export interface ResumePaiements {
  totalEncaisse: number;
  totalReste: number;
  parSite?: ResumePaiementsParSite[];
}


export interface TarifsExamens {
  prixExamenCode: number;
  prixExamenCreneau: number;
  prixExamenCirculation: number;
}

export interface Identite {
  logoData: string | null;
  imageConnexion: string | null;
  imageConnexionAjustement: 'cover' | 'contain';
  nomEtablissement: string;
  slogan: string;
  telephone: string | null;
  email: string | null;
  adresseSiege: string | null;
  numeroAgrement: string | null;
  dateAgrement: string | null;
  rccm: string | null;
  ifu: string | null;
  numeroPatente: string | null;
  boitePostale: string | null;
  nomDirigeant: string | null;
  comptePaiement: string | null;
  mentionLegalePied: string | null;
}

export interface IdentitePublique {
  nomEtablissement: string;
  slogan: string;
  logoData: string | null;
  imageConnexion: string | null;
  imageConnexionAjustement: 'cover' | 'contain';
  telephone: string | null;
  adresseSiege: string | null;
}

export interface StatistiquesSite {
  siteId: number;
  siteNom: string;
  totalCandidats: number;
  candidatsEnCours: number;
  candidatsSoldes: number;
  candidatsExpiresNonSoldes: number;
  montantEncaisse: number;
  montantRestant: number;
  soldeCaisse: number;
  totalEntreesCaisse: number;
  totalSortiesCaisse: number;
  examensReussis: number;
  examensEchecs: number;
  examensProgrammes: number;
}

export interface DashboardStats {
  totalCandidats: number;
  candidatsEnCours: number;
  candidatsSoldes: number;
  candidatsExpiresNonSoldes: number;
  totalHommes: number;
  totalFemmes: number;
  montantTotalEncaisse: number;
  montantGlobalRestantDu: number;
  soldeCaisseActuel: number;
  totalEntreesCaisse: number;
  totalSortiesCaisse: number;
  totalExamensReussis: number;
  totalExamensEchecs: number;
  totalExamensProgrammes: number;
  alertesExpiration: Candidat[];
  derniersExamensCrees: SessionExamen[];
  derniersPaiements: Paiement[];
  dernieresTransactionsCaisse: TransactionCaisse[];
  statsParSite?: StatistiquesSite[];
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

// ================= CODE DE LA ROUTE =================

export type LettreReponse = 'A' | 'B' | 'C' | 'D';
export type StatutTentativeCode = 'EN_COURS' | 'REUSSI' | 'ECHEC' | 'EXPIREE' | 'ABANDONNEE';
export type StatutSerie = 'VERROUILLE' | 'DISPONIBLE' | 'REUSSI' | 'ECHEC' | 'EN_COURS';

export interface CodeConfiguration {
  seuilReussite: number;
  tempsParQuestionSecondes: number;
  dureeMaxSerieSecondes: number;
  repriseAutoriseeApresEchec: boolean;
  retourQuestionPrecedenteAutorise: boolean;
  correctionImmediate: boolean;
  deblocageAutomatiqueSerieSuivante: boolean;
  dureeExpirationAccesJours?: number | null;
  nombreDeSeries: number;
}

export interface CodeSerie {
  id: number;
  nom: string;
  description?: string;
  ordre: number;
  actif: boolean;
  nombreQuestions: number;
}

export interface CodeQuestion {
  id: number;
  serieId: number;
  ordre: number;
  enonce: string;
  imageData?: string;
  // Optionnels : une question "façon scan" affiche déjà les choix dans l'image.
  reponseA?: string;
  reponseB?: string;
  reponseC?: string;
  reponseD?: string;
  // Libellés optionnels de sous-groupe façon examen officiel (ex: "pour aller à la
  // station service" au-dessus de A/B, "pour aller à Dreux" au-dessus de C/D).
  sousTitreGroupeAB?: string;
  sousTitreGroupeCD?: string;
  nombreOptions: number; // 2 à 4
  bonnesReponses: LettreReponse[];
  explication?: string;
  actif: boolean;
}

export interface CodeQuestionPourCandidat {
  id: number;
  ordre: number;
  enonce: string;
  imageData?: string;
  reponseA?: string;
  reponseB?: string;
  reponseC?: string;
  reponseD?: string;
  sousTitreGroupeAB?: string;
  sousTitreGroupeCD?: string;
  nombreOptions: number;
}

export interface CodeSerieStatut {
  serieId: number;
  serieNom: string;
  nombreQuestions: number;
  statut: StatutSerie;
  meilleurScore?: number;
  nbTentativesUtilisees: number;
}

export interface CodeProgression {
  candidatId: number;
  totalSeries: number;
  seriesReussies: number;
  pourcentageProgression: number;
  accesExpire: boolean;
  series: CodeSerieStatut[];
}

export interface TentativeEnCours {
  tentativeId: number;
  serieId: number;
  serieNom: string;
  numeroTentative: number;
  indexQuestionCourante: number;
  totalQuestionsDeLaSerie: number;
  question: CodeQuestionPourCandidat;
  tempsParQuestionSecondes: number;
  dureeMaxSerieSecondes: number;
  dateDebut: string;
  dateAffichageQuestionCourante: string;
  retourAutorise: boolean;
  peutRevenirEnArriere: boolean;
}

export interface CodeResultatTentative {
  tentativeId: number;
  serieId: number;
  serieNom: string;
  score: number;
  totalQuestions: number;
  seuilReussite: number;
  statut: StatutTentativeCode;
  reussi: boolean;
  serieSuivanteDebloquee: boolean;
  peutReprendre: boolean;
}

export interface CorrectionReponse {
  correcte: boolean;
  bonnesReponses: LettreReponse[];
  explication?: string;
}

export interface EtatTentative {
  enCours?: TentativeEnCours;
  resultat?: CodeResultatTentative;
  // Renseignée uniquement par /answer, et uniquement si la configuration "correction
  // immédiate" était active au démarrage de la tentative (décision prise côté backend).
  correction?: CorrectionReponse;
}

export interface CodeHistoriqueLigne {
  tentativeId: number;
  serieId: number;
  serieNom: string;
  numeroTentative: number;
  dateDebut: string;
  dateFin?: string;
  score: number;
  totalQuestions: number;
  statut: StatutTentativeCode;
}
