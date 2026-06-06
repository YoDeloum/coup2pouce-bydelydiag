// ─────────────────────────────────────────────
// SCHEMAS SVG — Tous les schémas illustratifs
// Chaque fonction retourne une chaîne HTML contenant le schéma
// ─────────────────────────────────────────────

function svgAGCP() {
  return `<div class="schema-wrap">
    <div class="schema-title" style="color:#C084FC">Schéma — Lecture de l'AGCP</div>
    <svg viewBox="0 0 440 250" style="width:100%;max-width:440px">
      <rect x="130" y="25" width="160" height="145" rx="9" fill="#252A3A" stroke="#C084FC" stroke-width="2"/>
      <text x="210" y="18" text-anchor="middle" fill="#C084FC" font-size="12" font-family="monospace" font-weight="bold">AGCP</text>
      <rect x="145" y="40" width="130" height="34" rx="5" fill="#1E2235" stroke="#a78bfa" stroke-width="1.5"/>
      <text x="210" y="58" text-anchor="middle" fill="#e2e8f0" font-size="11" font-family="monospace">disjoncteur différentiel</text>
      <rect x="158" y="88" width="55" height="20" rx="4" fill="#1a1f2e" stroke="#7c3aed" stroke-width="1.5"/>
      <text x="185" y="102" text-anchor="middle" fill="#a78bfa" font-size="12" font-family="monospace" font-weight="bold">500 mA</text>
      <line x1="213" y1="98" x2="298" y2="98" stroke="#7c3aed" stroke-width="1.5" stroke-dasharray="4,3"/>
      <text x="302" y="95" fill="#9ca3af" font-size="9" font-family="monospace">Sensibilité (mA)</text>
      <text x="302" y="107" fill="#F87171" font-size="9" font-family="monospace">max 650 mA en habitation</text>
      <rect x="158" y="120" width="55" height="20" rx="4" fill="#1a1f2e" stroke="#6b7280" stroke-width="1.5"/>
      <text x="185" y="134" text-anchor="middle" fill="#9ca3af" font-size="11" font-family="monospace">15-45 A</text>
      <line x1="213" y1="130" x2="298" y2="130" stroke="#6b7280" stroke-width="1.5" stroke-dasharray="4,3"/>
      <text x="302" y="133" fill="#9ca3af" font-size="9" font-family="monospace">Plage de réglage</text>
      <ellipse cx="215" cy="158" rx="17" ry="11" fill="#1a1f2e" stroke="#4ade80" stroke-width="2"/>
      <text x="215" y="162" text-anchor="middle" fill="#4ade80" font-size="11" font-family="monospace" font-weight="bold">30 A</text>
      <line x1="232" y1="158" x2="298" y2="165" stroke="#4ade80" stroke-width="1.5" stroke-dasharray="4,3"/>
      <text x="302" y="168" fill="#4ade80" font-size="9" font-family="monospace">Calibre (réglage actuel)</text>
      <line x1="20" y1="192" x2="420" y2="192" stroke="#252a3a" stroke-width="1"/>
      <text x="20" y="207" fill="#C084FC" font-size="9" font-family="monospace" font-weight="bold">VÉRIFICATIONS TERRAIN</text>
      <circle cx="24" cy="222" r="3" fill="#4ade80"/>
      <text x="32" y="226" fill="#e2e8f0" font-size="9" font-family="monospace">Accès direct — hauteur max 1,80 m</text>
      <circle cx="24" cy="238" r="3" fill="#60A5FA"/>
      <text x="32" y="242" fill="#e2e8f0" font-size="9" font-family="monospace">Sensibilité ≤ 650 mA — VAT obligatoire</text>
    </svg>
  </div>`;
}

