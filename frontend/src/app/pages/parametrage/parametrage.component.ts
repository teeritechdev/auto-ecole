import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { CategoriePermis, Identite, Site, SiteStat, Profil, PermissionCatalogue } from '../../core/models/models';
import { extraireMessageErreur } from '../../core/utils/error-utils';

type OngletParametrage = 'identite' | 'categories' | 'sites' | 'permissions';
const ONGLETS_VALIDES: OngletParametrage[] = ['identite', 'categories', 'sites', 'permissions'];

@Component({
    selector: 'app-parametrage',
    imports: [CommonModule, FormsModule],
    template: `
    <div class="parametrage-page">
      <div class="page-header-bar">
        <div>
          <h2>Paramètres Généraux</h2>
          <p>{{ sousTitrePourOnglet() }}</p>
        </div>
      </div>

      <!-- Navigation entre sections : via le sous-menu au survol de "Paramètres Généraux"
           dans la barre latérale (plus de barre d'onglets redondante ici). -->

      <!-- ===================== ONGLET IDENTITÉ ===================== -->
      @if (activeTab === 'identite') {
        <div class="card identite-card">
          <div class="card-header">
            <div class="card-title" style="display:flex; align-items:center; gap:0.5rem;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41 13.42 20.6a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82Z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
              Gestion du profil de l'auto-école
            </div>
          </div>
          <form (ngSubmit)="saveIdentite()">
            @if (identiteError) {
              <div class="alert alert-danger">{{ identiteError }}</div>
            }
            @if (identiteSuccess) {
              <div class="alert alert-success">Profil enregistré avec succès. Les informations sont appliquées sur tous vos documents et exports.</div>
            }

            <div class="param-sections">
              <!-- SECTION 1 : LOGO & IDENTITÉ OFFICIELLE -->
              <div class="param-section">
                <div class="param-section-header">
                  <div class="param-section-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                  </div>
                  <div>
                    <h3 class="param-section-title">1. Identité officielle &amp; Image de marque</h3>
                    <p class="param-section-subtitle">Logo, nom officiel de l'établissement, code d'agrément et devises figurant sur les en-têtes officiels.</p>
                  </div>
                </div>

                <div class="identite-brand-grid">
                  <div class="logo-uploader-box">
                    <div class="logo-preview-frame">
                      @if (identiteForm.logoData) {
                        <img [src]="identiteForm.logoData" alt="Logo officiel" />
                      } @else {
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M14.31 8 20.05 17.94"/><path d="M9.69 8h11.48"/><path d="m7.38 12 5.74-9.94"/><path d="M9.69 16 3.95 6.06"/><path d="M14.31 16H2.83"/><path d="m16.62 12-5.74 9.94"/></svg>
                      }
                    </div>
                    <div>
                      <strong style="display:block; font-size:0.85rem; color:#1e293b; margin-bottom:0.25rem;">Logo de l'auto-école</strong>
                      <input type="file" accept="image/png,image/jpeg,image/webp" (change)="onLogoSelected($event)" />
                      <p class="form-help" style="margin-top:0.35rem;">Formats acceptés : PNG, JPG, WebP (max 2 Mo). Utilisé sur l'en-tête officiel et l'application.</p>
                    </div>
                  </div>

                  <div class="identite-fields">
                    <div class="form-row">
                      <div class="form-group" style="flex: 2;">
                        <label class="form-label">Nom officiel de l'auto-école <span class="required">*</span></label>
                        <input type="text" class="form-control" [(ngModel)]="identiteForm.nomEtablissement" name="nomEtablissement" required placeholder="Ex: BARAKA AUTO MOTO ECOLE" />
                        <p class="form-help">Titre principal affiché en grand sur tous les en-têtes (listes d'examen, attestations, reçus, PDF).</p>
                      </div>
                      <div class="form-group" style="flex: 1;">
                        <label class="form-label">Code Auto-École (AE)</label>
                        <input type="text" class="form-control" [(ngModel)]="identiteForm.codeEtablissement" name="codeEtablissement" placeholder="Ex: AE 206" />
                        <p class="form-help">Encadré officiel affiché en haut à droite des documents.</p>
                      </div>
                    </div>

                    <div class="form-group">
                      <label class="form-label">Activités &amp; Prestations officielles</label>
                      <input type="text" class="form-control" [(ngModel)]="identiteForm.activites" name="activites" placeholder="Ex: FORMATION - ASSISTANCE ET PRESTATIONS DIVERSES EN SECURITE ROUTIERE - IMPORT EXPORT" />
                      <p class="form-help">Sous-titre officiel figurant directement sous le nom de l'auto-école sur les documents officiels.</p>
                    </div>

                    <div class="form-row">
                      <div class="form-group">
                        <label class="form-label">Devise officielle de l'établissement</label>
                        <input type="text" class="form-control" [(ngModel)]="identiteForm.devise" name="devise" placeholder="Ex: « Juste conduire »" />
                        <p class="form-help">Devise affichée en bas des listes d'examen et des relevés de formation.</p>
                      </div>
                      <div class="form-group">
                        <label class="form-label">Slogan de la plateforme</label>
                        <input type="text" class="form-control" [(ngModel)]="identiteForm.slogan" name="slogan" placeholder="Ex: Plateforme Intégrée de Gestion & Formation" />
                        <p class="form-help">Sous-titre affiché sur la page de connexion.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- SECTION 2 : COORDONNÉES & SIÈGE SOCIAL -->
              <div class="param-section">
                <div class="param-section-header">
                  <div class="param-section-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  </div>
                  <div>
                    <h3 class="param-section-title">2. Coordonnées &amp; Siège social</h3>
                    <p class="param-section-subtitle">Téléphones, adresse électronique, boîte postale et localisation du siège de l'auto-école.</p>
                  </div>
                </div>

                <div class="identite-fields">
                  <div class="form-row">
                    <div class="form-group">
                      <label class="form-label">Téléphone(s) officiel(s)</label>
                      <input type="tel" class="form-control" [(ngModel)]="identiteForm.telephone" name="telephone" placeholder="Ex: 76 15 97 72 – 53 58 26 01 – 79 09 33 52" />
                      <p class="form-help">Numéros de téléphone imprimés sur l'en-tête officiel, séparés par des tirets.</p>
                    </div>
                    <div class="form-group">
                      <label class="form-label">Adresse email officielle</label>
                      <input type="email" class="form-control" [(ngModel)]="identiteForm.email" name="email" placeholder="Ex: contact@baraka-autoecole.com" />
                      <p class="form-help">Email de correspondance pour les candidats et les partenaires.</p>
                    </div>
                  </div>

                  <div class="form-row">
                    <div class="form-group">
                      <label class="form-label">Adresse physique du siège social</label>
                      <textarea class="form-control" rows="2" [(ngModel)]="identiteForm.adresseSiege" name="adresseSiege" placeholder="Ex: Secteur 15, Ouagadougou, Burkina Faso"></textarea>
                      <p class="form-help">Adresse officielle du siège de l'établissement (distincte des annexes et sites secondaires).</p>
                    </div>
                    <div class="form-group">
                      <label class="form-label">Boîte Postale (B.P.)</label>
                      <input type="text" class="form-control" [(ngModel)]="identiteForm.boitePostale" name="boitePostale" placeholder="Ex: 01 BP 1234 Ouagadougou 01" />
                      <p class="form-help">Boîte postale officielle pour le courrier postal.</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- SECTION 3 : RÉFÉRENCES LÉGALES & AGRÉMENTS -->
              <div class="param-section">
                <div class="param-section-header">
                  <div class="param-section-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  </div>
                  <div>
                    <h3 class="param-section-title">3. Références réglementaires &amp; Légales</h3>
                    <p class="param-section-subtitle">Agrément ministériel (DGTTM), registre de commerce, IFU et numéro de patente.</p>
                  </div>
                </div>

                <div class="identite-fields">
                  <div class="form-row">
                    <div class="form-group">
                      <label class="form-label">Numéro d'agrément / Autorisation d'exploitation</label>
                      <input type="text" class="form-control" [(ngModel)]="identiteForm.numeroAgrement" name="numeroAgrement" placeholder="Ex: N° 2026-0428-MATM/SG/DGTTM" />
                      <p class="form-help">Numéro officiel de l'agrément délivré par le Ministère des Transports.</p>
                    </div>
                    <div class="form-group">
                      <label class="form-label">Date d'autorisation ou de renouvellement</label>
                      <input type="date" class="form-control" [(ngModel)]="identiteForm.dateAgrement" name="dateAgrement" />
                      <p class="form-help">Date d'arrêté ou de signature figurant sur l'agrément ministériel.</p>
                    </div>
                  </div>

                  <div class="form-row">
                    <div class="form-group">
                      <label class="form-label">Registre du Commerce (RCCM)</label>
                      <input type="text" class="form-control" [(ngModel)]="identiteForm.rccm" name="rccm" placeholder="Ex: BF-OUA-01-2024 B13-17114" />
                      <p class="form-help">Numéro d'immatriculation au registre du commerce et du crédit mobilier.</p>
                    </div>
                    <div class="form-group">
                      <label class="form-label">Identifiant Financier Unique (IFU)</label>
                      <input type="text" class="form-control" [(ngModel)]="identiteForm.ifu" name="ifu" placeholder="Ex: 00253566L" />
                      <p class="form-help">Numéro IFU délivré par la Direction Générale des Impôts.</p>
                    </div>
                  </div>

                  <div class="form-group">
                    <label class="form-label">Numéro de patente professionnelle</label>
                    <input type="text" class="form-control" [(ngModel)]="identiteForm.numeroPatente" name="numeroPatente" placeholder="Ex: 12345678" />
                    <p class="form-help">Référence de patente pour la comptabilité et les états fiscaux.</p>
                  </div>
                </div>
              </div>

              <!-- SECTION 4 : DIRECTION & MODALITÉS DE PAIEMENT -->
              <div class="param-section">
                <div class="param-section-header">
                  <div class="param-section-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  </div>
                  <div>
                    <h3 class="param-section-title">4. Direction, Modalités de règlement &amp; Pied de page</h3>
                    <p class="param-section-subtitle">Nom du dirigeant, comptes bancaires ou Mobile Money pour les versements, et mentions légales.</p>
                  </div>
                </div>

                <div class="identite-fields">
                  <div class="form-row">
                    <div class="form-group">
                      <label class="form-label">Nom du directeur / gérant</label>
                      <input type="text" class="form-control" [(ngModel)]="identiteForm.nomDirigeant" name="nomDirigeant" placeholder="Ex: M. OUEDRAOGO Jean-Marc" />
                      <p class="form-help">Nom complet du responsable de l'auto-école imprimé au bas des reçus de paiement.</p>
                    </div>
                    <div class="form-group">
                      <label class="form-label">Comptes de règlement (Banque / Mobile Money)</label>
                      <input type="text" class="form-control" [(ngModel)]="identiteForm.comptePaiement" name="comptePaiement" placeholder="Ex: Orange Money : 76 15 97 72 / Moov Money : 53 58 26 01" />
                      <p class="form-help">Comptes indiqués aux candidats pour le versement des frais de formation.</p>
                    </div>
                  </div>

                  <div class="form-group">
                    <label class="form-label">Mention légale officielle (Pied de page des reçus &amp; documents)</label>
                    <textarea class="form-control" rows="2" [(ngModel)]="identiteForm.mentionLegalePied" name="mentionLegalePied" placeholder="Ex: Auto-école agréée par le Ministère des Transports — Tous droits réservés."></textarea>
                    <p class="form-help">Texte légal affiché tout en bas des reçus de caisse, relevés et documents imprimés.</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- BARRE DE VALIDATION -->
            <div class="param-actions-bar">
              <button type="submit" class="btn btn-primary" [disabled]="savingIdentite" style="display:flex; align-items:center; gap:0.5rem; padding:0.6rem 1.4rem;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                {{ savingIdentite ? 'Enregistrement en cours...' : 'Enregistrer les modifications' }}
              </button>
            </div>
          </form>
        </div>
      }

      <!-- ===================== ONGLET CATÉGORIES DE PERMIS ===================== -->
      @if (activeTab === 'categories') {
        <div class="card">
          <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
            <div class="card-title" style="display:flex; align-items:center; gap:0.5rem;">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L19 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2"/><circle cx="6.5" cy="16.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/></svg>
              Catégories de Permis (A1, B, C...)
            </div>
            <div class="header-buttons" style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
              <button class="btn btn-outline btn-sm" (click)="exportCategoriesPdf()">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                Export PDF
              </button>
              <button class="btn btn-outline btn-sm" (click)="imprimerCategories()" title="Imprimer directement">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                Imprimer
              </button>
              <button class="btn btn-outline btn-sm" (click)="exportCategoriesExcel()">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                Export Excel
              </button>
              <button class="btn btn-primary btn-sm" (click)="openCatModal()">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                Nouvelle Catégorie
              </button>
            </div>
          </div>

          <div class="table-responsive">
            <table class="custom-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Libellé Officiel</th>
                  <th>Montant Formation</th>
                  <th>Frais d'Examen</th>
                  <th>Description</th>
                  <th class="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                @for (cat of categories; track cat) {
                  <tr>
                    <td><span class="badge badge-programme">{{ cat.code }}</span></td>
                    <td><strong>{{ cat.libelle }}</strong></td>
                    <td><strong class="text-success">{{ cat.montant | number }} FCFA</strong></td>
                    <td><strong class="text-primary">{{ (cat.fraisExamen || 0) | number }} FCFA</strong></td>
                    <td><small class="text-muted">{{ cat.description || '—' }}</small></td>
                    <td class="text-right">
                      <div class="action-flex" style="justify-content: flex-end; gap: 0.35rem;">
                        <button class="btn btn-outline btn-xs" (click)="editCat(cat)" title="Modifier">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg>
                        </button>
                        <button class="btn btn-danger btn-xs" (click)="deleteCat(cat)" title="Supprimer la catégorie">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }



      <!-- ===================== ONGLET SITES ===================== -->
      @if (activeTab === 'sites') {
        <div class="card">
          <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
            <div class="card-title" style="display:flex; align-items:center; gap:0.5rem;">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
              Sites de Formation
            </div>
            <div class="header-buttons" style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
              <button class="btn btn-outline btn-sm" (click)="exportSitesPdf()">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                Export PDF
              </button>
              <button class="btn btn-outline btn-sm" (click)="imprimerSites()" title="Imprimer directement">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                Imprimer
              </button>
              <button class="btn btn-outline btn-sm" (click)="exportSitesExcel()">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                Export Excel
              </button>
              <button class="btn btn-primary btn-sm" (click)="openSiteModal()">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                Nouveau Site
              </button>
            </div>
          </div>
          <div class="table-responsive">
            <table class="custom-table">
              <thead>
                <tr>
                  <th style="width: 35%;">Nom du Site</th>
                  <th style="width: 40%;">Adresse</th>
                  <th style="width: 13%;">Statut</th>
                  <th class="text-right" style="width: 12%;">Action</th>
                </tr>
              </thead>
              <tbody>
                @for (s of sites; track s.id) {
                  <tr>
                    <td>
                      <div style="display: flex; align-items: center; gap: 0.65rem;">
                        <span style="display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 8px; background: #eef4ff; color: #103778; flex-shrink: 0;">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                        </span>
                        <strong>{{ s.nom }}</strong>
                      </div>
                    </td>
                    <td><span class="text-muted">{{ s.adresse || '—' }}</span></td>
                    <td>
                      <span class="badge" [class.badge-success]="s.actif" [class.badge-secondary]="!s.actif">
                        {{ s.actif ? 'Actif' : 'Inactif' }}
                      </span>
                    </td>
                    <td class="text-right">
                      <div class="action-flex" style="justify-content: flex-end; gap: 0.4rem;">
                        <button class="btn btn-outline btn-xs" (click)="editSite(s)" title="Modifier">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg>
                        </button>
                        <button class="btn btn-danger btn-xs" (click)="deleteSite(s)" title="Supprimer le site">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- ===================== ONGLET PERMISSIONS ===================== -->
      @if (activeTab === 'permissions') {
        @if (!selectedProfil) {
          <div class="card">
            <div class="card-header">
              <div class="card-title" style="display:flex; align-items:center; gap:0.5rem;">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.5 7.3 12 12l-8.5-4.7"/><path d="M12 22V12"/><path d="m20.5 16.7-8.5 4.7-8.5-4.7"/><path d="m3.5 7.3 8.5-4.7 8.5 4.7-8.5 4.7-8.5-4.7Z"/></svg>
                Profils de Permissions
              </div>
              <button class="btn btn-primary btn-sm" (click)="openCreateProfilModal()">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                Nouveau Profil
              </button>
            </div>
            <div class="table-responsive">
              <table class="custom-table profils-table">
                <colgroup>
                  <col style="width: 16%;">
                  <col style="width: 11%;">
                  <col style="width: 38%;">
                  <col style="width: 17%;">
                  <col style="width: 18%;">
                </colgroup>
                <thead>
                  <tr>
                    <th>Nom du Profil</th>
                    <th>Type</th>
                    <th>Description</th>
                    <th>Utilisateurs associés</th>
                    <th class="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  @for (p of profils; track p.id) {
                    <tr>
                      <td><strong>{{ p.nom }}</strong></td>
                      <td>
                        @if (p.systeme) {
                          <span class="badge badge-programme">Système</span>
                        } @else {
                          <span class="badge badge-secondary">Personnalisé</span>
                        }
                      </td>
                      <td class="text-muted">{{ p.description || '—' }}</td>
                      <td>
                        <span class="badge badge-solde">{{ p.nombreUtilisateurs }} compte(s)</span>
                      </td>
                      <td class="text-right">
                        <button class="btn btn-outline btn-xs" (click)="selectProfil(p)" title="Configurer les permissions">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
                          Gérer
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }

        @if (selectedProfil) {
          <div class="card profil-detail-card">
              <div class="card-header">
                <button type="button" class="btn btn-outline btn-sm" (click)="deselectProfil()" style="display:flex; align-items:center; gap:0.4rem;">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                  Retour aux profils
                </button>
                <div class="card-title" style="display:flex; align-items:center; gap:0.5rem;">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  {{ selectedProfil.nom }}
                </div>
                @if (!selectedProfil.systeme) {
                  <button class="btn btn-outline btn-sm" [disabled]="selectedProfil.nombreUtilisateurs > 0" [title]="selectedProfil.nombreUtilisateurs > 0 ? 'Réaffectez d\\'abord les comptes utilisant ce profil' : 'Supprimer ce profil'" (click)="deleteProfil()">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    Supprimer
                  </button>
                }
              </div>

              @if (selectedProfil.verrouille) {
                <div class="alert alert-info">
                  Le profil Administrateur garde toujours l'intégralité des permissions et ne peut pas être restreint, pour ne jamais bloquer un administrateur.
                </div>
              }

              @if (!selectedProfil.verrouille) {
                <div class="form-row" style="margin-bottom:1rem;">
                  <div class="form-group">
                    <label class="form-label">Nom du profil</label>
                    <input type="text" class="form-control" [(ngModel)]="profilForm.nom" name="profilNom" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Description</label>
                    <input type="text" class="form-control" [(ngModel)]="profilForm.description" name="profilDescription" />
                  </div>
                </div>
              }

              @if (profilError) {
                <div class="alert alert-danger">{{ profilError }}</div>
              }
              @if (profilSuccess) {
                <div class="alert alert-success">Profil enregistré.</div>
              }

              <div class="permissions-matrix">
                @for (module of modulesPermissions; track module.nom) {
                  <div class="card permission-module">
                    <div class="permission-module-title">{{ module.nom }}</div>
                    <div class="permission-module-items">
                      @for (perm of module.items; track perm.code) {
                        <label class="permission-check">
                          <input type="checkbox"
                                 [checked]="workingPermissionCodes.has(perm.code)"
                                 [disabled]="selectedProfil.verrouille"
                                 (change)="togglePermission(perm.code)" />
                          {{ perm.libelle }}
                        </label>
                      }
                    </div>
                  </div>
                }
              </div>

              @if (!selectedProfil.verrouille) {
                <button class="btn btn-primary btn-sm" style="margin-top:1rem;" [disabled]="savingProfil" (click)="saveProfil()">
                  {{ savingProfil ? 'Enregistrement...' : 'Enregistrer les permissions' }}
                </button>
              }
          </div>
        }
      }

      <!-- MODAL NOUVEAU PROFIL -->
      @if (showCreateProfilModal) {
        <div class="modal-backdrop">
          <div class="modal-content">
            <div class="modal-header">
              <h3>Nouveau Profil de Permissions</h3>
              <button class="btn btn-outline btn-sm" (click)="showCreateProfilModal = false">✕</button>
            </div>
            <form (ngSubmit)="createProfil()">
              <div class="modal-body">
                @if (createProfilError) {
                  <div class="alert alert-danger">{{ createProfilError }}</div>
                }
                <div class="form-group">
                  <label class="form-label">Nom du profil <span class="required">*</span></label>
                  <input type="text" class="form-control" [(ngModel)]="newProfilForm.nom" name="newProfilNom" required placeholder="Ex: Superviseur régional" />
                </div>
                <div class="form-group">
                  <label class="form-label">Description</label>
                  <textarea class="form-control" rows="2" [(ngModel)]="newProfilForm.description" name="newProfilDescription" placeholder="Rôle et responsabilités de ce profil"></textarea>
                </div>
                <p class="form-help">Les permissions se cochent ensuite, une fois le profil créé.</p>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="showCreateProfilModal = false">Annuler</button>
                <button type="submit" class="btn btn-primary">Créer</button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- MODAL CATEGORIE -->
      @if (showCatModal) {
        <div class="modal-backdrop">
          <div class="modal-content">
            <div class="modal-header">
              <h3 style="display:flex; align-items:center; gap:0.5rem;">
                @if (isEditCat) {
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg>
                } @else {
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                }
                {{ isEditCat ? 'Modifier la Catégorie' : 'Nouvelle Catégorie de Permis' }}
              </h3>
              <button class="btn btn-outline btn-sm" (click)="showCatModal = false">✕</button>
            </div>
            <form (ngSubmit)="saveCat()">
              <div class="modal-body">
                @if (catError) {
                  <div class="alert alert-danger">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    {{ catError }}
                  </div>
                }
                <div class="form-group">
                  <label class="form-label">Code Catégorie <span class="required">*</span></label>
                  <input type="text" class="form-control" [(ngModel)]="catForm.code" name="code" required placeholder="Ex: D" [disabled]="isEditCat" />
                </div>
                <div class="form-group">
                  <label class="form-label">Libellé <span class="required">*</span></label>
                  <input type="text" class="form-control" [(ngModel)]="catForm.libelle" name="libelle" required placeholder="Ex: Permis D Transport en commun" />
                </div>
                <div class="form-group">
                  <label class="form-label">Montant Formation (FCFA) <span class="required">*</span></label>
                  <input type="number" class="form-control" [(ngModel)]="catForm.montant" name="montant" required placeholder="Ex: 100000" />
                </div>
                <div class="form-group">
                  <label class="form-label">Frais d'examen (FCFA)</label>
                  <input type="number" class="form-control" [(ngModel)]="catForm.fraisExamen" name="fraisExamen" placeholder="Ex: 25000" />
                  <p class="form-help">Frais forfaitaires pour les épreuves d'examen associées à ce permis.</p>
                </div>
                <div class="form-group">
                  <label class="form-label">Description</label>
                  <textarea class="form-control" rows="2" [(ngModel)]="catForm.description" name="description"></textarea>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="showCatModal = false">Annuler</button>
                <button type="submit" class="btn btn-primary">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- MODAL SITE -->
      @if (showSiteModal) {
        <div class="modal-backdrop">
          <div class="modal-content">
            <div class="modal-header">
              <h3 style="display:flex; align-items:center; gap:0.5rem;">
                @if (isEditSite) {
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg>
                } @else {
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                }
                {{ isEditSite ? 'Modifier le Site' : 'Nouveau Site de Formation' }}
              </h3>
              <button class="btn btn-outline btn-sm" (click)="showSiteModal = false">✕</button>
            </div>
            <form (ngSubmit)="saveSite()">
              <div class="modal-body">
                @if (siteError) {
                  <div class="alert alert-danger">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    {{ siteError }}
                  </div>
                }
                <div class="form-group">
                  <label class="form-label">Nom du site <span class="required">*</span></label>
                  <input type="text" class="form-control" [(ngModel)]="siteForm.nom" name="nom" required placeholder="Ex: Site Marcory" />
                </div>
                <div class="form-group">
                  <label class="form-label">Adresse</label>
                  <textarea class="form-control" rows="2" [(ngModel)]="siteForm.adresse" name="adresse" placeholder="Ex: Rue du Commerce, Marcory, Abidjan"></textarea>
                </div>
                @if (isEditSite) {
                  <div class="form-group form-check">
                    <label class="form-label">
                      <input type="checkbox" [(ngModel)]="siteForm.actif" name="actif" /> Site actif
                    </label>
                  </div>
                }
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="showSiteModal = false">Annuler</button>
                <button type="submit" class="btn btn-primary">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
    `,
    changeDetection: ChangeDetectionStrategy.Eager,
    styles: [`
    .page-header-bar {
      margin-bottom: 1.5rem;
    }

    .text-right { text-align: right; }
    .text-success { color: #15803d; }
    .text-danger { color: #b91c1c; }

    /* Largeurs fixes par colonne (cf. colgroup) : empêche le tableau de dépasser la
       largeur de la carte et d'imposer un défilement horizontal, en laissant la
       colonne Description passer à la ligne plutôt que de s'étirer. */
    .profils-table {
      table-layout: fixed;
    }

    .profils-table td {
      word-break: break-word;
    }

    .profils-table td:last-child {
      white-space: normal;
    }

    .param-sections {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      margin-top: 0.5rem;
    }

    .param-section {
      background: #ffffff;
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: var(--radius-md, 10px);
      padding: 1.5rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
    }

    .param-section-header {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      margin-bottom: 1.35rem;
      padding-bottom: 0.85rem;
      border-bottom: 1px solid #f1f5f9;
    }

    .param-section-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: #eff6ff;
      color: #2563eb;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .param-section-title {
      margin: 0;
      font-size: 1.05rem;
      font-weight: 700;
      color: var(--text-main, #0f172a);
      letter-spacing: -0.2px;
    }

    .param-section-subtitle {
      margin: 0.2rem 0 0;
      font-size: 0.82rem;
      color: var(--text-muted, #64748b);
    }

    .identite-brand-grid {
      display: grid;
      grid-template-columns: 240px 1fr;
      gap: 2rem;
      align-items: start;
    }

    @media (max-width: 820px) {
      .identite-brand-grid {
        grid-template-columns: 1fr;
      }
    }

    .logo-uploader-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 0.85rem;
      padding: 1.25rem;
      border: 1.5px dashed #cbd5e1;
      border-radius: 10px;
      background: #f8fafc;
    }

    .logo-preview-frame {
      width: 120px;
      height: 120px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 10px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      overflow: hidden;
      padding: 6px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }

    .logo-preview-frame img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    .logo-uploader-box input[type="file"] {
      font-size: 0.8rem;
      max-width: 100%;
    }

    .identite-fields {
      display: flex;
      flex-direction: column;
      gap: 1.15rem;
      min-width: 0;
    }

    .form-help { color: var(--text-muted); font-size: 0.8rem; margin: 0.2rem 0 0; }
    .tarifs-examens-form { display: flex; flex-direction: column; gap: 0.85rem; margin-bottom: 0.75rem; }

    .param-actions-bar {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 1rem;
      padding: 1.25rem 0 0.5rem;
    }

    .profils-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 1rem;
    }
    .profil-tile {
      display: flex; flex-direction: column; align-items: flex-start; gap: 0.35rem;
      padding: 1rem 1.1rem; border-radius: var(--radius-sm, 8px); cursor: pointer;
      border: 1px solid var(--border-color, #e2e8f0);
      background: var(--bg-card, #fff);
      font: inherit; text-align: left; width: 100%;
    }
    .profil-tile:hover { background: var(--bg-sidebar-hover, #f1f5f9); border-color: #bfdbfe; }
    .profil-item-main { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; width: 100%; }
    .profil-detail-card .card-header { flex-wrap: wrap; gap: 0.75rem; }
    .permissions-matrix {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.25rem;
      align-items: start;
    }
    .permission-module { padding: 1.1rem 1.3rem; }
    .permission-module-title { font-weight: 700; margin-bottom: 0.85rem; color: var(--text-main); }
    .permission-module-items { display: flex; flex-direction: column; gap: 0.65rem; }
    .permission-check { display: flex; align-items: center; gap: 0.6rem; font-size: 0.9rem; font-weight: 400; cursor: pointer; }
  `]
})
export class ParametrageComponent implements OnInit {
  activeTab: OngletParametrage = 'identite';

