
let usuarioAtual = null;

function obterDataHora() {
    const agora = new Date();
    const data = agora.toLocaleDateString('pt-BR');
    const hora = agora.toTimeString().slice(0, 5); // HH:MM
    return { dataHora: `${data} ${hora}`, data, hora };
}

function login() {
    const usuario = document.getElementById('usuario').value.trim();
    if (!usuario) return alert('Digite o nome do usuário');

    usuarioAtual = usuario;
    localStorage.setItem('usuarioLogado', usuario);
    document.getElementById('usuarioLogado').innerText = usuario;
    document.getElementById('loginContainer').style.display = 'none';
    document.getElementById('pontoContainer').style.display = 'block';

    atualizarUltimoRegistro();
    atualizarHistorico();
    atualizarTotais();
}

function logoff() {
    localStorage.removeItem('usuarioLogado');
    location.reload();
}

function registrar(tipo) {
    if (!usuarioAtual) return alert('Faça login primeiro.');

    const { dataHora, data, hora } = obterDataHora();
    let registros = JSON.parse(localStorage.getItem('registros_' + usuarioAtual)) || {};

    if (!registros[data]) {
        registros[data] = {
            'Entrada': '',
            'Saída para Almoço': '',
            'Retorno do Almoço': '',
            'Saída': '',
            'Hora Extra': ''
        };
    }

    registros[data][tipo] = hora;

    localStorage.setItem('registros_' + usuarioAtual, JSON.stringify(registros));
    localStorage.setItem('ultimoRegistro_' + usuarioAtual, `${tipo}: ${dataHora}`);

    atualizarUltimoRegistro();
    atualizarHistorico();
    atualizarTotais();
}

function atualizarHistorico() {
    const registros = JSON.parse(localStorage.getItem('registros_' + usuarioAtual)) || {};
    const historicoElemento = document.getElementById('historico');
    historicoElemento.innerHTML = '';

    const cabecalho = document.createElement('tr');
    ['Data', 'Entrada', 'Saída para Almoço', 'Retorno do Almoço', 'Saída', 'Hora Extra'].forEach(col => {
        const th = document.createElement('th');
        th.innerText = col;
        cabecalho.appendChild(th);
    });
    historicoElemento.appendChild(cabecalho);

    Object.keys(registros).sort().forEach(data => {
        const linha = document.createElement('tr');
        const dia = registros[data];

        const campos = [
            data,
            dia['Entrada'] || '',
            dia['Saída para Almoço'] || '',
            dia['Retorno do Almoço'] || '',
            dia['Saída'] || '',
            dia['Hora Extra'] || ''
        ];

        campos.forEach(texto => {
            const td = document.createElement('td');
            td.innerText = texto;
            linha.appendChild(td);
        });

        historicoElemento.appendChild(linha);
    });
}

function atualizarUltimoRegistro() {
    const ultimo = localStorage.getItem('ultimoRegistro_' + usuarioAtual);
    document.getElementById('ultimoRegistro').innerText = ultimo || 'Nenhum registro encontrado';
}

function limparRegistros() {
    if (!confirm('Tem certeza que deseja limpar os registros?')) return;
    localStorage.removeItem('registros_' + usuarioAtual);
    localStorage.removeItem('ultimoRegistro_' + usuarioAtual);
    atualizarHistorico();
    atualizarUltimoRegistro();
    atualizarTotais();
}

function exportarCSV() {
    const registros = JSON.parse(localStorage.getItem('registros_' + usuarioAtual)) || {};
    const linhas = [['Data', 'Entrada', 'Saída para Almoço', 'Retorno do Almoço', 'Saída', 'Hora Extra']];

    Object.keys(registros).sort().forEach(data => {
        const dia = registros[data];
        linhas.push([
            data,
            dia['Entrada'] || '',
            dia['Saída para Almoço'] || '',
            dia['Retorno do Almoço'] || '',
            dia['Saída'] || '',
            dia['Hora Extra'] || ''
        ]);
    });

    const csv = linhas.map(l => l.join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `registro_ponto_${usuarioAtual}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

function calcularHoras() {
    const registros = JSON.parse(localStorage.getItem('registros_' + usuarioAtual)) || {};
    let minutosHoje = 0;
    let minutosMes = 0;

    const hoje = new Date().toLocaleDateString('pt-BR');
    const mesAtual = hoje.slice(3);

    for (const data in registros) {
        const dia = registros[data];
        const pares = [
            ['Entrada', 'Saída para Almoço'],
            ['Retorno do Almoço', 'Saída']
        ];

        let totalMinDia = 0;

        pares.forEach(([inicio, fim]) => {
            const h1 = dia[inicio];
            const h2 = dia[fim];
            if (h1 && h2) {
                const [hIni, mIni] = h1.split(':').map(Number);
                const [hFim, mFim] = h2.split(':').map(Number);
                totalMinDia += (hFim * 60 + mFim) - (hIni * 60 + mIni);
            }
        });

        if (data === hoje) minutosHoje += totalMinDia;
        if (data.endsWith(mesAtual)) minutosMes += totalMinDia;
    }

    document.getElementById('totalHorasDiarias').innerText = `Hoje: ${Math.floor(minutosHoje / 60)}h ${minutosHoje % 60}min`;
    document.getElementById('totalHorasMensais').innerText = `Mês: ${Math.floor(minutosMes / 60)}h ${minutosMes % 60}min`;
}

function atualizarTotais() {
    calcularHoras();
}

document.addEventListener('DOMContentLoaded', () => {
    const usuarioSalvo = localStorage.getItem('usuarioLogado');
    if (usuarioSalvo) {
        usuarioAtual = usuarioSalvo;
        document.getElementById('usuarioLogado').innerText = usuarioAtual;
        document.getElementById('loginContainer').style.display = 'none';
        document.getElementById('pontoContainer').style.display = 'block';
        atualizarUltimoRegistro();
        atualizarHistorico();
        atualizarTotais();
    }

    document.getElementById('alternarTema').addEventListener('click', () => {
        const body = document.body;
        body.classList.toggle('claro');
        body.classList.toggle('escuro');
        const temaAtual = body.classList.contains('escuro') ? 'escuro' : 'claro';
        localStorage.setItem('temaPreferido', temaAtual);
    });

    const temaSalvo = localStorage.getItem('temaPreferido') || 'escuro';
    document.body.classList.remove('escuro', 'claro');
    document.body.classList.add(temaSalvo);
});
