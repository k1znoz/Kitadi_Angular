import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ClientDatabaseService } from '../shared/services/client-database.service';
import { LettersOnlyDirective } from '../shared/directives/letters-only.directive';
import { NumbersOnlyDirective } from '../shared/directives/numbers-only.directive';
import { ProjectDataService } from '../shared/services/project-data.service';

@Component({
  selector: 'app-piece-page',
  standalone: true,
  imports: [FormsModule, RouterLink, LettersOnlyDirective, NumbersOnlyDirective],
  template: `
    <section class="screen">
      <h1 class="title">Pièce : {{ pieceNumber }}</h1>
      <p class="subtitle">// autocomplete en fonction question</p>

      <form class="form-grid">
        <label
          >Quel est le nom de la pièce ?
          <input type="text" lettersOnly [(ngModel)]="nom" name="nom" (ngModelChange)="savePieceData()"
        /></label>
        <label
          >Quelle est la longueur de la pièce ?
          <input
            type="text"
            numbersOnly
            inputmode="numeric"
            [(ngModel)]="longueur"
            name="longueur"
            (ngModelChange)="savePieceData()"
        /></label>
        <label
          >Quelle est la largeur de la pièce ?
          <input
            type="text"
            numbersOnly
            inputmode="numeric"
            [(ngModel)]="largeur"
            name="largeur"
            (ngModelChange)="savePieceData()"
        /></label>
        <label
          >Quelle est la hauteur sous-plafond ?
          <input
            type="text"
            numbersOnly
            inputmode="numeric"
            [(ngModel)]="hauteur"
            name="hauteur"
            (ngModelChange)="savePieceData()"
        /></label>
        <label
          >Quelle est la température de confort ?
          <input
            type="text"
            numbersOnly
            inputmode="numeric"
            [(ngModel)]="temperatureConfort"
            name="temperatureConfort"
            (ngModelChange)="savePieceData()"
        /></label>
      </form>

      <div class="result red">DeltaT = {{ deltaT }} ({{ temperatureConfort || 0 }} - {{ temperatureBase }})</div>
      <div class="result blue">PuissanceP = {{ puissanceP }}</div>

      <div class="line-actions">
        <a class="btn prev" [routerLink]="previousLink">< {{ previousLabel }}</a>
        <div class="piece-actions">
          <a class="btn next" [routerLink]="nextPieceLink">{{ nextPieceLabel }} ></a>
          <a class="btn next" routerLink="/rapport">Rapport d'expertise ></a>
        </div>
      </div>

      <p class="tutorial-label">Tuto formulaire</p>
      <div class="tutorial-box"></div>
    </section>
  `,
  styles: `
    .piece-actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      justify-content: flex-end;
    }
  `,
})
export class PiecePageComponent {
  private route = inject(ActivatedRoute);
  private readonly projectData = inject(ProjectDataService);
  private readonly clientDatabase = inject(ClientDatabaseService);

  pieceNumber = 1;
  nom = '';
  longueur = '';
  largeur = '';
  hauteur = '';
  temperatureConfort = '';

  constructor() {
    this.route.paramMap.subscribe((params) => {
      this.pieceNumber = Number(params.get('id') ?? 1);
      this.loadPieceData();
    });
  }

  get temperatureBase(): number {
    return this.projectData.getMaisonData().temperatureBase;
  }

  get gCoefficient(): number {
    return this.projectData.getMaisonData().g;
  }

  get deltaT(): number {
    return (Number(this.temperatureConfort) || 0) - this.temperatureBase;
  }

  get puissanceP(): number {
    return this.gCoefficient * (Number(this.longueur) || 0) * (Number(this.largeur) || 0) * (Number(this.hauteur) || 0) * this.deltaT;
  }

  get previousLabel(): string {
    return this.pieceNumber === 1 ? 'La maison' : `Pièce i${this.pieceNumber - 1}`;
  }

  get previousLink(): string {
    return this.pieceNumber === 1 ? '/maison' : `/piece/${this.pieceNumber - 1}`;
  }

  get nextPieceLabel(): string {
    return `Pièce ${this.pieceNumber + 1}`;
  }

  get nextPieceLink(): string {
    return `/piece/${this.pieceNumber + 1}`;
  }

  async savePieceData(): Promise<void> {
    this.projectData.upsertPiece({
      id: this.pieceNumber,
      nom: this.nom,
      longueur: Number(this.longueur) || 0,
      largeur: Number(this.largeur) || 0,
      hauteur: Number(this.hauteur) || 0,
      temperatureConfort: Number(this.temperatureConfort) || 0,
    });

    await this.syncDossierToDatabase();
  }

  private async syncDossierToDatabase(): Promise<void> {
    const clientRef = this.projectData.getActiveClientRef();

    if (!clientRef) {
      return;
    }

    try {
      await this.clientDatabase.exportDossier(clientRef, this.projectData.getMaisonData(), this.projectData.getPieces());
    } catch {
      return;
    }
  }

  private loadPieceData(): void {
    const piece = this.projectData.getPiece(this.pieceNumber);
    const defaultHeight = this.projectData.getDefaultPieceHeight();

    this.nom = piece?.nom ?? '';
    this.longueur = piece?.longueur ? String(piece.longueur) : '';
    this.largeur = piece?.largeur ? String(piece.largeur) : '';
    this.hauteur = piece?.hauteur ? String(piece.hauteur) : defaultHeight ? String(defaultHeight) : '';
    this.temperatureConfort = piece?.temperatureConfort ? String(piece.temperatureConfort) : '';
  }
}