  categories: CategoriePermis[] = [];
  sites: Site[] = [];
  statsSites: SiteStat[] = [];

  showCatModal = false;
  isEditCat = false;
  selectedCatId: number | null = null;
  catForm: any = { code: '', libelle: '', montant: null, description: '', actif: true };
  catError = '';

  showSiteModal = false;
  isEditSite = false;
  selectedSiteId: number | null = null;
  siteForm: any = { nom: '', adresse: '', actif: true };
  siteError = '';

  identiteForm: Identite = {
    logoData: null, imageConnexion: null, imageConnexionAjustement: 'cover',
    nomEtablissement: 'BARAKA AUTO MOTO ECOLE',
    slogan: 'Plateforme Intégrée de Gestion & Formation',
    activites: 'FORMATION- ASSISTANCE ET PRESTATIONS DIVERSES EN SECURITE ROUTIERE - IMPORT EXPORT',
    codeEtablissement: 'AE 206',
    devise: '« Juste conduire »',
    telephone: '76 15 97 72 – 53 58 26 01 – 79 09 33 52',
    email: '',
    adresseSiege: 'Secteur 15, Ouagadougou, Burkina Faso',
    numeroAgrement: 'N° 2026-0428-MATM/SG/DGTTM',
    dateAgrement: '2026-07-30',
    rccm: 'BF-OUA-01-2024 B13-17114',
    ifu: '00253566L',
    numeroPatente: '',
    boitePostale: '',
    nomDirigeant: '',
    comptePaiement: '',
    mentionLegalePied: 'Autorisation d\'exploitation N° 2026-0428-MATM/SG/DGTTM du 30/07/2026 — RCCM : BF-OUA-01-2024 B13-17114 — IFU n° : 00253566L'
  };
  identiteError = '';
  identiteSuccess = false;
  savingIdentite = false;

