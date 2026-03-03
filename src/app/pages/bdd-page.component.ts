import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { ClientRecord, ClientDatabaseService } from '../shared/services/client-database.service';

@Component({
  selector: 'app-bdd-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <section class="screen">
      <h1 class="title">Fichier Clients<br />Kitadi Energies</h1>

      <div class="search-row">
        <input
          type="text"
          [(ngModel)]="searchTerm"
          name="searchTerm"
          placeholder="Rechercher un dossier (réf, nom, prénom, ville, CP)"
          (ngModelChange)="onSearchChange()"
        />
      </div>

      @if (errorMessage()) {
        <p class="error-message">{{ errorMessage() }}</p>
      }

      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th class="col-select">Sélection</th>
              <th>Nom</th>
              <th>Réf dossier</th>
              <th>Date</th>
              <th>Ville</th>
              <th>Code postal</th>
              <th>Rapport</th>
            </tr>
          </thead>
          <tbody>
            @for (client of clients(); track client.ref) {
              <tr>
                <td class="col-select">
                  <input
                    type="radio"
                    name="selectedClient"
                    [checked]="selectedClientRef() === client.ref"
                    (change)="selectClient(client.ref)"
                  />
                </td>
                <td>{{ displayName(client) }}</td>
                <td>{{ client.ref }}</td>
                <td>{{ client.date }}</td>
                <td>{{ client.ville }}</td>
                <td>{{ client.cp }}</td>
                <td>
                  <a class="table-link" [routerLink]="'/rapport'" [queryParams]="{ ref: client.ref }">Voir ></a>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="7">Aucun dossier enregistré.</td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <div class="line-actions bdd-actions">
        <button type="button" class="btn next action-btn" [disabled]="!selectedClientRef()" (click)="onOpenSelectedReport()">
          Voir le rapport >
        </button>
        <a class="btn next action-btn" [routerLink]="'/client'" [queryParams]="selectedClientRef() ? { ref: selectedClientRef() } : undefined">
          Modifier le dossier >
        </a>
        <button type="button" class="btn danger action-btn" [disabled]="!selectedClientRef() || isDeleting()" (click)="onDeleteSelected()">
          {{ isDeleting() ? 'Suppression...' : 'Supprimer le dossier' }}
        </button>
      </div>

      @if (statusMessage()) {
        <p class="status-line">{{ statusMessage() }}</p>
      }

      <div class="new-case-wrap">
        <a class="btn clients" routerLink="/client">Nouveau Dossier</a>
      </div>
    </section>
  `,
  styles: `
    .table-wrap {
      width: 100%;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      border: 1px solid #1d1d1d;
      background: #fff;
    }

    .data-table {
      min-width: 760px;
      margin: 0;
    }

    .col-select {
      width: 72px;
      text-align: center;
    }

    .col-select input {
      cursor: pointer;
    }

    .bdd-actions {
      margin-top: 10px;
      flex-wrap: wrap;
    }

    .search-row {
      width: 100%;
      margin: 8px 0 12px;
    }

    .search-row input {
      width: 100%;
    }

    .action-btn {
      text-align: center;
    }

    @media (max-width: 720px) {
      .bdd-actions {
        flex-direction: column;
        align-items: stretch;
      }

      .action-btn {
        width: 100%;
      }
    }
  `,
})
export class BddPageComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly clientDatabase = inject(ClientDatabaseService);
  private routeQuerySub?: Subscription;

  searchTerm = '';
  readonly clients = signal<ClientRecord[]>([]);
  readonly errorMessage = signal('');
  readonly statusMessage = signal('');
  readonly selectedClientRef = signal('');
  readonly isDeleting = signal(false);

  async ngOnInit(): Promise<void> {
    this.routeQuerySub = this.route.queryParamMap.subscribe((params) => {
      const querySearch = params.get('search')?.trim() ?? '';

      if (querySearch !== this.searchTerm) {
        this.searchTerm = querySearch;
        void this.loadClients();
      }
    });

    await this.loadClients();
  }

  ngOnDestroy(): void {
    this.routeQuerySub?.unsubscribe();
  }

  private async loadClients(): Promise<void> {
    try {
      const data = await this.clientDatabase.getClients(this.searchTerm);
      this.clients.set(data);
      this.errorMessage.set('');

      if (this.selectedClientRef() && !data.some((client) => client.ref === this.selectedClientRef())) {
        this.selectedClientRef.set('');
      }
    } catch {
      this.errorMessage.set('Impossible de charger les dossiers clients.');
      this.clients.set([]);
    }
  }

  async onSearchChange(): Promise<void> {
    await this.loadClients();
  }

  selectClient(ref: string): void {
    this.selectedClientRef.set(ref);
    this.statusMessage.set('');
  }

  async onDeleteSelected(): Promise<void> {
    const ref = this.selectedClientRef().trim();

    if (!ref || this.isDeleting()) {
      return;
    }

    const confirmed = window.confirm(`Supprimer le dossier ${ref} et toutes ses données (maison/pièces/rapport) ?`);

    if (!confirmed) {
      return;
    }

    this.isDeleting.set(true);
    this.statusMessage.set('');

    try {
      await this.clientDatabase.deleteClientByRef(ref);
      this.selectedClientRef.set('');
      await this.loadClients();
      this.statusMessage.set('Dossier supprimé avec succès.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Échec de la suppression du dossier.';
      this.statusMessage.set(message);
    } finally {
      this.isDeleting.set(false);
    }
  }

  onOpenSelectedReport(): void {
    const ref = this.selectedClientRef().trim();

    if (!ref) {
      this.statusMessage.set('Choisis un dossier pour voir le rapport.');
      return;
    }

    void this.router.navigate(['/rapport'], { queryParams: { ref } });
  }

  displayName(client: ClientRecord): string {
    const fullName = `${client.nom} ${client.prenom}`.trim();
    return fullName || client.nom;
  }
}
