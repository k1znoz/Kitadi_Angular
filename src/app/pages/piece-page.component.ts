import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LettersOnlyDirective } from '../shared/directives/letters-only.directive';
import { NumbersOnlyDirective } from '../shared/directives/numbers-only.directive';

@Component({
  selector: 'app-piece-page',
  standalone: true,
  imports: [RouterLink, LettersOnlyDirective, NumbersOnlyDirective],
  template: `
    <section class="screen">
      <h1 class="title">Pièce : {{ pieceNumber }}</h1>
      <p class="subtitle">// autocomplete en fonction question</p>

      <form class="form-grid">
        <label>Quel est le nom de la pièce ? <input type="text" lettersOnly /></label>
        <label>Quelle est la longueur de la pièce ? <input type="text" numbersOnly inputmode="numeric" /></label>
        <label>Quelle est la largeur de la pièce ? <input type="text" numbersOnly inputmode="numeric" /></label>
        <label>Quelle est la hauteur sous-plafond ? <input type="text" numbersOnly inputmode="numeric" /></label>
        <label>Quelle est la température de confort ? <input type="text" numbersOnly inputmode="numeric" /></label>
      </form>

      <div class="result red">Delta des Températures — DeltaT = tc - tb</div>
      <div class="result blue">PuissanceP = g x (longueur x largeur x hauteur) x deltaT</div>

      <div class="line-actions">
        <a class="btn prev" [routerLink]="previousLink">< {{ previousLabel }}</a>
        <a class="btn next" [routerLink]="nextLink">{{ nextLabel }} ></a>
      </div>

      <p class="tutorial-label">Tuto formulaire</p>
      <div class="tutorial-box"></div>
    </section>
  `,
})
export class PiecePageComponent {
  private route = inject(ActivatedRoute);

  pieceNumber = Number(this.route.snapshot.paramMap.get('id') ?? 1);

  get previousLabel(): string {
    return this.pieceNumber === 1 ? 'La maison' : `Pièce i${this.pieceNumber - 1}`;
  }

  get previousLink(): string {
    return this.pieceNumber === 1 ? '/maison' : `/piece/${this.pieceNumber - 1}`;
  }

  get nextLabel(): string {
    return this.pieceNumber >= 2 ? 'Rapport' : `Pièce i${this.pieceNumber + 1}`;
  }

  get nextLink(): string {
    return this.pieceNumber >= 2 ? '/rapport' : `/piece/${this.pieceNumber + 1}`;
  }
}
