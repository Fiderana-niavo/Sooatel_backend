# Base de Connaissances - Sooatel ERP

Ce document est la source de référence principale du chatbot d'assistance Sooatel.
Il décrit, pour chaque module, les prérequis, les étapes à suivre et les règles métier à respecter.

---

## 📌 STRUCTURE DU MENU LATÉRAL (SIDEBAR SOOATEL ERP)

Dans Sooatel ERP, l'utilisateur effectue toutes ses actions en passant par le **menu latéral (sidebar à gauche)**. La barre latérale est découpée en 7 sections accordéons principales :

1. **Opérations restaurant** (Espace Restaurant / Utopia) :
   - **Tableau de bord** : Statistiques et pilotage des ventes.
   - **Caisse & PDV** : Prise de commande, encaissement direct, ouverture/fermeture du journal de caisse.
   - **Historique des Ventes** : Consultation des ventes passées, réouvertures et annulations.
   - **Revenus** : Recettes, suivi financier et bouton "Journaliser les ventes".
   - **Mouvements de Caisse** : Entrées et sorties exceptionnelles de caisse (hors ventes).
   - **Catalogue & Menus** :
     - Onglet **Plats du Menu** : Création et gestion des plats/boissons vendus aux clients.
     - Onglet **Catégories de Menu** : Entrées, Plats, Desserts, Boissons...

2. **Opérations hôtel** (Espace Hôtel / Sooatel) :
   - **Chambres & Évènements** :
     - Onglet **Chambres** : Gestion des chambres et suites.
     - Onglet **Types de Chambres** : Standard, Suite, VIP...
     - Onglet **Évènements** : Salles et réservations d'évènements.

3. **Inventaire & Stocks** :
   - **Gestion des Produits & Inventaire** :
     - Onglet **Articles** : Ingrédients, matières premières, fournitures et produits finis.
     - Onglet **Types d'Articles** : Matière première, Produit fini, Boisson...
     - Onglet **Unités de Mesure** : kg, litre, pièce...
     - Onglet **Unités Alternatives** : Conditionnements (cartons, packs, sacs) et ratios de conversion.
   - **Niveaux de Stock** : Consultation des quantités disponibles et seuils d'alerte.
   - **Mouvements** : Mouvements manuels d'entrée et de sortie de stock.
   - **Inventaire Physique** : Sessions de comptage physique et ajustement des écarts.
   - **Audits & Alertes** : Alertes de rupture et audits de stock.
   - **Prévisions IA** : Analyse prédictive des besoins en réapprovisionnement.

4. **Achats & Fournisseurs** :
   - **Fournisseurs & Achats** : Fiches des fournisseurs, articles fournis et paiements fournisseurs.
   - **Commandes Fournisseurs** : Bons de commande d'achat (création, confirmation, modification, annulation).
   - **Livraisons Fournisseurs** : Réception des marchandises, bons de livraison et validation avec impact direct sur le stock.

5. **Production Cuisine** :
   - **Recettes** : Fiches techniques des plats (composition en ingrédients et rendement).
   - **Production de Plats** : Ordres de fabrication, préparation en batch, déduction des ingrédients et entrée en stock du plat préparé.

6. **Administration RH** :
   - **Annuaire du Personnel** : Liste et fiches des employés, confirmation de période d'essai.
   - **Bien-être de l'Équipe** : Suivi social et climat d'équipe.
   - **Gestion des Utilisateurs** : Création des comptes d'accès, attribution des rôles et réinitialisation de mot de passe.
   - **Rôles et Permissions** : Définition des rôles et permissions associées.
   - **Gestion des Postes** : Postes de travail (Serveur, Chef, Réceptionniste...).
   - **Besoins en Personnel** : Recrutements et besoins de poste.

7. **Temps & Planification** :
   - **Équipes & Quarts** : Constitution des équipes et définition des quarts/shifts (matin, soir, nuit).
   - **Emploi du Temps** : Planning hebdomadaire des employés.
   - **Congés & Absences** : Demandes de congés et validations managériales.
   - **Congés à venir** : Calendrier prévisionnel des congés.
   - **Types de Congés** : Types de congés (payés, maladie, sans solde...).

8. **Profil Utilisateur (Bas de la barre latérale)** :
   - Clic sur la carte utilisateur (avatar/nom) pour ouvrir le menu : *Modifier le mot de passe*, *Modifier le profil*, *Déconnexion*.

---

## TABLE DES MATIÈRES

1. Catalogue / Configuration de Base
2. Menu Restaurant
3. Recettes
4. Fournisseurs
5. Commandes Fournisseurs (Achats)
6. Livraisons
7. Stock & Inventaire
8. Production de Plats
9. Ventes
10. Paiements & Caisse
11. Employés & RH
12. Congés
13. Planning & Horaires
14. Rôles & Permissions
15. Authentification & Comptes Utilisateurs
16. Tableau de Bord
17. Traçabilité & Logs d'Audit

---

## 1. Catalogue / Configuration de Base

### 1.1 Types d'articles (Item Types)

Les types d'articles classifient les articles (ex: Matière première, Produit fini, Boisson...).

**Prérequis :** Aucun.

**Étapes :**
1. Dans le menu latéral (sidebar), ouvrir la section **Inventaire & Stocks**.
2. Cliquer sur **Gestion des Produits & Inventaire**.
3. Sélectionner l'onglet **Types d'Articles**.
4. Cliquer sur **Nouveau type**.
5. Saisir le libellé du type (ex : Matière première, Produit fini, Boisson).
6. Enregistrer.

---

### 1.2 Unités de mesure (Units of Measure)

Les unités de mesure définissent les unités de base pour le stock (ex: kg, litre, pièce).

**Prérequis :** Aucun.

**Étapes :**
1. Dans le menu latéral (sidebar), ouvrir la section **Inventaire & Stocks**.
2. Cliquer sur **Gestion des Produits & Inventaire**.
3. Sélectionner l'onglet **Unités de Mesure**.
4. Cliquer sur **Nouvelle unité**.
5. Saisir le nom et l'abréviation (ex : Kilogramme / kg, Litre / l, Pièce / pce).
6. Enregistrer.

---

### 1.3 Articles (Items) — Ingrédients, Plats et Fournitures

Les articles sont la brique fondamentale de l'application. Tout — ingrédient, matière première, plat produit, boisson, matériel — est un article.

#### Comment créer un ingrédient ou un article ?
Dans Sooatel ERP, **il n'existe pas de menu séparé nommé "Ingrédient"** : un ingrédient se crée et se gère comme un **Article** (généralement avec le type d'article "Matière première" ou "Ingrédient").

**Prérequis :**
- Au moins un type d'article doit exister (ex : Matière première, Ingrédient, Boisson).
- Au moins une unité de mesure doit exister (ex : kg, litre, pièce).

**Étapes pour créer un ingrédient ou article :**
1. Dans le menu latéral (sidebar), ouvrir la section **Inventaire & Stocks**.
2. Cliquer sur **Gestion des Produits & Inventaire**.
3. Sélectionner l'onglet **Articles**.
4. Cliquer sur **Nouvel article**.
5. Remplir les champs :
   - **Libellé :** Le nom de l'ingrédient ou plat (ex : Farine, Tomate, Mozzarella, Huile).
   - **Référence :** Le code ou la référence interne (ex : ING001, ART001).
   - **Type d'article :** Sélectionner "Matière première" ou "Ingrédient".
   - **Unité de mesure de base :** Choisir l'unité de stock (kg, litre, pièce).
6. Enregistrer.

