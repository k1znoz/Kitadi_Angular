import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LettersOnlyDirective } from '../shared/directives/letters-only.directive';
import { NumbersOnlyDirective } from '../shared/directives/numbers-only.directive';

@Component({
  selector: 'app-maison-page',
  standalone: true,
  imports: [RouterLink, LettersOnlyDirective, NumbersOnlyDirective],
  template: `
    <section class="screen">
      <h1 class="title">La maison</h1>

      <form class="form-grid">
        <label>Quelle est l'isolation de la maison ? <input type="text" lettersOnly /></label>
        <label>Quelle est la température de base ? <input type="text" numbersOnly inputmode="numeric" /></label>
        <label>Quelle est la hauteur sous-plafond ? <input type="text" numbersOnly inputmode="numeric" /></label>
        <label>Quel est le nombre de pièces ? <input type="text" numbersOnly inputmode="numeric" /></label>
      </form>

      <div class="line-actions">
        <a class="btn prev" routerLink="/client">< Le client</a>
        <a class="btn next" routerLink="/piece/1">Les pièces ></a>
      </div>

      <p class="tutorial-label">Tuto formulaire</p>
      <div class="tutorial-box"></div>
    </section>
  `,
})
export class MaisonPageComponent {}
