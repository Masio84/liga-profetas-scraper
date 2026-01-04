# Liga de Profetas - Quiniela Liga MX

Aplicación web moderna para pronosticar resultados de partidos de la Liga MX, construida con Next.js 15, Supabase, Tailwind CSS y Shadcn UI.

## Características

- 🏆 Dashboard principal con partidos de la jornada actual
- ⚽ Tarjetas de partido con escudos de equipos y estado en tiempo real
- 🔒 Lógica de bloqueo automático cuando los partidos están en vivo o finalizados
- 📊 Ranking de participantes ordenado por puntos totales
- 🔄 Actualización en tiempo real de partidos y rankings

## Requisitos Previos

- Node.js 18+ 
- Cuenta de Supabase con las siguientes tablas:
  - `matches`: Partidos de la Liga MX
  - `teams`: Equipos con logos
  - `profiles`: Perfiles de usuarios con puntos

## Instalación

1. Clona el repositorio o navega al directorio del proyecto

2. Instala las dependencias:
```bash
npm install
```

3. Configura las variables de entorno:
   - Copia `.env.local.example` a `.env.local`
   - Agrega tu URL y clave anónima de Supabase

4. Ejecuta el servidor de desarrollo:
```bash
npm run dev
```

5. Abre [http://localhost:3000](http://localhost:3000) en tu navegador

## Estructura de Base de Datos

### Tabla `matches`
- `id` (uuid)
- `home_team_id` (uuid, FK a teams)
- `away_team_id` (uuid, FK a teams)
- `home_score` (integer, nullable)
- `away_score` (integer, nullable)
- `start_time` (timestamp)
- `status` (enum: 'scheduled', 'live', 'finished')
- `round` (integer)
- `created_at` (timestamp)

### Tabla `teams`
- `id` (uuid)
- `name` (text)
- `logo_url` (text, nullable)
- `created_at` (timestamp)

### Tabla `profiles`
- `id` (uuid)
- `username` (text)
- `total_points` (integer)
- `created_at` (timestamp)

## Tecnologías

- **Next.js 15**: Framework React con App Router
- **Supabase**: Backend y base de datos
- **Tailwind CSS**: Estilos utilitarios
- **Shadcn UI**: Componentes de UI modernos
- **TypeScript**: Tipado estático
- **Lucide React**: Iconos

## Funcionalidades

### Dashboard Principal
Muestra todos los partidos de la jornada actual de la Liga MX, obtenidos de la tabla `matches`.

### Tarjeta de Partido
Cada partido muestra:
- Escudos de los equipos (desde `logo_url` en la tabla `teams`)
- Hora de inicio del partido
- Estado actual (Programado, En Vivo, Finalizado)
- Inputs para pronóstico (local y visitante)

### Lógica de Bloqueo
Los inputs se deshabilitan automáticamente cuando:
- El estado del partido es 'live' o 'finished'
- La hora actual es mayor a `start_time`

Cuando están bloqueados, se muestra el marcador real del partido.

### Ranking
Tabla lateral que muestra las posiciones de los participantes ordenados por `total_points`, con iconos especiales para los primeros 3 lugares.

## Desarrollo

```bash
# Desarrollo
npm run dev

# Build de producción
npm run build

# Iniciar servidor de producción
npm start

# Linter
npm run lint
```

## Licencia

MIT







