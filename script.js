// ============================================================
// SOLAR MONITOR - MONITORAMENTO FOTOVOLTAICO
// TEMPERATURA REAL PELO ESP32 + DEMAIS DADOS EM SIMULAÇÃO
// ============================================================

const state = {
  scenario: "clean",

  irradiance: 812,
  voltage: 20.12,
  current: 4.72,
  power: 94.9,

  // Começa em 0 até receber o primeiro valor do ESP32
  temperature: 0,

  performance: 82,

  cleaning: false,
  cleaningProgress: 0,

  history: {
    labels: [],
    power: [],
    current: [],
    temperature: [],
    irradiance: []
  }
};


// ============================================================
// CONEXÃO COM O ESP32
// ============================================================

// IP que apareceu no Monitor Serial do ESP32
const ESP32_URL = "http://192.168.1.175/dados";

let esp32Connected = false;


// ============================================================
// CONFIGURAÇÃO DOS CENÁRIOS
// ============================================================

const scenarios = {
  clean: {
    name: "PAINEL LIMPO",
    irradiance: 850,
    voltage: 20.5,
    current: 5.0,
    temperature: 43,
    performance: 100,
    efficiency: 1
  },

  light: {
    name: "SUJEIRA LEVE",
    irradiance: 760,
    voltage: 20.1,
    current: 4.45,
    temperature: 45,
    performance: 88,
    efficiency: 0.88
  },

  moderate: {
    name: "SUJEIRA MODERADA",
    irradiance: 640,
    voltage: 19.6,
    current: 3.65,
    temperature: 48,
    performance: 70,
    efficiency: 0.70
  },

  intense: {
    name: "SUJEIRA INTENSA",
    irradiance: 470,
    voltage: 18.7,
    current: 2.65,
    temperature: 53,
    performance: 48,
    efficiency: 0.48
  },

  shadow: {
    name: "SOMBREAMENTO",
    irradiance: 310,
    voltage: 17.9,
    current: 1.75,
    temperature: 49,
    performance: 31,
    efficiency: 0.31
  }
};


// ============================================================
// ELEMENTOS DO DOM
// ============================================================

const irradianciaValue =
  document.getElementById("irradianciaValue");

const tensaoValue =
  document.getElementById("tensaoValue");

const correnteValue =
  document.getElementById("correnteValue");

const potenciaValue =
  document.getElementById("potenciaValue");

const temperaturaValue =
  document.getElementById("temperaturaValue");

const desempenhoValue =
  document.getElementById("desempenhoValue");

const systemStatus =
  document.getElementById("systemStatus");

const cleaningStatus =
  document.getElementById("cleaningStatus");

const cleaningProgress =
  document.getElementById("cleaningProgress");

const cleaningBtn =
  document.getElementById("cleaningBtn");

const eventLog =
  document.getElementById("eventLog");

const currentDateTime =
  document.getElementById("currentDateTime");

const scenarioButtons =
  document.querySelectorAll(".scenario-btn");

const modeLabel =
  document.getElementById("modeLabel");


// ============================================================
// GRÁFICOS
// ============================================================

const chartConfig = {
  responsive: true,

  maintainAspectRatio: false,

  animation: {
    duration: 300
  },

  plugins: {
    legend: {
      display: false
    }
  },

  scales: {
    x: {
      ticks: {
        maxTicksLimit: 8
      }
    },

    y: {
      beginAtZero: true
    }
  }
};


// ------------------------------------------------------------
// GRÁFICO DE POTÊNCIA
// ------------------------------------------------------------

const powerChart = new Chart(
  document.getElementById("powerChart"),
  {
    type: "line",

    data: {
      labels: [],

      datasets: [
        {
          label: "Potência",
          data: [],
          borderWidth: 2,
          tension: 0.35,
          fill: true
        }
      ]
    },

    options: chartConfig
  }
);


// ------------------------------------------------------------
// GRÁFICO DE CORRENTE
// ------------------------------------------------------------

const currentChart = new Chart(
  document.getElementById("currentChart"),
  {
    type: "line",

    data: {
      labels: [],

      datasets: [
        {
          label: "Corrente",
          data: [],
          borderWidth: 2,
          tension: 0.35,
          fill: true
        }
      ]
    },

    options: chartConfig
  }
);