  tarifsForm: any = { prixExamenCode: 0, prixExamenCreneau: 0, prixExamenCirculation: 0 };
  tarifsError = '';
  tarifsSuccess = false;
  savingTarifs = false;

  profils: Profil[] = [];
  permissionsCatalogue: PermissionCatalogue[] = [];
  selectedProfil: Profil | null = null;
  workingPermissionCodes: Set<string> = new Set();
  profilForm: { nom: string; description: string } = { nom: '', description: '' };
  profilError = '';
  profilSuccess = false;
  savingProfil = false;

  showCreateProfilModal = false;
  newProfilForm: { nom: string; description: string } = { nom: '', description: '' };
  createProfilError = '';

  get modulesPermissions(): { nom: string; items: PermissionCatalogue[] }[] {
    const parModule = new Map<string, PermissionCatalogue[]>();
    for (const p of this.permissionsCatalogue) {
      if (!parModule.has(p.module)) parModule.set(p.module, []);
      parModule.get(p.module)!.push(p);
    }
    return Array.from(parModule.entries()).map(([nom, items]) => ({ nom, items }));
  }

  constructor(private apiService: ApiService, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.loadData();
    // Ouvre directement le bon onglet quand on arrive depuis le sous-menu de la barre
    // latérale (?tab=...) ; s'abonne (plutôt qu'un simple snapshot) car Angular réutilise
    // cette même instance de composant en changeant seulement les query params.
    this.route.queryParams.subscribe(params => {
      const tab = params['tab'];
      if (ONGLETS_VALIDES.includes(tab)) {
        this.activeTab = tab;
      }
    });
  }

