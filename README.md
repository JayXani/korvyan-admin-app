# Korvyan Admin App

Repositório dedicado ao **Painel de Administração Master (Root / Superadmin)** da plataforma **Korvyan Insurance**.

Este projeto foi totalmente desacoplado do front-end principal de corretores e clientes (`korvyan-front`), permitindo isolamento de segurança, controle de acesso restrito e bundle otimizado sem dependência do SDK direto do Firebase.

---

## 🚀 Tecnologias

- **Vue 3** (Composition API / Script Setup)
- **Vite**
- **TypeScript**
- **Vue Router 4**
- **ApexCharts** & **Chart.js** (Observabilidade e métricas)
- **Design System Korvyan** (Dark & Gold Theme)

---

## 🛡️ Funcionalidades Master

1. **Dashboard / Visão Geral:** Estatísticas em tempo real, status dos microsserviços e consumo global.
2. **Gestão de Tenants:** Criação, edição, bloqueio e exclusão de seguradoras/corretoras.
3. **Escopos & Permissões:** Definição hierárquica de permissões e controle de acesso RBAC.
4. **Chaves de API:** Geração, rotação e monitoramento de chaves para integrações externas.
5. **Operadores Master:** Controle de acessos superadmin (Root).
6. **Observabilidade:** Monitoramento de latência, status HTTP da API e volume de logs.
7. **Auditoria de Logs:** Rastreamento com histórico de IP, ações de usuários e auditoria.
8. **Templates de E-mail:** Gestão de templates de e-mail e configurações de SMTP/Hostinger por tenant via `korvyan-workers`.
9. **Faturamento & Kanban:** Acompanhamento financeiro dos planos e fluxo de demandas.

---

## 🛠️ Como Executar Localmente

1. **Instale as dependências:**
   ```bash
   npm install
   ```

2. **Configure as variáveis de ambiente:**
   ```bash
   cp .env.example .env
   ```
   * `VITE_API_BASE_URL`: URL da API Django (`http://localhost:8000`)
   * `VITE_WORKERS_URL`: URL do `korvyan-workers` (`http://localhost:5001`)

3. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```
   O painel estará disponível em `http://localhost:5174`.

4. **Build para Produção:**
   ```bash
   npm run build
   ```
