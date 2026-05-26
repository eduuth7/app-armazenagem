import { saveAs } from 'file-saver';
import './index.css';
import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
  doc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';



// FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyA7T9mLGGXQT_0iZcUB4nmn_dcslAZ4mjw",
  authDomain: "portaldaarmazenagem.firebaseapp.com",
  projectId: "portaldaarmazenagem",
  storageBucket: "portaldaarmazenagem.firebasestorage.app",
  messagingSenderId: "499308137403",
  appId: "1:499308137403:web:7d5070c8632446ba44129e",
  measurementId: "G-ZD8VXTP82W"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = "portaldaarmazenagem";

// SENHAS
const SENHAS_TURNOS = {
  'Turno A': 'senhaA123',
  'Turno B': 'senhaB123',
  'Turno C': 'senhaC123'
};

export default function App() {

  // STATES
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [turnoLogado, setTurnoLogado] = useState<string | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState('');

  const [loginTurno, setLoginTurno] = useState('Turno A');
  const [loginSenha, setLoginSenha] = useState('');
  const [loginErro, setLoginErro] = useState('');

  const [registros, setRegistros] = useState<any[]>([]);
  const [busca, setBusca] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

 const [form, setForm] = useState({
  data: new Date().toISOString().split('T')[0],
  inicio: '',
  fim: '',
  descricao: '',
  status: 'Em andamento'
  
});
const [imagem, setImagem] = useState<any>(null);
  // AUTH
  useEffect(() => {

    const initAuth = async () => {

      try {

        await signInAnonymously(auth);

      } catch (error) {

        console.error(error);
        setAuthError('Erro ao conectar.');
        setIsLoadingAuth(false);

      }
    };

    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (user) => {

      setFirebaseUser(user);
      setIsLoadingAuth(false);

    });

    return () => unsubscribe();

  }, []);

  // FIRESTORE
  useEffect(() => {

    if (!firebaseUser) return;

    const collRef = collection(
  db,
  'inconsistencias'
);

    const unsubscribe = onSnapshot(collRef, (snapshot) => {

      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      data.sort((a: any, b: any) => {
        const timeA = a.createdAt?.toMillis?.() || 0;
        const timeB = b.createdAt?.toMillis?.() || 0;
        return timeB - timeA;
      });

      setRegistros(data);

    });

    return () => unsubscribe();

  }, [firebaseUser]);

  // LOGIN
  const handleLogin = (e: any) => {

    e.preventDefault();

    if (SENHAS_TURNOS[loginTurno as keyof typeof SENHAS_TURNOS] === loginSenha) {

      setTurnoLogado(loginTurno);
      setLoginErro('');
      setLoginSenha('');

    } else {

      setLoginErro('Senha incorreta.');

    }
  };

  // LOGOUT
  const handleLogout = () => {
    setTurnoLogado(null);
  };

  // SALVAR
  const handleSubmitRegistro = async (e: any) => {

    e.preventDefault();

    if (!firebaseUser) return;

    if (!form.data || !form.inicio || !form.fim || !form.descricao) {
      alert('Preencha todos os campos.');
      return;
    }

    setIsSubmitting(true);

    try {

      const collRef = collection(
  db,
  'inconsistencias'
);
let imageUrl = '';



if (imagem) {

  imageUrl = await new Promise((resolve) => {

    const reader = new FileReader();

    reader.onload = (event: any) => {

      const img = new Image();

      img.onload = () => {

        const canvas = document.createElement('canvas');

        const MAX_WIDTH = 600;

        const scaleSize = MAX_WIDTH / img.width;

        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;

        const ctx = canvas.getContext('2d');

        ctx?.drawImage(
          img,
          0,
          0,
          canvas.width,
          canvas.height
        );

        const compressedBase64 = canvas.toDataURL(
          'image/jpeg',
          0.6
        );

        resolve(compressedBase64);

      };

      img.src = event.target.result;

    };

    reader.readAsDataURL(imagem);

  });

}
      await addDoc(collRef, {
  turno: turnoLogado,
  data: form.data,
  inicio: form.inicio,
  fim: form.fim,
  descricao: form.descricao,
  status: form.status,
  imagem: imageUrl,
  userId: firebaseUser.uid,
  createdAt: serverTimestamp()
});

      setForm({
  data: new Date().toISOString().split('T')[0],
  inicio: '',
  fim: '',
  descricao: '',
  status: 'Em andamento'
});

    } catch (error) {

      console.error(error);
      alert('Erro ao salvar.');

    } finally {

      setIsSubmitting(false);

    }
  };

  // BUSCA
  const registrosFiltrados = useMemo(() => {

    if (!busca) return registros;

    const termo = busca.toLowerCase();

    return registros.filter((reg: any) =>
      reg.descricao?.toLowerCase().includes(termo) ||
      reg.turno?.toLowerCase().includes(termo) ||
      reg.data?.includes(termo)
    );

  }, [registros, busca]);

  // LOADING
  if (isLoadingAuth) {

    return (

      <div className="app-container login-wrapper">

        <div className="login-card">

          <div className="login-header">

            <h1>Conectando...</h1>

            <p>
              Aguarde um momento
            </p>

          </div>

        </div>

      </div>

    );
  }

  // ERRO
  if (authError && !firebaseUser) {

    return (

      <div className="app-container login-wrapper">

        <div className="login-card">

          <div className="login-header">

            <h1>Erro</h1>

            <p>{authError}</p>

          </div>

        </div>

      </div>

    );
  }

  // LOGIN
  if (!turnoLogado) {

    return (

      <div className="app-container login-wrapper">

        <div className="login-card">

          <div className="login-header">

            <h1>Portal de Armazenagem</h1>

            <p>
              Controle Inteligente de Inconsistências
            </p>

          </div>

          <form onSubmit={handleLogin} className="login-body">

            {loginErro && (

              <div
                style={{
                  background: 'rgba(239,68,68,0.12)',
                  border: '1px solid rgba(239,68,68,0.25)',
                  color: '#f87171',
                  padding: '14px',
                  borderRadius: '14px',
                  marginBottom: '20px'
                }}
              >
                {loginErro}
              </div>

            )}

            <div className="form-group">

              <label>Selecione o Turno</label>

              <select
                value={loginTurno}
                onChange={(e) => setLoginTurno(e.target.value)}
                className="input-modern"
              >
                <option value="Turno A">Turno A</option>
                <option value="Turno B">Turno B</option>
                <option value="Turno C">Turno C</option>
              </select>

            </div>

            <div className="form-group">

              <label>Senha</label>

              <input
                type="password"
                value={loginSenha}
                onChange={(e) => setLoginSenha(e.target.value)}
                className="input-modern"
                placeholder="Digite sua senha"
              />

            </div>

            <button
              type="submit"
              className="btn-modern"
            >
              Entrar no Sistema
            </button>

          </form>

        </div>

      </div>
    );
  }
