# Fast Print Sahline

Site web de présentation et de commande pour l’atelier Fast Print Sahline.

## Architecture

- `apps/web` : Next.js, TypeScript et CSS responsive, avec parcours catalogue et produit en français, arabe et anglais.
- `apps/api` : API FastAPI versionnée sous `/api/v1`, documentée automatiquement avec OpenAPI.
- PostgreSQL 17 : catalogue, grilles de tarifs, clients, devis, commandes et métadonnées des fichiers.
- `apps/api/migrations` : évolution du schéma avec Alembic. Les migrations s’exécutent au démarrage des conteneurs.
- Un volume Docker privé conserve les fichiers téléversés ; ils ne sont jamais servis directement par une URL publique.

Le backend est un monolithe modulaire, et non un ensemble de microservices à exploiter prématurément. Il sépare le catalogue/tarification, les commandes/devis et les téléversements pour permettre une évolution ultérieure.

### Conventions de structure et de maintenance

- Garder le backend modulaire : `catalog.py` et `catalog_routes.py` pour le catalogue/prix, `order_routes.py` pour les demandes et commandes, `file_storage.py` et `product_image_storage.py` pour les fichiers, `product_image_routes.py` pour les galeries, et `whatsapp.py` / `notification_worker.py` pour les notifications.
- Garder les contrats HTTP dans `schemas.py` et les tables/relations dans `models.py`; ne pas dupliquer la validation métier dans l’interface.
- Garder les écrans Next.js sous `apps/web/app/` et les fonctions client/API partagées sous `apps/web/lib/`. Réutiliser les composants et styles existants avant d’ajouter des abstractions.
- Chaque changement de schéma doit avoir une migration Alembic additive et testable. Ne jamais supprimer ou réécrire une migration déjà appliquée : même une révision vide fait partie de la chaîne et doit rester pour les bases existantes.
- Ne supprimer un fichier que si ses imports, points d’entrée, configurations, commandes Docker, tests et références documentaires confirment qu’il n’est plus utilisé. Les répertoires ignorés tels que `node_modules/`, `.next/`, `.venv/` et les caches sont des dépendances/artéfacts générés, pas des fichiers source à nettoyer à la main.
- Avant de livrer une modification, lancer `.\.venv\Scripts\python.exe -m pytest apps\api\tests`, `npm run lint`, `npm run build`, `.\.venv\Scripts\python.exe -m alembic -c apps\api\alembic.ini check` et `docker compose config --quiet` lorsque les fichiers correspondants ont changé.

## Démarrage local

1. Installer Docker Desktop et Node.js 22 ou plus récent.
2. À la racine du projet, lancer `docker compose up --build`.
3. Ouvrir `http://localhost:3000`, puis choisir un article dans le catalogue. `http://localhost:3001` est également autorisé pour le frontend de développement.
4. Consulter l’API sur `http://localhost:8000/docs`.

Les états de santé sont `http://localhost:8000/health/live` et `http://localhost:8000/health/ready`.

Pour le développement, les valeurs PostgreSQL par défaut de Compose sont locales uniquement. Les origines CORS locales autorisées sont `http://localhost:3000` et `http://localhost:3001`. Avant un déploiement, copier `.env.example` vers `.env`, définir un mot de passe fort, configurer `NEXT_PUBLIC_API_URL` et remplacer `CORS_ORIGINS` par l’origine exacte du site en production (par exemple `["https://votre-domaine.tn"]`).

### Espace équipe

L’espace de gestion est disponible sur `http://localhost:3000/admin` (également lié en bas de page). Un compte administrateur unique est configuré dans `.env`; les mots de passe sont vérifiés avec Argon2id et l’accès utilise une session signée, HttpOnly, avec expiration. Les essais de connexion sont limités et les écritures d’administration refusent les origines étrangères. `.env` est exclu de Git.