// ------------------------------------------------------------
// GRÁFICO DE TEMPERATURA
// ------------------------------------------------------------

const temperatureChart = new Chart(
  document.getElementById("temperatureChart"),
  {
    type: "line",

    data: {
      labels: [],

      datasets: [
        {
          label: "Temperatura",
          data: [],
          borderWidth: 2,
          tension: 0.35,
          fill: true
        }
      ]
    },

    options: chartConfig
  }
);


// ------------------------------------------------------------
// GRÁFICO DE IRRADIÂNCIA
// ------------------------------------------------------------

const irradianceChart = new Chart(
  document.getElementById("irradianceChart"),
  {
    type: "line",

    data: {
      labels: [],

      datasets: [
        {
          label: "Irradiância",
          data: [],
          borderWidth: 2,
          tension: 0.35,
          fill: true
        }
      ]
    },

    options: chartConfig
  }
);


// ============================================================
// UTILIDADES
// ============================================================

function randomVariation(value, percentage = 0.03) {
  const variation = value * percentage;

  return value +
    (Math.random() * variation * 2 - variation);
}


function clamp(value, min, max) {
  return Math.min(
    Math.max(value, min),
    max
  );
}


function formatTime() {
  const now = new Date();

  return now.toLocaleTimeString(
    "pt-BR",
    {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    }
  );
}


function updateClock() {
  const now = new Date();

  currentDateTime.textContent =
    now.toLocaleString(
      "pt-BR",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      }
    );
}


// ============================================================
// ATUALIZAÇÃO DOS VALORES DOS CARDS
// ============================================================

function updateMetrics() {

  irradianciaValue.textContent =
    `${Math.round(state.irradiance)} W/m²`;

  tensaoValue.textContent =
    `${state.voltage.toFixed(2)} V`;

  correnteValue.textContent =
    `${state.current.toFixed(2)} A`;

  potenciaValue.textContent =
    `${state.power.toFixed(1)} W`;

  // Só mostra temperatura se já recebemos dado do ESP32
  if (esp32Connected) {

    temperaturaValue.textContent =
      `${state.temperature.toFixed(1)} °C`;

  } else {

    temperaturaValue.textContent =
      "-- °C";
  }

  desempenhoValue.textContent =
    `${Math.round(state.performance)}%`;
}


// ============================================================
// SIMULAÇÃO DOS DEMAIS DADOS
// ============================================================

function simulateData() {

  if (state.cleaning) {
    return;
  }

  const scenario =
    scenarios[state.scenario];


  // ----------------------------------------------------------
  // IRRADIÂNCIA SIMULADA
  // ----------------------------------------------------------

  state.irradiance =
    randomVariation(
      scenario.irradiance,
      0.035
    );


  // ----------------------------------------------------------
  // TENSÃO SIMULADA
  // ----------------------------------------------------------

  state.voltage =
    randomVariation(
      scenario.voltage,
      0.015
    );


  // ----------------------------------------------------------
  // CORRENTE SIMULADA
  // ----------------------------------------------------------

  state.current =
    randomVariation(
      scenario.current,
      0.04
    );


  // ----------------------------------------------------------
  // TEMPERATURA
  // ----------------------------------------------------------

  // NÃO SIMULAMOS MAIS A TEMPERATURA.
  //
  // O valor de state.temperature
  // vem diretamente do ESP32 / DS18B20.


  // ----------------------------------------------------------
  // POTÊNCIA
  // ----------------------------------------------------------

  let temperatureFactor = 1;

  if (esp32Connected) {

    temperatureFactor =
      1 -
      Math.max(
        0,
        state.temperature - 25
      ) * 0.002;
  }

  state.power =
    state.voltage *
    state.current *
    temperatureFactor;


  // ----------------------------------------------------------
  // DESEMPENHO SIMULADO
  // ----------------------------------------------------------

  state.performance =
    scenario.performance +
    (Math.random() * 4 - 2);


  // ----------------------------------------------------------
  // LIMITES
  // ----------------------------------------------------------

  state.irradiance =
    clamp(
      state.irradiance,
      0,
      1200
    );

  state.voltage =
    clamp(
      state.voltage,
      0,
      25
    );

  state.current =
    clamp(
      state.current,
      0,
      8
    );

  state.performance =
    clamp(
      state.performance,
      0,
      100
    );

  state.power =
    clamp(
      state.power,
      0,
      150
    );


  updateMetrics();

  updateSystemStatus();

  updateCharts();
}


