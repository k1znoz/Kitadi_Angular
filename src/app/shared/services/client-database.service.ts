import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';

export interface ClientRecord {
  id: number;
  nom: string;
  prenom: string;
  numero: string;
  rue: string;
  ref: string;
  date: string;
  ville: string;
  cp: string;
  tel: string;
  mail: string;
}

export type NewClientRecord = Omit<ClientRecord, 'id'>;

export interface MaisonExportData {
  isolation: string;
  temperatureBase: number;
  hauteurSousPlafond: number;
  nombrePieces: number;
}

export interface PieceExportData {
  id: number;
  nom: string;
  longueur: number;
  largeur: number;
  hauteur: number;
  temperatureConfort: number;
  deltaT: number;
  puissance: number;
}

export interface StoredReportPayload {
  id: number;
  clientRef: string;
  createdAt: string;
  maison: MaisonExportData & { puissanceTotale: number };
  pieces: PieceExportData[];
  client: ClientRecord;
}

@Injectable({
  providedIn: 'root',
})
export class ClientDatabaseService {
  private readonly dbName = 'kitadi_clients_db';
  private readonly apiUrl = 'http://localhost/Kitadi_Angular/api/clients.php';
  private readonly exportApiUrl = 'http://localhost/Kitadi_Angular/api/export-dossier.php';
  private readonly reportApiUrl = 'http://localhost/Kitadi_Angular/api/rapport.php';
  private readonly sqliteConnection = new SQLiteConnection(CapacitorSQLite);

  private db?: SQLiteDBConnection;
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    if (Capacitor.isNativePlatform()) {
      await this.initializeNativeDatabase();
    }

