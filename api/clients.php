<?php

declare(strict_types=1);

require_once __DIR__ . '/db.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

function jsonResponse(array $payload, int $statusCode = 200): never
{
    http_response_code($statusCode);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

function toSqlDate(?string $displayDate): ?string
{
    if (!$displayDate) {
        return null;
    }

    $displayDate = trim($displayDate);

    if (preg_match('/^\d{2}\/\d{2}\/\d{4}$/', $displayDate) !== 1) {
        return null;
    }

    [$day, $month, $year] = explode('/', $displayDate);

    if (!checkdate((int) $month, (int) $day, (int) $year)) {
        return null;
    }

    return sprintf('%04d-%02d-%02d', (int) $year, (int) $month, (int) $day);
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
    $pdo = getPdo();

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $ref = trim((string) ($_GET['ref'] ?? ''));
        $search = trim((string) ($_GET['search'] ?? ''));

        if ($ref !== '') {
            $query = $pdo->prepare('SELECT id, nom, prenom, numero, rue, ref, date_dossier, ville, cp, tel, mail FROM clients WHERE ref = :ref LIMIT 1');
            $query->bindValue(':ref', $ref);
            $query->execute();
            $row = $query->fetch();
            $rows = $row ? [$row] : [];
        } elseif ($search !== '') {
            $like = '%' . $search . '%';
            $query = $pdo->prepare(
                'SELECT id, nom, prenom, numero, rue, ref, date_dossier, ville, cp, tel, mail
                 FROM clients
                 WHERE ref LIKE :search_ref
                    OR nom LIKE :search_nom
                    OR prenom LIKE :search_prenom
                    OR ville LIKE :search_ville
                    OR cp LIKE :search_cp
                 ORDER BY id DESC'
            );
            $query->bindValue(':search_ref', $like);
            $query->bindValue(':search_nom', $like);
            $query->bindValue(':search_prenom', $like);
            $query->bindValue(':search_ville', $like);
            $query->bindValue(':search_cp', $like);
            $query->execute();
            $rows = $query->fetchAll();
        } else {
            $query = $pdo->query('SELECT id, nom, prenom, numero, rue, ref, date_dossier, ville, cp, tel, mail FROM clients ORDER BY id DESC');
            $rows = $query->fetchAll();
        }

        $clients = array_map(static function (array $row): array {
            return [
                'id' => (int) ($row['id'] ?? 0),
                'nom' => (string) ($row['nom'] ?? ''),
                'prenom' => (string) ($row['prenom'] ?? ''),
                'numero' => (string) ($row['numero'] ?? ''),
                'rue' => (string) ($row['rue'] ?? ''),
                'ref' => (string) ($row['ref'] ?? ''),
                'date' => toDisplayDate($row['date_dossier'] ?? null),
                'ville' => (string) ($row['ville'] ?? ''),
                'cp' => (string) ($row['cp'] ?? ''),
                'tel' => (string) ($row['tel'] ?? ''),
                'mail' => (string) ($row['mail'] ?? ''),
            ];
        }, $rows);

        jsonResponse(['clients' => $clients]);
    }

    if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
        $ref = trim((string) ($_GET['ref'] ?? ''));

        if ($ref === '') {
            $rawBody = file_get_contents('php://input');
            $data = json_decode((string) $rawBody, true);
            if (is_array($data)) {
                $ref = trim((string) ($data['ref'] ?? ''));
            }
        }

        if ($ref === '') {
            jsonResponse(['success' => false, 'message' => 'Référence dossier manquante.'], 422);
        }

        $statement = $pdo->prepare('DELETE FROM clients WHERE ref = :ref');
        $statement->bindValue(':ref', $ref);
        $statement->execute();

        if ($statement->rowCount() < 1) {
            jsonResponse(['success' => false, 'message' => 'Client introuvable pour suppression.'], 404);
        }

        jsonResponse(['success' => true, 'message' => 'Client et données associées supprimés.']);
    }

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        jsonResponse(['success' => false, 'message' => 'Méthode non autorisée.'], 405);
    }

    $rawBody = file_get_contents('php://input');
    $data = json_decode((string) $rawBody, true);

    if (!is_array($data)) {
        jsonResponse(['success' => false, 'message' => 'Payload JSON invalide.'], 400);
    }

    $nom = trim((string) ($data['nom'] ?? ''));
    $prenom = trim((string) ($data['prenom'] ?? ''));
    $numero = trim((string) ($data['numero'] ?? ''));
    $rue = trim((string) ($data['rue'] ?? ''));
    $ref = trim((string) ($data['ref'] ?? ''));
    $dateDossier = toSqlDate((string) ($data['date'] ?? ''));
    $ville = trim((string) ($data['ville'] ?? ''));
    $cp = trim((string) ($data['cp'] ?? ''));
    $tel = trim((string) ($data['tel'] ?? ''));
    $mail = trim((string) ($data['mail'] ?? ''));

    if ($nom === '' || $ref === '' || $ville === '' || $cp === '') {
        jsonResponse(['success' => false, 'message' => 'Champs obligatoires manquants.'], 422);
    }

    $sql = 'INSERT INTO clients (nom, prenom, numero, rue, ref, date_dossier, ville, cp, tel, mail)
            VALUES (:nom, :prenom, :numero, :rue, :ref, :date_dossier, :ville, :cp, :tel, :mail)
            ON DUPLICATE KEY UPDATE
              nom = VALUES(nom),
              prenom = VALUES(prenom),
              numero = VALUES(numero),
              rue = VALUES(rue),
              date_dossier = VALUES(date_dossier),
              ville = VALUES(ville),
              cp = VALUES(cp),
              tel = VALUES(tel),
              mail = VALUES(mail)';

    $statement = $pdo->prepare($sql);
    $statement->bindValue(':nom', $nom);
    $statement->bindValue(':prenom', $prenom);
    $statement->bindValue(':numero', $numero);
    $statement->bindValue(':rue', $rue);
    $statement->bindValue(':ref', $ref);
    $statement->bindValue(':date_dossier', $dateDossier);
    $statement->bindValue(':ville', $ville);
    $statement->bindValue(':cp', $cp);
    $statement->bindValue(':tel', $tel);
    $statement->bindValue(':mail', $mail);
    $statement->execute();

    jsonResponse(['success' => true, 'message' => 'Client enregistré en BDD MySQL.']);
} catch (Throwable $error) {
    jsonResponse([
        'success' => false,
        'message' => 'Erreur serveur: ' . $error->getMessage(),
    ], 500);
}