function svgTerre() {
  return `<div class="schema-wrap">
    <div class="schema-title" style="color:#4ADE80">Schéma — Mise à la Terre</div>
    <svg viewBox="0 0 440 250" style="width:100%;max-width:440px">
      <rect x="170" y="10" width="100" height="36" rx="7" fill="#252A3A" stroke="#C084FC" stroke-width="2"/>
      <text x="220" y="26" text-anchor="middle" fill="#C084FC" font-size="10" font-family="monospace" font-weight="bold">TABLEAU</text>
      <text x="220" y="38" text-anchor="middle" fill="#8B91A7" font-size="8" font-family="monospace">électrique</text>
      <line x1="220" y1="46" x2="220" y2="90" stroke="#4ADE80" stroke-width="2" stroke-dasharray="5,3"/>
      <text x="226" y="72" fill="#4ADE80" font-size="8" font-family="monospace">Cond. principal</text>
      <rect x="150" y="90" width="140" height="30" rx="5" fill="#1A2A1A" stroke="#4ADE80" stroke-width="2"/>
      <text x="220" y="102" text-anchor="middle" fill="#86EFAC" font-size="9" font-family="monospace" font-weight="bold">BARRETTE DE COUPURE</text>
      <text x="220" y="114" text-anchor="middle" fill="#4B5563" font-size="7" font-family="monospace">(barrette de terre)</text>
      <line x1="220" y1="120" x2="220" y2="178" stroke="#F59E0B" stroke-width="2.5"/>
      <text x="226" y="153" fill="#F59E0B" font-size="8" font-family="monospace">Cuivre nu</text>
      <rect x="190" y="178" width="60" height="22" rx="4" fill="#292524" stroke="#F59E0B" stroke-width="2"/>
      <text x="220" y="193" text-anchor="middle" fill="#FCD34D" font-size="9" font-family="monospace" font-weight="bold">PIQUET DE TERRE</text>
      <line x1="130" y1="190" x2="300" y2="190" stroke="#374151" stroke-width="2"/>
      <rect x="214" y="190" width="12" height="26" rx="2" fill="#F59E0B" opacity=".7"/>
      <line x1="150" y1="105" x2="72" y2="105" stroke="#4ADE80" stroke-width="1.5" stroke-dasharray="4,3"/>
      <line x1="72" y1="105" x2="72" y2="158" stroke="#4ADE80" stroke-width="1.5" stroke-dasharray="4,3"/>
      <rect x="12" y="153" width="60" height="22" rx="4" fill="#0F1F0F" stroke="#4ADE80" stroke-width="1.5"/>
      <text x="42" y="163" text-anchor="middle" fill="#86EFAC" font-size="8" font-family="monospace" font-weight="bold">L.E.P.</text>
      <text x="42" y="171" text-anchor="middle" fill="#4B5563" font-size="7" font-family="monospace">canalisations</text>
      <line x1="290" y1="105" x2="368" y2="105" stroke="#60A5FA" stroke-width="1.5" stroke-dasharray="4,3"/>
      <line x1="368" y1="105" x2="368" y2="158" stroke="#60A5FA" stroke-width="1.5" stroke-dasharray="4,3"/>
      <rect x="338" y="153" width="60" height="22" rx="4" fill="#0F172A" stroke="#60A5FA" stroke-width="1.5"/>
      <text x="368" y="163" text-anchor="middle" fill="#93C5FD" font-size="8" font-family="monospace" font-weight="bold">L.E.S.</text>
      <text x="368" y="171" text-anchor="middle" fill="#4B5563" font-size="7" font-family="monospace">salle de bain</text>
    </svg>
  </div>`;
}

