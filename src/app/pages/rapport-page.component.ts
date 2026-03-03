import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LettersOnlyDirective } from '../shared/directives/letters-only.directive';
import { NumbersOnlyDirective } from '../shared/directives/numbers-only.directive';

@Component({
  selector: 'app-rapport-page',
  standalone: true,
  imports: [RouterLink, LettersOnlyDirective, NumbersOnlyDirective],
  template: `
    <section class="screen">
      <h1 class="title">Rapport d'expertise</h1>

      <div class="two-col">
        <div>
          <h3>Votre client</h3>
          <form class="form-grid compact">
            <label>Nom <input type="text" lettersOnly /></label>
            <label>Prénom <input type="text" lettersOnly /></label>
            <label>Numéro <input type="text" numbersOnly inputmode="numeric" /></label>
            <label>Rue <input type="text" lettersOnly /></label>
            <label>Code Postal <input type="text" numbersOnly inputmode="numeric" /></label>
            <label>Ville <input type="text" lettersOnly /></label>
            <label>Tél. <input type="text" numbersOnly inputmode="numeric" /></label>
            <label>mail <input type="text" /></label>
          </form>
        </div>

        <div>
          <h3>La maison</h3>
          <form class="form-grid compact">
            <label>Isolation <input type="text" lettersOnly /></label>
            <label>Température de base <input type="text" numbersOnly inputmode="numeric" /></label>
            <label>Hauteur sous-plafond <input type="text" numbersOnly inputmode="numeric" /></label>
            <label>Nombre de pièces <input type="text" numbersOnly inputmode="numeric" /></label>
          </form>
          <div class="result blue">PuissanceM = ΣpuissanceP</div>
        </div>
      </div>

      <div class="two-col">
        <div>
          <h3>Pièce : ...</h3>
          <form class="form-grid compact">
            <label>Nom <input type="text" lettersOnly /></label>
            <label>Longueur <input type="text" numbersOnly inputmode="numeric" /></label>
            <label>Largeur <input type="text" numbersOnly inputmode="numeric" /></label>
            <label>Hauteur <input type="text" numbersOnly inputmode="numeric" /></label>
            <label>Température confort <input type="text" numbersOnly inputmode="numeric" /></label>
          </form>
          <div class="result blue">PuissanceP = g x (L x l x h) x deltaT</div>
        </div>

        <div>
          <h3>Pièce : ...</h3>
          <form class="form-grid compact">
            <label>Nom <input type="text" lettersOnly /></label>
            <label>Longueur <input type="text" numbersOnly inputmode="numeric" /></label>
            <label>Largeur <input type="text" numbersOnly inputmode="numeric" /></label>
            <label>Hauteur <input type="text" numbersOnly inputmode="numeric" /></label>
            <label>Température confort <input type="text" numbersOnly inputmode="numeric" /></label>
          </form>
          <div class="result blue">PuissanceP = g x (L x l x h) x deltaT</div>
        </div>
      </div>

      <div class="line-actions">
        <a class="btn prev" routerLink="/piece/1">< Pièce i+1</a>
        <a class="btn next" routerLink="/rapport/page-2">Page 2 rapport ></a>
      </div>
    </section>
  `,
})
export class RapportPageComponent {}