  /** Remplace la barre d'onglets (retirée, redondante avec le sous-menu de la barre
   *  latérale) : précise quand même quelle section est affichée. */
  sousTitrePourOnglet(): string {
    switch (this.activeTab) {
      case 'identite': return "Logo, nom et coordonnées de l'auto-école";
      case 'categories': return 'Catégories de permis proposées et leur tarif';
      case 'sites': return 'Sites de formation de l\'auto-école';
      case 'permissions': return "Permissions accordées à chaque profil d'utilisateur";
    }
  }

  loadData(): void {
    this.apiService.getCategories().subscribe({ next: (res) => this.categories = res });
    this.apiService.getSites().subscribe({ next: (res) => this.sites = res });
    this.apiService.getStatistiquesSites().subscribe({ next: (res) => this.statsSites = res });
    this.apiService.getIdentite().subscribe({
      next: (res) => {
        this.identiteForm = {
          ...this.identiteForm,
          ...res,
          nomEtablissement: res.nomEtablissement || this.identiteForm.nomEtablissement,
          activites: res.activites || this.identiteForm.activites,
          codeEtablissement: res.codeEtablissement || this.identiteForm.codeEtablissement,
          devise: res.devise || this.identiteForm.devise,
          telephone: res.telephone || this.identiteForm.telephone,
          adresseSiege: res.adresseSiege || this.identiteForm.adresseSiege,
          numeroAgrement: res.numeroAgrement || this.identiteForm.numeroAgrement,
          dateAgrement: res.dateAgrement || this.identiteForm.dateAgrement,
          rccm: res.rccm || this.identiteForm.rccm,
          ifu: res.ifu || this.identiteForm.ifu,
          mentionLegalePied: res.mentionLegalePied || this.identiteForm.mentionLegalePied
        };
      }
    });
    this.apiService.getTarifsExamens().subscribe({ next: (res) => this.tarifsForm = { ...res } });
    this.apiService.getPermissionsCatalogue().subscribe({ next: (res) => this.permissionsCatalogue = res });
    this.loadProfils();
  }

