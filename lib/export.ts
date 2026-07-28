import type { Produit } from "./types";

const ENTETES = ["Nom", "Référence", "Catégorie", "Prix", "Quantité", "Seuil d'alerte"];

function ligneProduit(p: Produit): (string | number)[] {
  return [p.nom, p.reference ?? "", p.categorie ?? "", p.prix, p.quantite, p.seuil_alerte];
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

  doc.save(`stock-${new Date().toISOString().slice(0, 10)}.pdf`);
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
