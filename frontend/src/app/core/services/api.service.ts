import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Candidat,
  Paiement,
  Recu,
  PassageExamen,
  BilanExamensCandidat,
  TransactionCaisse,
  RecapCaisse,
  DashboardStats,
  CategoriePermis,
  Forfait,
  UtilisateurDTO,
  HistoriqueAction
} from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private base = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  // ================= CANDIDATS =================
  public getCandidats(recherche?: string, statut?: string, categorieId?: number, page: number = 0, size: number = 15): Observable<any> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (recherche) params = params.set('recherche', recherche);
    if (statut) params = params.set('statut', statut);
    if (categorieId) params = params.set('categorieId', categorieId);

    return this.http.get<any>(`${this.base}/candidats`, { params });
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

  // ================= PAIEMENTS & REÇUS =================
  public getPaiements(candidatId?: number, statut?: string, page: number = 0, size: number = 15): Observable<any> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (candidatId) params = params.set('candidatId', candidatId);
    if (statut) params = params.set('statut', statut);

    return this.http.get<any>(`${this.base}/paiements`, { params });
  }

  public getPaiementsByCandidat(candidatId: number): Observable<Paiement[]> {
    return this.http.get<Paiement[]>(`${this.base}/paiements/candidat/${candidatId}`);
  }

  public getPaiementById(id: number): Observable<Paiement> {
    return this.http.get<Paiement>(`${this.base}/paiements/${id}`);
  }

  public enregistrerPaiement(data: { candidatId: number; montant: number; modeReglement: string }): Observable<Paiement> {
    return this.http.post<Paiement>(`${this.base}/paiements`, data);
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

  public getPassagesAValider(): Observable<PassageExamen[]> {
    return this.http.get<PassageExamen[]>(`${this.base}/examens/a-valider`);
  }

  public validerPassages(passageIds: number[]): Observable<PassageExamen[]> {
    return this.http.post<PassageExamen[]>(`${this.base}/examens/valider`, { passageIds });
  }

  public programmerPassage(data: any): Observable<PassageExamen> {
    return this.http.post<PassageExamen>(`${this.base}/examens`, data);
  }

  public updateResultatPassage(id: number, data: { datePassage: string; resultat: string; observations?: string }): Observable<PassageExamen> {
    return this.http.put<PassageExamen>(`${this.base}/examens/${id}/resultat`, data);
  }

  public deletePassage(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/examens/${id}`);
  }

  // ================= CAISSE =================
  public getTransactionsCaisse(type?: string, categorie?: string, page: number = 0, size: number = 15): Observable<any> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (type) params = params.set('type', type);
    if (categorie) params = params.set('categorie', categorie);

    return this.http.get<any>(`${this.base}/caisse/transactions`, { params });
  }

  public getRecapCaisse(): Observable<RecapCaisse> {
    return this.http.get<RecapCaisse>(`${this.base}/caisse/recap`);
  }

  public enregistrerTransactionCaisse(data: any): Observable<TransactionCaisse> {
    return this.http.post<TransactionCaisse>(`${this.base}/caisse/transactions`, data);
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

  public getForfaits(onlyActive: boolean = false): Observable<Forfait[]> {
    return this.http.get<Forfait[]>(`${this.base}/parametrage/forfaits?onlyActive=${onlyActive}`);
  }

  public createForfait(data: any): Observable<Forfait> {
    return this.http.post<Forfait>(`${this.base}/parametrage/forfaits`, data);
  }

  public updateForfait(id: number, data: any): Observable<Forfait> {
    return this.http.put<Forfait>(`${this.base}/parametrage/forfaits/${id}`, data);
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

  public updateUtilisateurPhoto(id: number, photoProfile: string | null): Observable<UtilisateurDTO> {
    return this.http.patch<UtilisateurDTO>(`${this.base}/utilisateurs/${id}/photo`, { photoProfile });
  }

  public updateMyPhoto(photoProfile: string | null): Observable<UtilisateurDTO> {
    return this.http.patch<UtilisateurDTO>(`${this.base}/utilisateurs/me/photo`, { photoProfile });
  }

  public getLogo(): Observable<{ logoData: string | null }> {
    return this.http.get<{ logoData: string | null }>(`${this.base}/configuration/logo`);
  }

  public updateLogo(logoData: string | null): Observable<{ logoData: string | null }> {
    return this.http.put<{ logoData: string | null }>(`${this.base}/configuration/logo`, { logoData });
  }

  // ================= AUDIT =================
  public getAuditLogs(entite?: string, action?: string, page: number = 0, size: number = 20): Observable<any> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (entite) params = params.set('entite', entite);
    if (action) params = params.set('action', action);

    return this.http.get<any>(`${this.base}/audit`, { params });
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

  public getCandidatsPdfUrl(): string { return `${this.base}/rapports/candidats/pdf`; }
  public getCandidatsExcelUrl(): string { return `${this.base}/rapports/candidats/excel`; }
  public getRelevePaiementPdfUrl(candidatId: number): string { return `${this.base}/rapports/releve-paiement/${candidatId}/pdf`; }
  public getRecuPdfUrl(recuId: number): string { return `${this.base}/rapports/recu/${recuId}/pdf`; }
  public getCaissePdfUrl(): string { return `${this.base}/rapports/caisse/pdf`; }
  public getCaisseExcelUrl(): string { return `${this.base}/rapports/caisse/excel`; }
}
