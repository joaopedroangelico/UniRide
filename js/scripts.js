'use strict';

// ===== Configuração =====

// Rateio de custos: valores de referência, atualizar periodicamente
// (ex.: preço médio da gasolina na cidade segundo a ANP)
const PRECO_COMBUSTIVEL = 6.20; // R$ por litro
const DESGASTE_POR_KM = 0.15;   // R$ por km (pneus, óleo, manutenção)

// TODO: confirmar o domínio do e-mail dos alunos
const DOMINIO_INSTITUCIONAL = 'catolicasc.org.br';

// Dados de exemplo (futuramente virão da API)
const MOTORISTAS = [
    {
        id: 1, nome: 'Diego', nota: 4.9, corridas: 120,
        destino: 'Vila Nova', saida: '18:40', veiculo: 'Fiat Mobi', cor: 'Preto',
        consumoKmL: 13.5, distanciaKm: 9, vagas: 3
    },
    {
        id: 2, nome: 'Ana', nota: 4.8, corridas: 95,
        destino: 'Centro', saida: '18:50', veiculo: 'VW Gol', cor: 'Branco',
        consumoKmL: 12, distanciaKm: 7, vagas: 3
    }
];

// ===== Utilitários =====

const formatarMoeda = valor => valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// Remove acentos e maiúsculas para comparar textos ("São José" == "sao jose")
function normalizar(texto) {
    return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

function escaparHtml(texto) {
    const div = document.createElement('div');
    div.textContent = String(texto);
    return div.innerHTML;
}

function mostrarAviso(mensagem, tipo = 'primary') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    const textoEscuro = tipo === 'warning' || tipo === 'light' || tipo === 'info';

    toast.className = `toast align-items-center text-bg-${tipo} border-0`;
    toast.setAttribute('role', tipo === 'danger' ? 'alert' : 'status');
    toast.setAttribute('aria-live', tipo === 'danger' ? 'assertive' : 'polite');
    toast.setAttribute('aria-atomic', 'true');
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body"></div>
            <button type="button" class="btn-close ${textoEscuro ? '' : 'btn-close-white'} me-2 m-auto"
                data-bs-dismiss="toast" aria-label="Fechar"></button>
        </div>`;
    toast.querySelector('.toast-body').textContent = mensagem;

    container.appendChild(toast);
    toast.addEventListener('hidden.bs.toast', () => toast.remove());
    bootstrap.Toast.getOrCreateInstance(toast, { delay: 5000 }).show();
}

// ===== Cálculo do rateio =====

function custoTotalViagem(motorista) {
    return motorista.distanciaKm * (PRECO_COMBUSTIVEL / motorista.consumoKmL + DESGASTE_POR_KM);
}

// O motorista também entra no rateio: o custo é dividido entre todos no carro
function precoPorPassageiro(motorista, passageiros) {
    return custoTotalViagem(motorista) / (passageiros + 1);
}

function textoPreco(motorista, tipo) {
    const precoSozinho = precoPorPassageiro(motorista, 1);
    if (tipo === 'particular') {
        return formatarMoeda(precoSozinho);
    }
    const precoLotado = precoPorPassageiro(motorista, motorista.vagas);
    return `${formatarMoeda(precoLotado)} a ${formatarMoeda(precoSozinho)}`;
}

// ===== Motoristas =====

let motoristasExibidos = MOTORISTAS;

function renderizarMotoristas(lista, tipo = 'compartilhada') {
    motoristasExibidos = lista;
    const container = document.getElementById('lista-motoristas');
    document.getElementById('sem-motoristas').classList.toggle('d-none', lista.length > 0);

    container.innerHTML = lista.map(m => `
        <div class="col">
            <article class="card h-100 ride-card driver-card">
                <div class="card-body">
                    <div class="d-flex align-items-center mb-3">
                        <div class="driver-avatar me-3" aria-hidden="true">${escaparHtml(m.nome.charAt(0))}</div>
                        <div>
                            <h3 class="h5 mb-0">${escaparHtml(m.nome)}</h3>
                            <span class="text-body-secondary">
                                <i class="fas fa-star text-warning" aria-hidden="true"></i>
                                ${m.nota.toFixed(1)} (${m.corridas} corridas)
                            </span>
                        </div>
                    </div>
                    <ul class="list-group list-group-flush mb-3">
                        <li class="list-group-item d-flex justify-content-between align-items-center">
                            <span>Destino:</span>
                            <strong>${escaparHtml(m.destino)}</strong>
                        </li>
                        <li class="list-group-item d-flex justify-content-between align-items-center">
                            <span>Saída:</span>
                            <span>${escaparHtml(m.saida)}</span>
                        </li>
                        <li class="list-group-item d-flex justify-content-between align-items-center">
                            <span>Veículo:</span>
                            <span>${escaparHtml(m.veiculo)} • ${escaparHtml(m.cor)}</span>
                        </li>
                        <li class="list-group-item d-flex justify-content-between align-items-center">
                            <span>Vagas:</span>
                            <span>${m.vagas}</span>
                        </li>
                        <li class="list-group-item d-flex justify-content-between align-items-center">
                            <span>Preço por pessoa:</span>
                            <strong>${textoPreco(m, tipo)}</strong>
                        </li>
                    </ul>
                    <div class="d-flex justify-content-between">
                        <button type="button" class="btn btn-outline-secondary btn-sm" data-acao="mensagem" data-id="${m.id}">
                            <i class="fas fa-comment me-1" aria-hidden="true"></i> Mensagem
                        </button>
                        <button type="button" class="btn btn-primary btn-sm" data-acao="solicitar" data-id="${m.id}">
                            <i class="fas fa-car me-1" aria-hidden="true"></i> Solicitar
                        </button>
                    </div>
                </div>
            </article>
        </div>`).join('');
}

// Lê e valida o formulário de busca; retorna null se estiver inválido
function lerFormularioBusca() {
    const form = document.getElementById('form-busca');
    if (!form.checkValidity()) {
        form.classList.add('was-validated');
        form.querySelector(':invalid').focus();
        return null;
    }
    return {
        origem: form.elements.origem.value.trim(),
        destino: form.elements.destino.value.trim(),
        tipo: form.elements.tipo.value,
        pagamento: form.elements.pagamento.value
    };
}

function aoBuscar(evento) {
    evento.preventDefault();
    const busca = lerFormularioBusca();
    if (!busca) return;

    const destino = normalizar(busca.destino);
    const encontrados = MOTORISTAS.filter(m => {
        const destinoMotorista = normalizar(m.destino);
        return destinoMotorista.includes(destino) || destino.includes(destinoMotorista);
    });

    renderizarMotoristas(encontrados, busca.tipo);
    document.getElementById('secao-motoristas').scrollIntoView({ behavior: 'smooth' });
}

function solicitarMotorista(id) {
    const motorista = MOTORISTAS.find(m => m.id === id);
    if (!motorista) return;

    const busca = lerFormularioBusca();
    if (!busca) {
        mostrarAviso('Preencha origem e destino antes de solicitar.', 'warning');
        return;
    }

    // Na prática, aqui a solicitação seria enviada ao servidor
    const valor = busca.tipo === 'particular'
        ? formatarMoeda(precoPorPassageiro(motorista, 1))
        : `até ${formatarMoeda(precoPorPassageiro(motorista, 1))}`;
    mostrarAviso(`Carona solicitada com ${motorista.nome} (${valor}). Aguarde a confirmação.`, 'success');
}

function aoClicarNaLista(evento) {
    const botao = evento.target.closest('button[data-acao]');
    if (!botao) return;
    const id = Number(botao.dataset.id);

    if (botao.dataset.acao === 'solicitar') {
        solicitarMotorista(id);
    } else if (botao.dataset.acao === 'mensagem') {
        // Por segurança o telefone do motorista não é exibido; o contato será pelo chat do app
        mostrarAviso('O chat com o motorista estará disponível em breve.', 'info');
    }
}

// ===== Emergência =====

let ultimaLocalizacao = null;

function obterLocalizacaoEmergencia() {
    const status = document.getElementById('sos-localizacao');
    const botaoCompartilhar = document.getElementById('sos-compartilhar');
    botaoCompartilhar.disabled = true;

    if (!('geolocation' in navigator)) {
        status.textContent = 'Seu aparelho não permite obter a localização. Ligue e informe onde você está.';
        return;
    }

    status.textContent = 'Obtendo sua localização...';
    navigator.geolocation.getCurrentPosition(posicao => {
        const { latitude, longitude, accuracy } = posicao.coords;
        ultimaLocalizacao = { latitude, longitude };
        status.textContent = `Localização obtida (precisão de ~${Math.round(accuracy)} m): `
            + `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
        botaoCompartilhar.disabled = false;
    }, erro => {
        status.textContent = erro.code === erro.PERMISSION_DENIED
            ? 'Permissão de localização negada. Ligue e informe onde você está.'
            : 'Não foi possível obter sua localização. Ligue e informe onde você está.';
        console.error('Erro de geolocalização:', erro);
    }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 });
}

