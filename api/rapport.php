<?php

declare(strict_types=1);

require_once __DIR__ . '/db.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
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

function toDisplayDate(?string $sqlDate): string
{
    if (!$sqlDate) {
        return '';
    }

    if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $sqlDate) !== 1) {
        return '';
    }

    [$year, $month, $day] = explode('-', $sqlDate);
    return sprintf('%s/%s/%s', $day, $month, $year);
}

try {
    $ref = trim((string) ($_GET['ref'] ?? ''));

    if ($ref === '') {
        jsonResponse(['success' => false, 'message' => 'Paramètre ref manquant.'], 422);
    }

    $pdo = getPdo();

    $rapportStmt = $pdo->prepare(
        'SELECT id, client_id, ref_dossier, isolation, temperature_base, hauteur_sous_plafond, nombre_pieces, puissance_totale, pieces_json, created_at
         FROM rapports
         WHERE ref_dossier = :ref
         ORDER BY id DESC
         LIMIT 1'
    );
    $rapportStmt->bindValue(':ref', $ref);
    $rapportStmt->execute();

    $rapport = $rapportStmt->fetch();

    if (!$rapport || !isset($rapport['client_id'])) {
        jsonResponse(['success' => false, 'message' => 'Aucun rapport trouvé pour cette référence.'], 404);
    }

    $clientStmt = $pdo->prepare('SELECT id, nom, prenom, numero, rue, ref, date_dossier, ville, cp, tel, mail FROM clients WHERE id = :id LIMIT 1');
    $clientStmt->bindValue(':id', (int) $rapport['client_id'], PDO::PARAM_INT);
    $clientStmt->execute();

    $clientRow = $clientStmt->fetch();

    if (!$clientRow) {
        jsonResponse(['success' => false, 'message' => 'Client introuvable pour ce rapport.'], 404);
    }

    $piecesJson = $rapport['pieces_json'] ?? null;
    $decodedPieces = [];

    if (is_string($piecesJson) && $piecesJson !== '') {
        $decoded = json_decode($piecesJson, true);
        if (is_array($decoded)) {
            $decodedPieces = $decoded;
        }
    }

    $pieces = array_values(array_filter(array_map(static function ($piece): ?array {
        if (!is_array($piece)) {
            return null;
        }

        return [
            'id' => max(1, (int) ($piece['id'] ?? 0)),
            'nom' => trim((string) ($piece['nom'] ?? '')),
            'longueur' => (float) ($piece['longueur'] ?? 0),
            'largeur' => (float) ($piece['largeur'] ?? 0),
            'hauteur' => (float) ($piece['hauteur'] ?? 0),
            'temperatureConfort' => (float) ($piece['temperatureConfort'] ?? 0),
            'deltaT' => (float) ($piece['deltaT'] ?? 0),
            'puissance' => (float) ($piece['puissance'] ?? 0),
        ];
    }, $decodedPieces)));

    usort($pieces, static function (array $a, array $b): int {
        return ($a['id'] ?? 0) <=> ($b['id'] ?? 0);
    });

    jsonResponse([
        'success' => true,
        'rapport' => [
            'id' => (int) ($rapport['id'] ?? 0),
            'clientRef' => (string) ($rapport['ref_dossier'] ?? ''),
            'createdAt' => (string) ($rapport['created_at'] ?? ''),
            'maison' => [
                'isolation' => (string) ($rapport['isolation'] ?? ''),
                'temperatureBase' => (float) ($rapport['temperature_base'] ?? 0),
                'hauteurSousPlafond' => (float) ($rapport['hauteur_sous_plafond'] ?? 0),
                'nombrePieces' => (int) ($rapport['nombre_pieces'] ?? 1),
                'puissanceTotale' => (float) ($rapport['puissance_totale'] ?? 0),
            ],
            'pieces' => $pieces,
            'client' => [
                'id' => (int) ($clientRow['id'] ?? 0),
                'nom' => (string) ($clientRow['nom'] ?? ''),
                'prenom' => (string) ($clientRow['prenom'] ?? ''),
                'numero' => (string) ($clientRow['numero'] ?? ''),
                'rue' => (string) ($clientRow['rue'] ?? ''),
                'ref' => (string) ($clientRow['ref'] ?? ''),
                'date' => toDisplayDate($clientRow['date_dossier'] ?? null),
                'ville' => (string) ($clientRow['ville'] ?? ''),
                'cp' => (string) ($clientRow['cp'] ?? ''),
                'tel' => (string) ($clientRow['tel'] ?? ''),
                'mail' => (string) ($clientRow['mail'] ?? ''),
            ],
        ],
    ]);
} catch (Throwable $error) {
    jsonResponse([
        'success' => false,
        'message' => 'Erreur lecture rapport: ' . $error->getMessage(),
    ], 500);
}
