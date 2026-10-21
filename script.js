// ============================================================
// SOLAR MONITOR
// MODO SIMULAÇÃO + MODO REAL
// ============================================================

const state = {

  // Modo inicial
  mode: "simulation",

  scenario: "clean",

  irradiance: 812,
  voltage: 20.12,
  current: 4.72,
  power: 94.9,
  temperature: 46.3,
  performance: 82,

  cleaning: false,
  cleaningProgress: 0,

  esp32Connected: false,

  history: {
    labels: [],
    power: [],
    current: [],
    temperature: [],
    irradiance: []
  }
};


// ============================================================
// ESP32
// ============================================================

const ESP32_URL =
  "http://192.168.1.175/dados";


// ============================================================
// CENÁRIOS DE SIMULAÇÃO
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
// ELEMENTOS DO HTML
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

const modeSelect =
  document.getElementById("modeSelect");


// ============================================================
// CONFIGURAÇÃO DOS GRÁFICOS
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


// ============================================================
// GRÁFICO DE POTÊNCIA
// ============================================================

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


// ============================================================
// GRÁFICO DE CORRENTE
// ============================================================

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


// ============================================================
// GRÁFICO DE TEMPERATURA
// ============================================================

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


// ============================================================
// GRÁFICO DE IRRADIÂNCIA
// ============================================================

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

function randomVariation(
  value,
  percentage = 0.03
) {

  const variation =
    value * percentage;

  return value +
    (
      Math.random() *
      variation *
      2 -
      variation
    );
}


function clamp(
  value,
  min,
  max
) {

  return Math.min(
    Math.max(value, min),
    max
  );
}


function formatTime() {

  const now =
    new Date();

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

  const now =
    new Date();

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

  eventLog.prepend(li);

  while (
    eventLog.children.length > 15
  ) {

    eventLog.removeChild(
      eventLog.lastChild
    );
  }
}


// ============================================================
// ATUALIZAÇÃO DOS CARDS
// ============================================================

function updateMetrics() {

  // ==========================================================
  // MODO SIMULAÇÃO
  // ==========================================================

  if (
    state.mode === "simulation"
  ) {

    irradianciaValue.textContent =
      `${Math.round(
        state.irradiance
      )} W/m²`;

    tensaoValue.textContent =
      `${state.voltage.toFixed(2)} V`;

    correnteValue.textContent =
      `${state.current.toFixed(2)} A`;

    potenciaValue.textContent =
      `${state.power.toFixed(1)} W`;

    temperaturaValue.textContent =
      `${state.temperature.toFixed(1)} °C`;

    desempenhoValue.textContent =
      `${Math.round(
        state.performance
      )}%`;

    return;
  }


  // ==========================================================
  // MODO REAL
  // ==========================================================

  // Ainda não temos LDR integrado
  irradianciaValue.textContent =
    "-- W/m²";

  // Ainda não temos INA226 lendo o painel
  tensaoValue.textContent =
    "-- V";

  // Ainda não temos ACS712 integrado
  correnteValue.textContent =
    "-- A";

  // Será calculada depois
  potenciaValue.textContent =
    "-- W";

  // Temperatura JÁ É REAL
  if (
    state.esp32Connected
  ) {

    temperaturaValue.textContent =
      `${state.temperature.toFixed(1)} °C`;

  } else {

    temperaturaValue.textContent =
      "-- °C";
  }

  // Ainda não calculado
  desempenhoValue.textContent =
    "--";
}


// ============================================================
// SIMULAÇÃO DOS DADOS
// ============================================================