async function compartilharLocalizacao() {
    if (!ultimaLocalizacao) return;
    const { latitude, longitude } = ultimaLocalizacao;
    const link = `https://www.google.com/maps?q=${latitude},${longitude}`;
    const texto = '🚨 Preciso de ajuda! Esta é minha localização atual:';

    if (navigator.share) {
        try {
            await navigator.share({ title: 'Emergência - UniRide', text: texto, url: link });
        } catch (erro) {
            // Usuário cancelou o compartilhamento
        }
        return;
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(`${texto} ${link}`)}`, '_blank', 'noopener');
}

// ===== Tema claro/escuro =====

function lerTemaSalvo() {
    try {
        return localStorage.getItem('theme');
    } catch (erro) {
        return null;
    }
}

function salvarTema(tema) {
    try {
        localStorage.setItem('theme', tema);
    } catch (erro) {
        // Armazenamento indisponível (ex.: aba anônima); o tema vale só para esta visita
    }
}

function aplicarTema(tema) {
    const escuro = tema === 'dark';
    const botao = document.getElementById('darkModeToggle');
    document.documentElement.setAttribute('data-bs-theme', tema);
    botao.innerHTML = `<i class="fas fa-${escuro ? 'sun' : 'moon'}" aria-hidden="true"></i>`;
    botao.setAttribute('aria-label', escuro ? 'Ativar modo claro' : 'Ativar modo escuro');
}

function iniciarTema() {
    const preferenciaSistema = window.matchMedia('(prefers-color-scheme: dark)');
    aplicarTema(lerTemaSalvo() || (preferenciaSistema.matches ? 'dark' : 'light'));

    document.getElementById('darkModeToggle').addEventListener('click', () => {
        const novoTema = document.documentElement.getAttribute('data-bs-theme') === 'dark' ? 'light' : 'dark';
        salvarTema(novoTema);
        aplicarTema(novoTema);
    });

    // Acompanha o tema do sistema enquanto o usuário não escolher um
    preferenciaSistema.addEventListener('change', evento => {
        if (!lerTemaSalvo()) aplicarTema(evento.matches ? 'dark' : 'light');
    });
}

// ===== Login =====

function aoEntrar(evento) {
    evento.preventDefault();
    const form = evento.currentTarget;
    const email = form.elements.email;
    const emailValido = email.value.trim().toLowerCase().endsWith(`@${DOMINIO_INSTITUCIONAL}`);
    email.setCustomValidity(emailValido ? '' : 'Use seu e-mail institucional.');

    if (!form.checkValidity()) {
        form.classList.add('was-validated');
        return;
    }

    // Na prática, aqui o login seria enviado ao servidor
    bootstrap.Modal.getOrCreateInstance(document.getElementById('loginModal')).hide();
    form.reset();
    form.classList.remove('was-validated');
    mostrarAviso('Login ainda não conectado ao servidor (protótipo).', 'info');
}

// ===== Inicialização =====

function iniciar() {
    iniciarTema();
    renderizarMotoristas(MOTORISTAS);

    document.getElementById('form-busca').addEventListener('submit', aoBuscar);
    document.getElementById('lista-motoristas').addEventListener('click', aoClicarNaLista);
    // Recalcula os preços exibidos ao trocar o tipo de viagem
    document.getElementById('ride-type').addEventListener('change', evento => {
        renderizarMotoristas(motoristasExibidos, evento.target.value);
    });

    document.getElementById('sosModal').addEventListener('show.bs.modal', obterLocalizacaoEmergencia);
    document.getElementById('sos-compartilhar').addEventListener('click', compartilharLocalizacao);

    const formLogin = document.getElementById('form-login');
    formLogin.addEventListener('submit', aoEntrar);
    formLogin.elements.email.addEventListener('input', evento => evento.target.setCustomValidity(''));
    document.querySelectorAll('.dominio-institucional').forEach(el => { el.textContent = DOMINIO_INSTITUCIONAL; });

    document.getElementById('ano-atual').textContent = new Date().getFullYear();
}

iniciar();