const exportarCSV = () => {

  const headers = [
    'Turno',
    'Data',
    'Inicio',
    'Fim',
    'Status',
    'Descricao'
  ];

  const rows = registros.map((r: any) => [

    r.turno || '',
    r.data || '',
    r.inicio || '',
    r.fim || '',
    r.status || 'Em andamento',
    r.descricao || ''

  ]);

  const csvContent =

    [headers, ...rows]
      .map(e => e.join(';'))
      .join('\n');

  const blob = new Blob(

    [csvContent],

    {
      type: 'text/csv;charset=utf-8;'
    }

  );

  saveAs(blob, 'inconsistencias.csv');

};
  // DASHBOARD
  return (

    <div className="app-container dashboard">

      <div className="topbar">

        <div>

          <h1>Portal de Armazenagem</h1>

          <span>
            Registro de inconsistências operacionais
          </span>

        </div>

        <button
          onClick={handleLogout}
          className="logout-btn"
        >
          Sair
        </button>

      </div>

      {/* FORM */}

      <div className="card">

        <h2 className="card-title">
          Nova Inconsistência
        </h2>

        <form onSubmit={handleSubmitRegistro}>

          <div className="grid-3">

  <input
    type="date"
    value={form.data}
    onChange={(e) => setForm({ ...form, data: e.target.value })}
    className="input-modern"
  />

  <input
    type="time"
    value={form.inicio}
    onChange={(e) => setForm({ ...form, inicio: e.target.value })}
    className="input-modern"
  />

  <input
    type="time"
    value={form.fim}
    onChange={(e) => setForm({ ...form, fim: e.target.value })}
    className="input-modern"
  />

  <select
    value={form.status}
    onChange={(e) => setForm({ ...form, status: e.target.value })}
    className="input-modern"
  >

    <option>Em andamento</option>
    <option>Finalizado</option>
    <option>Pendente</option>
    <option>Crítico</option>

  </select>

</div>
<input
  type="file"
  accept="image/*"
  className="input-modern"
  style={{ marginTop: '20px' }}
  onChange={(e: any) => {

    if (e.target.files[0]) {
      setImagem(e.target.files[0]);
    }

  }}
/>
          <textarea
            rows={4}
            value={form.descricao}
            onChange={(e) => setForm({ ...form, descricao: e.target.value })}
            placeholder="Descreva detalhadamente o problema..."
            className="textarea-modern"
          />

          <div style={{ marginTop: '20px' }}>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-modern"
            >
              {isSubmitting ? 'Salvando...' : 'Salvar Registro'}
            </button>

          </div>

        </form>

      </div>

      {/* HISTÓRICO */}

      <div className="card">

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            gap: '20px',
            flexWrap: 'wrap'
          }}
        >

          <h2 className="card-title">
            Histórico de Registros
          </h2>

          <input
            type="text"
            placeholder="Buscar registros..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="search-box"
          />
  <button
  onClick={exportarCSV}
  className="btn-modern"
  style={{
    width: '220px'
  }}