Générer un nouveau hash de mot de passe avec
`.\.venv\Scripts\python.exe -c "from getpass import getpass; from pwdlib import PasswordHash; print(PasswordHash.recommended().hash(getpass()))"`
et remplacer `ADMIN_PASSWORD_HASH` dans `.env`, en conservant les guillemets simples autour du hash (il contient des `$`). Le secret de session est une chaîne aléatoire d’au moins 32 caractères. Recréer ensuite l’API avec `docker compose up -d --force-recreate api`. Derrière HTTPS en production, définir `ADMIN_COOKIE_SECURE=true`.

L’onglet **Suivi des commandes** présente chaque dossier dans l’une des cinq étapes de l’atelier, avec un seul bouton pour la prochaine action :

1. **Nouvelles demandes** : saisir le prix total puis l’envoyer au client.
2. **Réponse du client** : quand le client accepte, créer la commande (un fichier à imprimer doit être joint).
3. **À lancer** : cocher « J’ai vérifié le fichier » puis lancer la production ; cette action valide les fichiers et démarre la production en une fois.
4. **En production** : indiquer que la commande est prête.
5. **À remettre** : encaisser le montant affiché et confirmer la remise.

Les dossiers refusés, annulés ou remis sont rangés dans l’**Historique**. Les actions irréversibles demandent une confirmation. La recherche (touche `/`) retrouve un dossier dans toutes les étapes par nom, téléphone (avec ou sans indicatif), référence, produit, description ou adresse, en tolérant les accents et les fautes de frappe. L’espace permet aussi de publier ou retirer des tarifs, de gérer les photos des produits et de suivre les messages WhatsApp.

### Images du catalogue

Dans **Administration → Photos des produits**, l’équipe peut ajouter jusqu’à 20 visuels JPEG, PNG ou WebP (8 Mo maximum par image), choisir une image principale et supprimer des visuels. Les descriptions alternatives sont conservées en français, arabe et anglais ; le catalogue et la page produit affichent automatiquement les images actives.

La table `product_images` conserve seulement les métadonnées, la clé de stockage, le type, la taille et le SHA-256. Les fichiers binaires restent hors de PostgreSQL, dans un volume Docker persistant dédié, distinct des fichiers d’impression téléversés par les clients. Les clés aléatoires, validations de signature, limites de taille, index par produit/ordre et contrainte d’image principale unique gardent la galerie contrôlée. Cette séparation protège la base contre la croissance des fichiers et simplifie les sauvegardes par type de données. Pour déployer plusieurs hôtes ou réplicas API, remplacer le stockage local par un stockage objet partagé (S3/compatible) et, idéalement, un CDN avant d’activer la mise à l’échelle horizontale ; un volume Docker local n’est pas un stockage partagé multi-hôtes.

### Notifications automatiques WhatsApp

Les clients peuvent cocher une case facultative pour consentir aux mises à jour WhatsApp ; sans consentement, aucun message n’est mis en file. Les demandes, devis préparés/clôturés, nouvelles commandes et changements d’état de commande sont enregistrés dans une file PostgreSQL dans la même transaction que le changement métier. Un worker indépendant les envoie par l’API officielle Meta Cloud API, retente les erreurs réseau ou temporaires avec délai progressif et conserve les échecs définitifs pour consultation et nouvelle tentative depuis `/admin`. Le tableau de bord se rafraîchit automatiquement toutes les 30 secondes.

Avant d’activer l’envoi, créer et faire approuver trois modèles WhatsApp Utility (FR, AR, EN) avec le même texte et trois variables de corps, dans cet ordre :

- FR : `Bonjour {{1}}, mise à jour Fast Print Sahline pour {{2}} : {{3}}`
- AR : `مرحباً {{1}}، تحديث من Fast Print Sahline للطلب {{2}}: {{3}}`
- EN : `Hello {{1}}, an update from Fast Print Sahline for {{2}}: {{3}}`

