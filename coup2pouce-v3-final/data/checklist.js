// ─────────────────────────────────────────────
// CHECKLIST_DATA — Checklists terrain par module
// ─────────────────────────────────────────────

const CHECKLIST_DATA = {
  Amiante: {
    color: "#2D6A4F",
    icon: "🔬",
    label: "Amiante",
    items: [
      "Repérer tous les conduits",
      "Colles et dalles de sol",
      "Parois verticales (enduits, plaques)",
      "Flocages",
      "Calorifugeages",
      "Faux-plafonds",
      "Conduits extérieurs",
      "Éléments de toiture",
      "Combles inspectés",
      "Sous-sol / vide sanitaire",
      "EPI enfilés (combinaison, gants, masque, surchaussures)",
      "Surfactant + pulvérisateur prêts",
      "Sacs prélèvement + double ensachage prêts",
      "Lingettes désinfectantes prêtes",
      "Appareil photo chargé",
      "Prélèvements étiquetés et conditionnés"
    ]
  },
  Elec: {
    color: "#1B4332",
    icon: "⚡",
    label: "Électricité",
    items: [
      "AGCP vérifié (hauteur, accès, plombage)",
      "Tableau inspecté (divisionnaires, DDR 30mA)",
      "DDR 30mA testé (méthode amont-aval)",
      "Section des conducteurs vérifiée",
      "Conducteur de terre identifié",
      "Barrette de terre vérifiée",
      "Piquet de terre vérifié (maison)",
      "L.E.P. — continuité ≤ 2Ω",
      "L.E.S. — continuité ≤ 2Ω (salle de bain)",
      "Conducteur principal vérifié",
      "Dérivation individuelle (appartement)",
      "Test différentiel effectué",
      "Test impédance de boucle effectué",
      "Test continuité prises effectué",
      "VAT testé avant intervention",
      "Dérouleur 25m disponible"
    ]
  },
  Gaz: {
    color: "#E8650A",
    icon: "🔥",
    label: "Gaz",
    items: [
      "Compteur inspecté et accessible",
      "Tuyauterie fixe vérifiée",
      "Raccordement des appareils vérifié",
      "Organes de coupure (OCA) vérifiés",
      "Ventilation contrôlée",
      "Combustion vérifiée",
      "Chaudière inspectée",
      "Gazinière / appareil cuisson testé",
      "Citerne / bouteille vérifiée (si présente)",
      "OCA fermés pour test étanchéité",
      "OCB vérifiés",
      "Test débit effectué",
      "Test CO effectué",
      "Bombe moussante si nécessaire",
      "Étiquette DGI apposée si DGI",
      "GrDF informé si DGI"
    ]
  },
  Termites: {
    color: "#52B788",
    icon: "🪲",
    label: "Termites",
    items: [
      "Jardin inspecté (10m autour)",
      "Abris de jardin / atelier inspecté",
      "Vide sanitaire inspecté",
      "Sous-sol / cave inspecté",
      "Grenier inspecté",
      "Combles inspectés",
      "Plinthes sondées (poinçon)",
      "Charpente sondée",
      "Bois contre maçonnerie sondé",
      "Encadrements fenêtres vérifiés",
      "Meubles en bois vérifiés",
      "Livres et cartons vérifiés",
      "Poinçon utilisé tous les 20cm"
    ]
  },
  Plomb: {
    color: "#E85D04",
    icon: "⚠️",
    label: "Plomb (CREP)",
    items: [
      "Plan du logement réalisé",
      "Zonage A/B/C/D effectué par local",
      "Tous les locaux accessibles vérifiés",
      "Locaux inaccessibles notés avec motif",
      "Fenêtres/portes ext. sondées (int. ET ext.)",
      "Portes intérieures : chaque face dans son local",
      "Éléments sans peinture écartés",
      "Mesures réglementaires respectées (1/2/3)",
      "Risque saturnisme évalué",
      "Facteurs dégradation bâti notés si présents",
      "Photos prises pour le rapport"
    ]
  }
};