  loadProfils(): void {
    this.apiService.getProfils().subscribe({
      next: (res) => {
        this.profils = res;
        if (this.selectedProfil) {
          const rafraichi = res.find(p => p.id === this.selectedProfil!.id) || null;
          this.selectedProfil = rafraichi;
          if (rafraichi) {
            this.workingPermissionCodes = new Set(rafraichi.permissionCodes);
            this.profilForm = { nom: rafraichi.nom, description: rafraichi.description || '' };
          }
        }
      }
    });
  }

  selectProfil(p: Profil): void {
    this.selectedProfil = p;
    this.workingPermissionCodes = new Set(p.permissionCodes);
    this.profilForm = { nom: p.nom, description: p.description || '' };
    this.profilError = '';
    this.profilSuccess = false;
  }

  deselectProfil(): void {
    this.selectedProfil = null;
  }

  togglePermission(code: string): void {
    if (this.workingPermissionCodes.has(code)) {
      this.workingPermissionCodes.delete(code);
    } else {
      this.workingPermissionCodes.add(code);
    }
  }

  saveProfil(): void {
    if (!this.selectedProfil) return;
    this.profilError = '';
    this.profilSuccess = false;
    this.savingProfil = true;
    const payload = {
      nom: this.profilForm.nom,
      description: this.profilForm.description,
      permissionCodes: Array.from(this.workingPermissionCodes)
    };
    this.apiService.updateProfil(this.selectedProfil.id, payload).subscribe({
      next: () => {
        this.savingProfil = false;
        this.profilSuccess = true;
        this.loadProfils();
      },
      error: (err) => {
        this.savingProfil = false;
        this.profilError = extraireMessageErreur(err, "Erreur lors de l'enregistrement du profil.");
      }
    });
  }