function svgAmianteLOC() {
  return `<div class="schema-wrap">
    <div class="schema-title" style="color:#3B82F6">Localisation de l'amiante dans une habitation</div>
    <svg viewBox="0 0 500 300" style="width:100%;max-width:500px">
      <rect x="80" y="95" width="340" height="185" rx="4" fill="none" stroke="#4B5563" stroke-width="2"/>
      <polygon points="80,95 250,22 420,95" fill="none" stroke="#4B5563" stroke-width="2"/>
      <rect x="195" y="210" width="60" height="70" rx="2" fill="none" stroke="#374151" stroke-width="1.5"/>
      <rect x="115" y="165" width="70" height="50" rx="2" fill="none" stroke="#374151" stroke-width="1.5"/>
      <rect x="315" y="165" width="70" height="50" rx="2" fill="none" stroke="#374151" stroke-width="1.5"/>
      <circle cx="250" cy="57" r="5" fill="#3B82F6"/>
      <line x1="250" y1="57" x2="340" y2="30" stroke="#3B82F6" stroke-width="1.5"/>
      <text x="344" y="26" fill="#3B82F6" font-size="10" font-family="monospace" font-weight="bold">Toiture fibrociment</text>
      <text x="344" y="37" fill="#8B91A7" font-size="9" font-family="monospace">Liste B / C</text>
      <circle cx="130" cy="140" r="5" fill="#EF4444"/>
      <line x1="130" y1="140" x2="18" y2="110" stroke="#EF4444" stroke-width="1.5"/>
      <text x="5" y="106" fill="#EF4444" font-size="10" font-family="monospace" font-weight="bold">Flocage plafond</text>
      <text x="5" y="117" fill="#8B91A7" font-size="9" font-family="monospace">Liste A ⚠</text>
      <circle cx="250" cy="125" r="5" fill="#EF4444"/>
      <line x1="250" y1="125" x2="340" y2="105" stroke="#EF4444" stroke-width="1.5"/>
      <text x="344" y="101" fill="#EF4444" font-size="10" font-family="monospace" font-weight="bold">Faux-plafond</text>
      <text x="344" y="112" fill="#8B91A7" font-size="9" font-family="monospace">Liste A ⚠</text>
      <circle cx="150" cy="188" r="5" fill="#EF4444"/>
      <line x1="150" y1="188" x2="18" y2="165" stroke="#EF4444" stroke-width="1.5"/>
      <text x="5" y="161" fill="#EF4444" font-size="10" font-family="monospace" font-weight="bold">Calorifugeage</text>
      <text x="5" y="172" fill="#8B91A7" font-size="9" font-family="monospace">Liste A ⚠</text>
      <circle cx="250" cy="162" r="5" fill="#F59E0B"/>
      <line x1="250" y1="162" x2="344" y2="145" stroke="#F59E0B" stroke-width="1.5"/>
      <text x="347" y="141" fill="#F59E0B" font-size="10" font-family="monospace" font-weight="bold">Conduits / gaines</text>
      <text x="347" y="152" fill="#8B91A7" font-size="9" font-family="monospace">Liste B</text>
      <circle cx="250" cy="280" r="5" fill="#F59E0B"/>
      <line x1="250" y1="280" x2="344" y2="292" stroke="#F59E0B" stroke-width="1.5"/>
      <text x="347" y="288" fill="#F59E0B" font-size="10" font-family="monospace" font-weight="bold">Dalles sol / colles</text>
      <text x="347" y="299" fill="#8B91A7" font-size="9" font-family="monospace">Liste B</text>
      <circle cx="80" cy="260" r="5" fill="#3B82F6"/>
      <line x1="80" y1="260" x2="5" y2="275" stroke="#3B82F6" stroke-width="1.5"/>
      <text x="5" y="271" fill="#3B82F6" font-size="10" font-family="monospace" font-weight="bold">Bardage ext.</text>
      <text x="5" y="282" fill="#8B91A7" font-size="9" font-family="monospace">Liste B/C</text>
    </svg>
    <div style="display:flex;gap:16px;margin-top:12px;flex-wrap:wrap;justify-content:center">
      <div style="display:flex;align-items:center;gap:6px"><div style="width:10px;height:10px;border-radius:50%;background:#EF4444"></div><span style="font-size:11px;color:#8B91A7">Liste A — friable ⚠</span></div>
      <div style="display:flex;align-items:center;gap:6px"><div style="width:10px;height:10px;border-radius:50%;background:#F59E0B"></div><span style="font-size:11px;color:#8B91A7">Liste B — non friable</span></div>
      <div style="display:flex;align-items:center;gap:6px"><div style="width:10px;height:10px;border-radius:50%;background:#3B82F6"></div><span style="font-size:11px;color:#8B91A7">Liste B/C — ext.</span></div>
    </div>
  </div>`;
}