Renseigner les variables Meta dans `.env` : `WHATSAPP_ACCESS_TOKEN` (jeton Meta), `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_API_VERSION` (version Graph API prise en charge, au format `vNN.N`) et les noms exacts approuvés dans `WHATSAPP_TEMPLATE_FR`, `WHATSAPP_TEMPLATE_AR` et `WHATSAPP_TEMPLATE_EN`. Les noms et variables du modèle doivent correspondre. Ne jamais partager le jeton dans le dépôt ou la conversation. Puis exécuter `docker compose up -d --build`; le worker garde les notifications en attente tant que la configuration n’est pas complète. Vérifier l’état et les éventuels échecs dans l’onglet **Messages WhatsApp** de l’administration. Les identifiants Meta et l’approbation des modèles sont requis avant tout envoi réel.

Pour lancer uniquement le frontend hors Docker : exécuter `npm install`, puis `npm run dev`.
Pour démarrer l’API depuis un terminal Windows : créer l’environnement avec
`python -m venv .venv`, installer `.\.venv\Scripts\python.exe -m pip install -r apps\api\requirements.txt`,
puis exécuter `$env:PYTHONPATH="apps\api"; .\.venv\Scripts\python.exe -m uvicorn app.main:app --reload`.
Installer également les dépendances de test avec
`.\.venv\Scripts\python.exe -m pip install -r apps\api\requirements-dev.txt`,
puis lancer `.\.venv\Scripts\python.exe -m pytest apps\api\tests`.

## Données et parcours disponibles

- Tables PostgreSQL : `categories`, `products`, `product_variants`, `product_options`, `product_images`, `price_tiers`, `customers`, `quote_requests`, `orders`, `order_items`, `uploaded_files` et `notification_outbox`.
- Six produits représentatifs trilingues sont ajoutés de façon idempotente au démarrage, puis lus depuis PostgreSQL par le catalogue et les pages produit. L’espace équipe gère les tarifs mais ne permet pas encore de modifier les textes, catégories, variantes ou options des produits ; ces modifications restent à faire dans les données de catalogue.
- Une grille de prix associe produit, variante, options et intervalle de quantité à un prix total en TND (`NUMERIC(12,3)`). Le backend est la seule source de calcul.
- Aucune grille tarifaire réelle n’est préchargée. Une combinaison non tarifée déclenche un devis ; aucun prix indicatif n’est inventé.
- Une commande immédiate nécessite un tarif validé, un fichier prêt à imprimer et le retrait en atelier. Le paiement est dû au retrait.
- La livraison reste une demande de devis tant que ses frais et conditions ne sont pas configurés ; son coût n’est jamais omis du total.
- Les fichiers PDF, PNG, JPEG et TIFF sont limités à 25 Mo par défaut, vérifiés par signature, renommés aléatoirement et stockés dans un volume privé. Le fichier reste en attente de vérification par l’équipe avant production.
- La page `/devis` accepte aussi les projets sur mesure hors catalogue (enseignes, véhicules, décoration…) : type de projet, description, quantité, format, date souhaitée, aide graphique et jusqu’à 5 fichiers. La demande est enregistrée dans `quote_requests` sans produit du catalogue, puis suit le même parcours de devis et de commande.
- La recherche du site (loupe de la barre de navigation, `Ctrl K` ou `/`) couvre les produits, les savoir-faire, les photos de réalisations, la FAQ et les pages utiles, en français, arabe et anglais, avec tolérance aux accents, aux fautes de frappe et aux synonymes courants.

## Endpoints catalogue et commande

- `GET /api/v1/catalog/categories`
- `GET /api/v1/catalog/products` (filtre facultatif `?category=slug`)
- `GET /api/v1/catalog/products/{slug}`
- `POST /api/v1/catalog/products/{product_id}/price`
- `POST /api/v1/quote-requests`
- `POST /api/v1/project-quote-requests` (projet sur mesure sans produit du catalogue)
- `POST /api/v1/orders`
- `POST /api/v1/uploads`

Les nouveaux tarifs doivent être approuvés par l’équipe dans l’interface d’administration protégée. Ne jamais exposer une écriture publique des prix. Le suivi client en libre-service et le scan antivirus sont à prévoir avant la mise en production.

Mettre en place des sauvegardes PostgreSQL et une politique d’expiration des fichiers de demandes abandonnées avant la mise en production.
