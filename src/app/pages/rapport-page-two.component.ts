import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LettersOnlyDirective } from '../shared/directives/letters-only.directive';
import { NumbersOnlyDirective } from '../shared/directives/numbers-only.directive';

@Component({
  selector: 'app-rapport-page-two',
  standalone: true,
  imports: [RouterLink, LettersOnlyDirective, NumbersOnlyDirective],
  template: `
    <section class="screen">
      <h3>Pièce : ...</h3>

      <form class="form-grid compact">
        <label>Quel est le nom de la pièce ? <input type="text" lettersOnly /></label>
        <label>Quelle est la longueur de la pièce ? <input type="text" numbersOnly inputmode="numeric" /></label>
        <label>Quelle est la largeur de la pièce ? <input type="text" numbersOnly inputmode="numeric" /></label>
        <label>Quelle est la hauteur sous-plafond ? <input type="text" numbersOnly inputmode="numeric" /></label>
        <label>Quelle est la température de confort ? <input type="text" numbersOnly inputmode="numeric" /></label>
      </form>

      <div class="result blue">PuissanceP = g x (longueur x largeur x hauteur) x deltaT</div>

      <div class="line-actions footer-space">
        <a class="btn prev" routerLink="/rapport">< Rapport</a>
        <button type="button" class="btn next">Export vers la bdd ></button>
      </div>
    </section>
  `,
})
export class RapportPageTwoComponent {}