// ============================================================
// TEMPERATURA REAL - ESP32 + DS18B20
// ============================================================

async function readRealTemperature() {

  try {

    const response =
      await fetch(
        ESP32_URL,
        {
          method: "GET",
          cache: "no-store"
        }
      );


    if (!response.ok) {

      throw new Error(
        `HTTP ${response.status}`
      );
    }


    const data =
      await response.json();


    const temperature =
      Number(data.temperatura);


    // Verificação para impedir
    // valores absurdos ou erro -127 °C
    if (
      !Number.isFinite(temperature) ||
      temperature <= -100 ||
      temperature > 125
    ) {

      throw new Error(
        "Temperatura inválida recebida do ESP32"
      );
    }


    // Salva a temperatura real
    state.temperature =
      temperature;


    // Se acabou de conectar
    if (!esp32Connected) {

      esp32Connected = true;

      modeLabel.textContent =
        "HÍBRIDO";

      addEvent(
        "ESP32 conectado. Temperatura real do DS18B20 recebida.",
        "normal"
      );
    }


    // Atualiza imediatamente
    // o card de temperatura
    temperaturaValue.textContent =
      `${state.temperature.toFixed(1)} °C`;

  }

  catch (error) {

    console.error(
      "Erro ao receber temperatura do ESP32:",
      error
    );


    if (esp32Connected) {

      addEvent(
        "Conexão com o ESP32 perdida.",
        "warning"
      );
    }


    esp32Connected = false;


    modeLabel.textContent =
      "ESP32 DESCONECTADO";


    temperaturaValue.textContent =
      "-- °C";
  }
}


// ============================================================
// STATUS DO SISTEMA
// ============================================================

function updateSystemStatus() {

  if (state.cleaning) {

    systemStatus.className =
      "system-status status-normal";

    systemStatus.textContent =
      "🔵 LIMPEZA DO SISTEMA EM ANDAMENTO";

    return;
  }


  if (state.scenario === "clean") {

    systemStatus.className =
      "system-status status-normal";

    systemStatus.textContent =
      "🟢 SISTEMA OPERANDO NORMALMENTE";

    return;
  }


  if (state.scenario === "light") {

    systemStatus.className =
      "system-status status-warning";

    systemStatus.textContent =
      "🟡 SUJEIRA LEVE DETECTADA";

    return;
  }


  if (state.scenario === "moderate") {

    systemStatus.className =
      "system-status status-warning";

    systemStatus.textContent =
      "🟠 REDUÇÃO DE DESEMPENHO DETECTADA";

    return;
  }


  if (state.scenario === "intense") {

    systemStatus.className =
      "system-status status-danger";

    systemStatus.textContent =
      "🔴 SUJEIRA INTENSA — LIMPEZA RECOMENDADA";

    return;
  }


  if (state.scenario === "shadow") {

    systemStatus.className =
      "system-status status-danger";

    systemStatus.textContent =
      "🌑 SOMBREAMENTO DETECTADO";

    return;
  }
}


// ============================================================
// GRÁFICOS
// ============================================================

