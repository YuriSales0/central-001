import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

const Painel = () => (
  <div style={{ padding: '2rem' }}>
    <h2>Nós Fundacionais</h2>
    <ul>
      <li><strong>001</strong> – Intenção: Criar a Central e inaugurar a era da economia intencional</li>
      <li><strong>002</strong> – Intenção: Aplicar IA na formação de redes de cooperação entre educadores</li>
      <li><strong>003</strong> – Intenção: Construir modelos éticos de governança distribuída</li>
      <li><strong>004</strong> – Intenção: Usar a Central para mapeamento de vocações em zonas rurais</li>
      <li><strong>005</strong> – Intenção: Avaliar como a Central pode integrar refugiados à economia local</li>
    </ul>
  </div>
);

const Home = () => (
  <div style={{ padding: '2rem' }}>
    <h1>🌐 Central 001</h1>
    <p>Você é um nó. Um ponto de consciência intencional em rede.</p>
    <Link to="/painel">Ver Painel de Nós Fundacionais</Link>
  </div>
);

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/painel" element={<Painel />} />
      </Routes>
    </Router>
  );
}