function simulateData() {

  // Se estiver no modo REAL,
  // não fazemos simulação.

  if (
    state.mode !== "simulation"
  ) {

    return;
  }


  if (
    state.cleaning
  ) {

    return;
  }


  const scenario =
    scenarios[
      state.scenario
    ];


  // Irradiância
  state.irradiance =
    randomVariation(
      scenario.irradiance,
      0.035
    );


  // Tensão
  state.voltage =
    randomVariation(
      scenario.voltage,
      0.015
    );


  // Corrente
  state.current =
    randomVariation(
      scenario.current,
      0.04
    );


  // Temperatura
  state.temperature =
    randomVariation(
      scenario.temperature,
      0.025
    );


  // Influência simplificada
  // da temperatura

  const temperatureFactor =
    1 -
    Math.max(
      0,
      state.temperature - 25
    ) *
    0.002;


  // Potência
  state.power =
    state.voltage *
    state.current *
    temperatureFactor;


  // Desempenho
  state.performance =
    scenario.performance +
    (
      Math.random() *
      4 -
      2
    );


  // Limites
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

  state.temperature =
    clamp(
      state.temperature,
      20,
      80
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
// LEITURA REAL DO ESP32
// ============================================================

async function readRealData() {

  // Só tenta acessar o ESP32
  // quando estiver no modo REAL.

  if (
    state.mode !== "real"
  ) {

    return;
  }


  try {

    const response =
      await fetch(
        ESP32_URL,
        {
          method: "GET",
          cache: "no-store"
        }
      );


    if (
      !response.ok
    ) {

      throw new Error(
        `HTTP ${response.status}`
      );
    }


    const data =
      await response.json();


    // ========================================================
    // TEMPERATURA REAL
    // ========================================================

    const temperature =
      Number(
        data.temperatura
      );


    if (
      !Number.isFinite(
        temperature
      ) ||
      temperature <= -100 ||
      temperature > 125
    ) {

      throw new Error(
        "Temperatura inválida"
      );
    }


    state.temperature =
      temperature;


    // ========================================================
    // PRIMEIRA CONEXÃO
    // ========================================================

    if (
      !state.esp32Connected
    ) {

      state.esp32Connected =
        true;

      addEvent(
        "ESP32 conectado. DS18B20 enviando temperatura real.",
        "normal"
      );
    }


    updateMetrics();

    updateSystemStatus();

    updateCharts();
  }

  catch (error) {

    console.error(
      "Erro ao acessar ESP32:",
      error
    );


    if (
      state.esp32Connected
    ) {

      addEvent(
        "Conexão com o ESP32 perdida.",
        "warning"
      );
    }


    state.esp32Connected =
      false;


    updateMetrics();

    updateSystemStatus();
  }
}


// ============================================================
// STATUS DO SISTEMA
// ============================================================

function updateSystemStatus() {

  // ==========================================================
  // MODO REAL
  // ==========================================================

  if (
    state.mode === "real"
  ) {

    if (
      state.esp32Connected
    ) {

      systemStatus.className =
        "system-status status-normal";

      systemStatus.textContent =
        "🟢 MODO REAL — ESP32 CONECTADO";

    } else {

      systemStatus.className =
        "system-status status-danger";

      systemStatus.textContent =
        "🔴 MODO REAL — ESP32 DESCONECTADO";
    }

    return;
  }


  // ==========================================================
  // MODO SIMULAÇÃO
  // ==========================================================

  if (
    state.cleaning
  ) {

    systemStatus.className =
      "system-status status-normal";

    systemStatus.textContent =
      "🔵 LIMPEZA DO SISTEMA EM ANDAMENTO";

    return;
  }


  if (
    state.scenario === "clean"
  ) {

    systemStatus.className =
      "system-status status-normal";

    systemStatus.textContent =
      "🟢 SISTEMA OPERANDO NORMALMENTE";

    return;
  }


  if (
    state.scenario === "light"
  ) {

    systemStatus.className =
      "system-status status-warning";

    systemStatus.textContent =
      "🟡 SUJEIRA LEVE DETECTADA";

    return;
  }


  if (
    state.scenario === "moderate"
  ) {

    systemStatus.className =
      "system-status status-warning";

    systemStatus.textContent =
      "🟠 REDUÇÃO DE DESEMPENHO DETECTADA";

    return;
  }


  if (
    state.scenario === "intense"
  ) {

    systemStatus.className =
      "system-status status-danger";

    systemStatus.textContent =
      "🔴 SUJEIRA INTENSA — LIMPEZA RECOMENDADA";

    return;
  }


  if (
    state.scenario === "shadow"
  ) {

    systemStatus.className =
      "system-status status-danger";

    systemStatus.textContent =
      "🌑 SOMBREAMENTO DETECTADO";
  }
}


// ============================================================
// GRÁFICOS
// ============================================================

function updateCharts() {

  const time =
    formatTime();


  state.history.labels.push(
    time
  );


  // ==========================================================
  // SIMULAÇÃO
  // ==========================================================

  if (
    state.mode === "simulation"
  ) {

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

    state.history.temperature.push(
      Number(
        state.temperature.toFixed(1)
      )
    );

    state.history.irradiance.push(
      Math.round(
        state.irradiance
      )
    );
  }


  // ==========================================================
  // REAL
  // ==========================================================

  else {

    // Ainda não temos dados reais
    // destas grandezas

    state.history.power.push(
      null
    );

    state.history.current.push(
      null
    );

    state.history.irradiance.push(
      null
    );


    // Temperatura real
    if (
      state.esp32Connected
    ) {

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
  }


  // Últimos 30 pontos
  if (
    state.history.labels.length > 30
  ) {

    state.history.labels.shift();

    state.history.power.shift();

    state.history.current.shift();

    state.history.temperature.shift();

    state.history.irradiance.shift();
  }


  powerChart.data.labels =
    state.history.labels;

  powerChart
    .data
    .datasets[0]
    .data =
      state.history.power;


  currentChart.data.labels =
    state.history.labels;

  currentChart
    .data
    .datasets[0]
    .data =
      state.history.current;


  temperatureChart.data.labels =
    state.history.labels;

  temperatureChart
    .data
    .datasets[0]
    .data =
      state.history.temperature;


  irradianceChart.data.labels =
    state.history.labels;

  irradianceChart
    .data
    .datasets[0]
    .data =
      state.history.irradiance;


  powerChart.update();

  currentChart.update();

  temperatureChart.update();

  irradianceChart.update();
}


// ============================================================
// LIMPA HISTÓRICO DOS GRÁFICOS
// ============================================================

function clearCharts() {

  state.history.labels = [];

  state.history.power = [];

  state.history.current = [];

  state.history.temperature = [];

  state.history.irradiance = [];


  powerChart.data.labels = [];

  powerChart.data.datasets[0].data = [];


  currentChart.data.labels = [];

  currentChart.data.datasets[0].data = [];


  temperatureChart.data.labels = [];

  temperatureChart.data.datasets[0].data = [];


  irradianceChart.data.labels = [];

  irradianceChart.data.datasets[0].data = [];


  powerChart.update();

  currentChart.update();

  temperatureChart.update();

  irradianceChart.update();
}


// ============================================================
// TROCA DE MODO
// ============================================================

modeSelect.addEventListener(
  "change",
  () => {

    const selectedMode =
      modeSelect.value;


    // ========================================================
    // SIMULAÇÃO
    // ========================================================

    if (
      selectedMode === "simulation"
    ) {

      state.mode =
        "simulation";


      state.esp32Connected =
        false;


      scenarioButtons.forEach(
        button => {

          button.disabled =
            false;
        }
      );


      cleaningBtn.disabled =
        false;


      cleaningBtn.textContent =
        "🧹 AUTORIZAR LIMPEZA";


      cleaningStatus.textContent =
        "Aguardando análise";


      clearCharts();


      // Volta aos valores
      // do cenário atual

      const scenario =
        scenarios[
          state.scenario
        ];


      state.irradiance =
        scenario.irradiance;

      state.voltage =
        scenario.voltage;

      state.current =
        scenario.current;

      state.temperature =
        scenario.temperature;

      state.performance =
        scenario.performance;

      state.power =
        state.voltage *
        state.current;


      updateMetrics();

      updateSystemStatus();


      addEvent(
        "Modo SIMULAÇÃO ativado.",
        "normal"
      );


      return;
    }


    // ========================================================
    // REAL
    // ========================================================

    state.mode =
      "real";


    state.esp32Connected =
      false;


    // Cenários não devem alterar
    // dados físicos reais

    scenarioButtons.forEach(
      button => {

        button.disabled =
          true;
      }
    );


    // Limpeza física ainda
    // não foi integrada

    cleaningBtn.disabled =
      true;


    cleaningBtn.textContent =
      "🧹 AGUARDANDO INTEGRAÇÃO";


    cleaningStatus.textContent =
      "Modo real: limpeza ainda não integrada";


    clearCharts();


    updateMetrics();

    updateSystemStatus();


    addEvent(
      "Modo REAL ativado. Buscando dados do ESP32.",
      "normal"
    );


    // Tenta conectar imediatamente
    readRealData();
  }
);


// ============================================================
// SELEÇÃO DE CENÁRIO
// ============================================================

scenarioButtons.forEach(
  button => {

    button.addEventListener(
      "click",
      () => {

        // Cenários são exclusivos
        // do modo simulação

        if (
          state.mode !== "simulation"
        ) {

          return;
        }


        if (
          state.cleaning
        ) {

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


        scenarioButtons.forEach(
          btn => {

            btn.classList.remove(
              "active"
            );
          }
        );


        button.classList.add(
          "active"
        );


        const scenario =
          scenarios[
            scenarioName
          ];


        state.irradiance =
          scenario.irradiance;

        state.voltage =
          scenario.voltage;

        state.current =
          scenario.current;

        state.temperature =
          scenario.temperature;

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
// BOTÃO DE LIMPEZA
// ============================================================

cleaningBtn.addEventListener(
  "click",
  () => {

    // A limpeza física
    // ainda não está integrada.

    if (
      state.mode !== "simulation"
    ) {

      return;
    }


    if (
      state.cleaning
    ) {

      return;
    }


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
// INICIA LIMPEZA SIMULADA
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
// FINALIZA LIMPEZA SIMULADA
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


  state.scenario =
    "clean";


  scenarioButtons.forEach(
    btn => {

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


  state.irradiance =
    scenarios.clean.irradiance;

  state.voltage =
    scenarios.clean.voltage;

  state.current =
    scenarios.clean.current;

  state.temperature =
    scenarios.clean.temperature;

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
  link => {

    link.addEventListener(
      "click",
      () => {

        navLinks.forEach(
          item => {

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
// DETECÇÃO DA SEÇÃO VISÍVEL
// ============================================================

const sections =
  document.querySelectorAll(
    "main section[id]"
  );


const observer =
  new IntersectionObserver(
    entries => {

      entries.forEach(
        entry => {

          if (
            entry.isIntersecting
          ) {

            navLinks.forEach(
              link => {

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
  section => {

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


  addEvent(
    "Sistema iniciado em modo de SIMULAÇÃO.",
    "normal"
  );


  addEvent(
    "Monitoramento fotovoltaico iniciado.",
    "normal"
  );
}


// ============================================================
// INICIA
// ============================================================

initialize();


// Relógio
setInterval(
  updateClock,
  1000
);


// Simulação
setInterval(
  simulateData,
  1500
);


// ESP32
setInterval(
  readRealData,
  1500
);