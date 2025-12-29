import os
import requests
import json
from datetime import datetime
import pytz
from supabase import create_client, Client

# --- 1. Configuración de Supabase ---
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")

if not url or not key:
    raise ValueError("Error: Faltan las credenciales SUPABASE_URL o SUPABASE_KEY")

supabase: Client = create_client(url, key)

def run_scraper():
    print("--- Iniciando Scraper de Liga de Profetas ---")
    
    # --- 2. Configuración de API FotMob ---
    # ID 230 = Liga MX
    # tab=matches: CRÍTICO. Obliga a la API a dar el calendario en vez del resumen.
    # season=2025/2026: Asegura que traiga el torneo actual/próximo.
    league_id = 230
    api_url = f"https://www.fotmob.com/api/leagues?id={league_id}&tab=matches&type=league&timeZone=America/Mexico_City"
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36"
    }

    try:
        print(f"Consultando API: {api_url}")
        response = requests.get(api_url, headers=headers)
        response.raise_for_status()
        data = response.json()
        
        # --- 3. Estrategia de Búsqueda de Datos (La corrección principal) ---
        # El log mostró que la llave se llama 'fixtures', no 'matches' en esta vista.
        # Usamos .get() encadenados para probar varias ubicaciones comunes de FotMob.
        
        matches_container = data.get('fixtures') or data.get('matches') or {}
        
        # Intentamos obtener la lista 'allMatches'
        all_matches = matches_container.get('allMatches', [])
        
        # Si sigue vacío, probamos una ruta alternativa común (overview)
        if not all_matches:
             all_matches = data.get('overview', {}).get('leagueOverviewMatches', [])

        if not all_matches:
            print("ALERTA CRÍTICA: No se encontraron partidos.")
            print("Llaves disponibles en 'data':", data.keys())
            if matches_container:
                print("Llaves en el contenedor:", matches_container.keys())
            return

        print(f"✅ Partidos encontrados en el calendario: {len(all_matches)}")
        
        # Contadores
        partidos_procesados = 0
        equipos_procesados = set()

        # --- 4. Procesamiento ---
        for match in all_matches:
            match_id = match.get('id')
            home = match.get('home', {})
            away = match.get('away', {})
            status_obj = match.get('status', {})
            
            # --- A. Upsert Equipos (Tabla 'teams') ---
            # Guardamos primero los equipos para que la llave foránea no falle
            
            # Local
            if home.get('id') and home.get('id') not in equipos_procesados:
                team_data = {
                    "id": home.get('id'),
                    "name": home.get('name'),
                    "short_name": home.get('shortName', home.get('name')),
                    "logo_url": f"https://images.fotmob.com/image_resources/logo/teamlogo/{home.get('id')}.png"
                }
                supabase.table('teams').upsert(team_data).execute()
                equipos_procesados.add(home.get('id'))

            # Visitante
            if away.get('id') and away.get('id') not in equipos_procesados:
                team_data = {
                    "id": away.get('id'),
                    "name": away.get('name'),
                    "short_name": away.get('shortName', away.get('name')),
                    "logo_url": f"https://images.fotmob.com/image_resources/logo/teamlogo/{away.get('id')}.png"
                }
                supabase.table('teams').upsert(team_data).execute()
                equipos_procesados.add(away.get('id'))

            # --- B. Datos del Partido ---
            
            # Estado normalizado para nuestra DB
            match_status = 'scheduled'
            if status_obj.get('cancelled'):
                match_status = 'cancelled'
            elif status_obj.get('finished'):
                match_status = 'finished'
            elif status_obj.get('started'):
                match_status = 'live'

            # Marcador seguro (maneja casos de null o strings)
            try:
                # FotMob a veces usa 'scoreStr' o propiedades directas
                h_score = int(home.get('score', 0)) if home.get('score') is not None else 0
                a_score = int(away.get('score', 0)) if away.get('score') is not None else 0
            except (ValueError, TypeError):
                h_score = 0
                a_score = 0

            # --- C. Upsert Partido (Tabla 'matches') ---
            match_record = {
                "id": match_id,
                "home_team_id": home.get('id'),
                "away_team_id": away.get('id'),
                "start_time": status_obj.get('utcTime'), # Supabase maneja UTC ISO directo
                "home_score": h_score,
                "away_score": a_score,
                "status": match_status,
                "round_name": match.get('roundName', '') # Ej: Jornada 1
            }

            # Upsert: crea si no existe, actualiza si existe
            supabase.table('matches').upsert(match_record).execute()
            partidos_procesados += 1

        print(f"🎉 Éxito: Se actualizaron {partidos_procesados} partidos en Supabase.")

    except Exception as e:
        print(f"❌ Error Crítico: {e}")
        # Importante: exit(1) marca el workflow como fallido en GitHub
        exit(1)

if __name__ == "__main__":
    run_scraper()