function updateCharts() {

  const time =
    formatTime();


  // ----------------------------------------------------------
  // SALVA DADOS NO HISTÓRICO
  // ----------------------------------------------------------

  state.history.labels.push(
    time
  );


  state.history.power.push(
    Number(
      state.power.toFixed(1)
    )
  );


  state.history.current.push(
    Number(
      state.current.toFixed(2)
    )
  );


  if (esp32Connected) {

    state.history.temperature.push(
      Number(
        state.temperature.toFixed(1)
      )
    );

  } else {

    state.history.temperature.push(
      null
    );
  }


  state.history.irradiance.push(
    Math.round(
      state.irradiance
    )
  );


  // ----------------------------------------------------------
  // MANTÉM SOMENTE OS ÚLTIMOS 30 PONTOS
  // ----------------------------------------------------------

  if (
    state.history.labels.length > 30
  ) {

    state.history.labels.shift();

    state.history.power.shift();

    state.history.current.shift();

    state.history.temperature.shift();

    state.history.irradiance.shift();
  }


  // ----------------------------------------------------------
  // POTÊNCIA
  // ----------------------------------------------------------

  powerChart.data.labels =
    state.history.labels;

  powerChart.data.datasets[0].data =
    state.history.power;


  // ----------------------------------------------------------
  // CORRENTE
  // ----------------------------------------------------------

  currentChart.data.labels =
    state.history.labels;

  currentChart.data.datasets[0].data =
    state.history.current;


  // ----------------------------------------------------------
  // TEMPERATURA
  // ----------------------------------------------------------

  temperatureChart.data.labels =
    state.history.labels;

  temperatureChart
    .data
    .datasets[0]
    .data =
      state.history.temperature;


  // ----------------------------------------------------------
  // IRRADIÂNCIA
  // ----------------------------------------------------------

  irradianceChart.data.labels =
    state.history.labels;

  irradianceChart
    .data
    .datasets[0]
    .data =
      state.history.irradiance;


  // ----------------------------------------------------------
  // ATUALIZA GRÁFICOS
  // ----------------------------------------------------------

  powerChart.update();

  currentChart.update();

  temperatureChart.update();

  irradianceChart.update();
}


// ============================================================
// EVENTOS
// ============================================================

function addEvent(
  message,
  type = "normal"
) {

  const li =
    document.createElement("li");


  li.className =
    `event-item event-${type}`;


  li.innerHTML = `
    <span class="event-time">
      ${formatTime()}
    </span>

    <span class="event-message">
      ${message}
    </span>
  `;


  eventLog.prepend(
    li
  );


  // Limita histórico
  // aos últimos 15 eventos

  while (
    eventLog.children.length > 15
  ) {

    eventLog.removeChild(
      eventLog.lastChild
    );
  }
}


// ============================================================
// SELEÇÃO DOS CENÁRIOS
// ============================================================

scenarioButtons.forEach(
  (button) => {

    button.addEventListener(
      "click",
      () => {

        if (state.cleaning) {

          addEvent(
            "Não é possível alterar o cenário durante a limpeza.",
            "warning"
          );

          return;
        }


        const scenarioName =
          button.dataset.scenario;


        state.scenario =
          scenarioName;


        // ----------------------------------------------------
        // ATUALIZA BOTÃO ATIVO
        // ----------------------------------------------------

        scenarioButtons.forEach(
          (btn) => {

            btn.classList.remove(
              "active"
            );
          }
        );


        button.classList.add(
          "active"
        );


        const scenario =
          scenarios[scenarioName];


        // ----------------------------------------------------
        // ALTERA OS DADOS SIMULADOS
        // ----------------------------------------------------

        state.irradiance =
          scenario.irradiance;

        state.voltage =
          scenario.voltage;

        state.current =
          scenario.current;


        // NÃO altera a temperatura.
        //
        // Ela continua vindo
        // fisicamente do DS18B20.


        state.performance =
          scenario.performance;


        state.power =
          state.voltage *
          state.current;


        updateMetrics();

        updateSystemStatus();


        addEvent(
          `Cenário alterado para: ${scenario.name}`,

          scenarioName === "clean"
            ? "normal"
            : "warning"
        );
      }
    );
  }
);


// ============================================================
// SISTEMA DE LIMPEZA
// ============================================================

cleaningBtn.addEventListener(
  "click",
  () => {

    if (state.cleaning) {
      return;
    }


    // Se o painel já estiver limpo
    if (
      state.scenario === "clean"
    ) {

      cleaningStatus.textContent =
        "Painel já está limpo";


      addEvent(
        "Solicitação de limpeza ignorada: painel já está limpo.",
        "normal"
      );


      return;
    }


    startCleaning();
  }
);


// ============================================================
// INÍCIO DA LIMPEZA
// ============================================================

