import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ClientDatabaseService, ClientRecord } from '../shared/services/client-database.service';
import { MaisonData, PieceData } from '../shared/services/project-data.service';
import { ProjectDataService } from '../shared/services/project-data.service';

@Component({
  selector: 'app-rapport-page',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="screen">
      <h1 class="title">Rapport d'expertise</h1>

      <div class="two-col">
        <div>
          <h3>Votre client</h3>
          <form class="form-grid compact">
            <label>Nom <input type="text" [value]="client().nom" disabled /></label>
            <label>Prénom <input type="text" [value]="client().prenom" disabled /></label>
            <label>Numéro <input type="text" [value]="client().numero" disabled /></label>
            <label>Rue <input type="text" [value]="client().rue" disabled /></label>
            <label>Code Postal <input type="text" [value]="client().cp" disabled /></label>
            <label>Ville <input type="text" [value]="client().ville" disabled /></label>
            <label>Tél. <input type="text" [value]="client().tel" disabled /></label>
            <label>mail <input type="text" [value]="client().mail" disabled /></label>
          </form>
        </div>

        <div>
          <h3>La maison</h3>
          <form class="form-grid compact">
            <label>Isolation <input type="text" [value]="maison.isolation" disabled /></label>
            <label>Température de base <input type="text" [value]="maison.temperatureBase" disabled /></label>
            <label
              >Hauteur sous-plafond <input type="text" [value]="maison.hauteurSousPlafond" disabled
            /></label>
            <label>Nombre de pièces <input type="text" [value]="maison.nombrePieces" disabled /></label>
          </form>
          <div class="result blue">PuissanceM = {{ totalPuissance() }}</div>
        </div>
      </div>

      <div class="two-col">
        @for (piece of firstTwoPieces; track piece.id) {
          <div>
            <h3>Pièce : {{ piece.id }}</h3>
          <form class="form-grid compact">
            <label>Nom <input type="text" [value]="piece.nom" disabled /></label>
            <label>Longueur <input type="text" [value]="piece.longueur" disabled /></label>
            <label>Largeur <input type="text" [value]="piece.largeur" disabled /></label>
            <label>Hauteur <input type="text" [value]="piece.hauteur" disabled /></label>
            <label>Température confort <input type="text" [value]="piece.temperatureConfort" disabled /></label>
          </form>
          <div class="result blue">PuissanceP = {{ piece.puissance }}</div>
          </div>
        } @empty {
          <p>Aucune pièce enregistrée pour le rapport.</p>
        }
      </div>

      <div class="line-actions">
        <a class="btn prev" [routerLink]="lastPieceLink">< Pièce {{ lastPieceId }}</a>
        @if (hasSecondPage) {
          <a class="btn next" routerLink="/rapport/page-2" [queryParams]="{ ref: client().ref }">Page 2 rapport ></a>
        }
      </div>
    </section>
  `,
})
export class RapportPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly projectData = inject(ProjectDataService);
  private readonly clientDatabase = inject(ClientDatabaseService);

  readonly client = signal<ClientRecord>({
    id: 0,
    nom: '',
    prenom: '',
    numero: '',
    rue: '',
    ref: '',
    date: '',
    ville: '',
    cp: '',
    tel: '',
    mail: '',
  });

  readonly pieces = signal<PieceData[]>([]);
  readonly maisonFromReport = signal<MaisonData | null>(null);

  readonly totalPuissance = computed(() => {
    return this.pieces().reduce((sum, piece) => sum + piece.puissance, 0);
  });

  async ngOnInit(): Promise<void> {
    await this.hydrateReportState();
  }

  get maison() {
    return this.maisonFromReport() ?? this.projectData.getMaisonData();
  }

  get allPieces() {
    return this.pieces();
  }

  get firstTwoPieces() {
    return this.allPieces.slice(0, 2);
  }

  get hasSecondPage(): boolean {
    return this.allPieces.length > 2;
  }

  get lastPieceId(): number {
    return this.allPieces.length ? this.allPieces[this.allPieces.length - 1].id : 1;
  }

  get lastPieceLink(): string {
    return `/piece/${this.lastPieceId}`;
  }

  private async loadClient(): Promise<void> {
    const ref = this.route.snapshot.queryParamMap.get('ref')?.trim();

    try {
      const clients = await this.clientDatabase.getClients();

      if (!clients.length) {
        return;
      }

      const selected = ref ? clients.find((item) => item.ref === ref) ?? clients[0] : clients[0];
      this.client.set(selected);
    } catch {
      this.client.set({
        id: 0,
        nom: '',
        prenom: '',
        numero: '',
        rue: '',
        ref: '',
        date: '',
        ville: '',
        cp: '',
        tel: '',
        mail: '',
      });
    }
  }

  private async hydrateReportState(): Promise<void> {
    const ref = this.route.snapshot.queryParamMap.get('ref')?.trim() ?? '';

    if (!ref) {
      this.maisonFromReport.set(null);
      this.pieces.set(this.projectData.getPieces());
      await this.loadClient();
      return;
    }

    try {
      const report = await this.clientDatabase.getReportByRef(ref);

      this.client.set(report.client);
      this.maisonFromReport.set({
        isolation: report.maison.isolation,
        temperatureBase: report.maison.temperatureBase,
        hauteurSousPlafond: report.maison.hauteurSousPlafond,
        nombrePieces: report.maison.nombrePieces,
      });
      this.pieces.set(report.pieces);
    } catch {
      this.maisonFromReport.set(null);
      this.pieces.set(this.projectData.getPieces());
      await this.loadClient();
    }
  }
}
