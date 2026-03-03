import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LettersOnlyDirective } from '../shared/directives/letters-only.directive';
import { NumbersOnlyDirective } from '../shared/directives/numbers-only.directive';
import { ClientDatabaseService, ClientRecord } from '../shared/services/client-database.service';
import { ProjectDataService } from '../shared/services/project-data.service';

@Component({
  selector: 'app-client-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink, LettersOnlyDirective, NumbersOnlyDirective],
  template: `
    <section class="screen">
      <div class="meta-row">
        <label>Date <input type="date" [(ngModel)]="clientDate" name="clientDate" /></label>
        <label
          >Réf Dossier
          <input
            class="locked-input"
            type="text"
            [value]="clientReference"
            disabled
            aria-disabled="true"
            title="Référence générée automatiquement"
        /></label>
      </div>

      <h1 class="title">Votre client</h1>

      <div class="meta-row">
        <label>
          Dossier existant
          <select [(ngModel)]="selectedClientRef" name="selectedClientRef">
            <option value="">-- Sélectionner une référence --</option>
            @for (client of existingClients(); track client.ref) {
              <option [value]="client.ref">{{ client.ref }} - {{ client.nom }} {{ client.prenom }}</option>
            }
          </select>
        </label>
        <div class="stack-actions">
          <button type="button" class="btn ok" (click)="onLoadExisting()">Charger</button>
          <button type="button" class="btn danger" (click)="onDeleteExisting()">Supprimer</button>
        </div>
      </div>

      <form class="form-grid">
        <label>Nom <input type="text" lettersOnly [(ngModel)]="lastName" name="lastName" /></label>
        <label>Prénom <input type="text" lettersOnly [(ngModel)]="firstName" name="firstName" /></label>
        <label
          >Numéro
          <input type="text" numbersOnly inputmode="numeric" [(ngModel)]="streetNumber" name="streetNumber"
        /></label>
        <label>Rue <input type="text" [(ngModel)]="streetName" name="streetName" /></label>
        <label
          >Code Postal
          <input type="text" numbersOnly inputmode="numeric" [(ngModel)]="postalCode" name="postalCode"
        /></label>
        <label>Ville <input type="text" lettersOnly [(ngModel)]="city" name="city" /></label>
        <label
          >Tél.
          <input type="text" numbersOnly inputmode="numeric" [(ngModel)]="phone" name="phone"
        /></label>
        <label>mail <input type="email" [(ngModel)]="email" name="email" /></label>
      </form>

      <div class="stack-actions">
        <button type="button" class="btn ok" [disabled]="!canSave" (click)="onValidate()">Valider</button>
        <button type="button" class="btn danger" (click)="onCancel()">Annuler</button>
      </div>

      @if (statusMessage()) {
        <p class="status-line">{{ statusMessage() }}</p>
      }

      <div class="next-line">
        <a class="btn next" routerLink="/maison">La maison ></a>
      </div>

      <p class="tutorial-label">Tuto formulaire</p>
      <div class="tutorial-box"></div>
    </section>
  `,
})
export class ClientPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly clientDatabase = inject(ClientDatabaseService);
  private readonly projectData = inject(ProjectDataService);

  clientDate = '';
  firstName = '';
  lastName = '';
  streetNumber = '';
  streetName = '';
  postalCode = '';
  city = '';
  phone = '';
  email = '';
  selectedClientRef = '';
  editingRef = '';

  readonly statusMessage = signal('');
  readonly existingClients = signal<ClientRecord[]>([]);

  async ngOnInit(): Promise<void> {
    await this.refreshExistingClients();

    const refFromRoute = this.route.snapshot.queryParamMap.get('ref')?.trim();

    if (refFromRoute) {
      this.selectedClientRef = refFromRoute;
      await this.onLoadExisting();
    }
  }

  get canSave(): boolean {
    return Boolean(
      this.clientDate &&
        this.firstName.trim() &&
        this.lastName.trim() &&
        this.streetNumber.trim() &&
        this.streetName.trim() &&
        this.postalCode.trim() &&
        this.city.trim() &&
        this.phone.trim(),
    );
  }

  get clientReference(): string {
    if (this.editingRef) {
      return this.editingRef;
    }

    const datePart = this.formatDateToDdMmYy(this.clientDate);
    const firstNamePart = this.normalizeLetters(this.firstName).slice(0, 1);
    const lastNamePart = this.normalizeLetters(this.lastName).slice(0, 2);

    return `${datePart}${firstNamePart}${lastNamePart}`;
  }

  async onValidate(): Promise<void> {
    if (!this.canSave) {
      this.statusMessage.set('Veuillez compléter les champs requis.');
      return;
    }

    try {
      await this.clientDatabase.saveClient({
        nom: this.lastName.trim(),
        prenom: this.firstName.trim(),
        numero: this.streetNumber.trim(),
        rue: this.streetName.trim(),
        ref: this.clientReference,
        date: this.toDisplayDate(this.clientDate),
        ville: this.city.trim(),
        cp: this.postalCode.trim(),
        tel: this.phone.trim(),
        mail: this.email.trim(),
      });

      this.editingRef = this.clientReference;
      this.selectedClientRef = this.clientReference;
      this.projectData.setActiveClientRef(this.clientReference);
      await this.refreshExistingClients();
      this.statusMessage.set('Dossier client enregistré.');
    } catch {
      this.statusMessage.set('Échec de l\'enregistrement du dossier.');
    }
  }

  async onLoadExisting(): Promise<void> {
    const ref = this.selectedClientRef.trim();

    if (!ref) {
      this.statusMessage.set('Choisis une référence à charger.');
      return;
    }

    const selected = this.existingClients().find((client) => client.ref === ref);

    if (!selected) {
      this.statusMessage.set('Dossier introuvable.');
      return;
    }

    this.populateFormFromClient(selected);
    this.projectData.setActiveClientRef(selected.ref);
    this.statusMessage.set('Dossier client chargé.');
  }

  async onDeleteExisting(): Promise<void> {
    const ref = (this.selectedClientRef || this.editingRef).trim();

    if (!ref) {
      this.statusMessage.set('Choisis une référence à supprimer.');
      return;
    }

    const confirmed = window.confirm(`Supprimer le dossier ${ref} et toutes ses données (maison/pièces/rapport) ?`);

    if (!confirmed) {
      return;
    }

    try {
      await this.clientDatabase.deleteClientByRef(ref);

      if (this.editingRef === ref) {
        this.resetForm();
      }

      if (this.projectData.getActiveClientRef() === ref) {
        this.projectData.setActiveClientRef('');
      }

      this.selectedClientRef = '';
      await this.refreshExistingClients();
      this.statusMessage.set('Dossier supprimé avec succès.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Échec de la suppression du dossier.';
      this.statusMessage.set(message);
    }
  }

  onCancel(): void {
    this.resetForm();
    this.statusMessage.set('Formulaire réinitialisé.');
  }

  private formatDateToDdMmYy(dateValue: string): string {
    if (!dateValue) {
      return '';
    }

    const [year, month, day] = dateValue.split('-');

    if (!year || !month || !day) {
      return '';
    }

    return `${day}${month}${year.slice(-2)}`;
  }

  private toDisplayDate(dateValue: string): string {
    if (!dateValue) {
      return '';
    }

    const [year, month, day] = dateValue.split('-');

    if (!year || !month || !day) {
      return '';
    }

    return `${day}/${month}/${year}`;
  }

  private normalizeLetters(input: string): string {
    return input
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^A-Za-z]/g, '')
      .toUpperCase();
  }

  private async refreshExistingClients(): Promise<void> {
    try {
      const clients = await this.clientDatabase.getClients();
      this.existingClients.set(clients);
    } catch {
      this.existingClients.set([]);
    }
  }

  private populateFormFromClient(client: ClientRecord): void {
    this.clientDate = this.toInputDate(client.date);
    this.firstName = client.prenom;
    this.lastName = client.nom;
    this.streetNumber = client.numero;
    this.streetName = client.rue;
    this.postalCode = client.cp;
    this.city = client.ville;
    this.phone = client.tel;
    this.email = client.mail;
    this.editingRef = client.ref;
    this.selectedClientRef = client.ref;
  }

  private toInputDate(displayDate: string): string {
    const value = displayDate.trim();

    if (!value) {
      return '';
    }

    const parts = value.split('/');

    if (parts.length === 3) {
      const [day, month, year] = parts;

      if (day && month && year) {
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
    }

    return '';
  }

  private resetForm(): void {
    this.clientDate = '';
    this.firstName = '';
    this.lastName = '';
    this.streetNumber = '';
    this.streetName = '';
    this.postalCode = '';
    this.city = '';
    this.phone = '';
    this.email = '';
    this.editingRef = '';
    this.selectedClientRef = '';
    this.projectData.setActiveClientRef('');
  }
}