function svgAmiante_CONDUITS() {
  return `<div class="schema-wrap">
    <div class="schema-title" style="color:#3B82F6">Périmètre de vérification des conduits</div>
    <table style="width:100%;border-collapse:collapse;margin-bottom:14px">
      <thead>
        <tr style="background:#252A3A">
          <th style="padding:10px 14px;text-align:left;font-size:12px;color:#8B91A7;font-weight:500;border-bottom:1px solid #374151">Mission</th>
          <th style="padding:10px 14px;text-align:center;font-size:12px;color:#8B91A7;font-weight:500;border-bottom:1px solid #374151">Intérieur</th>
          <th style="padding:10px 14px;text-align:center;font-size:12px;color:#8B91A7;font-weight:500;border-bottom:1px solid #374151">Extérieur</th>
        </tr>
      </thead>
      <tbody style="background:#252A3A">
        <tr style="border-bottom:1px solid #374151">
          <td style="padding:12px 14px;font-size:13px;color:#3B82F6;font-weight:600">Sans mention</td>
          <td style="padding:12px 14px;text-align:center"><span style="font-size:12px;padding:4px 12px;border-radius:999px;background:rgba(239,68,68,.2);color:#FCA5A5;font-weight:600">Tous les conduits</span></td>
          <td style="padding:12px 14px;text-align:center"><span style="font-size:12px;padding:4px 12px;border-radius:999px;background:rgba(245,158,11,.2);color:#FCD34D;font-weight:600">Fibrociment uniquement</span></td>
        </tr>
        <tr>
          <td style="padding:12px 14px;font-size:13px;color:#8B5CF6;font-weight:600">Avec mention</td>
          <td style="padding:12px 14px;text-align:center"><span style="font-size:12px;padding:4px 12px;border-radius:999px;background:rgba(245,158,11,.2);color:#FCD34D;font-weight:600">Fibrociment uniquement</span></td>
          <td style="padding:12px 14px;text-align:center"><span style="font-size:12px;padding:4px 12px;border-radius:999px;background:rgba(239,68,68,.2);color:#FCA5A5;font-weight:600">Tous les conduits</span></td>
        </tr>
      </tbody>
    </table>
    <div style="background:#252A3A;border-radius:10px;padding:14px 16px;display:flex;gap:12px;align-items:flex-start">
      <span style="font-size:24px;flex-shrink:0">🧲</span>
      <div>
        <p style="font-size:13px;font-weight:600;color:#F0F2F8;margin-bottom:5px">Astuce terrain — l'aimant</p>
        <p style="font-size:13px;color:#8B91A7;line-height:1.7">Approcher un aimant du conduit :<br><strong style="color:#4ADE80">Reste collé → métal</strong> — non concerné<br><strong style="color:#F87171">Ne colle pas → fibrociment possible</strong> → à investiguer</p>
      </div>
    </div>
  </div>`;
}

function svgPlombZonage() {
  return `<div class="schema-wrap">
    <div class="schema-title" style="color:#EF4444">Schéma — Zonage d'un local (CREP)</div>
    <svg viewBox="0 0 420 320" style="width:100%;max-width:420px;display:block;margin:0 auto">
      <rect x="60" y="40" width="280" height="230" rx="4" fill="#252A3A" stroke="#EF4444" stroke-width="2"/>
      <text x="200" y="292" text-anchor="middle" fill="#EF4444" font-size="16" font-family="monospace" font-weight="bold">A</text>
      <rect x="185" y="260" width="40" height="10" rx="2" fill="#EF4444" opacity=".8"/>
      <path d="M 185 260 Q 185 240 205 240" fill="none" stroke="#EF4444" stroke-width="1.5" stroke-dasharray="3,2"/>
      <text x="200" y="278" text-anchor="middle" fill="#EF4444" font-size="9" font-family="monospace">Entrée</text>
      <text x="38" y="158" text-anchor="middle" fill="#4ADE80" font-size="16" font-family="monospace" font-weight="bold">B</text>
      <rect x="60" y="135" width="10" height="30" rx="1" fill="#4ADE80" opacity=".8"/>
      <text x="200" y="30" text-anchor="middle" fill="#60A5FA" font-size="16" font-family="monospace" font-weight="bold">C</text>
      <rect x="110" y="40" width="35" height="10" rx="1" fill="#60A5FA" opacity=".8"/>
      <text x="127" y="32" text-anchor="middle" fill="#60A5FA" font-size="9" font-family="monospace">F1</text>
      <rect x="240" y="40" width="35" height="10" rx="1" fill="#60A5FA" opacity=".8"/>
      <text x="257" y="32" text-anchor="middle" fill="#60A5FA" font-size="9" font-family="monospace">F2</text>
      <text x="362" y="158" text-anchor="middle" fill="#F59E0B" font-size="16" font-family="monospace" font-weight="bold">D</text>
      <path d="M 200 155 m -55 0 a 55 55 0 0 1 110 0" fill="none" stroke="#8B91A7" stroke-width="1.5" stroke-dasharray="4,3"/>
      <polygon points="253,150 263,155 253,160" fill="#8B91A7"/>
      <text x="200" y="148" text-anchor="middle" fill="#8B91A7" font-size="9" font-family="monospace">sens horaire</text>
    </svg>
    <div style="margin-top:14px;background:#252A3A;border-radius:8px;padding:12px 14px">
      <p style="font-size:12px;font-weight:600;color:#F0F2F8;margin-bottom:6px">💡 Règle à retenir</p>
      <p style="font-size:12px;color:#8B91A7;line-height:1.7">
        <strong style="color:#EF4444">Zone A</strong> = mur d'entrée (porte principale) → sens des aiguilles d'une montre : <strong style="color:#4ADE80">B</strong>, <strong style="color:#60A5FA">C</strong>, <strong style="color:#F59E0B">D</strong>...<br>
        Plusieurs fenêtres sur la même zone → <strong style="color:#60A5FA">F1, F2...</strong>
      </p>
    </div>
  </div>`;
}

