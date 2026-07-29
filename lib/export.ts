import type { MouvementAvecProduit, Produit, TypeMouvement } from "./types";
import type { jsPDF } from "jspdf";

const ENTETES = ["Nom", "Référence", "Catégorie", "Prix", "Quantité", "Seuil d'alerte"];

const LIBELLE_TYPE: Record<TypeMouvement, string> = {
  entree: "Entrée",
  sortie: "Sortie",
  ajustement: "Ajustement",
};

function ligneProduit(p: Produit): (string | number)[] {
  return [p.nom, p.reference ?? "", p.categorie ?? "", p.prix, p.quantite, p.seuil_alerte];
}

function ligneMouvement(m: MouvementAvecProduit): (string | number)[] {
  return [
    new Date(m.date).toLocaleString("fr-FR"),
    m.produit?.nom ?? "Produit supprimé",
    LIBELLE_TYPE[m.type],
    m.quantite,
    m.note ?? "",
  ];
}

// Ouvre le PDF dans un nouvel onglet (aperçu navigateur) plutôt que de le
// télécharger directement : l'utilisateur choisit ensuite l'imprimante ou
// l'enregistrement depuis cet aperçu. Si le navigateur bloque la fenêtre
// (bloqueur de popups), on retombe sur un téléchargement direct.
export function ouvrirApercuPdf(doc: jsPDF, nomFichier: string) {
  const url = doc.output("bloburl") as unknown as string;
  const fenetre = window.open(url, "_blank");
  if (!fenetre) {
    doc.save(nomFichier);
  }
}

export async function exporterStockEnPdf(produits: Produit[]) {
  const { default: jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text("Le Gestionnaire — État du stock", 14, 16);
  doc.setFontSize(9);
  doc.text(new Date().toLocaleString("fr-FR"), 14, 22);

  autoTable(doc, {
    startY: 28,
    head: [ENTETES],
    body: produits.map(ligneProduit),
  });

  ouvrirApercuPdf(doc, `stock-${new Date().toISOString().slice(0, 10)}.pdf`);
}

const ENTETES_MOUVEMENTS = ["Date", "Produit", "Type", "Quantité", "Note"];

interface PeriodeRapport {
  debut: string;
  fin: string;
  typeLibelle: string;
}

export async function exporterMouvementsEnPdf(
  mouvements: MouvementAvecProduit[],
  periode: PeriodeRapport
) {
  const { default: jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text("Le Gestionnaire — Rapport des mouvements de stock", 14, 16);
  doc.setFontSize(9);
  doc.text(`Période : du ${periode.debut} au ${periode.fin}`, 14, 22);
  doc.text(`Type de mouvement : ${periode.typeLibelle}`, 14, 27);
  doc.text(`Généré le ${new Date().toLocaleString("fr-FR")}`, 14, 32);

  autoTable(doc, {
    startY: 38,
    head: [ENTETES_MOUVEMENTS],
    body: mouvements.map(ligneMouvement),
  });

  ouvrirApercuPdf(doc, `rapport-mouvements-${periode.debut}-au-${periode.fin}.pdf`);
}

export async function exporterMouvementsEnExcel(
  mouvements: MouvementAvecProduit[],
  periode: PeriodeRapport
) {
  const ExcelJS = (await import("exceljs")).default;

  const classeur = new ExcelJS.Workbook();
  const feuille = classeur.addWorksheet("Mouvements");

  feuille.columns = ENTETES_MOUVEMENTS.map((entete) => ({ header: entete, key: entete, width: 22 }));
  mouvements.forEach((m) => feuille.addRow(ligneMouvement(m)));
  feuille.getRow(1).font = { bold: true };

  const buffer = await classeur.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const url = URL.createObjectURL(blob);
  const lien = document.createElement("a");
  lien.href = url;
  lien.download = `rapport-mouvements-${periode.debut}-au-${periode.fin}.xlsx`;
  lien.click();
  URL.revokeObjectURL(url);
}

// Bon de livraison à faire signer lors d'une sortie de stock : en-tête à
// remplir à la main (destinataire), une ligne pour le produit livré, et un
// bloc de signature livreur/destinataire pour garder une trace écrite.
export async function genererBonDeLivraisonPdf(
  mouvement: MouvementAvecProduit,
  entrepriseNom: string
) {
  const { default: jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF();
  const margeGauche = 16;
  let y = 20;

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Bon de livraison", margeGauche, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(entrepriseNom, 195, y, { align: "right" });
  y += 6;
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(`Émis le ${new Date().toLocaleString("fr-FR")}`, 195, y, { align: "right" });
  doc.setTextColor(0);

  y += 10;
  doc.setDrawColor(210);
  doc.line(margeGauche, y, 195, y);
  y += 10;

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Destinataire", margeGauche, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  y += 7;

  const champsDestinataire = ["Nom / Société", "Adresse", "Téléphone", "Date de livraison"];
  champsDestinataire.forEach((champ) => {
    doc.setTextColor(120);
    doc.text(champ, margeGauche, y);
    doc.setTextColor(0);
    doc.setDrawColor(180);
    doc.line(margeGauche + 42, y, 195, y);
    y += 9;
  });

  y += 4;
  autoTable(doc, {
    startY: y,
    head: [["Produit", "Référence", "Quantité livrée", "Note"]],
    body: [
      [
        mouvement.produit?.nom ?? "Produit supprimé",
        mouvement.produit?.reference ?? "—",
        String(mouvement.quantite),
        mouvement.note ?? "—",
      ],
    ],
    styles: { fontSize: 10, cellPadding: 4 },
    headStyles: { fillColor: [42, 120, 214] },
  });

  // @ts-expect-error — jspdf-autotable étend jsPDF à l'exécution sans le déclarer dans ses types.
  y = doc.lastAutoTable.finalY + 20;

  const largeurBloc = 80;
  const blocs: [string, number][] = [
    ["Livré par", margeGauche],
    ["Reçu par (nom, date et signature)", 195 - largeurBloc],
  ];
  blocs.forEach(([libelle, x]) => {
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(libelle, x, y);
    doc.setTextColor(0);
    doc.setDrawColor(150);
    doc.line(x, y + 22, x + largeurBloc, y + 22);
  });

  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(
    "Ce document atteste de la remise des marchandises listées ci-dessus à la date de signature.",
    margeGauche,
    285
  );

  ouvrirApercuPdf(doc, `bon-livraison-${mouvement.id.slice(0, 8)}.pdf`);
}

export async function exporterStockEnExcel(produits: Produit[]) {
  const ExcelJS = (await import("exceljs")).default;

  const classeur = new ExcelJS.Workbook();
  const feuille = classeur.addWorksheet("Stock");

  feuille.columns = ENTETES.map((entete) => ({ header: entete, key: entete, width: 20 }));
  produits.forEach((p) => feuille.addRow(ligneProduit(p)));
  feuille.getRow(1).font = { bold: true };

  const buffer = await classeur.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const url = URL.createObjectURL(blob);
  const lien = document.createElement("a");
  lien.href = url;
  lien.download = `stock-${new Date().toISOString().slice(0, 10)}.xlsx`;
  lien.click();
  URL.revokeObjectURL(url);
}