function startCleaning() {

  state.cleaning =
    true;


  state.cleaningProgress =
    0;


  cleaningBtn.disabled =
    true;


  cleaningBtn.textContent =
    "⏳ LIMPEZA EM ANDAMENTO...";


  cleaningStatus.textContent =
    "Preparando sistema de limpeza...";


  cleaningProgress.style.width =
    "0%";


  updateSystemStatus();


  addEvent(
    "Limpeza autorizada pelo operador.",
    "normal"
  );


  const cleaningInterval =
    setInterval(
      () => {

        state.cleaningProgress +=
          Math.random() * 8 + 4;


        if (
          state.cleaningProgress >= 100
        ) {

          state.cleaningProgress =
            100;


          clearInterval(
            cleaningInterval
          );


          finishCleaning();


          return;
        }


        cleaningProgress.style.width =
          `${state.cleaningProgress}%`;


        cleaningStatus.textContent =
          `Limpando painel... ${Math.round(
            state.cleaningProgress
          )}%`;

      },

      500
    );
}


// ============================================================
// FINAL DA LIMPEZA
// ============================================================

function finishCleaning() {

  cleaningProgress.style.width =
    "100%";


  cleaningStatus.textContent =
    "✅ Limpeza concluída com sucesso";


  addEvent(
    "Limpeza concluída. Eficiência do painel restaurada.",
    "normal"
  );


  // Retorna para
  // o cenário painel limpo

  state.scenario =
    "clean";


  scenarioButtons.forEach(
    (btn) => {

      btn.classList.remove(
        "active"
      );


      if (
        btn.dataset.scenario ===
        "clean"
      ) {

        btn.classList.add(
          "active"
        );
      }
    }
  );


  // ----------------------------------------------------------
  // RESTAURA OS DADOS SIMULADOS
  // ----------------------------------------------------------

  state.irradiance =
    scenarios.clean.irradiance;


  state.voltage =
    scenarios.clean.voltage;


  state.current =
    scenarios.clean.current;


  // NÃO altera a temperatura.
  //
  // A temperatura continua
  // vindo do DS18B20.


  state.performance =
    scenarios.clean.performance;


  state.power =
    state.voltage *
    state.current;


  state.cleaning =
    false;


  cleaningBtn.disabled =
    false;


  cleaningBtn.textContent =
    "🧹 AUTORIZAR LIMPEZA";


  updateMetrics();

  updateSystemStatus();


  setTimeout(
    () => {

      cleaningStatus.textContent =
        "Sistema pronto para nova análise";


      cleaningProgress.style.width =
        "0%";

    },

    2500
  );
}


// ============================================================
// NAVEGAÇÃO
// ============================================================

const navLinks =
  document.querySelectorAll(
    ".nav-link"
  );


navLinks.forEach(
  (link) => {

    link.addEventListener(
      "click",
      () => {

        navLinks.forEach(
          (item) => {

            item.classList.remove(
              "active"
            );
          }
        );


        link.classList.add(
          "active"
        );
      }
    );
  }
);


// ============================================================
// DETECTA AUTOMATICAMENTE A SEÇÃO VISÍVEL
// ============================================================

const sections =
  document.querySelectorAll(
    "main section[id]"
  );


const observer =
  new IntersectionObserver(
    (entries) => {

      entries.forEach(
        (entry) => {

          if (
            entry.isIntersecting
          ) {

            navLinks.forEach(
              (link) => {

                link.classList.remove(
                  "active"
                );


                if (
                  link.getAttribute("href") ===
                  `#${entry.target.id}`
                ) {

                  link.classList.add(
                    "active"
                  );
                }
              }
            );
          }
        }
      );
    },

    {
      threshold: 0.3
    }
  );


sections.forEach(
  (section) => {

    observer.observe(
      section
    );
  }
);


// ============================================================
// INICIALIZAÇÃO
// ============================================================

function initialize() {

  updateClock();

  updateMetrics();

  updateSystemStatus();


  modeLabel.textContent =
    "CONECTANDO ESP32...";


  addEvent(
    "Sistema iniciado: temperatura real + demais grandezas em simulação.",
    "normal"
  );


  addEvent(
    "Monitoramento fotovoltaico iniciado.",
    "normal"
  );
}


// ============================================================
// INICIA O DASHBOARD
// ============================================================

initialize();


// Atualiza relógio
// a cada 1 segundo

setInterval(
  updateClock,
  1000
);


// Atualiza os dados
// que ainda estão simulados
// a cada 1,5 segundo

setInterval(
  simulateData,
  1500
);


// Faz a primeira leitura
// real imediatamente

readRealTemperature();


// Lê novamente a temperatura
// do ESP32 a cada 1,5 segundo

setInterval(
  readRealTemperature,
  1500
);