    this.initialized = true;
  }

  async getClients(): Promise<ClientRecord[]> {
    await this.initialize();

    if (Capacitor.isNativePlatform()) {
      return this.getNativeClients();
    }

    return this.getRemoteClients();
  }

  async saveClient(client: NewClientRecord): Promise<void> {
    await this.initialize();

    if (Capacitor.isNativePlatform()) {
      await this.saveNativeClient(client);
      return;
    }

    await this.saveRemoteClient(client);
  }

  async exportDossier(clientRef: string, maison: MaisonExportData, pieces: PieceExportData[]): Promise<void> {
    const trimmedRef = clientRef.trim();

    if (!trimmedRef) {
      throw new Error('Référence client manquante pour l\'export.');
    }

    const response = await fetch(this.exportApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        clientRef: trimmedRef,
        maison,
        pieces,
      }),
    });

    let payload: { success?: boolean; message?: string } = {};

    try {
      payload = (await response.json()) as { success?: boolean; message?: string };
    } catch {
      payload = {};
    }

    if (!response.ok || !payload.success) {
      throw new Error(payload.message || 'Échec de l\'export vers la BDD.');
    }
  }

  async deleteClientByRef(clientRef: string): Promise<void> {
    const trimmedRef = clientRef.trim();

    if (!trimmedRef) {
      throw new Error('Référence client manquante pour la suppression.');
    }

    const response = await fetch(`${this.apiUrl}?ref=${encodeURIComponent(trimmedRef)}`, {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
      },
    });

    let payload: { success?: boolean; message?: string } = {};

    try {
      payload = (await response.json()) as { success?: boolean; message?: string };
    } catch {
      payload = {};
    }

    if (!response.ok || !payload.success) {
      throw new Error(payload.message || 'Échec de la suppression du client.');
    }
  }

  async getReportByRef(clientRef: string): Promise<StoredReportPayload> {
    const trimmedRef = clientRef.trim();

    if (!trimmedRef) {
      throw new Error('Référence client manquante pour charger le rapport.');
    }

    const response = await fetch(`${this.reportApiUrl}?ref=${encodeURIComponent(trimmedRef)}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    let payload: { success?: boolean; message?: string; rapport?: Partial<StoredReportPayload> } = {};

    try {
      payload = (await response.json()) as {
        success?: boolean;
        message?: string;
        rapport?: Partial<StoredReportPayload>;
      };
    } catch {
      payload = {};
    }

    if (!response.ok || !payload.success || !payload.rapport) {
      throw new Error(payload.message || 'Rapport introuvable pour cette référence.');
    }

    const rapport = payload.rapport;
    const maison = rapport.maison ?? { isolation: '', temperatureBase: 0, hauteurSousPlafond: 0, nombrePieces: 1, puissanceTotale: 0 };
    const piecesRaw = Array.isArray(rapport.pieces) ? rapport.pieces : [];
    const clientRaw = rapport.client ?? {
      id: 0,
      nom: '',
      prenom: '',
      numero: '',
      rue: '',
      ref: '',
      date: '',
      ville: '',
      cp: '',
      tel: '',
      mail: '',
    };

    return {
      id: Number(rapport.id ?? 0),
      clientRef: String(rapport.clientRef ?? ''),
      createdAt: String(rapport.createdAt ?? ''),
      maison: {
        isolation: String(maison.isolation ?? ''),
        temperatureBase: Number(maison.temperatureBase ?? 0),
        hauteurSousPlafond: Number(maison.hauteurSousPlafond ?? 0),
        nombrePieces: Math.max(1, Number(maison.nombrePieces ?? 1) || 1),
        puissanceTotale: Number((maison as { puissanceTotale?: unknown }).puissanceTotale ?? 0),
      },
      pieces: piecesRaw.map((piece) => ({
        id: Math.max(1, Number(piece.id ?? 0) || 1),
        nom: String(piece.nom ?? ''),
        longueur: Number(piece.longueur ?? 0),
        largeur: Number(piece.largeur ?? 0),
        hauteur: Number(piece.hauteur ?? 0),
        temperatureConfort: Number(piece.temperatureConfort ?? 0),
        deltaT: Number(piece.deltaT ?? 0),
        puissance: Number(piece.puissance ?? 0),
      })),
      client: {
        id: Number(clientRaw.id ?? 0),
        nom: String(clientRaw.nom ?? ''),
        prenom: String(clientRaw.prenom ?? ''),
        numero: String(clientRaw.numero ?? ''),
        rue: String(clientRaw.rue ?? ''),
        ref: String(clientRaw.ref ?? ''),
        date: String(clientRaw.date ?? ''),
        ville: String(clientRaw.ville ?? ''),
        cp: String(clientRaw.cp ?? ''),
        tel: String(clientRaw.tel ?? ''),
        mail: String(clientRaw.mail ?? ''),
      },
    };
  }

  private async initializeNativeDatabase(): Promise<void> {
    const consistency = await this.sqliteConnection.checkConnectionsConsistency();
    const hasConnection = (await this.sqliteConnection.isConnection(this.dbName, false)).result;

    if (consistency.result && hasConnection) {
      this.db = await this.sqliteConnection.retrieveConnection(this.dbName, false);
    } else {
      this.db = await this.sqliteConnection.createConnection(this.dbName, false, 'no-encryption', 1, false);
    }

    await this.db.open();
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS clients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nom TEXT NOT NULL,
        prenom TEXT NOT NULL DEFAULT '',
        numero TEXT NOT NULL DEFAULT '',
        rue TEXT NOT NULL DEFAULT '',
        ref TEXT NOT NULL UNIQUE,
        date TEXT NOT NULL,
        ville TEXT NOT NULL,
        cp TEXT NOT NULL,
        tel TEXT NOT NULL DEFAULT '',
        mail TEXT NOT NULL DEFAULT ''
      );
    `);

    await this.ensureNativeColumns();
  }

  private async getNativeClients(): Promise<ClientRecord[]> {
    if (!this.db) {
      return [];
    }

    const result = await this.db.query(
      'SELECT id, nom, prenom, numero, rue, ref, date, ville, cp, tel, mail FROM clients ORDER BY id DESC;',
    );

    const rows = result.values ?? [];

    return rows.map((row) => ({
      id: Number(row.id ?? 0),
      nom: String(row.nom ?? ''),
      prenom: String(row.prenom ?? ''),
      numero: String(row.numero ?? ''),
      rue: String(row.rue ?? ''),
      ref: String(row.ref ?? ''),
      date: String(row.date ?? ''),
      ville: String(row.ville ?? ''),
      cp: String(row.cp ?? ''),
      tel: String(row.tel ?? ''),
      mail: String(row.mail ?? ''),
    }));
  }

  private async saveNativeClient(client: NewClientRecord): Promise<void> {
    if (!this.db) {
      return;
    }

    await this.db.run(
      'INSERT OR REPLACE INTO clients (nom, prenom, numero, rue, ref, date, ville, cp, tel, mail) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);',
      [
      client.nom,
      client.prenom,
      client.numero,
      client.rue,
      client.ref,
      client.date,
      client.ville,
      client.cp,
      client.tel,
      client.mail,
      ],
    );
  }

  private async getRemoteClients(): Promise<ClientRecord[]> {
    const response = await fetch(this.apiUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Impossible de charger les clients depuis la BDD.');
    }

    const data = (await response.json()) as { clients?: Partial<ClientRecord>[] };
    const clients = Array.isArray(data.clients) ? data.clients : [];

    return clients.map((item) => ({
      id: Number(item.id ?? 0),
      nom: String(item.nom ?? ''),
      prenom: String(item.prenom ?? ''),
      numero: String(item.numero ?? ''),
      rue: String(item.rue ?? ''),
      ref: String(item.ref ?? ''),
      date: String(item.date ?? ''),
      ville: String(item.ville ?? ''),
      cp: String(item.cp ?? ''),
      tel: String(item.tel ?? ''),
      mail: String(item.mail ?? ''),
    }));
  }

  private async saveRemoteClient(client: NewClientRecord): Promise<void> {
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(client),
    });

    let payload: { success?: boolean; message?: string } = {};

    try {
      payload = (await response.json()) as { success?: boolean; message?: string };
    } catch {
      payload = {};
    }

    if (!response.ok || !payload.success) {
      throw new Error(payload.message || 'Impossible d\'enregistrer le client dans la BDD.');
    }
  }

  private async ensureNativeColumns(): Promise<void> {
    if (!this.db) {
      return;
    }

    const result = await this.db.query('PRAGMA table_info(clients);');
    const tableInfo = result.values ?? [];
    const existingColumns = new Set(tableInfo.map((column) => String(column.name ?? '')));

    if (!existingColumns.has('prenom')) {
      await this.db.execute("ALTER TABLE clients ADD COLUMN prenom TEXT NOT NULL DEFAULT '';");
    }

    if (!existingColumns.has('numero')) {
      await this.db.execute("ALTER TABLE clients ADD COLUMN numero TEXT NOT NULL DEFAULT '';");
    }

    if (!existingColumns.has('rue')) {
      await this.db.execute("ALTER TABLE clients ADD COLUMN rue TEXT NOT NULL DEFAULT '';");
    }

    if (!existingColumns.has('tel')) {
      await this.db.execute("ALTER TABLE clients ADD COLUMN tel TEXT NOT NULL DEFAULT '';");
    }

    if (!existingColumns.has('mail')) {
      await this.db.execute("ALTER TABLE clients ADD COLUMN mail TEXT NOT NULL DEFAULT '';");
    }
  }
}