// Identidades verificadas contra MANIFESTO_PACOTE_ETAPA6.json.
export const demoFiles = [
  {
    name: 'SAFEVISION_V03_PLANTAS_2D.pdf',
    bytes: 252206,
    sha256: '68b62a86febada08ce1bf62545437b521abe642a551f0a641aa172b047cbbd9f',
  },
  {
    name: 'SAFEVISION_V03_DETALHE_TECNICO_R03.pdf',
    bytes: 93494,
    sha256: '2f6541770428731310ae5089034c5f76e063a8ba9fedf005ea024dfa4a55e316',
  },
];

export async function validateDemoFile(file, selection) {
  if (!file.name.toLowerCase().endsWith('.pdf')) return 'Selecione um PDF oficial.';
  if (file.size > Math.max(...demoFiles.map(entry => entry.bytes))) {
    return 'Arquivo acima do limite deste conjunto.';
  }
  const expected = demoFiles.find(entry => entry.name === file.name);
  if (!expected) return 'Nome ausente do conjunto demonstrativo.';
  if (selection.filter(entry => entry.name === file.name).length > 1) {
    return 'Remova uma das cópias deste arquivo.';
  }
  if (file.size !== expected.bytes) return 'Tamanho diferente do PDF oficial.';
  const bytes = await file.arrayBuffer();
  if (new TextDecoder().decode(bytes.slice(0, 5)) !== '%PDF-') return 'Formato PDF inválido.';
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const hash = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
  return hash === expected.sha256 ? '' : 'Conteúdo diferente do PDF oficial.';
}
