import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ClientDatabaseService } from '../shared/services/client-database.service';
import { PieceData } from '../shared/services/project-data.service';
import { ProjectDataService } from '../shared/services/project-data.service';

@Component({
  selector: 'app-rapport-page-two',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="screen">
      @for (piece of remainingPieces; track piece.id) {
        <h3>Pièce : {{ piece.id }}</h3>
        <form class="form-grid compact">
          <label>Quel est le nom de la pièce ? <input type="text" [value]="piece.nom" disabled /></label>
          <label>Quelle est la longueur de la pièce ? <input type="text" [value]="piece.longueur" disabled /></label>
          <label>Quelle est la largeur de la pièce ? <input type="text" [value]="piece.largeur" disabled /></label>
          <label>Quelle est la hauteur sous-plafond ? <input type="text" [value]="piece.hauteur" disabled /></label>
          <label
            >Quelle est la température de confort ? <input type="text" [value]="piece.temperatureConfort" disabled
          /></label>
        </form>

        <div class="result blue">PuissanceP = {{ piece.puissance }}</div>
      }

      <div class="line-actions footer-space">
        <a class="btn prev" routerLink="/rapport" [queryParams]="{ ref: clientRef }">< Rapport</a>
        <button type="button" class="btn next" [disabled]="isExporting()" (click)="onExportToBdd()">
          {{ isExporting() ? 'Export en cours...' : 'Export vers la bdd >' }}
        </button>
      </div>

      @if (statusMessage()) {
        <p class="status-line">{{ statusMessage() }}</p>
      }
    </section>
  `,
})
export class RapportPageTwoComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly projectData = inject(ProjectDataService);
  private readonly clientDatabase = inject(ClientDatabaseService);

  readonly statusMessage = signal('');
  readonly isExporting = signal(false);
  readonly pieces = signal<PieceData[]>([]);

  get clientRef(): string {
    return this.route.snapshot.queryParamMap.get('ref')?.trim() ?? '';
  }

  get remainingPieces() {
    return this.pieces().slice(2);
  }

  async ngOnInit(): Promise<void> {
    await this.hydratePieces();

    if (!this.remainingPieces.length) {
      void this.router.navigate(['/rapport'], {
        queryParams: { ref: this.clientRef || undefined },
      });
    }
  }

  async onExportToBdd(): Promise<void> {
    if (this.isExporting()) {
      return;
    }

    this.statusMessage.set('');
    this.isExporting.set(true);

    try {
      const refToExport = await this.resolveClientRef();

      if (!refToExport) {
        this.statusMessage.set('Aucun client trouvé pour réaliser l\'export.');
        return;
      }

      await this.clientDatabase.exportDossier(refToExport, this.projectData.getMaisonData(), this.projectData.getPieces());
      this.statusMessage.set('Export vers la BDD effectué avec succès.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Échec de l\'export vers la BDD.';
      this.statusMessage.set(message);
    } finally {
      this.isExporting.set(false);
    }
  }

  private async resolveClientRef(): Promise<string> {
    if (this.clientRef) {
      return this.clientRef;
    }

    const clients = await this.clientDatabase.getClients();
    return clients[0]?.ref?.trim() ?? '';
  }

  private async hydratePieces(): Promise<void> {
    const ref = this.clientRef;

    if (!ref) {
      this.pieces.set(this.projectData.getPieces());
      return;
    }

    try {
      const report = await this.clientDatabase.getReportByRef(ref);
      this.pieces.set(report.pieces);
    } catch {
      this.pieces.set(this.projectData.getPieces());
    }
  }
}
