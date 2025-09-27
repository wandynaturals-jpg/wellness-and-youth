// 🧴 Catalogue des produits
const produits = [
  { nom: "Baume Fraise", prix: 3.5, image: "images/baume-fraise.jpg", stock: 10 },
  { nom: "Eau Micellaire", prix: 16, image: "images/eau-micellaire.jpg", stock: 8 },
  { nom: "Mousse Nettoyante", prix: 28, image: "images/mousse-nettoyante.jpg", stock: 5 },
  { nom: "Pack Beauté", prix: 49.9, image: "images/pack-beaute.jpg", stock: 3 }
];

let panier = [];
const produitsNotifiés = [];

// 🛍️ Affichage du catalogue
const catalogue = document.getElementById("catalogue");
function actualiserCatalogue() {
  catalogue.innerHTML = "";
  produits.forEach((p, index) => {
    const div = document.createElement("div");
    div.className = "produit";
    div.innerHTML = `
      <img src="${p.image}" alt="${p.nom}">
      <h3>${p.nom}</h3>
      <p>${p.prix} DT</p>
      <p class="stock">Stock : ${p.stock}</p>
      <label>Quantité :
        <input type="number" min="1" value="1" id="qte-${index}" ${p.stock === 0 ? "disabled" : ""}>
      </label>
      <button onclick="ajouterAuPanier(${index})" ${p.stock === 0 ? "disabled" : ""}>Ajouter au panier</button>
    `;
    catalogue.appendChild(div);
  });
}

// ➕ Ajouter au panier
function ajouterAuPanier(index) {
  const quantite = parseInt(document.getElementById(`qte-${index}`).value);
  const produit = produits[index];
  if (quantite > produit.stock) {
    alert(`Stock insuffisant ! Il reste seulement ${produit.stock} unités.`);
    return;
  }

  const existant = panier.find(p => p.nom === produit.nom);
  if (existant) {
    if (existant.quantite + quantite > produit.stock) {
      alert(`Stock insuffisant ! Il reste seulement ${produit.stock - existant.quantite} unités.`);
      return;
    }
    existant.quantite += quantite;
  } else {
    panier.push({ ...produit, quantite });
  }

  produit.stock -= quantite;
  afficherPanier();
  actualiserCatalogue();
  verifierStockCritique();
}

// 🧾 Affichage du panier
function afficherPanier() {
  const contenu = document.getElementById("contenu-panier");
  contenu.innerHTML = "";
  let total = 0;

  panier.forEach((p, i) => {
    const stockRestant = produits.find(prod => prod.nom === p.nom).stock;
    const ligne = document.createElement("div");
    ligne.innerHTML = `
      ${p.nom} - ${p.prix} DT x 
      <input type="number" min="1" max="${p.quantite + stockRestant}" value="${p.quantite}" onchange="modifierQuantite(${i}, this.value)">
      = ${p.prix * p.quantite} DT
      <button onclick="supprimerDuPanier(${i})">Supprimer</button>
    `;
    contenu.appendChild(ligne);
    total += p.prix * p.quantite;
  });

  const contientPack = panier.some(p => p.nom.toLowerCase().includes("pack"));
  const livraison = (total >= 50 || contientPack) ? 0 : 6;

  document.getElementById("livraison").innerText = `Livraison : ${livraison} DT`;
  document.getElementById("total").innerText = `Total : ${total + livraison} DT`;
}

// 🔄 Modifier la quantité
function modifierQuantite(index, nouvelleQuantite) {
  nouvelleQuantite = parseInt(nouvelleQuantite);
  const produit = panier[index];
  const original = produits.find(p => p.nom === produit.nom);
  const difference = nouvelleQuantite - produit.quantite;

  if (difference > original.stock) {
    alert(`Stock insuffisant ! Il reste seulement ${original.stock} unités.`);
    return;
  }

  produit.quantite = nouvelleQuantite;
  original.stock -= difference;

  if (nouvelleQuantite <= 0) {
    supprimerDuPanier(index);
  } else {
    afficherPanier();
    actualiserCatalogue();
    verifierStockCritique();
  }
}