  deleteProfil(): void {
    if (!this.selectedProfil || this.selectedProfil.nombreUtilisateurs > 0) return;
    if (!confirm(`Supprimer définitivement le profil "${this.selectedProfil.nom}" ?`)) return;
    this.apiService.deleteProfil(this.selectedProfil.id).subscribe({
      next: () => {
        this.selectedProfil = null;
        this.loadProfils();
      },
      error: (err) => this.profilError = extraireMessageErreur(err, 'Erreur lors de la suppression du profil.')
    });
  }

  openCreateProfilModal(): void {
    this.newProfilForm = { nom: '', description: '' };
    this.createProfilError = '';
    this.showCreateProfilModal = true;
  }

  createProfil(): void {
    this.createProfilError = '';
    this.apiService.createProfil({ ...this.newProfilForm, permissionCodes: [] }).subscribe({
      next: (profil) => {
        this.showCreateProfilModal = false;
        this.loadProfils();
        this.selectProfil(profil);
      },
      error: (err) => this.createProfilError = extraireMessageErreur(err, 'Erreur lors de la création du profil.')
    });
  }

  saveTarifsExamens(): void {
    this.tarifsError = '';
    this.tarifsSuccess = false;
    this.savingTarifs = true;
    this.apiService.updateTarifsExamens(this.tarifsForm).subscribe({
      next: (res) => {
        this.savingTarifs = false;
        this.tarifsForm = { ...res };
        this.tarifsSuccess = true;
      },
      error: (err) => {
        this.savingTarifs = false;
        this.tarifsError = extraireMessageErreur(err, "Erreur lors de l'enregistrement des tarifs.");
      }
    });
  }

