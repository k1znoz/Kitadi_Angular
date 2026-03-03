<?php

declare(strict_types=1);

require_once __DIR__ . '/db.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée.'], JSON_UNESCAPED_UNICODE);
    exit;
}

function jsonResponse(array $payload, int $statusCode = 200): never
{
    http_response_code($statusCode);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $rawBody = file_get_contents('php://input');
    $data = json_decode((string) $rawBody, true);

    if (!is_array($data)) {
        jsonResponse(['success' => false, 'message' => 'Payload JSON invalide.'], 400);
    }

    $clientRef = trim((string) ($data['clientRef'] ?? ''));
    $maison = $data['maison'] ?? null;
    $pieces = $data['pieces'] ?? null;

    if ($clientRef === '' || !is_array($maison) || !is_array($pieces)) {
        jsonResponse(['success' => false, 'message' => 'Données d\'export incomplètes.'], 422);
    }

    $isolation = trim((string) ($maison['isolation'] ?? ''));
    $temperatureBase = (float) ($maison['temperatureBase'] ?? 0);
    $hauteurSousPlafond = (float) ($maison['hauteurSousPlafond'] ?? 0);
    $nombrePieces = max(1, (int) ($maison['nombrePieces'] ?? 1));

    $pdo = getPdo();
    $pdo->beginTransaction();

    $findClient = $pdo->prepare('SELECT id FROM clients WHERE ref = :ref LIMIT 1');
    $findClient->bindValue(':ref', $clientRef);
    $findClient->execute();

    $clientRow = $findClient->fetch();

    if (!$clientRow || !isset($clientRow['id'])) {
        $pdo->rollBack();
        jsonResponse(['success' => false, 'message' => 'Client introuvable pour la référence fournie.'], 404);
    }

    $clientId = (int) $clientRow['id'];

    $upsertMaison = $pdo->prepare(
        'INSERT INTO maisons (client_id, isolation, temperature_base, hauteur_sous_plafond, nombre_pieces)
         VALUES (:client_id, :isolation, :temperature_base, :hauteur_sous_plafond, :nombre_pieces)
         ON DUPLICATE KEY UPDATE
           isolation = VALUES(isolation),
           temperature_base = VALUES(temperature_base),
           hauteur_sous_plafond = VALUES(hauteur_sous_plafond),
           nombre_pieces = VALUES(nombre_pieces),
           updated_at = CURRENT_TIMESTAMP'
    );

    $upsertMaison->bindValue(':client_id', $clientId, PDO::PARAM_INT);
    $upsertMaison->bindValue(':isolation', $isolation);
    $upsertMaison->bindValue(':temperature_base', $temperatureBase);
    $upsertMaison->bindValue(':hauteur_sous_plafond', $hauteurSousPlafond);
    $upsertMaison->bindValue(':nombre_pieces', $nombrePieces, PDO::PARAM_INT);
    $upsertMaison->execute();

    $findMaison = $pdo->prepare('SELECT id FROM maisons WHERE client_id = :client_id LIMIT 1');
    $findMaison->bindValue(':client_id', $clientId, PDO::PARAM_INT);
    $findMaison->execute();

    $maisonRow = $findMaison->fetch();

    if (!$maisonRow || !isset($maisonRow['id'])) {
        throw new RuntimeException('Maison non trouvée après upsert.');
    }

    $maisonId = (int) $maisonRow['id'];

    $clearPieces = $pdo->prepare('DELETE FROM pieces WHERE maison_id = :maison_id');
    $clearPieces->bindValue(':maison_id', $maisonId, PDO::PARAM_INT);
    $clearPieces->execute();

    $insertPiece = $pdo->prepare(
        'INSERT INTO pieces (
            maison_id,
            piece_index,
            nom,
            longueur,
            largeur,
            hauteur,
            temperature_confort,
            delta_t,
            puissance
        ) VALUES (
            :maison_id,
            :piece_index,
            :nom,
            :longueur,
            :largeur,
            :hauteur,
            :temperature_confort,
            :delta_t,
            :puissance
        )'
    );

    $piecesExportees = 0;
    $puissanceTotale = 0.0;
    $piecesPayload = [];

    foreach ($pieces as $piece) {
        if (!is_array($piece)) {
            continue;
        }

        $pieceIndex = max(1, (int) ($piece['id'] ?? 0));

        $insertPiece->bindValue(':maison_id', $maisonId, PDO::PARAM_INT);
        $insertPiece->bindValue(':piece_index', $pieceIndex, PDO::PARAM_INT);
        $insertPiece->bindValue(':nom', trim((string) ($piece['nom'] ?? '')));
        $insertPiece->bindValue(':longueur', (float) ($piece['longueur'] ?? 0));
        $insertPiece->bindValue(':largeur', (float) ($piece['largeur'] ?? 0));
        $insertPiece->bindValue(':hauteur', (float) ($piece['hauteur'] ?? 0));
        $insertPiece->bindValue(':temperature_confort', (float) ($piece['temperatureConfort'] ?? 0));
        $insertPiece->bindValue(':delta_t', (float) ($piece['deltaT'] ?? 0));
        $piecePuissance = (float) ($piece['puissance'] ?? 0);
        $insertPiece->bindValue(':puissance', $piecePuissance);
        $insertPiece->execute();

        $puissanceTotale += $piecePuissance;
        $piecesPayload[] = [
            'id' => $pieceIndex,
            'nom' => trim((string) ($piece['nom'] ?? '')),
            'longueur' => (float) ($piece['longueur'] ?? 0),
            'largeur' => (float) ($piece['largeur'] ?? 0),
            'hauteur' => (float) ($piece['hauteur'] ?? 0),
            'temperatureConfort' => (float) ($piece['temperatureConfort'] ?? 0),
            'deltaT' => (float) ($piece['deltaT'] ?? 0),
            'puissance' => $piecePuissance,
        ];

        $piecesExportees++;
    }

    $insertRapport = $pdo->prepare(
        'INSERT INTO rapports (
            client_id,
            ref_dossier,
            isolation,
            temperature_base,
            hauteur_sous_plafond,
            nombre_pieces,
            puissance_totale,
            pieces_json
        ) VALUES (
            :client_id,
            :ref_dossier,
            :isolation,
            :temperature_base,
            :hauteur_sous_plafond,
            :nombre_pieces,
            :puissance_totale,
            :pieces_json
        )'
    );

    $insertRapport->bindValue(':client_id', $clientId, PDO::PARAM_INT);
    $insertRapport->bindValue(':ref_dossier', $clientRef);
    $insertRapport->bindValue(':isolation', $isolation);
    $insertRapport->bindValue(':temperature_base', $temperatureBase);
    $insertRapport->bindValue(':hauteur_sous_plafond', $hauteurSousPlafond);
    $insertRapport->bindValue(':nombre_pieces', $nombrePieces, PDO::PARAM_INT);
    $insertRapport->bindValue(':puissance_totale', $puissanceTotale);
    $insertRapport->bindValue(':pieces_json', json_encode($piecesPayload, JSON_UNESCAPED_UNICODE));
    $insertRapport->execute();

    $rapportId = (int) $pdo->lastInsertId();

    $pdo->commit();

    jsonResponse([
        'success' => true,
        'message' => 'Export BDD terminé.',
        'clientId' => $clientId,
        'maisonId' => $maisonId,
        'rapportId' => $rapportId,
        'piecesExportees' => $piecesExportees,
    ]);
} catch (Throwable $error) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) {
        $pdo->rollBack();
    }

    jsonResponse([
        'success' => false,
        'message' => 'Erreur export: ' . $error->getMessage(),
    ], 500);
}