function svgAUE() {
  return `<div class="schema-wrap" style="background:#1E2235;border-radius:12px;padding:16px;margin-top:16px">
    <div class="schema-title" style="color:#E8650A;font-size:11px;font-family:monospace;letter-spacing:2px;text-transform:uppercase;margin-bottom:14px;text-align:center">Schéma — AUE (b) : Appartement au dernier étage</div>
    <svg viewBox="0 0 480 290" style="width:100%;max-width:480px;display:block;margin:0 auto">
      <text x="20" y="30" fill="#9ca3af" font-size="9" font-family="monospace">N</text>
      <text x="20" y="48" fill="#9ca3af" font-size="9" font-family="monospace">O+E</text>
      <text x="20" y="63" fill="#9ca3af" font-size="9" font-family="monospace">S</text>
      <text x="240" y="68" text-anchor="middle" fill="#6B7280" font-size="9" font-family="monospace">EXT (plafond dernier étage = SF)</text>
      <text x="410" y="115" fill="#6B7280" font-size="9" font-family="monospace">EXT</text>
      <rect x="55" y="80" width="155" height="140" rx="4" fill="#252A3A" stroke="#6B7280" stroke-width="2"/>
      <text x="132" y="155" text-anchor="middle" fill="#9ca3af" font-size="14" font-family="monospace" font-weight="bold">LC</text>
      <rect x="210" y="80" width="90" height="140" rx="2" fill="#1E2235" stroke="#6B7280" stroke-width="1.5" stroke-dasharray="4,3"/>
      <text x="255" y="155" text-anchor="middle" fill="#fff" font-size="11" font-family="monospace" font-weight="bold">LNC</text>
      <rect x="210" y="80" width="90" height="16" rx="0" fill="#3B82F6" opacity=".7"/>
      <text x="255" y="92" text-anchor="middle" fill="#fff" font-size="8" font-family="monospace" font-weight="bold">SF</text>
      <rect x="284" y="80" width="16" height="140" rx="0" fill="#3B82F6" opacity=".7"/>
      <text x="292" y="155" text-anchor="middle" fill="#fff" font-size="8" font-family="monospace" font-weight="bold" transform="rotate(90,292,155)">SF</text>
      <rect x="210" y="80" width="14" height="140" rx="0" fill="#EF4444" opacity=".7"/>
      <text x="217" y="130" text-anchor="middle" fill="#fff" font-size="7" font-family="monospace" font-weight="bold" transform="rotate(90,217,130)">SCH</text>
      <rect x="210" y="204" width="90" height="16" rx="0" fill="#EF4444" opacity=".7"/>
      <text x="255" y="216" text-anchor="middle" fill="#fff" font-size="8" font-family="monospace" font-weight="bold">SCH</text>
      <text x="207" y="125" text-anchor="end" fill="#EF4444" font-size="12" font-family="monospace" font-weight="bold">1</text>
      <text x="207" y="200" text-anchor="end" fill="#EF4444" font-size="12" font-family="monospace" font-weight="bold">2</text>
      <line x1="255" y1="80" x2="255" y2="68" stroke="#3B82F6" stroke-width="1.5" stroke-dasharray="3,2"/>
      <line x1="300" y1="150" x2="315" y2="150" stroke="#3B82F6" stroke-width="1.5" stroke-dasharray="3,2"/>
      <text x="320" y="154" fill="#3B82F6" font-size="8" font-family="monospace">EXT → SF</text>
      <rect x="210" y="220" width="90" height="60" rx="4" fill="#252A3A" stroke="#6B7280" stroke-width="2"/>
      <text x="255" y="255" text-anchor="middle" fill="#9ca3af" font-size="11" font-family="monospace" font-weight="bold">LC</text>
      <line x1="55" y1="258" x2="430" y2="258" stroke="#374151" stroke-width="1"/>
      <rect x="60" y="265" width="12" height="10" rx="1" fill="#3B82F6" opacity=".8"/>
      <text x="76" y="274" fill="#e2e8f0" font-size="9" font-family="monospace">SF = Surface Froide (→ extérieur ou terrain)</text>
      <rect x="60" y="278" width="12" height="10" rx="1" fill="#EF4444" opacity=".8"/>
      <text x="76" y="287" fill="#e2e8f0" font-size="9" font-family="monospace">SCH = Surface Chaude (→ local chauffé)</text>
    </svg>
    <div style="margin-top:14px;background:#252A3A;border-radius:8px;padding:12px 14px">
      <p style="font-size:12px;color:#F59E0B;font-weight:700;margin-bottom:6px">💡 Formule : b = SF / (SF + SCH)</p>
      <p style="font-size:12px;color:#9ca3af;line-height:1.7">• <span style="color:#3B82F6">SF (Surface Froide)</span> : parois du LNC donnant sur l'extérieur ou sur le terrain<br>• <span style="color:#EF4444">SCH (Surface Chaude)</span> : parois du LNC donnant sur un local chauffé (LC)<br>• Une paroi entre deux LNC s'annule — ne pas la compter<br>• Une paroi donnant sur le terrain est considérée comme froide (SF)</p>
    </div>
  </div>`;
}