>
  Exportar CSV
</button>
        </div>

        <div className="table-wrapper">

          <table>

            <thead>

              <tr>

                <th>Turno</th>
                <th>Data</th>
                <th>Horário</th>
                <th>Descrição</th>
                <th>Status</th>
                <th>Ações</th>

              </tr>

            </thead>

            <tbody>

              {registrosFiltrados.map((reg: any) => (

                <tr key={reg.id}>

                  <td>{reg.turno}</td>

                  <td>{reg.data}</td>

                  <td>
                    {reg.inicio} até {reg.fim}
                  </td>

                 <td>

  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '10px'
    }}
  >

    <span>
      {reg.descricao}
    </span>

    {reg.imagem && (

      <img
        src={reg.imagem}
        alt="Imagem"
        style={{
          width: '120px',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.1)'
        }}
      />

    )}

  </div>

</td>

<td>

  <select
   value={reg.status || 'Em andamento'}
    onChange={async (e) => {

      try {

       const docRef = doc( db, 'inconsistencias', reg.id);

        await updateDoc(docRef, {
          status: e.target.value
        });

      } catch (error) {

        console.error(error);
        alert('Erro ao atualizar status');

      }

    }}
    className="input-modern"
    style={{

  minWidth: '160px',

  background:
    (reg.status || 'Em andamento') === 'Finalizado'
      ? 'rgba(34,197,94,0.15)'
      : (reg.status || 'Em andamento') === 'Crítico'
      ? 'rgba(239,68,68,0.15)'
      : (reg.status || 'Em andamento') === 'Pendente'
      ? 'rgba(234,179,8,0.15)'
      : 'rgba(59,130,246,0.15)',

  color:
    (reg.status || 'Em andamento') === 'Finalizado'
      ? '#22c55e'
      : (reg.status || 'Em andamento') === 'Crítico'
      ? '#ef4444'
      : (reg.status || 'Em andamento') === 'Pendente'
      ? '#eab308'
      : '#3b82f6'
}}
  >

    <option>Em andamento</option>
    <option>Finalizado</option>
    <option>Pendente</option>
    <option>Crítico</option>

  </select>

</td>
<td>

  <button

    onClick={async () => {

      const confirmar = confirm(
        'Deseja excluir este registro?'
      );

      if (!confirmar) return;

      try {

        const docRef = doc(
          db,
          'inconsistencias',
          reg.id
        );

        await deleteDoc(docRef);

      } catch (error) {

        console.error(error);
        alert('Erro ao excluir');

      }

    }}

    style={{

      background: 'rgba(239,68,68,0.15)',
      border: '1px solid rgba(239,68,68,0.25)',
      color: '#ef4444',
      borderRadius: '10px',
      padding: '8px 12px',
      cursor: 'pointer',
      fontWeight: 700

    }}

  >
    X
  </button>

</td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}