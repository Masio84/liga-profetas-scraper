# Configuración de Supabase

Este documento describe cómo configurar las tablas necesarias en Supabase para la aplicación Liga de Profetas.

## Tablas Requeridas

### 1. Tabla `teams`

```sql
CREATE TABLE teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. Tabla `matches`

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

-- Índices para mejorar el rendimiento
CREATE INDEX idx_matches_round ON matches(round);
CREATE INDEX idx_matches_start_time ON matches(start_time);
CREATE INDEX idx_matches_status ON matches(status);
```

### 3. Tabla `profiles`

```sql
CREATE TABLE profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  total_points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para el ranking
CREATE INDEX idx_profiles_total_points ON profiles(total_points DESC);
```

## Políticas RLS (Row Level Security)

Para que la aplicación funcione correctamente, necesitas configurar las políticas RLS:

### Habilitar RLS en todas las tablas

```sql
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
```

### Políticas de Lectura Pública

```sql
-- Permitir lectura pública de teams
CREATE POLICY "Public read access for teams"
ON teams FOR SELECT
USING (true);

-- Permitir lectura pública de matches
CREATE POLICY "Public read access for matches"
ON matches FOR SELECT
USING (true);

-- Permitir lectura pública de profiles
CREATE POLICY "Public read access for profiles"
ON profiles FOR SELECT
USING (true);
```

### Políticas de Escritura (Opcional - según tu caso de uso)

Si necesitas que los usuarios puedan actualizar sus perfiles o crear predicciones, puedes agregar políticas adicionales. Por ejemplo:

```sql
-- Permitir actualización de puntos del propio perfil
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);
```

## Datos de Ejemplo

### Insertar Equipos

```sql
INSERT INTO teams (name, logo_url) VALUES
('América', 'https://example.com/logos/america.png'),
('Chivas', 'https://example.com/logos/chivas.png'),
('Cruz Azul', 'https://example.com/logos/cruz-azul.png'),
('Pumas', 'https://example.com/logos/pumas.png');
```

### Insertar Partidos

```sql
INSERT INTO matches (home_team_id, away_team_id, start_time, round, status) VALUES
(
  (SELECT id FROM teams WHERE name = 'América'),
  (SELECT id FROM teams WHERE name = 'Chivas'),
  '2024-01-15 20:00:00-06',
  1,
  'scheduled'
);
```

### Insertar Perfiles

```sql
INSERT INTO profiles (username, total_points) VALUES
('Profeta1', 15),
('Profeta2', 12),
('Profeta3', 10),
('Profeta4', 8);
```

## Configuración de Variables de Entorno

1. Ve a tu proyecto en Supabase
2. Navega a Settings > API
3. Copia la `URL` y la `anon public` key
4. Crea un archivo `.env.local` en la raíz del proyecto:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
```

## Habilitar Realtime (Opcional pero Recomendado)

Para que las actualizaciones en tiempo real funcionen:

1. Ve a Database > Replication en Supabase
2. Habilita la replicación para las tablas `matches` y `profiles`

Esto permitirá que la aplicación se actualice automáticamente cuando cambien los datos.




