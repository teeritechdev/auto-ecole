import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Candidat,
  IdentifiantsCompte,
  Paiement,
  Recu,
  PassageExamen,
  BilanExamensCandidat,
  SessionExamen,
  TransactionCaisse,
  CreateTransactionCaisse,
  NatureOperation,
  CreateNatureOperation,
  UpdateNatureOperation,
  RecapCaisse,
  DashboardStats,
  CategoriePermis,
  Site,
  SiteStat,
  CandidatStatistiques,
  UtilisateurDTO,
  HistoriqueAction,
  ResumePaiements,
  TarifsExamens,
  Identite,
  IdentitePublique,
  CodeConfiguration,
  CodeQuestion,
  CodeProgression,
  EtatTentative,
  CodeHistoriqueLigne,
  LettreReponse,
  Profil,
  PermissionCatalogue
} from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ================= CANDIDATS =================
  public getCandidats(recherche?: string, statut?: string, categorieId?: number, page: number = 0, size: number = 15, statutInscription?: string, ignoreEtapeFilter?: boolean, siteId?: number, etapeParcours?: string, priseEnChargeExamens?: boolean, dateExamenProgramme?: string): Observable<any> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (recherche) params = params.set('recherche', recherche);
    if (statut) params = params.set('statut', statut);
    if (categorieId) params = params.set('categorieId', categorieId);
    if (statutInscription) params = params.set('statutInscription', statutInscription);
    if (ignoreEtapeFilter) params = params.set('ignoreEtapeFilter', 'true');
    if (siteId) params = params.set('siteId', siteId);
    if (etapeParcours) params = params.set('etapeParcours', etapeParcours);
    if (priseEnChargeExamens !== undefined) params = params.set('priseEnChargeExamens', priseEnChargeExamens);
    if (dateExamenProgramme) params = params.set('dateExamenProgramme', dateExamenProgramme);

    return this.http.get<any>(`${this.base}/candidats`, { params });
  }

  /** Mêmes paramètres de filtre que getCandidats, mais renvoie la répartition homme/femme
   *  (globale + par site) au lieu de la liste paginée. */
  public getCandidatsStatistiques(recherche?: string, statut?: string, categorieId?: number, statutInscription?: string, siteId?: number, etapeParcours?: string, priseEnChargeExamens?: boolean, dateExamenProgramme?: string): Observable<CandidatStatistiques> {
    let params = new HttpParams();
    if (recherche) params = params.set('recherche', recherche);
    if (statut) params = params.set('statut', statut);
    if (categorieId) params = params.set('categorieId', categorieId);
    if (statutInscription) params = params.set('statutInscription', statutInscription);
    if (siteId) params = params.set('siteId', siteId);
    if (etapeParcours) params = params.set('etapeParcours', etapeParcours);
    if (priseEnChargeExamens !== undefined) params = params.set('priseEnChargeExamens', priseEnChargeExamens);
    if (dateExamenProgramme) params = params.set('dateExamenProgramme', dateExamenProgramme);

    return this.http.get<CandidatStatistiques>(`${this.base}/candidats/statistiques`, { params });
  }

  public getCandidatById(id: number): Observable<Candidat> {
    return this.http.get<Candidat>(`${this.base}/candidats/${id}`);
  }

  public getCandidatByDossier(dossier: string): Observable<Candidat> {
    return this.http.get<Candidat>(`${this.base}/candidats/dossier/${dossier}`);
  }

  public createCandidat(data: any): Observable<Candidat> {
    return this.http.post<Candidat>(`${this.base}/candidats`, data);
  }

  public updateCandidat(id: number, data: any): Observable<Candidat> {
    return this.http.put<Candidat>(`${this.base}/candidats/${id}`, data);
  }

  public deleteCandidat(id: number, motif?: string): Observable<void> {
    let params = new HttpParams();
    if (motif) params = params.set('motif', motif);
    return this.http.delete<void>(`${this.base}/candidats/${id}`, { params });
  }

  public reinscrireCandidat(id: number, data: any): Observable<Candidat> {
    return this.http.post<Candidat>(`${this.base}/candidats/${id}/reinscrire`, data);
  }

  public resetPasswordCandidat(id: number): Observable<IdentifiantsCompte> {
    return this.http.patch<IdentifiantsCompte>(`${this.base}/candidats/${id}/reset-password`, {});
  }

  // ================= PAIEMENTS & REÇUS =================
  public getPaiements(candidatId?: number, page: number = 0, size: number = 15, debut?: string, fin?: string, siteId?: number): Observable<any> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (candidatId) params = params.set('candidatId', candidatId);
    if (debut) params = params.set('debut', debut);
    if (fin) params = params.set('fin', fin);
    if (siteId) params = params.set('siteId', siteId);

    return this.http.get<any>(`${this.base}/paiements`, { params });
  }

  public getPaiementsByCandidat(candidatId: number): Observable<Paiement[]> {
    return this.http.get<Paiement[]>(`${this.base}/paiements/candidat/${candidatId}`);
  }

  public getPaiementById(id: number): Observable<Paiement> {
    return this.http.get<Paiement>(`${this.base}/paiements/${id}`);
  }

  public getResumePaiements(): Observable<ResumePaiements> {
    return this.http.get<ResumePaiements>(`${this.base}/paiements/resume`);
  }

  public enregistrerPaiement(data: { candidatId: number; montant: number; modeReglement: string }): Observable<Paiement> {
    return this.http.post<Paiement>(`${this.base}/paiements`, data);
  }

  public enregistrerFraisExamen(data: { candidatId: number; typeEpreuve: string; montant: number; modeReglement: string }): Observable<Paiement> {
    return this.http.post<Paiement>(`${this.base}/paiements/frais-examen`, data);
  }

  public modifierPaiement(id: number, data: { montant: number; modeReglement: string; motif: string }): Observable<Paiement> {
    return this.http.put<Paiement>(`${this.base}/paiements/${id}`, data);
  }

  public annulerPaiement(id: number, data: { motif: string }): Observable<Paiement> {
    return this.http.post<Paiement>(`${this.base}/paiements/${id}/annuler`, data);
  }

  public getRecuById(id: number): Observable<Recu> {
    return this.http.get<Recu>(`${this.base}/paiements/recus/${id}`);
  }

  public getRecuByPaiementId(paiementId: number): Observable<Recu> {
    return this.http.get<Recu>(`${this.base}/paiements/recus/paiement/${paiementId}`);
  }

  // ================= EXAMENS =================
  public getPassages(candidatId?: number, typeEpreuve?: string, resultat?: string, page: number = 0, size: number = 15): Observable<any> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (candidatId) params = params.set('candidatId', candidatId);
    if (typeEpreuve) params = params.set('typeEpreuve', typeEpreuve);
    if (resultat) params = params.set('resultat', resultat);

    return this.http.get<any>(`${this.base}/examens`, { params });
  }

  public getPassagesByCandidat(candidatId: number): Observable<PassageExamen[]> {
    return this.http.get<PassageExamen[]>(`${this.base}/examens/candidat/${candidatId}`);
  }

  public getBilanExamensCandidat(candidatId: number): Observable<BilanExamensCandidat> {
    return this.http.get<BilanExamensCandidat>(`${this.base}/examens/candidat/${candidatId}/bilan`);
  }

  public getProchainsExamens(): Observable<PassageExamen[]> {
    return this.http.get<PassageExamen[]>(`${this.base}/examens/prochains`);
  }

  public programmerPassage(data: any): Observable<PassageExamen> {
    return this.http.post<PassageExamen>(`${this.base}/examens`, data);
  }

  public creerSession(data: any): Observable<SessionExamen> {
    return this.http.post<SessionExamen>(`${this.base}/examens/sessions`, data);
  }

  public getSessions(): Observable<SessionExamen[]> {
    return this.http.get<SessionExamen[]>(`${this.base}/examens/sessions`);
  }

  public getSessionDetail(id: number): Observable<SessionExamen> {
    return this.http.get<SessionExamen>(`${this.base}/examens/sessions/${id}`);
  }

  public ajouterCandidatsASession(sessionId: number, candidatIds: number[]): Observable<SessionExamen> {
    return this.http.post<SessionExamen>(`${this.base}/examens/sessions/${sessionId}/candidats`, { candidatIds });
  }

  public retirerCandidatDeSession(sessionId: number, passageId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/examens/sessions/${sessionId}/candidats/${passageId}`);
  }

  public modifierDateSession(sessionId: number, datePassage: string): Observable<SessionExamen> {
    return this.http.put<SessionExamen>(`${this.base}/examens/sessions/${sessionId}`, { datePassage });
  }

  public modifierSession(sessionId: number, data: { datePassage: string; lieu?: string; siteId?: number; observations?: string }): Observable<SessionExamen> {
    return this.http.put<SessionExamen>(`${this.base}/examens/sessions/${sessionId}`, data);
  }

  public deleteSession(sessionId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/examens/sessions/${sessionId}`);
  }

  public updateResultatPassage(id: number, data: { datePassage: string; resultat: string; observations?: string }): Observable<PassageExamen> {
    return this.http.put<PassageExamen>(`${this.base}/examens/${id}/resultat`, data);
  }

  public deletePassage(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/examens/${id}`);
  }

  // ================= CAISSE =================
  public getTransactionsCaisse(type?: string, natureOperationId?: number, page: number = 0, size: number = 15, siteId?: number): Observable<any> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (type) params = params.set('type', type);
    if (natureOperationId) params = params.set('natureOperationId', natureOperationId);
    if (siteId) params = params.set('siteId', siteId);

    return this.http.get<any>(`${this.base}/caisse/transactions`, { params });
  }

  public getRecapCaisse(siteId?: number): Observable<RecapCaisse> {
    let params = new HttpParams();
    if (siteId) params = params.set('siteId', siteId);
    return this.http.get<RecapCaisse>(`${this.base}/caisse/recap`, { params });
  }

  public enregistrerTransactionCaisse(data: CreateTransactionCaisse): Observable<TransactionCaisse> {
    return this.http.post<TransactionCaisse>(`${this.base}/caisse/transactions`, data);
  }

  public getNaturesOperation(): Observable<NatureOperation[]> {
    return this.http.get<NatureOperation[]>(`${this.base}/caisse/natures`);
  }

  public getToutesNaturesOperation(): Observable<NatureOperation[]> {
    return this.http.get<NatureOperation[]>(`${this.base}/caisse/natures/toutes`);
  }

  public createNatureOperation(data: CreateNatureOperation): Observable<NatureOperation> {
    return this.http.post<NatureOperation>(`${this.base}/caisse/natures`, data);
  }

  public updateNatureOperation(id: number, data: UpdateNatureOperation): Observable<NatureOperation> {
    return this.http.put<NatureOperation>(`${this.base}/caisse/natures/${id}`, data);
  }

  public deleteNatureOperation(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/caisse/natures/${id}`);
  }

  public deleteTransactionCaisse(id: number, motif?: string): Observable<void> {
    let params = new HttpParams();
    if (motif) params = params.set('motif', motif);
    return this.http.delete<void>(`${this.base}/caisse/transactions/${id}`, { params });
  }

  // ================= DASHBOARD =================
  public getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.base}/dashboard`);
  }

  // ================= PARAMÉTRAGE =================
  public getCategories(onlyActive: boolean = false): Observable<CategoriePermis[]> {
    return this.http.get<CategoriePermis[]>(`${this.base}/parametrage/categories?onlyActive=${onlyActive}`);
  }

  public createCategorie(data: any): Observable<CategoriePermis> {
    return this.http.post<CategoriePermis>(`${this.base}/parametrage/categories`, data);
  }

  public updateCategorie(id: number, data: any): Observable<CategoriePermis> {
    return this.http.put<CategoriePermis>(`${this.base}/parametrage/categories/${id}`, data);
  }

  public deleteCategorie(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/parametrage/categories/${id}`);
  }

  public getSites(onlyActive: boolean = false): Observable<Site[]> {
    return this.http.get<Site[]>(`${this.base}/parametrage/sites?onlyActive=${onlyActive}`);
  }

  public createSite(data: any): Observable<Site> {
    return this.http.post<Site>(`${this.base}/parametrage/sites`, data);
  }

  public updateSite(id: number, data: any): Observable<Site> {
    return this.http.put<Site>(`${this.base}/parametrage/sites/${id}`, data);
  }

  public deleteSite(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/parametrage/sites/${id}`);
  }

  public getStatistiquesSites(): Observable<SiteStat[]> {
    return this.http.get<SiteStat[]>(`${this.base}/parametrage/sites/statistiques`);
  }

  // ================= UTILISATEURS =================
  public getUtilisateurs(): Observable<UtilisateurDTO[]> {
    return this.http.get<UtilisateurDTO[]>(`${this.base}/utilisateurs`);
  }

  public getUtilisateurById(id: number): Observable<UtilisateurDTO> {
    return this.http.get<UtilisateurDTO>(`${this.base}/utilisateurs/${id}`);
  }

  public createUtilisateur(data: any): Observable<UtilisateurDTO> {
    return this.http.post<UtilisateurDTO>(`${this.base}/utilisateurs`, data);
  }

  public updateUtilisateur(id: number, data: any): Observable<UtilisateurDTO> {
    return this.http.put<UtilisateurDTO>(`${this.base}/utilisateurs/${id}`, data);
  }

  public toggleActifUtilisateur(id: number): Observable<void> {
    return this.http.patch<void>(`${this.base}/utilisateurs/${id}/toggle-actif`, {});
  }

  public resetPasswordUtilisateur(id: number): Observable<IdentifiantsCompte> {
    return this.http.patch<IdentifiantsCompte>(`${this.base}/utilisateurs/${id}/reset-password`, {});
  }

  public updateUtilisateurPhoto(id: number, photoProfile: string | null): Observable<UtilisateurDTO> {
    return this.http.patch<UtilisateurDTO>(`${this.base}/utilisateurs/${id}/photo`, { photoProfile });
  }

  public updateMyPhoto(photoProfile: string | null): Observable<UtilisateurDTO> {
    return this.http.patch<UtilisateurDTO>(`${this.base}/utilisateurs/me/photo`, { photoProfile });
  }

  // ================= PROFILS & PERMISSIONS =================
  public getPermissionsCatalogue(): Observable<PermissionCatalogue[]> {
    return this.http.get<PermissionCatalogue[]>(`${this.base}/profils/permissions`);
  }

  public getProfils(): Observable<Profil[]> {
    return this.http.get<Profil[]>(`${this.base}/profils`);
  }

  public createProfil(data: { nom: string; description?: string; permissionCodes: string[] }): Observable<Profil> {
    return this.http.post<Profil>(`${this.base}/profils`, data);
  }

  public updateProfil(id: number, data: { nom: string; description?: string; permissionCodes: string[] }): Observable<Profil> {
    return this.http.put<Profil>(`${this.base}/profils/${id}`, data);
  }

  public deleteProfil(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/profils/${id}`);
  }

  public getLogo(): Observable<{ logoData: string | null; nomEtablissement: string; slogan: string }> {
    return this.http.get<{ logoData: string | null; nomEtablissement: string; slogan: string }>(`${this.base}/configuration/logo`);
  }

  public getIdentite(): Observable<Identite> {
    return this.http.get<Identite>(`${this.base}/configuration/identite`);
  }

  public updateIdentite(data: Identite): Observable<Identite> {
    return this.http.put<Identite>(`${this.base}/configuration/identite`, data);
  }

  /** Nom et logo affichés sur l'écran de connexion, avant toute authentification. */
  public getIdentitePublique(): Observable<IdentitePublique> {
    return this.http.get<IdentitePublique>(`${this.base}/public/identite`);
  }

  public getTarifsExamens(): Observable<TarifsExamens> {
    return this.http.get<TarifsExamens>(`${this.base}/configuration/tarifs-examens`);
  }

  public updateTarifsExamens(data: TarifsExamens): Observable<TarifsExamens> {
    return this.http.put<TarifsExamens>(`${this.base}/configuration/tarifs-examens`, data);
  }

  // ================= AUDIT =================
  public getAuditLogs(entite?: string, action?: string, page: number = 0, size: number = 20, debut?: string, fin?: string, utilisateurId?: number): Observable<any> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (entite) params = params.set('entite', entite);
    if (action) params = params.set('action', action);
    if (debut) params = params.set('debut', debut);
    if (fin) params = params.set('fin', fin);
    if (utilisateurId) params = params.set('utilisateurId', utilisateurId);

    return this.http.get<any>(`${this.base}/audit`, { params });
  }

  public deleteAuditLog(id: number, motif: string): Observable<void> {
    const params = new HttpParams().set('motif', motif);
    return this.http.delete<void>(`${this.base}/audit/${id}`, { params });
  }

  public deleteAuditLogs(ids: number[], motif: string): Observable<void> {
    return this.http.post<void>(`${this.base}/audit/supprimer`, { ids, motif });
  }

  // ================= RAPPORTS & TÉLÉCHARGEMENTS =================
  public downloadBlob(url: string, filename: string): void {
    this.http.get(url, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = filename;
        link.click();
        window.URL.revokeObjectURL(downloadUrl);
      },
      error: (err) => console.error('Erreur lors du téléchargement:', err)
    });
  }

  /** Ouvre un PDF dans un nouvel onglet et déclenche directement la boîte de dialogue
   *  d'impression du navigateur, sans passer par un téléchargement de fichier. */
  public printBlob(url: string): void {
    this.http.get(url, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        const blobUrl = window.URL.createObjectURL(blob);
        const printWindow = window.open(blobUrl, '_blank');
        if (!printWindow) {
          console.error('Impossible d’ouvrir la fenêtre d’impression (bloqueur de pop-up ?).');
          return;
        }
        printWindow.onload = () => {
          printWindow.focus();
          printWindow.print();
        };
      },
      error: (err) => console.error('Erreur lors de l’impression:', err)
    });
  }

  public getCandidatsPdfUrl(): string { return `${this.base}/rapports/candidats/pdf`; }
  public getCandidatsExcelUrl(): string { return `${this.base}/rapports/candidats/excel`; }
  public getRelevePaiementPdfUrl(candidatId: number): string { return `${this.base}/rapports/releve-paiement/${candidatId}/pdf`; }
  public getRecuPdfUrl(recuId: number): string { return `${this.base}/rapports/recu/${recuId}/pdf`; }
  public getCaissePdfUrl(debut?: string, fin?: string): string { return `${this.base}/rapports/caisse/pdf${this.buildPeriodeQuery(debut, fin)}`; }
  public getCaisseExcelUrl(debut?: string, fin?: string): string { return `${this.base}/rapports/caisse/excel${this.buildPeriodeQuery(debut, fin)}`; }

  private buildPeriodeQuery(debut?: string, fin?: string): string {
    const parts: string[] = [];
    if (debut) parts.push(`debut=${encodeURIComponent(debut)}`);
    if (fin) parts.push(`fin=${encodeURIComponent(fin)}`);
    return parts.length > 0 ? `?${parts.join('&')}` : '';
  }

  // ================= CODE DE LA ROUTE =================
  public getCodeConfiguration(): Observable<CodeConfiguration> {
    return this.http.get<CodeConfiguration>(`${this.base}/code/configuration`);
  }

  public updateCodeConfiguration(data: CodeConfiguration): Observable<CodeConfiguration> {
    return this.http.put<CodeConfiguration>(`${this.base}/code/configuration`, data);
  }

  public getCodeQuestions(): Observable<CodeQuestion[]> {
    return this.http.get<CodeQuestion[]>(`${this.base}/code/questions`);
  }

  public createCodeQuestion(data: Partial<CodeQuestion>): Observable<CodeQuestion> {
    return this.http.post<CodeQuestion>(`${this.base}/code/questions`, data);
  }

  public updateCodeQuestion(id: number, data: Partial<CodeQuestion>): Observable<CodeQuestion> {
    return this.http.put<CodeQuestion>(`${this.base}/code/questions/${id}`, data);
  }

  public deleteCodeQuestion(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/code/questions/${id}`);
  }

  public getCodeProgression(candidatId: number): Observable<CodeProgression> {
    return this.http.get<CodeProgression>(`${this.base}/code/progression/${candidatId}`);
  }

  public getCodeHistorique(candidatId: number): Observable<CodeHistoriqueLigne[]> {
    return this.http.get<CodeHistoriqueLigne[]>(`${this.base}/code/historique/${candidatId}`);
  }

  public demarrerCycleCode(numero: number): Observable<EtatTentative> {
    return this.http.post<EtatTentative>(`${this.base}/code/cycles/${numero}/start`, {});
  }

  public getEtatTentativeCode(tentativeId: number): Observable<EtatTentative> {
    return this.http.get<EtatTentative>(`${this.base}/code/tentatives/${tentativeId}`);
  }

  public repondreTentativeCode(tentativeId: number, reponses: LettreReponse[]): Observable<EtatTentative> {
    return this.http.post<EtatTentative>(`${this.base}/code/tentatives/${tentativeId}/answer`, { reponses });
  }

  public revenirQuestionPrecedenteCode(tentativeId: number): Observable<EtatTentative> {
    return this.http.post<EtatTentative>(`${this.base}/code/tentatives/${tentativeId}/precedente`, {});
  }

  public terminerTentativeCode(tentativeId: number): Observable<EtatTentative> {
    return this.http.post<EtatTentative>(`${this.base}/code/tentatives/${tentativeId}/finish`, {});
  }
}