// ❌ Supprimer du panier
function supprimerDuPanier(index) {
  const produit = panier[index];
  const original = produits.find(p => p.nom === produit.nom);
  original.stock += produit.quantite;
  panier.splice(index, 1);
  afficherPanier();
  actualiserCatalogue();
}

// 📋 Afficher le formulaire
function afficherFormulaire() {
  document.getElementById("formulaire").style.display = "block";
}

// 🧮 Générer le résumé de commande
function mettreAJourCommande() {
  let texte = "";
  let total = 0;
  let livraison = 6;

  panier.forEach(p => {
    texte += `${p.nom} x${p.quantite} - ${p.prix * p.quantite} DT\n`;
    total += p.prix * p.quantite;
  });

  const contientPack = panier.some(p => p.nom.toLowerCase().includes("pack"));
  if (total >= 50 || contientPack) livraison = 0;

  texte += `\nLivraison : ${livraison} DT\nTotal : ${total + livraison} DT`;
  document.getElementById("commande").value = texte;
}

// ✅ Soumettre le formulaire
function validerEtSoumettre() {
  mettreAJourCommande();
  setTimeout(() => {
    document.getElementById("formulaire").style.display = "none";
    document.getElementById("confirmation").style.display = "block";
  }, 500);
  return true;
}

// 📲 Envoi via WhatsApp
function envoyerWhatsApp() {
  mettreAJourCommande();
  const nom = document.getElementById("nom").value;
  const tel = document.getElementById("telephone").value;
  const adresse = document.getElementById("adresse").value;
  const commande = document.getElementById("commande").value;

  const message = `Commande W&Y\nNom: ${nom}\nTéléphone: ${tel}\nAdresse: ${adresse}\n${commande}`;
  const url = `https://wa.me/21692212615?text=${encodeURIComponent(message)}`;

  if (confirm("Voici le résumé de votre commande :\n\n" + message + "\n\nSouhaitez-vous l’envoyer via WhatsApp ?")) {
    window.open(url);
  }
}

// 🔔 Notification email si stock nul
function verifierStockCritique() {
  produits.forEach(p => {
    if (p.stock === 0 && !produitsNotifiés.includes(p.nom)) {
      produitsNotifiés.push(p.nom);
      fetch("https://formspree.io/f/mzzjznor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "wandy.naturals@gmail.com",
          message: `⚠️ Le produit "${p.nom}" est en rupture de stock.`
        })
      });
    }
  });
}

// 🔐 Accès admin sécurisé
const identifiantCorrect = "wassim";
const codeCorrect = "Nwissou.1309";

function verifierAccesAdmin() {
  const id = document.getElementById("admin-id").value.trim();
  const code = document.getElementById("admin-code").value.trim();
  const message = document.getElementById("auth-message");

  if (id === identifiantCorrect && code === codeCorrect) {
    document.getElementById("auth-admin").style.display = "none";
    document.getElementById("admin").style.display = "block";
    afficherGestionStock();
  } else {
    message.textContent = "Identifiant ou code incorrect.";
  }
}

// 🛠️ Interface admin - gestion du stock
function afficherGestionStock() {
  const zone = document.getElementById("admin-stock");
  zone.innerHTML = "";

  produits.forEach((p, i) => {
    const ligne = document.createElement("div");
    ligne.style.marginBottom = "10px";
    ligne.style.color = p.stock === 0 ? "red" : "black";

    ligne.innerHTML = `
      <strong>${p.nom}</strong> - Stock actuel : ${p.stock}
      <input type="number" min="0" value="${p.stock}" onchange="modifierStock(${i}, this.value)">
    `;
    zone.appendChild(ligne);
  });
}

function modifierStock(index, nouvelleValeur) {
  nouvelleValeur = parseInt(nouvelleValeur);
  produits[index].stock = nouvelleValeur;
  actualiserCatalogue();
  afficherPanier();
  afficherGestionStock();
  verifierStockCritique(); // 🔔 Envoie une alerte si stock = 0
}
actualiserCatalogue();
function seDeconnecter() {
  document.getElementById("admin").style.display = "none";
  document.getElementById("auth-admin").style.display = "block";
  document.getElementById("admin-id").value = "";
  document.getElementById("admin-code").value = "";
  document.getElementById("auth-message").textContent = "";
}