IMPORTANT : Sans article, il est impossible de créer un menu, de composer une recette (les ingrédients d'une recette sont des articles), un produit fournisseur ou de gérer le stock.

---

### 1.4 Unités alternatives de l'article (Conditionnements)

#### Qu'est-ce qu'une unité alternative ?
Chaque article possède une **unité de base** (l'unité de stock, ex: la bouteille, le kilogramme ou le litre) dans laquelle son inventaire est mesuré.
Cependant, dans la réalité opérationnelle :
- **À l'achat :** Les fournisseurs livrent souvent par conditionnements groupés (ex: un carton de 24 bouteilles, un pack de 6 canettes, un sac de 25 kg de farine, un casier de 12).
- **En cuisine / recettes :** On utilise parfois des formats ou portions spécifiques.

Une **unité alternative** permet de définir un format de conditionnement pour un article et de préciser son **ratio de conversion vers le stock** (combien d'unités de stock de base contient ce conditionnement).

**Exemples concrets :**
- **Article "Bouteille de Vin 75cl"** :
  - Unité de base (stock) : *Bouteille*
  - Unité alternative : *Carton de 6* → Ratio = 6 (1 carton correspond à 6 bouteilles en stock).
- **Article "Farine de blé"** :
  - Unité de base (stock) : *Kilogramme (kg)*
  - Unité alternative : *Sac de 25 kg* → Ratio = 25 (1 sac correspond à 25 kg en stock).
- **Article "Boisson Canette 33cl"** :
  - Unité de base (stock) : *Canette*
  - Unité alternative : *Pack de 24* → Ratio = 24 (1 pack correspond à 24 canettes en stock).

Grâce à ce mécanisme, lors d'une commande fournisseur ou d'une réception de marchandise, si vous commandez "3 packs", le système calcule et crédite automatiquement 72 canettes (3 x 24) en stock, sans aucun calcul manuel !

**Règles importantes :**
- L'unité alternative ne peut pas être la même que l'unité de base de l'article (l'unité de base ne peut pas être sa propre unité alternative).
- Une unité alternative ne peut être configurée qu'une seule fois par article (pas de doublon pour le même article).
- Un même article peut avoir plusieurs unités alternatives différentes (ex: un pack de 6 ET un carton de 24).

#### Comment créer une unité alternative ?

**Prérequis :**
- L'article doit déjà exister avec son unité de mesure de base définie.
- L'unité de mesure alternative (ex: Carton, Pack, Sac, Boîte) doit exister dans la liste des unités de mesure.

**Étapes :**
1. Dans le menu latéral (sidebar), ouvrir la section **Inventaire & Stocks**.
2. Cliquer sur **Gestion des Produits & Inventaire**.
3. Sélectionner l'onglet **Unités Alternatives**.
4. Cliquer sur **Nouvelle unité alternative**.
5. Sélectionner l'article concerné.
6. Choisir l'unité alternative souhaitée dans la liste des unités.
7. Saisir le ratio de conversion vers le stock (ex : saisir `24` pour un carton contenant 24 canettes).
8. Enregistrer.

---

### 1.5 Catégories de menu (Menu Categories)

Les catégories regroupent les plats du menu (ex: Entrées, Plats, Desserts, Boissons).

**Prérequis :** Aucun.

**Étapes :**
1. Dans le menu latéral (sidebar), ouvrir la section **Opérations restaurant**.
2. Cliquer sur **Catalogue & Menus**.
3. Sélectionner l'onglet **Catégories de Menu**.
4. Cliquer sur **Nouvelle catégorie**.
5. Saisir le libellé (ex : Entrées, Plats, Desserts, Boissons).
6. Enregistrer.

---

### 1.6 Modes de paiement (Payment Methods)

**Prérequis :** Aucun.

**Étapes :**
1. Dans le menu latéral (sidebar), accéder à la configuration des paiements (section **Opérations restaurant** > **Mouvements de Caisse** ou paramètres de l'établissement).
2. Configurer les modes (espèces, carte bancaire, Mobile Money Mvola/Orange/Airtel, virement, etc.).

---

### 1.7 Types de chambres & Chambres

**Prérequis :** Un type de chambre doit exister avant de créer une chambre.

**Étapes :**
1. Dans le menu latéral (sidebar), basculer dans l'espace Hôtel (Sooatel) si nécessaire et ouvrir la section **Opérations hôtel**.
2. Cliquer sur **Chambres & Évènements**.
3. Pour les types de chambres : aller dans l'onglet **Types de Chambres** et cliquer sur **Nouveau type** (Standard, Suite, VIP...).
4. Pour les chambres : aller dans l'onglet **Chambres** et cliquer sur **Nouvelle chambre** en lui associant son type.

---

## 2. Menu Restaurant

Le menu contient les plats vendus aux clients. Chaque élément du menu est lié à un article du catalogue.

### 2.1 Créer un élément de menu

**Prérequis :**
1. Un article doit exister (c'est le plat à vendre).
2. Une catégorie de menu doit exister.

**Étapes :**
1. Dans le menu latéral (sidebar), ouvrir la section **Opérations restaurant**.
2. Cliquer sur **Catalogue & Menus**.
3. Sélectionner l'onglet **Plats du Menu**.
4. Cliquer sur **Nouvel élément** (ou **Ajouter un plat**).
5. Sélectionner l'article correspondant au plat (créé au préalable dans le stock).
6. Sélectionner la catégorie de menu (ex : Entrées, Plats, Boissons).
7. Définir le prix de vente et le coût unitaire.
8. Optionnellement, saisir une référence.
9. Enregistrer.

RÈGLE MÉTIER : Pour qu'un plat puisse être vendu, il doit impérativement être enregistré dans le menu. Créer un article seul ne suffit pas — il faut aussi l'ajouter au menu.

### 2.2 Prix produits

Les prix des produits peuvent être historisés dans le module Prix produits, permettant de suivre l'évolution des prix au fil du temps.

---

## 3. Recettes

Les recettes définissent la composition d'un plat (quels ingrédients, en quelles quantités).

### 3.1 Créer une recette

**Prérequis :**
1. Un article de type "plat produit" doit exister (c'est le résultat de la recette).
2. Les ingrédients (autres articles) doivent exister.
3. Les unités d'article doivent être configurées si l'on veut utiliser des conditionnements (optionnel).

**Étapes :**
1. Dans le menu latéral (sidebar), ouvrir la section **Production Cuisine**.
2. Cliquer sur **Recettes**.
3. Cliquer sur **Nouvelle recette**.
3. Sélectionner l'article produit (le plat final).
4. Définir la quantité produite (rendement / yield).
5. Ajouter les lignes d'ingrédients : pour chaque ingrédient, saisir la quantité et l'unité.
6. Activer la recette (une seule recette active par article à la fois).
7. Enregistrer.

RÈGLE MÉTIER : Une seule recette peut être active par article. Pour modifier, désactiver l'ancienne et activer la nouvelle.

RÈGLE MÉTIER : La recette est indispensable pour la production de plats — sans recette active, la production ne peut pas être validée.

---

## 4. Fournisseurs

### 4.1 Créer un fournisseur

**Prérequis :** Aucun.

**Étapes :**
1. Dans le menu latéral (sidebar), ouvrir la section **Achats & Fournisseurs**.
2. Cliquer sur **Fournisseurs & Achats**.
3. Cliquer sur **Nouveau fournisseur**.
3. Saisir le nom, contact, adresse.
4. Enregistrer.

---

### 4.2 Produits fournisseur (Supplier Products)

Les produits fournisseurs représentent ce que chaque fournisseur vend (son catalogue propre).

**Prérequis :**
- Un fournisseur doit exister.
- Un article doit exister.

**Étapes :**
1. Dans le menu latéral (sidebar), aller dans **Achats & Fournisseurs** > **Fournisseurs & Achats**.
2. Ouvrir la fiche du fournisseur concerné.
3. Aller dans l'onglet **Produits**.
4. Cliquer sur **Ajouter un produit**.
4. Lier le produit fournisseur à un article du catalogue.
5. Saisir le prix d'achat actuel.
6. Enregistrer.

---

### 4.3 Articles fournis

Les articles fournis représentent le lien entre un produit du catalogue fournisseur et un article interne. Ce sont eux qui sont sélectionnés dans les lignes de commande.

Ces éléments sont créés automatiquement lorsqu'on ajoute un produit à un fournisseur.

---

## 5. Commandes Fournisseurs (Achats)

### 5.1 Cycle de vie d'une commande

Une commande fournisseur passe par les étapes suivantes :

1. **Créée** — La commande vient d'être enregistrée.
2. **Confirmée** — La commande a été validée et peut recevoir des livraisons.
3. **Partiellement livrée** — Une partie des produits a été reçue.
4. **Livrée** — Tous les produits ont été reçus.
5. **Annulée** — La commande a été annulée (impossible si elle est entièrement livrée).

**Prérequis :**
1. Un fournisseur doit exister.
2. Des produits fournisseur (articles fournis) doivent exister.
3. Au moins un employé doit exister (pour être désigné acheteur).

---

### 5.2 Créer une commande

**Étapes :**
1. Dans le menu latéral (sidebar), ouvrir la section **Achats & Fournisseurs**.
2. Cliquer sur **Commandes Fournisseurs**.
3. Cliquer sur **Nouvelle commande**.
3. Sélectionner le fournisseur.
4. Sélectionner l'acheteur (employé).
5. Ajouter les lignes de commande : article fourni, quantité, prix unitaire.
6. Option : cocher "Livraison déjà effectuée" si les produits arrivent en même temps que la commande.
7. Enregistrer. La commande est maintenant créée.

---

### 5.3 Confirmer une commande

Une commande doit être confirmée avant de pouvoir lui associer une livraison.

RÈGLE : Seule une commande nouvellement créée (non encore confirmée) peut être confirmée.

**Étapes :**
1. Dans le menu latéral (sidebar), aller dans **Achats & Fournisseurs** > **Commandes Fournisseurs**.
2. Ouvrir la commande concernée (au statut *Créée*).
3. Cliquer sur **Confirmer**.
3. La commande est maintenant confirmée et prête à recevoir des livraisons.

---

### 5.4 Annuler une commande fournisseur

#### Quand peut-on annuler une commande ?
- Une commande peut être annulée tant qu'elle n'est **pas entièrement livrée**.
- Si la commande est au statut *Créée* ou *Confirmée*, l'annulation est possible.
- **Attention aux livraisons en cours :** S'il existe une livraison actuellement ouverte (en cours de saisie, non encore validée), le système bloque l'annulation et demande de traiter d'abord cette livraison : soit la valider, soit la supprimer.
- **Quand est-ce impossible ?** Une commande *Entièrement livrée* ne peut plus être annulée, car toutes les marchandises sont déjà réceptionnées et enregistrées en stock.

#### Règle essentielle : Que se passe-t-il en cas d'annulation après des livraisons partielles ?
Si la commande a déjà fait l'objet d'une ou plusieurs livraisons préalablement validées :
1. **Les articles déjà reçus restent définitivement en stock :** Tout ce qui a été livré et validé est conservé. Le stock n'est pas diminué et les réceptions passées restent intactes.
2. **Uniquement les éléments non encore reçus sont annulés :** L'annulation ne concerne **que** le reliquat (la partie restante de la commande qui n'avait pas encore été livrée).
3. La commande est alors clôturée : aucune nouvelle livraison ne pourra plus être créée pour cette commande.

> 👉 **Exemple concret :**
> Vous commandez 100 bouteilles d'huile.
> Vous recevez une première livraison de 40 bouteilles (qui entrent bien en stock).
> Le fournisseur vous informe qu'il est en rupture de stock pour les 60 bouteilles restantes.
> Vous cliquez sur **Annuler la commande** :
> - Les 40 bouteilles restent bien dans votre stock.
> - Seules les 60 bouteilles non reçues sont annulées.
> - La commande est définitivement terminée.

---

### 5.5 Modifier une commande fournisseur

#### Quand peut-on modifier une commande ?
- Une commande peut être modifiée tant qu'elle est au statut *Créée* ou *Confirmée*.
- Elle ne peut plus être modifiée si elle a déjà été annulée.

#### Conditions et règles strictes de modification :
1. **Pas de livraison ouverte :** Impossible de modifier une commande tant qu'une livraison est en cours de saisie (ouverte/non validée). Il faut d'abord valider ou supprimer cette livraison.
2. **Fournisseur verrouillé après livraison :** Si au moins un article a déjà été réceptionné, il est strictement **impossible de changer le fournisseur** de la commande.
3. **Interdiction de supprimer un article déjà livré :** Vous ne pouvez pas retirer de la commande un article qui a déjà fait l'objet d'une réception.
4. **Plancher de quantité (Règle du déjà livré) :**
   - Vous pouvez augmenter la quantité ou la réduire, mais **la quantité commandée ne peut jamais descendre en dessous de la quantité déjà livrée**.
   - 👉 *Exemple :* Si vous aviez commandé 50 cartons et que 20 cartons ont déjà été réceptionnés, vous pouvez modifier la commande pour 30, 45 ou 80 cartons. En revanche, **impossible de saisir 15 cartons**, car 20 sont déjà physiquement dans votre stock.
5. **Ajouter de nouveaux articles :** Il est toujours possible d'ajouter de nouvelles lignes d'articles à la commande.

---

## 6. Livraisons

### 6.1 Cycle de vie d'une livraison

Une livraison passe par deux étapes :
1. **En cours** — La livraison est enregistrée mais le stock n'a pas encore été mis à jour.
2. **Validée** — La livraison est confirmée, le stock est mis à jour.

**Prérequis :** Une commande confirmée doit exister.

---

### 6.2 Créer une livraison

**Étapes :**
1. Dans le menu latéral (sidebar), aller dans **Achats & Fournisseurs** > **Livraisons Fournisseurs** (ou depuis **Commandes Fournisseurs** sur la commande confirmée).
2. Cliquer sur **Nouvelle livraison** (ou ouvrir la commande confirmée et cliquer sur *Nouvelle livraison*).
3. Saisir les quantités reçues par article.
4. Optionnellement saisir un acompte/paiement lié à la livraison.
5. Enregistrer. La livraison est maintenant en cours (le stock n'est pas encore modifié).

IMPORTANT : Le stock n'est PAS encore mis à jour à la création de la livraison. Il le sera seulement à la validation.

---

### 6.3 Valider une livraison

**Étapes :**
1. Dans le menu latéral (sidebar), aller dans **Achats & Fournisseurs** > **Livraisons Fournisseurs**.
2. Ouvrir la livraison *En cours*.
3. Vérifier les quantités reçues et cliquer sur **Valider**.
3. Le stock des articles reçus est mis à jour automatiquement.
4. Le prix de revient moyen des articles est recalculé.
5. La commande passe au statut Livrée ou Partiellement livrée selon les quantités.
6. Les recettes actives voient leur coût recalculé automatiquement.

---

## 7. Stock & Inventaire

### 7.1 Mouvements de stock

Les mouvements de stock tracent toutes les entrées/sorties d'articles.

Types de mouvements :
- Entrée de stock : réception d'une livraison, validation d'une production, ajustement manuel.
- Sortie de stock : vente d'un article, consommation d'ingrédients lors d'une production, ajustement manuel.

**Prérequis :** Un article doit exister.

**Étapes pour un mouvement manuel :**
1. Dans le menu latéral (sidebar), ouvrir la section **Inventaire & Stocks**.
2. Cliquer sur **Mouvements**.
3. Cliquer sur **Nouveau mouvement**.
3. Sélectionner l'article, la direction (entrée/sortie), la quantité, la raison.
4. Enregistrer.

---

### 7.2 Inventaire

**Prérequis :** Des articles avec un stock existant doivent être présents.

**Étapes :**
1. Dans le menu latéral (sidebar), ouvrir la section **Inventaire & Stocks**.
2. Cliquer sur **Inventaire Physique**.
3. Lancer une nouvelle session de comptage (**Nouveau comptage**).
3. Saisir les quantités physiquement comptées.
4. Valider les écarts pour ajuster le stock.

---

## 8. Production de Plats

La production de plats est le processus par lequel des **ingrédients bruts en stock sont transformés en un plat ou un article semi-fini prêt à être utilisé ou vendu**. Elle consomme des matières premières et génère un produit fini dans le stock.

---

### 8.1 Quand et pourquoi faire une production ?

Certains plats ou préparations nécessitent d'être élaborés **à l'avance**, en grande quantité, avant même d'être commandés par un client. La production est utilisée dans ces cas précis.

**Exemples concrets :**
- **Pâtes à pizza :** La cuisine prépare en début de journée une grande quantité de pâtons. Cette opération consomme de la farine, de la levure, de l'eau et de l'huile du stock (sorties d'ingrédients), et crédite en retour un stock de "Pâte à pizza prête" (entrée du produit fini). Lors de la vente d'une pizza, c'est ce stock de pâte déjà prête qui est consommé.
- **Sauces maison, bouillons de base, desserts préparés :** Toute préparation faite à l'avance et stockée avant d'être utilisée suit le même principe.

**Ce que la production N'est PAS :** Pour les articles vendus directement et préparés à la commande sans stock intermédiaire (ex : une simple boisson en bouteille ou un article standard), il n'y a pas de production. Le stock de ces articles est directement déduit lors de la clôture de la vente.

---

### 8.2 Le Rendement de production

Le **rendement de production** (ou taux de rendement) représente la proportion de produit fini effectivement obtenu par rapport aux matières premières consommées. Dans la pratique, toutes les matières premières ne se transforment pas intégralement en produit exploitable (épluchures, pertes à la cuisson, évaporation...).

**Exemple :**
- On utilise 10 kg de tomates fraîches pour faire de la sauce tomate.
- Après cuisson et filtration, on n'obtient que 6 kg de sauce.
- Le **rendement est de 60 %** (6 kg produits / 10 kg consommés).

Dans Sooatel, ce rendement est défini au niveau de la **recette** de l'article. Il permet au système de calculer automatiquement la juste quantité d'ingrédients à déduire pour obtenir la quantité de produit fini souhaitée, en tenant compte de ces pertes inhérentes au processus.

---

### 8.3 Cycle de vie d'une production

Une production passe par deux étapes :
1. **Brouillon** — La production est créée mais le stock n'est pas encore impacté.
2. **Validée** — La production est confirmée, les ingrédients sont consommés et le plat est ajouté au stock.

**Prérequis :**
1. Un article de type plat doit exister.
2. Une recette active doit être associée à cet article.
3. Les ingrédients de la recette doivent être en stock en quantité suffisante.

---

### 8.4 Créer une production

**Étapes :**
1. Dans le menu latéral (sidebar), ouvrir la section **Production Cuisine**.
2. Cliquer sur **Production de Plats**.
3. Cliquer sur **Nouvelle production**.
3. Sélectionner l'article produit (le plat ou le semi-fini à préparer).
4. Saisir la quantité à produire.
5. Optionnellement saisir des notes (ex : "Batch du matin").
6. Enregistrer. La production est créée en brouillon (le stock n'est pas encore modifié).

---

### 8.5 Valider une production

**RÈGLES :**
- Le stock de **chaque ingrédient** est vérifié : si un seul ingrédient est insuffisant, la validation de la production entière échoue.
- À la validation, deux mouvements de stock sont créés automatiquement :
  1. **Sorties** : Les ingrédients de la recette sont débités du stock (mouvement de stock sortie).
  2. **Entrée** : Le plat ou article fini produit est crédité au stock (mouvement de stock entrée).
- Une production déjà **validée ne peut PAS être modifiée ni supprimée**.

**Étapes :**
1. Dans le menu latéral (sidebar), aller dans **Production Cuisine** > **Production de Plats**.
2. Ouvrir la production en brouillon.
3. Cliquer sur **Valider**.
3. Le système vérifie les stocks et effectue les mouvements automatiquement.

---

## 9. Ventes (Point de Vente / POS)

Le module Ventes permet d'enregistrer et de gérer les commandes clients du restaurant, du bar ou du room service.

---

### 9.1 Créer et configurer une vente

**Prérequis :**
- Des éléments de menu doivent être configurés (les plats et boissons vendus).
- Un serveur ou vendeur (employé) doit être désigné.
- Si le client paie directement sur place : un journal de caisse doit être ouvert.

**Étapes de saisie générale :**
1. Dans le menu latéral (sidebar), ouvrir la section **Opérations restaurant**.
2. Cliquer sur **Caisse & PDV** (ou **Historique des Ventes**).
3. Cliquer sur **Nouvelle vente** (ou démarrer une commande).
2. Renseigner le **numéro de facture** et la **date de vente**.
3. Sélectionner le **vendeur / serveur** responsable de la commande.
4. Choisir le **lieu de consommation** :
   - **Consommation au Restaurant :** Saisir le numéro de table (ex: Table 12).
   - **Service en Chambre (Room Service) :** Sélectionner le numéro de la chambre du client.
5. Optionnellement : saisir une consigne ou remarque (ex: "Sans piment", "Viande bien cuite").

---

### 9.2 Ajouter des plats à la commande

Pour composer la commande du client :
1. Cliquer sur le bouton **"+"** ou **"Ajouter"** pour créer une nouvelle ligne de plat.
2. Dans la ligne ajoutée, sélectionner le plat ou la boisson souhaité(e) dans la liste déroulante du menu.
3. Le prix unitaire s'affiche automatiquement.
4. Renseigner la **quantité** commandée (par défaut 1).
5. Pour chaque nouveau plat ou boisson de la commande, **cliquer à nouveau sur le bouton Ajouter** pour insérer une nouvelle ligne.
6. Le montant total de la commande se recalcule instantanément à chaque ajout.
7. Si un plat a été ajouté par erreur : cliquer sur l'icône de suppression (la corbeille) à côté du plat concerné pour le retirer.

---

### 9.3 Règlement et Modes de Paiement

Il existe deux manières fondamentales de régler la facture d'une vente :

#### Option 1 : Imputer sur la chambre (Payer avec la facture de l'hôtel)
- **Principe :** Si le client est logé dans l'hôtel, il n'a pas besoin de payer immédiatement au restaurant ou au bar.
- **Comment faire :** Cocher la case **"Payer à la caisse de l'hôtel (Imputer sur la chambre)"** et sélectionner la chambre concernée.
- **Règlement :** La note de restaurant est automatiquement transférée sur la note globale de la chambre. Le client règlera l'ensemble de ses consommations en même temps que sa facture d'hébergement lors de son départ (**check-out**) à la réception / caisse centrale de l'hôtel.

#### Option 2 : Paiement direct au restaurant / bar
- **Principe :** Pour les clients de passage ou les résidents de l'hôtel qui souhaitent régler immédiatement leur addition sur place.
- **Moyens de paiement acceptés :**
  - **En Cash (Espèces) :** Encaissement immédiat dans le tiroir-caisse.
  - **En Mobile Money (Mvola, Orange Money, Airtel Money) :** Paiement direct par transfert mobile.
  - **Par Carte bancaire** ou autres modes configurés.
- **Paiements partiels et multi-modes :**
  - Un client peut combiner plusieurs moyens de paiement (ex : une partie en Cash et le solde en Mobile Money).
  - Une vente peut être enregistrée avec un acompte, laissant un solde restant à payer.
  - Dès que le solde restant atteint zéro, la vente passe automatiquement au statut **Payée**.

---

### 9.4 Clôturer une vente (Le client ne veut plus rien commander)

La **clôture d'une vente** est l'acte par lequel le serveur ou le caissier signifie que le client a terminé sa commande et ne souhaite plus ajouter de plats ou de boissons.

**Ce qui se passe lors de la clôture :**

1. **Verrouillage définitif de la commande :** Une vente clôturée ne peut **plus être modifiée**. Il est impossible d'ajouter de nouveaux articles, de supprimer des lignes ou de changer les quantités. La commande est figée.
2. **Déduction du stock :** C'est **au moment de la clôture** que le stock des articles vendus (boissons, plats standard préparés à la commande) est automatiquement déduit. Ce mécanisme évite des mouvements de stock permanents et potentiellement annulés au cours d'une vente encore ouverte.
   > ⚠️ Exception : les articles issus d'une **production** (ex: pâtes à pizza préparées en avance) ont déjà eu leur stock consommé lors de la validation de la production. Leur stock n'est pas déduit une seconde fois à la clôture de la vente.
3. **Seul le paiement reste possible :** Après clôture, la seule action possible sur la vente est son règlement financier (cash, mobile money, carte, ou imputation chambre).

**Quand clôturer une vente ?**
- Lorsque le client demande l'addition et ne souhaite plus rien consommer.
- Lorsque le service en chambre est terminé.
- Avant de demander le paiement, le serveur doit clôturer la vente.

**Important :** Ne pas confondre **clôturer** (fin de commande → verrouillage et déduction stock) et **payer** (règlement financier de la facture clôturée).

---

### 9.5 Cycle de vie complet d'une vente

1. **Ouverte / En cours :** La vente est créée. Le serveur peut librement ajouter, modifier ou supprimer des plats. Aucun mouvement de stock n'a encore eu lieu pour cette vente.
2. **Clôturée :** Le client a fini de commander. La commande est verrouillée, les stocks sont déduits automatiquement. Seul le paiement est désormais possible.
3. **Payée :** L'intégralité du montant a été encaissée (solde restant = 0). La vente est finalisée.
4. **Annulée / Remboursée :** En cas d'erreur ou de réclamation, un responsable peut procéder à un remboursement partiel ou total. Le stock des articles est alors automatiquement réintégré et une sortie de caisse est enregistrée.

## 10. Paiements & Caisse

Le module Caisse gère tous les flux financiers de l'établissement (entrées et sorties d'argent liquide, mobile money, cartes bancaires).

---

### 10.1 Le rôle du Journal de caisse

Le **journal de caisse** est le registre financier officiel qui trace tous les encaissements et décaissements au cours d'un service (shift).

**Règles fondamentales :**
- **Un seul journal ouvert à la fois :** Il est techniquement impossible d'avoir deux journaux ouverts simultanément. L'équipe du nouveau service ne peut pas ouvrir son journal tant que le service précédent n'a pas fermé le sien.
- **Obligation de fermer le journal à chaque fin de service :** Chaque service (midi, soir, nuit) constitue une période comptable distincte qui doit être clôturée par le caissier responsable.

---

### 10.2 Ouvrir le journal de caisse (Au début de chaque service)

Au début de sa prise de poste, le caissier ouvre le journal pour son service.

**Prérequis :**
- Le journal du service précédent doit être fermé.
- Un caissier (employé) doit être désigné.

**Reprise automatique du solde (Fond de caisse) :**
- Le système reprend automatiquement le solde théorique de clôture du journal précédent, décomposé par mode de paiement (espèces, mobile money, etc.).
- Aucun calcul manuel n'est nécessaire pour définir le fond de caisse initial : la continuité financière est garantie.

**Étapes :**
1. Dans le menu latéral (sidebar), ouvrir la section **Opérations restaurant**.
2. Cliquer sur **Caisse & PDV** (ou **Mouvements de Caisse**).
3. Cliquer sur **Ouvrir un journal de caisse**.
3. Sélectionner le caissier responsable du service.
4. Vérifier les soldes de départ repris automatiquement.
5. Enregistrer pour ouvrir le journal.

---

### 10.3 Toutes les actions BLOQUÉES sans journal ouvert

Si aucun journal de caisse n'est actif, le système verrouille automatiquement toutes les transactions d'argent par mesure de sécurité :

1. **Aucun encaissement de vente directe :** Impossible d'enregistrer un paiement client au restaurant ou au bar (que ce soit en cash, mobile money ou carte bancaire).
2. **Aucune journalisation des ventes :** Le système affiche une boîte de dialogue vous indiquant : *"Vous devez avoir un journal de caisse actif pour journaliser les ventes. Voulez-vous ouvrir un journal maintenant ?"*.
3. **Aucun paiement fournisseur :** Tout règlement de facture fournisseur est bloqué.
4. **Aucun mouvement de caisse manuel :** Impossible d'enregistrer une entrée ou une sortie d'argent exceptionnelle.
5. **Aucun remboursement client :** Comme un remboursement nécessite une sortie d'argent de la caisse, il est impossible à valider sans journal ouvert.

*(Seule exception : enregistrer une commande imputée sur la chambre de l'hôtel, car elle ne fait l'objet d'aucun encaissement immédiat au restaurant).*

---

### 10.4 "Journaliser les ventes" : Vérifier le compte réel petit à petit

Dans les restaurants et bars très actifs, attendre la toute fin du service pour faire le point sur l'ensemble des encaissements accumulés est souvent source de stress, de lenteur et d'erreurs de calcul.

**Comment fonctionne la fonction "Journaliser les ventes" ?**
- Dans la page des recettes/ventes, l'équipe dispose du bouton **"Journaliser les ventes"**.
- En cliquant sur ce bouton en cours de journée, les encaissements perçus jusqu'à cet instant sont consolidés et enregistrés directement dans le journal de caisse actif.

**Pourquoi l'utiliser pendant le service ?**
- **Vérification progressive :** Cela permet au caissier et aux gérants de vérifier le compte réel et les espèces physiques en caisse **petit à petit**, au fur et à mesure du service.
- **Gain de temps à la clôture :** Évite d'avoir un énorme calcul fastidieux et interminable à la fermeture. Tout est déjà rapproché et pré-comptabilisé.

---

### 10.5 Fermer le journal de caisse (Obligatoire à chaque fin de service)

À la fin de chaque service (ex: fin du service du midi ou fin de soirée), le caissier **doit obligatoirement fermer son journal**.

**Pourquoi cette fermeture est-elle obligatoire ?**
1. Pour figer les comptes et la responsabilité du caissier qui termine son shift.
2. Pour calculer les éventuels écarts de caisse de ce service.
3. Pour permettre au caissier du service suivant d'ouvrir son propre journal.

**Étapes de fermeture :**
1. Dans le menu latéral (sidebar), ouvrir la section **Opérations restaurant** > **Caisse & PDV** (ou **Mouvements de Caisse**).
2. Cliquer sur **Fermer le journal**.
2. **Comptage physique réel :** Compter les billets et pièces dans le tiroir-caisse et vérifier les soldes sur les téléphones/comptes Mobile Money.
3. Saisir le **solde réel constaté** dans le formulaire de clôture.
4. **Calcul automatique des écarts :** Le système compare le montant réel saisi avec le montant théorique attendu et affiche immédiatement l'écart (excédent ou manquant).
5. Confirmer la clôture. Ce solde réel devient le point de départ du prochain service.

---

### 10.6 Mouvements de caisse manuels & Règlements fournisseurs

- **Mouvements manuels :** Permettent d'enregistrer des entrées ou sorties de caisse hors vente (ex: menues dépenses de dépannage, pourboires, appoint).
- **Paiements fournisseurs :**
  - **Prérequis :** Fournisseur avec solde débiteur + Journal de caisse ouvert.
  - **Étapes :** Dans le menu latéral (sidebar), aller dans **Achats & Fournisseurs** > **Fournisseurs & Achats**, ouvrir la fiche du fournisseur concerné, aller dans l'onglet **Paiements**, saisir le montant et le mode de règlement, puis valider pour réduire le solde dû.

---

## 11. Employés & RH

### 11.1 Créer un employé

**Prérequis :**
- Un poste (ex : Serveur, Chef, Réceptionniste) doit exister.
- Un type d'emploi doit exister (CDI, CDD, Stage...).

**Étapes :**
1. Dans le menu latéral (sidebar), ouvrir la section **Administration RH**.
2. Cliquer sur **Annuaire du Personnel**.
3. Cliquer sur **Nouvel employé**.
4. Saisir : nom, prénom, date de naissance, etc.
3. Assigner un poste et un type d'emploi.
4. Enregistrer. L'employé est créé avec le statut "En attente de confirmation".

---

### 11.2 Confirmer un employé

La confirmation est une étape OBLIGATOIRE pour qu'un employé bénéficie des congés payés (2,5 jours/mois).

RÈGLE : Seul un employé en attente de confirmation peut être confirmé.

**Étapes :**
1. Dans le menu latéral (sidebar), aller dans **Administration RH** > **Annuaire du Personnel**.
2. Ouvrir la fiche de l'employé (au statut *En attente de confirmation*).
3. Cliquer sur **Confirmer l'employé**.
3. L'employé est maintenant confirmé.
4. Dès ce moment, l'employé commence à accumuler 2,5 jours de congé payé par mois lors de l'allocation mensuelle.

RÈGLE MÉTIER : Un employé non encore confirmé peut prendre des congés, mais ceux-ci sont enregistrés comme des avances sur congés futurs, pas des congés réels. L'allocation mensuelle de 2,5 jours ne s'applique qu'aux employés confirmés.

---

### 11.3 Créer un compte utilisateur pour un employé

**Principe :** Un employé n'a pas accès au système tant qu'un compte utilisateur ne lui a pas été créé par un manager ou un administrateur.

**Prérequis :**
- L'employé doit être créé dans le système.
- Avoir les permissions d'administration ou de gestion des accès.

**Étapes :**
1. Dans le menu latéral (sidebar), ouvrir la section **Administration RH**.
2. Cliquer sur **Gestion des Utilisateurs** (ou ouvrir la fiche de l'employé dans **Annuaire du Personnel** > onglet Droits d'accès / Compte).
3. Cliquer sur **Nouvel utilisateur** (ou Activer l'accès).
4. Renseigner l'identifiant (login) et sélectionner l'employé associé.
3. Renseigner un nom d'utilisateur (login).
4. Le système ou le manager génère un mot de passe initial temporaire.
5. Assigner les rôles métier et d'éventuelles permissions individuelles.
6. Enregistrer. L'employé pourra ensuite personnaliser son mot de passe lors de sa première connexion.

---

### 11.4 Équipes (Teams)

**Prérequis :** Des employés doivent exister.

**Étapes :**
1. Dans le menu latéral (sidebar), ouvrir la section **Temps & Planification**.
2. Cliquer sur **Équipes & Quarts**.
3. Cliquer sur **Nouvelle équipe**.
3. Ajouter des employés à l'équipe.

---

### 11.5 Types de postes (Job Titles)

**Prérequis :** Aucun.

**Étapes :**
1. Dans le menu latéral (sidebar), ouvrir la section **Administration RH**.
2. Cliquer sur **Gestion des Postes**.
3. Cliquer sur **Nouveau poste**.
4. Définir le poste (ex : Serveur, Chef de cuisine, Réceptionniste...) et enregistrer.

---

## 12. Congés

### 12.1 Types de congés

Les types de congés définissent les catégories (Congé payé, Congé maladie, Congé sans solde...).

**Prérequis :** Aucun.

Modes de déduction :
- Toujours déduit : les jours pris sont toujours retirés du solde de congés annuels.
- Jamais déduit : ce type de congé a son propre compteur indépendant (ex : congé maladie).
- Au choix : l'utilisateur décide au moment de la demande si les jours sont déduits ou non.

---

### 12.2 Allocation mensuelle de congés (2,5 jours/mois)

L'allocation mensuelle crédite automatiquement 2,5 jours de congé payé par mois à chaque employé confirmé.

**Prérequis :**
1. L'employé doit être confirmé.
2. Un type de congé payé doit exister.

RÈGLE MÉTIER : Si l'employé n'est pas encore confirmé, l'allocation mensuelle ne s'applique pas. Pour bénéficier des 2,5 jours par mois, l'employé doit impérativement être confirmé.

---

### 12.3 Créer une demande de congé

**Prérequis :**
1. L'employé doit avoir un job actif (pas annulé).
2. Un type de congé doit exister.
3. L'employé doit avoir un solde suffisant (ou le type de congé permet les avances).

**Étapes :**
1. Dans le menu latéral (sidebar), ouvrir la section **Temps & Planification**.
2. Cliquer sur **Congés & Absences**.
3. Cliquer sur **Nouvelle demande**.
4. Sélectionner l'employé et le type de congé.
3. Saisir les dates de début et de fin.
4. Enregistrer.

Comportement selon le statut de l'employé :
- Employé confirmé : les jours sont déduits du solde de congés disponible.
- Employé en attente : les jours sont enregistrés comme une avance à régulariser ultérieurement.

Gestion du dépassement :
- Si les jours demandés dépassent le plafond autorisé pour ce type de congé, le système demande comment gérer le surplus : report sur congé annuel ou passage en congé sans solde.

---

### 12.4 Déduction sur salaire

Si un employé a pris des congés en avance (avant d'être confirmé), on peut enregistrer une déduction salariale pour régulariser la situation.

---

## 13. Planning & Horaires

### 13.1 Types de shifts

**Prérequis :** Aucun.

**Étapes :**
1. Dans le menu latéral (sidebar), ouvrir la section **Temps & Planification**.
2. Cliquer sur **Équipes & Quarts**.
3. Dans la section des quarts/shifts, créer les plages horaires (Matin, Soir, Nuit, etc.) avec horaires de début et de fin.

---

### 13.2 Créer un planning

**Prérequis :**
1. Des employés doivent exister.
2. Des équipes doivent être configurées.
3. Des types de shift doivent exister.

**Étapes :**
1. Dans le menu latéral (sidebar), ouvrir la section **Temps & Planification**.
2. Cliquer sur **Emploi du Temps** (ou **Équipes & Quarts**).
3. Sélectionner la plage de dates.
3. Générer automatiquement par équipe ou saisir manuellement.
4. Affecter chaque employé à un shift pour chaque journée.
5. Enregistrer.

RÈGLE : Si un employé est en congé sur une journée, le planning tient compte de cette absence.

---

### 13.3 Pointage (Attendance)

**Prérequis :** Un planning doit exister pour la période.

---

## 14. Rôles & Permissions

### 14.1 Principe fondamental : "Pas de permission, pas d'action"

Dans Sooatel ERP, l'accès à chaque fonctionnalité et chaque action est strictement contrôlé par un système de permissions.

**Règle d'or :**
> Un utilisateur ne peut effectuer **que** les actions pour lesquelles il a reçu une autorisation explicite.
> Si un utilisateur ne possède pas la permission requise, il ne peut **rien faire** sur cette tâche :
> - Les pages et menus correspondants sont invisibles ou inaccessibles.
> - Les boutons d'action (Créer, Modifier, Valider, Supprimer, Rembourser, etc.) sont masqués ou inactifs.
> - Toute tentative d'action non autorisée est immédiatement bloquée par le système avec un message d'accès refusé.

---

### 14.2 Comment les droits sont attribués

Le système repose sur deux mécanismes complémentaires :

1. **Les Rôles (Attribution groupée par métier) :**
   - Un rôle regroupe un ensemble logique de permissions correspondant à un métier dans l'établissement (ex : Caissier / Vendeur, Gestionnaire de stock, Cuisinier, Responsable RH, Administrateur).
   - En attribuant un rôle à un utilisateur, celui-ci hérite automatiquement de toutes les permissions associées à ce rôle.
   - Un utilisateur peut cumuler plusieurs rôles si nécessaire.

2. **Les Permissions individuelles (Surcharges par utilisateur) :**
   - Pour des situations spécifiques, il est possible d'accorder une permission directement à un utilisateur précis, même si son rôle ne la prévoit pas.
   - À l'inverse, il est également possible de bloquer expressément une action à un utilisateur précis, même si son rôle le permettait en temps normal.

---

### 14.3 Exemples concrets par module

- **Caisse & Ventes :**
  - Un vendeur disposant de l'accès caisse peut créer une commande et encaisser un paiement.
  - En revanche, seules les personnes ayant une permission de gestion supérieure peuvent rouvrir une vente clôturée, annuler une commande ou effectuer un remboursement.

- **Stock & Inventaire :**
  - La consultation du stock permet uniquement de visualiser les disponibilités.
  - Déclarer une perte, valider une entrée/sortie ou rectifier des quantités nécessite une permission dédiée de gestion de stock.

- **Fournisseurs & Achats :**
  - La création de commandes, la validation des livraisons de marchandises et l'enregistrement des paiements aux fournisseurs sont chacun soumis à des autorisations distinctes.

- **Ressources Humaines & Congés :**
  - La gestion des profils du personnel, la confirmation des périodes d'essai et la validation des demandes de congés sont réservées aux profils habilités (RH / Direction).

- **Administration & Sécurité :**
  - La création de nouveaux rôles, l'attribution des droits et la modification des paramètres généraux du système sont strictement réservées aux administrateurs.

---

### 14.4 Que faire si un utilisateur est bloqué par manque de permission ?

Si un utilisateur ne parvient pas à réaliser une action ou à voir un menu :
1. Il s'agit d'un manque de permission : le système le protège contre les erreurs et protège l'établissement.
2. L'utilisateur doit se rapprocher de son responsable ou de l'administrateur du système.
3. L'administrateur vérifie son compte et lui assigne soit le rôle manquant, soit la permission individuelle adéquate.
4. Dès l'enregistrement, l'accès est débloqué.

---

### 14.5 Créer un rôle

**Prérequis :** Avoir les droits d'administration du système.

**Étapes :**
1. Dans le menu latéral (sidebar), ouvrir la section **Administration RH**.
2. Cliquer sur **Rôles et Permissions**.
3. Cliquer sur **Nouveau rôle**.
3. Saisir le nom du rôle (ex: Responsable Caisse, Chef Magasinier).
4. Cocher les permissions à accorder pour ce rôle.
5. Enregistrer.

---

### 14.6 Assigner un rôle à un utilisateur

**Prérequis :**
- L'utilisateur doit avoir un compte utilisateur créé.
- Le rôle doit exister.

**Étapes :**
1. Dans le menu latéral (sidebar), aller dans **Administration RH** > **Gestion des Utilisateurs** (ou la fiche employé dans **Annuaire du Personnel**).
2. Ouvrir le compte de l'utilisateur concerné.
3. Aller dans la section des rôles et cocher le ou les rôles attribués.
3. Cocher le ou les rôles attribués à la personne.
4. Enregistrer.

---

### 14.7 Gérer les permissions individuelles

1. Ouvrir le compte de l'utilisateur.
2. Dans la section des permissions individuelles, activer ou désactiver les permissions spécifiques souhaitées.
3. Enregistrer.

---

## 15. Authentification & Gestion des Comptes Utilisateurs

### 15.1 Création du compte par un manager

Dans Sooatel ERP, un employé ne peut pas s'inscrire lui-même en libre-service :
- C'est obligatoirement un **manager ou un administrateur** qui crée le compte utilisateur de l'employé (depuis la fiche employé ou le module d'administration).
- Lors de cette création, un mot de passe initial temporaire est généré pour le compte.
- Le manager attribue également les rôles et permissions nécessaires.

---

### 15.2 Première connexion et définition du mot de passe personnel

Pour des raisons strictes de sécurité et de confidentialité, lors de sa toute première connexion, l'utilisateur doit obligatoirement personnaliser son mot de passe :

Deux méthodes existent selon la situation de l'utilisateur :

1. **Par e-mail (si l'utilisateur a une adresse e-mail enregistrée) :**
   - Sur la page de connexion, l'utilisateur clique sur *Mot de passe oublié*.
   - Il saisit son identifiant ou son adresse e-mail.
   - Un e-mail contenant un lien sécurisé lui est immédiatement envoyé pour définir son nouveau mot de passe.

2. **Par clé de réinitialisation manuelle (si l'utilisateur n'a pas d'e-mail ou en interne) :**
   - Si l'utilisateur n'a pas d'adresse e-mail ou ne peut pas y accéder, il s'adresse directement à son manager ou à son administrateur.
   - Le manager génère une **clé de réinitialisation unique** dans le système et la transmet à l'utilisateur (valable 24 heures).
   - L'utilisateur se rend sur la page de connexion, choisit l'option de saisie avec clé, renseigne son nom d'utilisateur et colle sa clé.
   - Il définit ensuite immédiatement son nouveau mot de passe personnel.

---

### 15.3 Réinitialisation en cas d'oubli de mot de passe

Si un utilisateur oublie son mot de passe par la suite, la même procédure s'applique :
- Soit par réception d'un e-mail de réinitialisation.
- Soit en demandant à son manager de lui générer une nouvelle clé de réinitialisation.

---

### 15.4 Changer son mot de passe une fois connecté

Un utilisateur connecté à sa session peut changer son mot de passe à tout moment :

**Prérequis :** Être connecté à son compte et connaître son mot de passe actuel.

**Étapes :**
1. Dans le menu latéral (sidebar), tout en bas, cliquer sur la carte de profil utilisateur (votre nom et avatar).
2. Dans le menu déroulant qui apparaît, cliquer sur **Modifier le mot de passe**.
3. Saisir son mot de passe actuel (pour confirmer son identité).
4. Saisir le nouveau mot de passe et le confirmer.
5. Enregistrer → Le mot de passe est mis à jour immédiatement.

---

### 15.5 Connexion quotidienne

**Étapes :**
1. Accéder à la page de connexion.
2. Saisir son identifiant (nom d'utilisateur ou e-mail) et son mot de passe.
3. Valider pour accéder au tableau de bord.

---

## 16. Tableau de Bord (Dashboard)

Le tableau de bord est l'outil central de pilotage et d'analyse financière de l'établissement.

**Accès :**
1. Dans le menu latéral (sidebar), ouvrir la section **Opérations restaurant**.
2. Cliquer sur **Tableau de bord**. Il permet aux responsables et gérants de suivre la performance économique en temps réel sur une période choisie (par jour, semaine, mois ou période personnalisée).

---

### 16.1 Chiffre d'Affaires (CA) vs Bénéfice : Comprendre la différence

Le tableau de bord permet de basculer instantanément entre deux modes d'analyse fondamentaux :

1. **Le Chiffre d'Affaires (CA) :**
   - **Définition :** C'est le montant total des ventes encaissées auprès des clients sur la période.
   - **Ce qu'il mesure :** Le volume d'activité commerciale brute de l'établissement.
   - **Calcul simple :** Somme du montant de tous les articles vendus.

2. **Le Bénéfice (Marge brute / Bénéfice sur ventes) :**
   - **Définition :** C'est le gain réel dégagé par les ventes une fois que l'on a déduit le coût de revient des produits.
   - **Ce qu'il mesure :** La rentabilité effective de l'établissement.
   - **Calcul simple :** Montant des ventes - (Coût unitaire d'achat ou de fabrication x Quantité vendue).
   - 👉 *Exemple :* Un cocktail vendu 20 000 Ar dont les ingrédients ont coûté 8 000 Ar génère un Chiffre d'Affaires de 20 000 Ar mais un Bénéfice de 12 000 Ar.

**Courbe de tendance (Graphique d'évolution) :**
- Affiche la trajectoire du CA ou du Bénéfice au fil du temps.
- La vue s'adapte automatiquement : découpage par jour pour un mois, par semaine ou par mois pour des périodes plus longues.

---

### 16.2 Les Meilleurs Produits (Top Produits / Best-sellers)

Cette section met en avant les **5 produits les plus performants** sur la période filtrée :

- **Classement en valeur (Graphique en barres) :**
  - Classe les 5 plats ou boissons qui ont généré le plus d'argent (soit en CA, soit en Bénéfice selon l'onglet actif).
  - Permet d'identifier immédiatement les plats "locomotives" de l'établissement.

- **Répartition en pourcentage (Graphique en anneau / Donut) :**
  - Affiche la part relative que représente chacun des meilleurs produits par rapport au total global des ventes de l'établissement.
  - 👉 *Exemple :* Si un plat représente 25 % du graphique, cela signifie qu'un quart de vos rentrées financières provient de ce seul produit.

---

### 16.3 Statistiques Détaillées par Produit

En plus du Top 5 global, le tableau de bord permet d'isoler n'importe quel produit du catalogue pour examiner son comportement :

**Informations fournies pour le produit sélectionné :**
- **Montant total généré :** Total du CA ou du Bénéfice apporté par ce produit sur la période.
- **Contribution globale (%) :** Pourcentage exact qu'il représente dans les ventes totales de l'établissement.
- **Courbe d'évolution chronologique :** Graphique montrant les jours ou semaines de fortes ventes et les moments de creux pour ce plat spécifique.

**À quoi ça sert concrètement pour l'équipe ?**
- Savoir quels plats sont les plus rentables (forte marge) versus ceux qui font du volume mais peu de bénéfice.
- Anticiper les commandes d'ingrédients auprès des fournisseurs pour les produits stars.
- Décider de revoir la recette, le prix ou la mise en valeur des plats qui rapportent peu.

---

### 16.4 Prérequis pour l'affichage du Tableau de bord

- **Ventes enregistrées :** Des ventes validées doivent exister sur la période sélectionnée pour afficher des graphiques pertinents.
- **Coûts renseignés :** Pour que le calcul du Bénéfice soit exact, les coûts unitaires des articles et les recettes doivent être renseignés.
- **Permissions :** Avoir les droits d'accès à la consultation des données financières de l'établissement.

---

## 17. Traçabilité & Logs d'Audit (Audit Logs)

Les **logs d'audit** (`audit_logs`) constituent le registre de sécurité et de contrôle interne de Sooatel. Ils permettent de savoir avec certitude **qui a fait quoi, quand, sur quelle opération, et quelles étaient les valeurs avant et après modification**.

---

### 17.1 Rôle et structure d'un log d'audit

Chaque entrée d'audit enregistre automatiquement les données suivantes :
- **L'utilisateur (`id_user`) :** L'identifiant de la personne connectée ayant déclenché l'opération (garantie de responsabilité individuelle).
- **L'entité concernée (`entity_name` & `entity_id`) :** L'élément touché (ex : une vente `Sale`, une ligne de plat `SaleItem`, un paiement `Payment`).
- **L'action effectuée (`action`) :** Le type d'opération sensible (ex : `UPDATE_ITEM`, `REMOVE_ITEM`, `REOPEN_SALE`, `CANCEL_SALE`, `REFUND_PAYMENT`...).
- **L'ancienne valeur (`old_value`) :** L'état exact des champs avant la modification (ex : ancienne quantité, ancien prix unitaire, ancien montant, ancien statut).
- **La nouvelle valeur (`new_value`) :** L'état après modification, ou le motif justificatif saisi par l'opérateur.
- **L'horodatage (`created_at`) :** La date et l'heure précises de l'événement.

---

### 17.2 Quand les logs sont-ils créés (et quand ne le sont-ils PAS) ?

#### ❌ Ce qui n'est PAS logué :
- **La création normale d'une vente :** La création d'une nouvelle commande est une opération standard de service. Pour éviter de saturer inutilement la base d'audit avec des flux normaux, aucune ligne d'audit n'est générée lors de la création initiale d'une vente.

#### ✅ Ce qui est OBLIGATOIREMENT logué (Modifications, Suppressions et Actions critiques) :
Le système déclenche automatiquement un log d'audit lors de chaque action sensible pouvant impacter la caisse, les stocks ou l'intégrité comptable :

1. **Modification d'un plat dans une vente (`UPDATE_ITEM`) :**
   - **Quand :** Un serveur ou caissier modifie la quantité ou le prix d'un plat déjà saisi sur une commande en cours.
   - **Trace :** L'ancienne quantité/prix vs la nouvelle valeur.

2. **Ajout d'un plat lors d'une mise à jour (`ADD_ITEM`) :**
   - **Quand :** Une nouvelle ligne de plat est rajoutée lors de la modification d'une vente déjà existante.
   - **Trace :** Le plat ajouté, sa quantité et son montant.

3. **Suppression d'un plat d'une vente (`REMOVE_ITEM`) :**
   - **Quand :** Une ligne de commande est supprimée d'une vente existante.
   - **Pourquoi c'est capital :** Empêche tout employé de servir un plat, d'encaisser discrètement le client en liquide, puis de supprimer le plat de la commande pour dissimuler la recette. L'audit conserve la trace indélébile de l'article supprimé.

4. **Réouverture d'une vente clôturée (`REOPEN_SALE`) :**
   - **Quand :** Une vente était déjà fermée (statut 0), mais doit être réouverte (ex : le client désire finalement un café supplémentaire ou signale une erreur).
   - **Règle stricte :** L'opérateur a l'**obligation de saisir un motif de réouverture** dans une boîte de dialogue (ex : *"Le client désire un digestif en plus"*). Sans motif renseigné, la vente ne peut pas être réouverte.
   - **Trace :** Le log enregistre l'ancien statut et le **motif exact** saisi.

5. **Annulation d'une vente (`CANCEL_SALE`) :**
   - **Quand :** Une vente est annulée (avec ou sans remboursement des sommes perçues).
   - **Trace :** L'ancien montant total remis à zéro et l'utilisateur ayant validé l'annulation.

6. **Suppression définitive d'une vente (`DELETE_SALE`) :**
   - **Quand :** Une vente est supprimée de la base de données.
   - **Trace :** L'ancien montant de la vente et l'utilisateur responsable.

7. **Ajustement ou suppression d'un paiement (`UPDATE_PAYMENT` / `DELETE_PAYMENT`) :**
   - **Quand :** Le montant d'un paiement enregistré est rectifié ou supprimé.
   - **Trace :** L'ancien montant vs le nouveau montant.

8. **Remboursement d'un paiement client (`REFUND_PAYMENT`) :**
   - **Quand :** Un remboursement partiel ou total est effectué en caisse.
   - **Trace :** Le montant remboursé, le mode de paiement utilisé et le motif éventuel.

---

### 17.3 Les trois niveaux de traçabilité dans Sooatel

Pour assurer une transparence totale, Sooatel gère 3 registres complémentaires :
1. **Logs d'audit (`audit_logs`) :** Traçabilité comportementale des utilisateurs sur les actions sensibles (qui a modifié, annulé, réouvert ou remboursé quoi, et pourquoi).
2. **Mouvements de stock (`stock_movements`) :** Traçabilité physique des articles (entrées livraisons, sorties production, sorties clôture vente, ajustements inventaire).
3. **Mouvements de caisse (`cash_movement`) :** Traçabilité financière des flux monétaires (entrées cash/mobile money, sorties pour remboursement ou fournisseur, fond de caisse).

---

## RÉSUMÉ DES PRÉREQUIS PAR MODULE

| Pour faire... | Il faut d'abord... |
|---|---|
| **Effectuer toute action dans le système** | **Détenir la permission requise (par son rôle ou en direct)** |
| Créer un article | Type d'article + Unité de mesure |
| Créer une unité alternative | Article avec unité de base + Unité de mesure alternative |
| Créer un élément de menu | Article + Catégorie de menu |
| Créer une recette | Article (plat) + Articles (ingrédients) |
| Créer un produit fournisseur | Fournisseur + Article |
| Créer une commande fournisseur | Fournisseur + Produits fournisseurs |
| Créer une livraison | Commande confirmée |
| Valider une livraison | Livraison ouverte |
| Créer une production | Article + Recette active + Stock suffisant |
| Créer une vente | Éléments de menu + Journal de caisse ouvert |
| Payer une vente | Journal de caisse ouvert + Mode de paiement |
| Créer un employé | Poste + Type d'emploi |
| Confirmer un employé | Employé en attente de confirmation |
| Attribuer 2,5 jours/mois | Employé confirmé |
| Créer un congé | Employé actif + Type de congé |
| Créer un planning | Employés + Équipes + Types de shift |
| Ouvrir un journal de caisse | Aucun journal déjà ouvert |
| Payer un fournisseur | Fournisseur + Journal de caisse ouvert |
| Créer un compte utilisateur | Employé existant + Création par manager/admin |
| Définir son mot de passe (1ère connexion) | Clé de sécurité fournie par le manager OU lien e-mail |
| Changer son mot de passe (connecté) | Être connecté + Mot de passe actuel |
| Consulter le tableau de bord financier | Ventes validées sur la période + Permission d'accès financier |
| Imputer une vente sur une chambre | Chambre occupée/existante + Vente en cours |

---

## RÈGLES MÉTIER CRITIQUES

0. **Permissions globales :** Aucune opération n'est possible sans la permission adéquate. Si un utilisateur n'a pas les droits requis (via son rôle ou une permission individuelle), le système bloque totalement l'action : les boutons et menus sont masqués ou un message d'accès refusé apparaît.

1. Menu → Vente : Un plat ne peut être vendu que s'il est enregistré dans le menu. Créer un article seul ne suffit pas — il faut aussi l'ajouter au menu.

2. Recette → Production : La production d'un plat nécessite une recette active. Sans recette, la validation échoue.

3. Commande → Livraison : La commande doit être confirmée avant de pouvoir créer une livraison.

4. Livraison → Stock : Le stock n'est mis à jour qu'à la validation de la livraison, pas à sa création.

5. Employé → Congés payés : L'allocation de 2,5 jours par mois ne s'applique qu'aux employés confirmés. Un employé non encore confirmé prend des congés en avance.

6. Caisse → Journal & Clôture obligatoire : Tout encaissement direct, paiement fournisseur ou sortie d'argent exige un journal de caisse ouvert. Un seul journal peut être actif à la fois. Le journal doit obligatoirement être fermé à chaque fin de service après comptage du solde réel. La fonction "Journaliser les ventes" permet de vérifier les comptes petit à petit pendant le service sans attendre la fin du shift.

7. Production → Ingrédients : Si le stock d'un seul ingrédient est insuffisant, la production entière est bloquée.

8. Commande → Modification & Annulation : Impossible de modifier ou annuler avec une livraison ouverte en cours. Impossible de réduire une quantité en dessous du déjà livré ni de changer de fournisseur. En cas d'annulation après des livraisons partielles, les articles déjà reçus restent en stock et seules les quantités non encore reçues sont annulées.

9. Unités alternatives → Stock : Une unité alternative ne peut pas être identique à l'unité de stock de base de l'article. Elle applique un ratio multiplicateur lors des entrées/sorties pour maintenir le stock toujours exact dans l'unité de base.

10. Comptes & Mots de passe : Les comptes sont créés par les managers. À la première connexion, le mot de passe initial doit être changé, soit via un email, soit via une clé générée par le manager si l'utilisateur n'a pas de boîte mail.

11. Ventes → Règlement ou Imputation chambre : Si une vente est imputée sur une chambre, elle ne nécessite pas de paiement immédiat au restaurant et sera réglée avec la facture globale de la chambre à la caisse de l'hôtel lors du départ (check-out). Sinon, le client règle directement au restaurant/bar en espèces (cash), par mobile money ou par carte bancaire.

12. Traçabilité & Logs d'audit : Aucune modification critique (modification ou suppression d'un plat dans une vente, réouverture d'une vente fermée, annulation, ajustement ou remboursement d'un paiement) ne passe inaperçue. Elles sont tracées automatiquement dans les logs d'audit avec l'auteur, l'horodatage précis, et l'état avant/après. La réouverture d'une vente fermée exige obligatoirement un motif écrit qui est consigné dans les logs.