  /** Formats acceptés par le backend (voir ConfigurationController.validateImage) : un
   *  fichier hors de cette liste (HEIC, GIF, capture d'écran exotique, etc.) est rejeté ici
   *  avec un message clair, plutôt que de découvrir l'échec seulement à l'enregistrement. */
  private readonly TYPES_IMAGE_ACCEPTES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!this.TYPES_IMAGE_ACCEPTES.includes(file.type)) {
      this.identiteError = `Format d'image non pris en charge pour le logo (${file.type || 'inconnu'}). Utilisez un fichier JPG, PNG ou WebP.`;
      input.value = '';
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      this.identiteError = 'Le logo ne doit pas dépasser 2 Mo.';
      input.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      this.identiteForm.logoData = reader.result as string;
      this.identiteError = '';
    };
    reader.readAsDataURL(file);
  }

  onImageConnexionSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!this.TYPES_IMAGE_ACCEPTES.includes(file.type)) {
      this.identiteError = `Format d'image non pris en charge pour l'image de connexion (${file.type || 'inconnu'}). Utilisez un fichier JPG, PNG ou WebP.`;
      input.value = '';
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      this.identiteError = "L'image de connexion ne doit pas dépasser 3 Mo. Compressez-la avant de la téléverser.";
      input.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      this.identiteForm.imageConnexion = reader.result as string;
      this.identiteError = '';
    };
    reader.readAsDataURL(file);
  }

  retirerImageConnexion(): void {
    this.identiteForm.imageConnexion = null;
  }

  saveIdentite(): void {
    this.identiteError = '';
    this.identiteSuccess = false;
    this.savingIdentite = true;
    this.apiService.updateIdentite(this.identiteForm).subscribe({
      next: (res) => {
        this.savingIdentite = false;
        this.identiteForm = { ...res };
        this.identiteSuccess = true;
      },
      error: (err) => {
        this.savingIdentite = false;
        if (err.status === 0) {
          this.identiteError = 'Impossible de contacter le serveur, ou les images sont trop volumineuses pour la connexion actuelle. Réessayez avec des images plus légères.';
        } else {
          this.identiteError = extraireMessageErreur(err, "Erreur lors de l'enregistrement de l'identité.");
        }
      }
    });
  }

  openCatModal(): void {
    this.isEditCat = false;
    this.selectedCatId = null;
    this.catForm = { code: '', libelle: '', montant: null, fraisExamen: null, description: '', actif: true };
    this.catError = '';
    this.showCatModal = true;
  }

  editCat(c: CategoriePermis): void {
    this.isEditCat = true;
    this.selectedCatId = c.id;
    this.catForm = { code: c.code, libelle: c.libelle, montant: c.montant, fraisExamen: c.fraisExamen, description: c.description, actif: c.actif };
    this.catError = '';
    this.showCatModal = true;
  }

  saveCat(): void {
    this.catError = '';
    if (this.isEditCat && this.selectedCatId) {
      this.apiService.updateCategorie(this.selectedCatId, this.catForm).subscribe({
        next: () => {
          this.showCatModal = false;
          this.loadData();
        },
        error: (err) => this.catError = extraireMessageErreur(err, 'Erreur lors de l’enregistrement de la catégorie.')
      });
    } else {
      this.apiService.createCategorie(this.catForm).subscribe({
        next: () => {
          this.showCatModal = false;
          this.loadData();
        },
        error: (err) => this.catError = extraireMessageErreur(err, 'Erreur lors de l’enregistrement de la catégorie.')
      });
    }
  }

  openSiteModal(): void {
    this.isEditSite = false;
    this.selectedSiteId = null;
    this.siteForm = { nom: '', adresse: '', actif: true };
    this.siteError = '';
    this.showSiteModal = true;
  }

  editSite(s: Site): void {
    this.isEditSite = true;
    this.selectedSiteId = s.id;
    this.siteForm = { nom: s.nom, adresse: s.adresse, actif: s.actif };
    this.siteError = '';
    this.showSiteModal = true;
  }

  saveSite(): void {
    this.siteError = '';
    if (this.isEditSite && this.selectedSiteId) {
      this.apiService.updateSite(this.selectedSiteId, this.siteForm).subscribe({
        next: () => {
          this.showSiteModal = false;
          this.loadData();
        },
        error: (err) => this.siteError = extraireMessageErreur(err, 'Erreur lors de l’enregistrement du site.')
      });
    } else {
      this.apiService.createSite(this.siteForm).subscribe({
        next: () => {
          this.showSiteModal = false;
          this.loadData();
        },
        error: (err) => this.siteError = extraireMessageErreur(err, 'Erreur lors de l’enregistrement du site.')
      });
    }
  }

  deleteCat(c: CategoriePermis): void {
    if (!confirm(`Supprimer définitivement la catégorie de permis "${c.code} - ${c.libelle}" ?`)) return;
    this.apiService.deleteCategorie(c.id).subscribe({
      next: () => this.loadData(),
      error: (err) => alert(extraireMessageErreur(err, 'Erreur lors de la suppression de la catégorie.'))
    });
  }

  deleteSite(s: Site): void {
    if (!confirm(`Supprimer définitivement le site de formation "${s.nom}" ?`)) return;
    this.apiService.deleteSite(s.id).subscribe({
      next: () => this.loadData(),
      error: (err) => alert(extraireMessageErreur(err, 'Erreur lors de la suppression du site.'))
    });
  }

  exportCategoriesPdf(): void {
    this.apiService.downloadBlob(this.apiService.getCategoriesPdfUrl(), 'categories_permis.pdf');
  }

  imprimerCategories(): void {
    this.apiService.printBlob(this.apiService.getCategoriesPdfUrl());
  }

  exportCategoriesExcel(): void {
    this.apiService.downloadBlob(this.apiService.getCategoriesExcelUrl(), 'categories_permis.xlsx');
  }

  exportSitesPdf(): void {
    this.apiService.downloadBlob(this.apiService.getSitesPdfUrl(), 'sites_formation.pdf');
  }

  imprimerSites(): void {
    this.apiService.printBlob(this.apiService.getSitesPdfUrl());
  }

  exportSitesExcel(): void {
    this.apiService.downloadBlob(this.apiService.getSitesExcelUrl(), 'sites_formation.xlsx');
  }
}
