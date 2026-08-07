// ============================================================
// Serveur de vérification de paiement — Business Digital Pack
// ============================================================
// Ce serveur reçoit l'ID de transaction envoyé par le site après
// paiement, vérifie AUPRÈS DE KKIAPAY que le paiement est bien
// réussi (impossible à falsifier côté client), et ne renvoie le
// lien de téléchargement QUE si c'est confirmé.
// ============================================================

const express = require("express");
const cors = require("cors");
const kkiapay = require("@kkiapay-org/nodejs-sdk");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// Clés récupérées depuis les variables d'environnement (jamais en dur dans le code)
const k = kkiapay({
  privatekey: process.env.KKIAPAY_PRIVATE_KEY,
  publickey: process.env.KKIAPAY_PUBLIC_KEY,
  secretkey: process.env.KKIAPAY_SECRET_KEY,
  sandbox: process.env.KKIAPAY_SANDBOX === "true",
});

const LIEN_TELECHARGEMENT = process.env.LIEN_TELECHARGEMENT;
const PRIX_ATTENDU = Number(process.env.PRIX_FCFA || 5000);

app.get("/", (req, res) => {
  res.send("Serveur de vérification Business Digital Pack — actif ✅");
});

app.post("/verify", async (req, res) => {
  const { transactionId } = req.body;

  if (!transactionId) {
    return res.status(400).json({ ok: false, message: "transactionId manquant" });
  }

  try {
    const transaction = await k.verify(transactionId);

    const estReussi = transaction.status === "SUCCESS";
    const montantCorrect = Number(transaction.amount) >= PRIX_ATTENDU;

    if (estReussi && montantCorrect) {
      return res.json({ ok: true, downloadLink: LIEN_TELECHARGEMENT });
    }

    return res.status(402).json({
      ok: false,
      message: "Paiement non confirmé ou montant incorrect",
      status: transaction.status,
    });
  } catch (error) {
    console.error("Erreur de vérification Kkiapay :", error.message);
    return res.status(500).json({ ok: false, message: "Erreur lors de la vérification" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