function svgTest3Piquets() {
  return '<div class="schema-wrap"><div class="schema-title" style="color:#8B5CF6">Schéma — Méthode 3 Piquets / 62%</div><svg viewBox="0 0 480 220" style="width:100%;max-width:480px;display:block;margin:0 auto"><rect x="0" y="150" width="480" height="70" fill="#1A1A2E" opacity=".5"/><line x1="0" y1="150" x2="480" y2="150" stroke="#4B5563" stroke-width="2"/><text x="240" y="195" text-anchor="middle" fill="#4B5563" font-size="9" font-family="monospace">SOL</text><rect x="170" y="15" width="140" height="45" rx="8" fill="#252A3A" stroke="#8B5CF6" stroke-width="2"/><text x="240" y="34" text-anchor="middle" fill="#8B5CF6" font-size="9" font-family="monospace" font-weight="bold">TELLURONOMETRE</text><text x="240" y="50" text-anchor="middle" fill="#F59E0B" font-size="9" font-family="monospace">Appareil de mesure</text><rect x="38" y="110" width="14" height="60" rx="3" fill="#F59E0B"/><text x="45" y="103" text-anchor="middle" fill="#F59E0B" font-size="8" font-family="monospace" font-weight="bold">Piquet</text><text x="45" y="93" text-anchor="middle" fill="#F59E0B" font-size="8" font-family="monospace">client</text><rect x="428" y="110" width="14" height="60" rx="3" fill="#EF4444"/><text x="435" y="103" text-anchor="middle" fill="#EF4444" font-size="8" font-family="monospace" font-weight="bold">2e piquet</text><text x="435" y="93" text-anchor="middle" fill="#EF4444" font-size="8" font-family="monospace">20 m</text><rect x="258" y="118" width="12" height="52" rx="3" fill="#4ADE80"/><text x="264" y="110" text-anchor="middle" fill="#4ADE80" font-size="8" font-family="monospace" font-weight="bold">3e piquet</text><text x="264" y="100" text-anchor="middle" fill="#4ADE80" font-size="8" font-family="monospace">62%</text><text x="264" y="90" text-anchor="middle" fill="#4ADE80" font-size="7" font-family="monospace">12,40m</text><line x1="195" y1="60" x2="45" y2="110" stroke="#F59E0B" stroke-width="2"/><line x1="240" y1="60" x2="264" y2="118" stroke="#4ADE80" stroke-width="2"/><line x1="285" y1="60" x2="435" y2="110" stroke="#EF4444" stroke-width="2"/><line x1="45" y1="145" x2="435" y2="145" stroke="#6B7280" stroke-width="1" stroke-dasharray="5,4"/><text x="240" y="142" text-anchor="middle" fill="#6B7280" font-size="9" font-family="monospace">20 metres minimum</text></svg><div style="margin-top:12px;background:#252A3A;border-radius:8px;padding:12px 14px"><p style="font-size:12px;color:#F59E0B;font-weight:700;margin-bottom:5px">Positions du 3e piquet</p><p style="font-size:12px;color:#9ca3af;line-height:1.8">1ere mesure : 62% = 12,40 m<br>2e mesure : 52% = 10,40 m<br>3e mesure : 72% = 14,40 m<br><strong style="color:#F59E0B">Retenir le MEILLEUR resultat (valeur la plus basse)</strong></p></div></div>';
}

