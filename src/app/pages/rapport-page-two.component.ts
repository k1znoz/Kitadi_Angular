import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
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
        <a class="btn prev" routerLink="/rapport">< Rapport</a>
        <button type="button" class="btn next">Export vers la bdd ></button>
      </div>
    </section>
  `,
})
export class RapportPageTwoComponent {
  private readonly projectData = inject(ProjectDataService);

  get remainingPieces() {
    return this.projectData.getPieces().slice(2);
  }
}
