# UniRide - Carona Universitária

O UniRide é um aplicativo de **carona solidária** entre estudantes universitários. Motoristas que já vão fazer um trajeto saindo do campus (ou indo para ele) oferecem as vagas livres do carro. Passageiros da mesma instituição informam para onde vão e reservam uma vaga, e o custo da viagem é **dividido entre todos no carro**, sem lucro para o motorista.

O foco é um meio de locomoção **seguro e barato** para estudantes, especialmente no turno da noite.

---

## Sumário

1. [Modelo do serviço](#1-modelo-do-serviço)
2. [Público e abrangência](#2-público-e-abrangência)
3. [Cadastro e verificação](#3-cadastro-e-verificação)
4. [Privacidade e endereço (LGPD)](#4-privacidade-e-endereço-lgpd)
5. [Rotas e pontos de desembarque](#5-rotas-e-pontos-de-desembarque)
6. [Preço (rateio de custos)](#6-preço-rateio-de-custos)
7. [Pagamento](#7-pagamento)
8. [Fluxo da carona](#8-fluxo-da-carona)
9. [Cancelamento, faltas e avaliações](#9-cancelamento-faltas-e-avaliações)
10. [Segurança](#10-segurança)
11. [Tecnologias](#11-tecnologias)
12. [Protótipo: estrutura e como executar](#12-protótipo-estrutura-e-como-executar)
13. [O que já está implementado](#13-o-que-já-está-implementado)
14. [Pendências a confirmar](#14-pendências-a-confirmar)
15. [Roadmap](#15-roadmap)

---

## 1. Modelo do serviço

- **Carona com rota oferecida (modelo BlaBlaCar):** o motorista cadastra uma viagem que ele já faria (destino, horário e vagas). O passageiro informa o destino e o app lista **apenas os motoristas cuja rota passa perto dele**. É o passageiro quem escolhe o motorista.
- **Sem fins lucrativos:** o preço é calculado pelo app com base no custo real da viagem (combustível + desgaste) e dividido entre os ocupantes, incluindo o motorista. **O motorista não pode alterar o valor.**
- **Base legal:** o transporte remunerado privado de passageiros (tipo Uber) é regulado pela Lei 13.640/2018. O UniRide se posiciona como **carona solidária com rateio de custos**. Para sustentar essa posição, o app:
  - exige que toda viagem tenha o campus como origem ou destino (trajeto que o motorista já faria);
  - calcula o preço sem margem de lucro;
  - limita cada motorista a **2 viagens ativas** (ida e volta).

  > Validar esse enquadramento com o orientador. Recomenda-se também que o motorista confira se o seguro do veículo cobre caronas.

## 2. Público e abrangência

| Regra | Definição |
|---|---|
| Quem usa | Estudantes com vínculo ativo com a instituição, **maiores de 18 anos** |
| Trajetos | Toda viagem tem o **campus como origem ou destino** |
| Dias e horários | Qualquer dia em que haja aula (matutino, vespertino e noturno) |
| Tipos de viagem | **Compartilhada** (divide o carro) ou **Particular** (o passageiro ocupa o carro sozinho) |
| Vagas | Até **3 passageiros** por viagem, definidas pelo motorista |

## 3. Cadastro e verificação

A verificação é feita em níveis:

| Nível | Exigências | Libera |
|---|---|---|
| **1 — Conta** | E-mail institucional confirmado por código | Navegar pelo app |
| **2 — Estudante verificado** | RA + foto da carteira de estudante (ou comprovante de matrícula) + selfie comparada com a foto da carteira + **contatos de emergência** | Pedir caronas |
| **Motorista** | Nível 2 + CNH válida + documento do veículo (CRLV) + certidão de antecedentes criminais | Oferecer caronas |

- O vínculo com a instituição é **revalidado a cada semestre**.
- O ideal é uma parceria com a instituição para confirmar o RA diretamente.
- Documentos ficam em armazenamento criptografado (Amazon S3) e são acessados apenas na verificação.

## 4. Privacidade e endereço (LGPD)

- O endereço do passageiro serve **somente** para sugerir pontos seguros de desembarque próximos à residência. Ele é armazenado criptografado e **nunca é mostrado ao motorista**.
- O motorista vê apenas o **ponto de desembarque** (ex.: "Farmácia 24h • Vila Lalau").
- **Deixar na porta de casa** é opcional e decidido **a cada corrida**. Nesse caso o motorista só vê o endereço depois que a viagem começa, e ele deixa de ser exibido quando a viagem termina.
- O telefone do motorista não é exposto. O contato é feito pelo chat do app.
- O cadastro exige aceite dos Termos de Uso e da Política de Privacidade, com a finalidade de cada dado coletado.

## 5. Rotas e pontos de desembarque

- **Pontos seguros:** o passageiro desce em lugares públicos, iluminados e movimentados, como ponto de ônibus, supermercado, farmácia, banco ou posto de combustível, a **no máximo 5 minutos a pé** de casa.
- **À noite** (após as 22h), o app prioriza estabelecimentos **24h**, como postos e farmácias.
- **Desvio máximo de 5 km:** o ponto de desembarque não pode aumentar a rota do motorista em mais de 5 km. Motoristas acima desse limite não aparecem na busca.
- **Mais próximo da rota:** entre os pontos possíveis, o app escolhe o de **menor desvio**, e a lista de motoristas é ordenada do menor para o maior desvio.
- **Máximo de 2 paradas** por viagem. Passageiros que moram perto são agrupados no mesmo ponto.
- A lista de pontos por bairro é curada pela equipe, e os usuários podem sugerir novos.

## 6. Preço (rateio de custos)

```
custo da viagem  = (km da rota + desvio do ponto) × (preço do combustível ÷ consumo do carro + R$ 0,15 de desgaste)
preço por pessoa = custo da viagem ÷ (passageiros + 1)      ← o motorista também paga a parte dele
particular       = maior valor entre (custo ÷ 2) e R$ 4,00
```

- O preço do combustível vem da média da cidade (levantamento semanal da **ANP**), e o consumo de cada modelo vem da tabela do **INMETRO**.
- **Exemplo:** rota de 9 km, Fiat Mobi (13,5 km/L), gasolina a R$ 6,20 → custo de R$ 5,48.

  | Situação | Preço por passageiro |
  |---|---|
  | 1 passageiro | R$ 2,74 |
  | 3 passageiros | R$ 1,37 |
  | Particular | R$ 4,00 (mínimo) |

  Para comparação, um carro de aplicativo no mesmo trajeto custa cerca de R$ 15.
- **O preço só cai antes da saída:** ao reservar, o passageiro vê o valor máximo, que diminui se mais pessoas entrarem. Ele nunca sobe.
- **Preço fechado no embarque:** quando o motorista confirma o embarque (PIN), o valor daquele passageiro é fechado e **não muda mais**. Ele não sobe se outro passageiro faltar nem por desvios durante a viagem.
- **Desvios forçados não custam nada:** obras, acidentes e vias bloqueadas não geram tarifa adicional, porque é a rota que o motorista faria de qualquer forma. Pelo mesmo motivo, uma rota mais curta não gera desconto.
- **Viagem interrompida** (carro quebrou, acidente): o motorista devolve via Pix o valor proporcional ao trecho não percorrido, calculado pelo app. Se não devolver, o caso vira denúncia e a conta é bloqueada até a resolução.

## 7. Pagamento

- **O app não guarda dinheiro.** Receber e repassar valores de terceiros exigiria ser uma instituição regulada pelo Banco Central, e um intermediário cobraria taxas desproporcionais para valores de R$ 1 a R$ 4.
- **Pix direto ao motorista:** o app gera o QR Code / "copia e cola" com a chave Pix do motorista e o valor exato. Esse é um padrão aberto do Pix e dispensa intermediário.
- **Pagamento antes da saída:** o passageiro paga após o embarque e o motorista confirma o recebimento no app. **A viagem só pode ser iniciada quando todos os passageiros pagaram.**
- **Dinheiro:** é aceito como alternativa, com confirmação pelo motorista.
- **Cartão:** a definir (ver [pendências](#14-pendências-a-confirmar)).
- Como o app não intermedia o pagamento, não há estorno pelo app. Pagamentos não confirmados geram denúncia.

## 8. Fluxo da carona

```
 Passageiro                        SERVIDOR                          Motorista
     │  informa destino, vê motoristas que passam perto
     │  solicita carona ─────────▶  PENDENTE  ────── notifica ─────▶  vê o pedido
     │  ◀────── notifica ──────  ACEITA / RECUSADA  ◀───────────── aceita ou recusa
     │  confere carro e placa, diz o PIN ─────────────────────────▶  confirma embarque (valor fechado)
     │  paga via Pix  ─────────────────────────────────────────────▶  confirma recebimento
     │  ◀────── notifica ──────  EM VIAGEM  ◀───────────────────── inicia viagem
     │  ◀── aviso de desvio (sem custo) ──────────────────────────── informa via bloqueada/obra
     │  avalia motorista ──────▶  CONCLUÍDA  ◀───────────────────── finaliza e avalia passageiros

 Outros finais: CANCELADA (passageiro ou motorista) · FALTA (passageiro não compareceu)
```

- **Um pedido por vez:** o passageiro tem no máximo uma carona ativa.
- **Particular:** só é possível em viagens sem passageiros aceitos, e ao ser aceita ocupa todas as vagas.
- **Embarque fecha a viagem:** a partir do primeiro embarque confirmado, a viagem deixa de aceitar pedidos e os pendentes são recusados automaticamente. Pedidos pendentes também são recusados quando a viagem lota.

## 9. Cancelamento, faltas e avaliações

| Tema | Regra |
|---|---|
| Cancelamento do passageiro | Livre até **30 min** antes da saída; depois disso conta como falta |
| Cancelamento do motorista | Livre até **2 h** antes; depois disso conta como falta, com **peso dobrado** |
| Não comparecimento | O motorista espera **5 min** no ponto de embarque (o GPS confirma a chegada) e então pode registrar a falta |
| Atraso do motorista | Mais de **10 min**: o passageiro cancela sem penalidade |
| Faltas | **3 faltas em 30 dias** suspendem a conta por **7 dias** |
| Avaliações | 1 a 5 estrelas, mútuas e **cegas**: cada um só vê a nota recebida depois de avaliar, ou após 48 h. Comentários passam por filtro de linguagem |
| Nota baixa | Média abaixo de **4,0** nas últimas 20 viagens gera alerta; abaixo de **3,5**, suspensão e revisão |
| Denúncias | Separadas da nota, com categorias (assédio, direção perigosa, cobrança indevida...). Denúncias de segurança suspendem a conta até a análise |

## 10. Segurança

- **SOS sempre visível:**
  - ligação direta para a Polícia (190) e o SAMU (192);
  - envio da localização atual para os contatos de emergência;
  - aviso à segurança do campus.
- **PIN de embarque:** o passageiro só é considerado embarcado quando o motorista digita o PIN que o passageiro informa.
- **Conferência do veículo:** o passageiro vê modelo, cor e placa antes de entrar no carro.
- **Compartilhar a viagem** em tempo real com contatos.
- **Alerta de desvio de rota:** se o carro sair da rota prevista (ex.: mais de 500 m por mais de 2 min), o app pergunta aos passageiros "Está tudo bem?", com acesso direto ao SOS. O motorista pode informar o motivo ("Via bloqueada", "Obra na pista", "Acidente na via"), que é enviado aos passageiros e fica registrado no histórico.
- **Somente mulheres:** opção para motoristas e passageiras.
- **Direção segura:** o chat fica bloqueado com o carro em movimento, restando só mensagens rápidas prontas.

## 11. Tecnologias

| Camada | Tecnologia |
|---|---|
| Front-end | HTML, CSS e JavaScript com Bootstrap 5.3, focado em celular. Evolução prevista para **PWA** (instalável, sem loja) |
| Back-end | Python (**Django ou FastAPI**, a definir) com **PostgreSQL** |
| Tempo real | **WebSocket** com o app aberto e **Firebase Cloud Messaging** (push) com o app fechado |
| Mapas | **Google Maps Platform**: Maps JavaScript API (mapa), Places API (autocompletar destino e pontos seguros) e **Routes API** (rota, distância e desvio) |
| Navegação do motorista | Link para o app **Google Maps** com as paradas (gratuito, sem chave de API) |
| Documentos | Amazon S3 (criptografado) |

**Regras técnicas:**
- **Cálculos no servidor:** preço, desvio e a regra dos 5 km são calculados no servidor. O navegador pode ser adulterado, então o cálculo feito nele serve só para exibição.
- **Chaves do Google protegidas:** a chave usada no navegador é restrita ao domínio e às APIs necessárias; as chamadas de rota usam outra chave, no servidor.
- **Limite de gastos:** a conta do Google tem limite diário de uso e alerta de orçamento.
- **Menos chamadas pagas:** motoristas claramente longe do destino são descartados pela distância em linha reta (cálculo grátis) antes de consultar a Routes API, e resultados repetidos ficam em cache.

## 12. Protótipo: estrutura e como executar

```
index.html          Tela do passageiro
motorista.html      Tela do motorista (Início · Pedidos · Viagem)
css/style.css       Estilos compartilhados
js/comum.js         Configuração, utilitários, cálculo do rateio, tema e SOS
js/api.js           Simulação do servidor: dados e regras de negócio
js/passageiro.js    Lógica da tela do passageiro
js/motorista.js     Lógica da tela do motorista
```

As telas nunca acessam os dados diretamente: tudo passa pelo `js/api.js`. Hoje ele guarda os dados no `localStorage` do navegador. Na versão final, cada função vira uma chamada ao back-end, **sem alterar as telas**.

**Para executar:**
1. Abra a pasta no VS Code e inicie a extensão **Live Server**. A localização do SOS só funciona em `https://` ou `localhost`.
2. Abra `index.html` (passageiro) e `motorista.html` (motorista) **em duas abas**. O que acontece em uma aparece na outra na hora.
3. **Roteiro de demonstração:**
   1. Como passageiro, busque "Vila Nova" e solicite a carona do Diego.
   2. Como motorista, aceite o pedido na aba **Pedidos**.
   3. Na aba **Viagem**, digite o PIN que aparece para o passageiro.
   4. O passageiro toca em "Já paguei" e o motorista confirma o pagamento. Marque a falta da Maria, ou aceite e embarque ela também.
   5. **Inicie a viagem**, informe um desvio ("Via bloqueada") e **finalize**.
   6. Os dois se avaliam.
4. O link **"Restaurar dados de demonstração"**, no rodapé, volta tudo ao estado inicial.

## 13. O que já está implementado

| Funcionalidade | Protótipo | Observação |
|---|---|---|
| Busca por destino com desvio máximo de 5 km e ponto de menor desvio | ✅ | Rotas e desvios simulados; na versão final vêm da Routes/Places API |
| Preço por rateio, mínimo de R$ 4,00 na particular | ✅ | |
| Reserva, aceite, PIN, pagamento, início, desvio e finalização | ✅ | Sincronizado entre abas |
| Preço fechado no embarque; desvio sem custo | ✅ | |
| Pedidos recusados automaticamente ao lotar ou iniciar o embarque | ✅ | |
| Limite de 2 viagens ativas por motorista | ✅ | |
| Avaliação mútua | ✅ | Ainda sem avaliação cega nem cálculo de média |
| SOS (190/192 e compartilhar localização) | ✅ | Envio automático aos contatos de emergência: planejado |
| Navegação pelo Google Maps | ✅ | Por endereço em texto; na versão final, por coordenadas |
| Pix copia e cola | Simulado | Geração real do código: planejada |
| Login com e-mail institucional | Só validação | Sem back-end |
| Cadastro, verificação, prazos de cancelamento, suspensões, denúncias, chat, alerta automático de desvio (GPS), somente mulheres | Planejado | |

## 14. Pendências a confirmar

- **Domínio do e-mail institucional:** está como `catolicasc.org.br` em `js/comum.js`.
- **Cidade do campus:** está como Jaraguá do Sul - SC, usada no link de navegação.
- **Cartão de crédito:** manter (cobrança pelo motorista via link de pagamento, com taxa de 3–5%) ou retirar do MVP.
- **Back-end:** Django ou FastAPI.
- **Enquadramento legal** do rateio de custos: validar com o orientador.
- **Valores de referência:** limites como 30 min, 2 h, 5 min, 3 faltas e notas 4,0 / 3,5 são propostas iniciais e podem ser ajustados após o beta.

## 15. Roadmap

1. **Protótipo navegável** (atual): telas do passageiro e do motorista com servidor simulado.
2. **Back-end:** API, banco de dados, autenticação e verificação de estudantes.
3. **Mapas reais:** Google Places e Routes; Pix com QR Code real.
4. **Tempo real:** WebSocket, notificações push e alerta automático de desvio.
5. **Testes:** internos entre aparelhos, depois beta fechado com alunos voluntários.
6. **Lançamento:** PWA e parceria com a instituição para validação de matrícula e divulgação.
7. **Futuro:** chat integrado e expansão para outras universidades.

---

O UniRide busca tornar o transporte universitário mais **seguro, econômico e prático**, conectando estudantes que já fazem o mesmo caminho.
