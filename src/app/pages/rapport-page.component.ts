import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
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
            <label>Nom <input type="text" disabled /></label>
            <label>Prénom <input type="text" disabled /></label>
            <label>Numéro <input type="text" disabled /></label>
            <label>Rue <input type="text" disabled /></label>
            <label>Code Postal <input type="text" disabled /></label>
            <label>Ville <input type="text" disabled /></label>
            <label>Tél. <input type="text" disabled /></label>
            <label>mail <input type="text" disabled /></label>
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
          <div class="result blue">PuissanceM = {{ totalPuissance }}</div>
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
        }
      </div>

      <div class="line-actions">
        <a class="btn prev" [routerLink]="lastPieceLink">< Pièce {{ lastPieceId }}</a>
        <a class="btn next" routerLink="/rapport/page-2">Page 2 rapport ></a>
      </div>
    </section>
  `,
})
export class RapportPageComponent {
  private readonly projectData = inject(ProjectDataService);

  get maison() {
    return this.projectData.getMaisonData();
  }

  get allPieces() {
    return this.projectData.getPieces();
  }

  get firstTwoPieces() {
    return this.allPieces.slice(0, 2);
  }

  get totalPuissance(): number {
    return this.projectData.getTotalPuissanceMaison();
  }

  get lastPieceId(): number {
    return this.allPieces.length ? this.allPieces[this.allPieces.length - 1].id : 1;
  }

  get lastPieceLink(): string {
    return `/piece/${this.lastPieceId}`;
  }
}
