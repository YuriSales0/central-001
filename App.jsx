import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

function CentralAccess() {
  const [node, setNode] = useState('');
  const [intention, setIntention] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen p-4 font-sans">
      <h1 className="text-3xl text-center mb-2">🌐 Central</h1>
      <p className="text-center text-gray-600 mb-6">
        Bem-vindo, nó fundacional. Aqui começa a revolução.
      </p>
      <div className="text-center mb-8">
        <Link to="/painel" className="text-indigo-600 underline">Ver painel de nós fundacionais</Link>
      </div>

      {!submitted ? (
        <form onSubmit={handleSubmit} className="max-w-md mx-auto">
          <label>
            Número do Nó:
            <input
              type="text"
              value={node}
              onChange={(e) => setNode(e.target.value)}
              required
              className="w-full p-2 border rounded mb-4"
            />
          </label>
          <label>
            Intenção Inicial:
            <textarea
              value={intention}
              onChange={(e) => setIntention(e.target.value)}
              rows="4"
              required
              className="w-full p-2 border rounded mb-4"
            />
          </label>
          <button type="submit" className="w-full py-2 bg-indigo-600 text-white rounded">
            Ingressar na Central
          </button>
        </form>
      ) : (
        <div className="text-center mt-10">
          <p><strong>Nó:</strong> {node}</p>
          <p className="italic">"{intention}"</p>
          <p className="text-green-600 mt-2">Intenção registrada. Você agora está conectado.</p>
        </div>
      )}
    </div>
  );
}

function PainelNosFundacionais() {
  const [nos] = useState([
    { id: '001', intencao: 'Criar a Central para transformar potencial humano em valor social.' },
    { id: '002', intencao: 'Gerar conexões entre comunidades locais com a Central.' },
    { id: '003', intencao: 'Apoiar jovens a descobrirem seu papel no mundo por meio de seus nós.' },
    { id: '004', intencao: 'Integrar sustentabilidade à economia intencional.' },
    { id: '005', intencao: 'Construir pontes entre tecnologia e ancestralidade.' }
  ]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-4xl font-bold text-center mb-8">🌐 Painel de Nós Fundacionais</h1>
      <p className="text-center text-gray-600 mb-10 max-w-2xl mx-auto">
        A Central está viva. Aqui se encontram os primeiros nós — seres humanos que intencionaram seu papel no novo sistema.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
        {nos.map((no) => (
          <div
            key={no.id}
            className="bg-white rounded-2xl shadow-md p-6 border border-gray-200 hover:shadow-xl transition"
          >
            <h2 className="text-xl font-bold text-indigo-800">Nó {no.id}</h2>
            <p className="mt-3 text-gray-700 italic">"{no.intencao}"</p>
          </div>
        ))}
      </div>

      <div className="text-center mt-12 text-sm text-gray-500">
        Total: {nos.length} nós fundacionais conectados.
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<CentralAccess />} />
        <Route path="/painel" element={<PainelNosFundacionais />} />
      </Routes>
    </Router>
  );
}