# Guía de Inicio Rápido - Liga de Profetas

Sigue estos pasos para configurar y ejecutar el proyecto:

## Paso 1: Instalar Dependencias

Abre la terminal en la carpeta del proyecto y ejecuta:

```bash
npm install
```

Esto instalará todas las dependencias necesarias (Next.js, React, Supabase, Tailwind CSS, etc.).

---

## Paso 2: Crear Proyecto en Supabase (si no lo tienes)

1. Ve a [https://supabase.com](https://supabase.com)
2. Inicia sesión o crea una cuenta
3. Haz clic en "New Project"
4. Completa la información del proyecto:
   - Nombre del proyecto
   - Contraseña de la base de datos
   - Región (elige la más cercana)
5. Espera a que se cree el proyecto (2-3 minutos)

---

## Paso 3: Configurar Variables de Entorno

1. En Supabase, ve a **Settings** → **API**
2. Encuentra estas dos claves:
   - **Project URL** (algo como: `https://xxxxx.supabase.co`)
   - **anon public** key (una clave larga)

3. En la raíz del proyecto, crea un archivo llamado `.env.local`

4. Agrega el siguiente contenido (reemplaza con tus valores):

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anon_aqui
```

⚠️ **Importante:** Nunca subas el archivo `.env.local` a Git. Ya está en el `.gitignore`.

---

## Paso 4: Configurar la Base de Datos en Supabase

1. En Supabase, ve a **SQL Editor**

2. Ejecuta este script para crear las tablas:

### Crear Tabla `teams`:
```sql
CREATE TABLE teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Crear Tabla `matches`:
```sql
CREATE TABLE matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_team_id UUID NOT NULL REFERENCES teams(id),
  away_team_id UUID NOT NULL REFERENCES teams(id),
  home_score INTEGER,
  away_score INTEGER,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('scheduled', 'live', 'finished')) DEFAULT 'scheduled',
  round INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_matches_round ON matches(round);
CREATE INDEX idx_matches_start_time ON matches(start_time);
CREATE INDEX idx_matches_status ON matches(status);
```

### Crear Tabla `profiles`:
```sql
CREATE TABLE profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  total_points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_profiles_total_points ON profiles(total_points DESC);
```

3. Configurar Row Level Security (RLS):

```sql
-- Habilitar RLS
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Permitir lectura pública
CREATE POLICY "Public read access for teams"
ON teams FOR SELECT
USING (true);

CREATE POLICY "Public read access for matches"
ON matches FOR SELECT
USING (true);

CREATE POLICY "Public read access for profiles"
ON profiles FOR SELECT
USING (true);
```

4. (Opcional) Habilitar Realtime:
   - Ve a **Database** → **Replication**
   - Habilita la replicación para las tablas `matches` y `profiles`

---

## Paso 5: Agregar Datos de Ejemplo (Opcional)

Puedes agregar algunos datos de prueba para ver la aplicación funcionando:

### Insertar Equipos:
```sql
INSERT INTO teams (name, logo_url) VALUES
('América', 'https://logos-world.net/wp-content/uploads/2020/06/Club-America-Logo.png'),
('Chivas', 'https://logos-world.net/wp-content/uploads/2020/06/Chivas-Logo.png'),
('Cruz Azul', 'https://logos-world.net/wp-content/uploads/2020/06/Cruz-Azul-Logo.png'),
('Pumas', 'https://logos-world.net/wp-content/uploads/2020/06/Pumas-Logo.png'),
('Monterrey', 'https://logos-world.net/wp-content/uploads/2020/06/CF-Monterrey-Logo.png'),
('Tigres', 'https://logos-world.net/wp-content/uploads/2020/06/Tigres-UANL-Logo.png');
```

### Insertar Perfiles de Ejemplo:
```sql
INSERT INTO profiles (username, total_points) VALUES
('Profeta1', 15),
('Profeta2', 12),
('Profeta3', 10),
('Profeta4', 8),
('Profeta5', 5);
```

### Insertar un Partido de Ejemplo:
```sql
INSERT INTO matches (home_team_id, away_team_id, start_time, round, status) VALUES
(
  (SELECT id FROM teams WHERE name = 'América' LIMIT 1),
  (SELECT id FROM teams WHERE name = 'Chivas' LIMIT 1),
  NOW() + INTERVAL '2 days',
  1,
  'scheduled'
);
```

---

## Paso 6: Ejecutar el Proyecto

En la terminal, ejecuta:

```bash
npm run dev
```

Abre tu navegador y ve a:
```
http://localhost:3000
```

¡Deberías ver la aplicación funcionando! 🎉

---

## Solución de Problemas

### Error: "Cannot find module"
- Asegúrate de haber ejecutado `npm install`

### Error de conexión a Supabase
- Verifica que las variables de entorno en `.env.local` sean correctas
- Verifica que tu proyecto de Supabase esté activo

### Error: "permission denied"
- Verifica que hayas ejecutado los scripts de RLS (Row Level Security)

### La página está en blanco
- Abre la consola del navegador (F12) para ver errores
- Verifica que hayas creado las tablas en Supabase

---

## Próximos Pasos

- Agregar más partidos en Supabase
- Personalizar los logos de los equipos
- Implementar el guardado de pronósticos (crear tabla `predictions`)
- Agregar autenticación de usuarios
- Personalizar los estilos

---

## Comandos Útiles

```bash
# Desarrollo
npm run dev

# Build de producción
npm run build

# Iniciar servidor de producción
npm start

# Ejecutar linter
npm run lint
```

