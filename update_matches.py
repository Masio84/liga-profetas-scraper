import os
import requests
import json
from datetime import datetime
import pytz
from supabase import create_client, Client

# --- 1. Configuración de Supabase ---
# Obtiene las credenciales de los "Secrets" de GitHub
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")

if not url or not key:
    raise ValueError("Error: Faltan las credenciales SUPABASE_URL o SUPABASE_KEY en las variables de entorno.")

supabase: Client = create_client(url, key)

def run_scraper():
    print("--- Iniciando Scraper de Liga de Profetas ---")
    
    # --- 2. Configuración de la API de FotMob ---
    # ID 230 = Liga MX
    # tab=matches: Fuerza a la API a traer la lista de partidos en lugar del resumen general
    # timeZone: Asegura que las fechas vengan ajustadas o listas para procesar
    league_id = 230
    api_url = f"https://www.fotmob.com/api/leagues?id={league_id}&tab=matches&type=league&timeZone=America/Mexico_City"
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36"
    }

    try:
        # Hacemos la petición a FotMob
        print(f"Consultando API: {api_url}")
        response = requests.get(api_url, headers=headers)
        response.raise_for_status() # Lanza error si la web falla (404, 500)
        data = response.json()
        
        # Extraemos la lista de partidos. 
        # La estructura suele ser: data['matches']['allMatches']
        all_matches = data.get('matches', {}).get('allMatches', [])
        
        # Verificación de seguridad por si la estructura cambia o está vacía
        if not all_matches:
            print("ALERTA: FotMob devolvió 0 partidos. Imprimiendo llaves recibidas para depuración:")
            print(data.keys())
            return

        print(f"Total de partidos encontrados en el calendario: {len(all_matches)}")
        
        # Contadores para el reporte final
        partidos_procesados = 0
        equipos_procesados = set()

        # --- 3. Procesamiento de Datos ---
        for match in all_matches:
            match_id = match.get('id')
            home = match.get('home', {})
            away = match.get('away', {})
            status = match.get('status', {})
            
            # A. Insertar Equipos PRIMERO (Tabla 'teams')
            # Si intentamos guardar el partido sin que existan los equipos, Supabase dará error.
            
            # Equipo Local
            if home.get('id') not in equipos_procesados:
                team_data = {
                    "id": home.get('id'),
                    "name": home.get('name'),
                    # Generamos la URL del logo usando el ID de FotMob
                    "logo_url": f"https://images.fotmob.com/image_resources/logo/teamlogo/{home.get('id')}.png"
                }
                supabase.table('teams').upsert(team_data).execute()
                equipos_procesados.add(home.get('id'))

            # Equipo Visitante
            if away.get('id') not in equipos_procesados:
                team_data = {
                    "id": away.get('id'),
                    "name": away.get('name'),
                    "logo_url": f"https://images.fotmob.com/image_resources/logo/teamlogo/{away.get('id')}.png"
                }
                supabase.table('teams').upsert(team_data).execute()
                equipos_procesados.add(away.get('id'))

            # B. Determinar estado y marcador
            
            # Estados simplificados para nuestra BD: 'scheduled', 'live', 'finished', 'cancelled'
            match_status = 'scheduled'
            if status.get('cancelled'):
                match_status = 'cancelled'
            elif status.get('finished'):
                match_status = 'finished'
            elif status.get('started'):
                match_status = 'live'

            # Marcadores (manejo seguro para evitar errores si vienen vacíos o como texto)
            try:
                # A veces FotMob manda el score en campos distintos dependiendo si es live o finished
                # Intentamos leer scoreStr o los campos individuales
                home_score = int(home.get('score', 0)) if home.get('score') is not None else 0
                away_score = int(away.get('score', 0)) if away.get('score') is not None else 0
            except (ValueError, TypeError):
                home_score = 0
                away_score = 0

            # C. Insertar/Actualizar Partido (Tabla 'matches')
            match_record = {
                "id": match_id,
                "home_team_id": home.get('id'),
                "away_team_id": away.get('id'),
                "start_time": status.get('utcTime'), # Supabase maneja UTC ISO 8601 automáticamente
                "home_score": home_score,
                "away_score": away_score,
                "status": match_status,
                "round_name": match.get('roundName', '') # Ej: "Jornada 1"
            }

            # Upsert: Actualiza si existe el ID, crea si no existe
            supabase.table('matches').upsert(match_record).execute()
            partidos_procesados += 1

        print(f"¡Éxito! Se actualizaron {partidos_procesados} partidos en la base de datos.")

    except Exception as e:
        print(f"Ocurrió un error crítico durante la ejecución: {e}")
        # Importante: exit(1) notifica a GitHub Actions que el proceso falló (marca roja)
        exit(1)

if __name__ == "__main__":
    run_scraper()
