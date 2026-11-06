# Lien du repo # 

https://github.com/Yoyo77400/WTR-TP1-YGE.git


# Documentation PROJET

## Lancement du projet

Seul Docker est nécessaire :

```bash
docker compose up --build -d
```

Le serveur répond sur http://localhost:3000.

- Page de suivi d'une commande : http://localhost:3000/order.html?id=1
- Les données (utilisateurs, produits, commandes) sont stockées avec JsonDB dans `data/` et conservées dans le volume Docker `app-data`.
- Au premier démarrage, 2 utilisateurs et 3 produits sont créés.

En local sans Docker : `npm install` puis `npm run dev`.

### Tester

1. Créer une commande :

```bash
curl -X POST localhost:3000/orders -H "Content-Type: application/json" -d '{"userId":1,"productId":1,"quantity":1}'
```

2. Ouvrir http://localhost:3000/order.html?id=1
3. Expédier la commande, la page se met à jour, puis passe à « Livrée » 20 s plus tard :

```bash
curl -X PATCH localhost:3000/orders/1/status -H "Content-Type: application/json" -d '{"status":"shipped"}'
```

Suivre le flux SSE dans le terminal : `curl -N localhost:3000/orders/1/events`

## Routes

Les erreurs renvoient un JSON `{ "error": "message" }`.

### Utilisateurs

| Méthode | Route | Succès | Erreurs |
|---|---|---|---|
| GET | `/users` | 200 : liste des utilisateurs | |
| GET | `/users/:id` | 200 : l'utilisateur | 400 id invalide, 404 inconnu |

### Produits

| Méthode | Route | Succès | Erreurs |
|---|---|---|---|
| GET | `/products` | 200 : liste des produits | |
| GET | `/products/:id` | 200 : le produit | 400 id invalide, 404 inconnu |

### Commandes

| Méthode | Route | Body | Succès | Erreurs |
|---|---|---|---|---|
| GET | `/orders` | | 200 : liste des commandes | |
| GET | `/orders/:id` | | 200 : la commande | 400 id invalide, 404 inconnue |
| POST | `/orders` | `{ "userId": 1, "productId": 2, "quantity": 1 }` | 201 : commande créée en `preparing`, stock décrémenté | 400 champ manquant ou invalide, 404 client ou produit inconnu, 409 stock insuffisant |
| PATCH | `/orders/:id/status` | `{ "status": "shipped" }` | 200 : commande mise à jour | 400 statut invalide, 404 inconnue, 409 transition interdite |

Statuts : `preparing` → `shipped` → `delivered`, un statut à la fois, sans retour en arrière.
`cancelled` n'est possible que depuis `preparing` et rend le stock au produit.
20 secondes après `shipped`, la commande passe seule à `delivered`.

### Temps réel (SSE)

| Route | Contenu |
|---|---|
| GET `/events` | Tous les événements : commandes et stock |
| GET `/orders/:id/events` | Uniquement les événements de cette commande (404 si inconnue, 204 si terminée) |

Événements :

| Nom | Données | Quand |
|---|---|---|
| `order-created` | la commande | création |
| `order-status-changed` | la commande | passage à `shipped` ou `delivered` |
| `order-cancelled` | la commande | annulation |
| `stock-changed` | le produit | variation de stock |

Chaque flux impose 5 s avant chaque reconnexion (`retry`) et envoie un ping toutes les 15 s. Le flux d'une commande rejoue en plus les événements manqués grâce à `Last-Event-ID` et se ferme une fois la commande livrée ou annulée.

** Dans un soucis de transparence, la documentation ci-dessus a été rédigé par IA, ayant manqué de temps avec mon choix d'architecture pour la rédaction. Les pages web ne servent qu'au minimum et les modification ne sont faisable que par lignes de commandes. ** 