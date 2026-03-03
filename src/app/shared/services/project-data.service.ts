import { Injectable } from '@angular/core';

export interface MaisonData {
  isolation: string;
  g: number;
  temperatureBase: number;
  hauteurSousPlafond: number;
  nombrePieces: number;
}

export interface PieceData {
  id: number;
  nom: string;
  longueur: number;
  largeur: number;
  hauteur: number;
  temperatureConfort: number;
  deltaT: number;
  puissance: number;
}

@Injectable({
  providedIn: 'root',
})
export class ProjectDataService {
  private defaultPieceHeight = 0;
  private activeClientRef = '';

  private maisonData: MaisonData = {
    isolation: '',
    g: 1,
    temperatureBase: 0,
    hauteurSousPlafond: 0,
    nombrePieces: 1,
  };

  private pieces = new Map<number, PieceData>();

  setMaisonData(data: Partial<MaisonData>): void {
    this.maisonData = {
      ...this.maisonData,
      ...data,
      g: Number(data.g ?? this.maisonData.g) || 1,
      nombrePieces: Math.max(1, Number(data.nombrePieces ?? this.maisonData.nombrePieces) || 1),
      temperatureBase: Number(data.temperatureBase ?? this.maisonData.temperatureBase) || 0,
      hauteurSousPlafond: Number(data.hauteurSousPlafond ?? this.maisonData.hauteurSousPlafond) || 0,
    };

    if (this.defaultPieceHeight <= 0 && this.maisonData.hauteurSousPlafond > 0) {
      this.defaultPieceHeight = this.maisonData.hauteurSousPlafond;
    }

    this.recomputePieces();
  }

  getMaisonData(): MaisonData {
    return { ...this.maisonData };
  }

  getNombrePieces(): number {
    return Math.max(1, this.maisonData.nombrePieces || 1);
  }

  upsertPiece(data: Omit<PieceData, 'deltaT' | 'puissance'>): PieceData {
    if (data.hauteur > 0) {
      this.defaultPieceHeight = data.hauteur;
    }

    const piece = this.computePiece(data);

    this.pieces.set(data.id, piece);
    return piece;
  }

  getPiece(id: number): PieceData | undefined {
    const piece = this.pieces.get(id);
    return piece ? { ...piece } : undefined;
  }

  getPieces(): PieceData[] {
    return Array.from(this.pieces.values()).sort((a, b) => a.id - b.id);
  }

  getDefaultPieceHeight(): number {
    if (this.defaultPieceHeight > 0) {
      return this.defaultPieceHeight;
    }

    return this.maisonData.hauteurSousPlafond > 0 ? this.maisonData.hauteurSousPlafond : 0;
  }

  getTotalPuissanceMaison(): number {
    return this.getPieces().reduce((sum, piece) => sum + piece.puissance, 0);
  }

  setActiveClientRef(ref: string): void {
    this.activeClientRef = ref.trim();
  }

  getActiveClientRef(): string {
    return this.activeClientRef;
  }

  private recomputePieces(): void {
    const entries = Array.from(this.pieces.entries());

    for (const [id, piece] of entries) {
      this.pieces.set(id, this.computePiece(piece));
    }
  }

  private computePiece(data: Omit<PieceData, 'deltaT' | 'puissance'>): PieceData {
    const deltaT = data.temperatureConfort - this.maisonData.temperatureBase;
    const puissance = this.maisonData.g * data.longueur * data.largeur * data.hauteur * deltaT;

    return {
      ...data,
      deltaT,
      puissance,
    };
  }
}