function svgTermitesTab1() {
  return `<div class="schema-wrap" style="padding:0;background:#fff;border:1px solid #E2E5F0;border-radius:12px;overflow:hidden">
    <div style="background:#22C55E;padding:12px 16px">
      <p style="font-size:12px;color:#fff;font-weight:700;letter-spacing:1px;text-transform:uppercase;font-family:monospace">Tableau 1 — Insectes et champignons xylophages</p>
    </div>
    <div style="overflow-x:auto">
    <table style="width:100%;border-collapse:collapse;font-size:13px">
      <thead>
        <tr style="background:#fafaf8">
          <th style="padding:10px 12px;text-align:left;font-weight:700;color:#1A1D2E;border-bottom:1px solid #E2E5F0">Type</th>
          <th style="padding:10px 12px;text-align:left;font-weight:700;color:#1A1D2E;border-bottom:1px solid #E2E5F0">Indices visibles</th>
          <th style="padding:10px 12px;text-align:left;font-weight:700;color:#1A1D2E;border-bottom:1px solid #E2E5F0">Reconnaissance</th>
          <th style="padding:10px 12px;text-align:left;font-weight:700;color:#1A1D2E;border-bottom:1px solid #E2E5F0">Zones fréquentes</th>
        </tr>
      </thead>
      <tbody>
        <tr style="border-bottom:1px solid #E2E5F0;background:#FAFFFE">
          <td style="padding:10px 12px;font-weight:600;color:#22C55E">Termites</td>
          <td style="padding:10px 12px;color:#374151">Bois creux, galeries internes, cordonnets de terre, ailes abandonnées</td>
          <td style="padding:10px 12px;color:#374151">Pas de sciure, bois mangé de l'intérieur</td>
          <td style="padding:10px 12px;color:#374151">Cave, plinthes, bois en contact maçonnerie</td>
        </tr>
        <tr style="border-bottom:1px solid #E2E5F0">
          <td style="padding:10px 12px;font-weight:600;color:#1A1D2E">Petite vrillette</td>
          <td style="padding:10px 12px;color:#374151">Trous 1 à 2 mm, fine sciure claire</td>
          <td style="padding:10px 12px;color:#374151">Trous nombreux et réguliers</td>
          <td style="padding:10px 12px;color:#374151">Meubles, charpentes humides</td>
        </tr>
        <tr style="border-bottom:1px solid #E2E5F0;background:#FAFFFE">
          <td style="padding:10px 12px;font-weight:600;color:#1A1D2E">Grosse vrillette</td>
          <td style="padding:10px 12px;color:#374151">Trous 3 à 5 mm, sciure grossière</td>
          <td style="padding:10px 12px;color:#374151">Souvent liée à humidité</td>
          <td style="padding:10px 12px;color:#374151">Vieilles charpentes</td>
        </tr>
        <tr style="border-bottom:1px solid #E2E5F0">
          <td style="padding:10px 12px;font-weight:600;color:#1A1D2E">Capricorne</td>
          <td style="padding:10px 12px;color:#374151">Trous ovales 6 à 10 mm, copeaux, galeries profondes</td>
          <td style="padding:10px 12px;color:#374151">Attaque surtout résineux</td>
          <td style="padding:10px 12px;color:#374151">Combles, charpentes</td>
        </tr>
        <tr style="border-bottom:1px solid #E2E5F0;background:#FAFFFE">
          <td style="padding:10px 12px;font-weight:600;color:#1A1D2E">Lyctus</td>
          <td style="padding:10px 12px;color:#374151">Très petits trous, sciure farineuse</td>
          <td style="padding:10px 12px;color:#374151">Bois feuillus récents</td>
          <td style="padding:10px 12px;color:#374151">Parquets, escaliers</td>
        </tr>
        <tr style="border-bottom:1px solid #E2E5F0">
          <td style="padding:10px 12px;font-weight:600;color:#EF4444">Mérule</td>
          <td style="padding:10px 12px;color:#374151">Filaments blancs, odeur de champignon, bois fissuré en cubes</td>
          <td style="padding:10px 12px;color:#374151">Champignon très destructeur</td>
          <td style="padding:10px 12px;color:#374151">Cave, doublages, planchers</td>
        </tr>
        <tr style="background:#FAFFFE">
          <td style="padding:10px 12px;font-weight:600;color:#EF4444">Coniophore / pourriture fibreuse</td>
          <td style="padding:10px 12px;color:#374151">Bois brun, mou, fibreux</td>
          <td style="padding:10px 12px;color:#374151">Humidité importante</td>
          <td style="padding:10px 12px;color:#374151">Cave, menuiseries, pièces humides</td>
        </tr>
      </tbody>
    </table>
    </div>
  </div>`;
}

function svgTermitesTab2() {
  return `<div class="schema-wrap" style="padding:0;background:#fff;border:1px solid #E2E5F0;border-radius:12px;overflow:hidden;margin-top:16px">
    <div style="background:#22C55E;padding:12px 16px">
      <p style="font-size:12px;color:#fff;font-weight:700;letter-spacing:1px;text-transform:uppercase;font-family:monospace">Points de contrôle prioritaires</p>
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:13px">
      <thead>
        <tr style="background:#fafaf8">
          <th style="padding:10px 12px;text-align:left;font-weight:700;color:#1A1D2E;border-bottom:1px solid #E2E5F0">Zone</th>
          <th style="padding:10px 12px;text-align:left;font-weight:700;color:#1A1D2E;border-bottom:1px solid #E2E5F0">Risque principal</th>
        </tr>
      </thead>
      <tbody>
        <tr style="border-bottom:1px solid #E2E5F0;background:#FAFFFE"><td style="padding:10px 12px;font-weight:600">Charpente</td><td style="padding:10px 12px;color:#374151">Capricorne, vrillettes</td></tr>
        <tr style="border-bottom:1px solid #E2E5F0"><td style="padding:10px 12px;font-weight:600">Solives</td><td style="padding:10px 12px;color:#374151">Humidité, champignons</td></tr>
        <tr style="border-bottom:1px solid #E2E5F0;background:#FAFFFE"><td style="padding:10px 12px;font-weight:600">Cave</td><td style="padding:10px 12px;color:#374151">Mérule, termites</td></tr>
        <tr style="border-bottom:1px solid #E2E5F0"><td style="padding:10px 12px;font-weight:600;color:#22C55E">Plinthes</td><td style="padding:10px 12px;color:#374151">Termites</td></tr>
        <tr style="border-bottom:1px solid #E2E5F0;background:#FAFFFE"><td style="padding:10px 12px;font-weight:600">Encadrements fenêtres</td><td style="padding:10px 12px;color:#374151">Pourriture fibreuse</td></tr>
        <tr style="border-bottom:1px solid #E2E5F0"><td style="padding:10px 12px;font-weight:600;color:#22C55E">Bois contre maçonnerie</td><td style="padding:10px 12px;color:#374151">Termites, humidité</td></tr>
        <tr style="border-bottom:1px solid #E2E5F0;background:#FAFFFE"><td style="padding:10px 12px;font-weight:600;color:#EF4444">Pièces humides</td><td style="padding:10px 12px;color:#374151">Champignons</td></tr>
        <tr><td style="padding:10px 12px;font-weight:600;color:#EF4444">Derrière doublages</td><td style="padding:10px 12px;color:#374151">Mérule</td></tr>
      </tbody>
    </table>
  </div>`;
}

// ─────────────────────────────────────────────
// DISPATCHER — Retourne le bon schéma par nom
// ─────────────────────────────────────────────
function getSchema(name) {
  if (name === "AGCP")             return svgAGCP();
  if (name === "TERRE")            return svgTerre();
  if (name === "AMIANTE_LOC")      return svgAmianteLOC();
  if (name === "AMIANTE_CONDUITS") return svgAmiante_CONDUITS();
  if (name === "PLOMB_ZONAGE")     return svgPlombZonage();
  if (name === "TERMITES_TAB1")    return svgTermitesTab1();
  if (name === "TERMITES_TAB2")    return svgTermitesTab2();
  if (name === "AUE")              return svgAUE();
  if (name === "TEST_3PIQUETS")    return svgTest3Piquets();
  // Schémas électricité — définis dans l'index.html original, à migrer si besoin
  if (name === "LICIEL_B1")        return typeof svgLicielB1  === 'function' ? svgLicielB1()  : '';
  if (name === "LICIEL_B2")        return typeof svgLicielB2  === 'function' ? svgLicielB2()  : '';
  if (name === "TEST_DIFF")        return typeof svgTestDiff  === 'function' ? svgTestDiff()  : '';
  if (name === "CONTINUITE_LES")   return typeof svgContinuiteLES  === 'function' ? svgContinuiteLES()  : '';
  if (name === "AMONT_AVAL")       return typeof svgAmontAval === 'function' ? svgAmontAval() : '';
  if (name === "CONTINUITE_PRISE") return typeof svgContinuitePrise === 'function' ? svgContinuitePrise() : '';
  if (name === "IMPEDANCE_BOUCLE2")return typeof svgImpedanceBoucle2 === 'function' ? svgImpedanceBoucle2() : '';
  if (name === "CONTINUITE_LEP")   return typeof svgContinuiteLEP === 'function' ? svgContinuiteLEP() : '';
  if (name === "TEST_BOUCLE")      return typeof svgTestBoucle === 'function' ? svgTestBoucle() : '';
  return '';
}
