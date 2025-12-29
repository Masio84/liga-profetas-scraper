import os
import requests
from datetime import datetime, timedelta
from supabase import create_client, Client

# Configuración de Supabase
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

def fetch_ligamx_matches():
    # El endpoint de FotMob para ligas requiere la fecha. 
    # Consultaremos un rango de días para cubrir tu requerimiento.
    league_id = 230
    base_url = "https://www.fotmob.com/api/leagues"
    
    # Rango: -1 día a +7 días
    start_date = datetime.now() - timedelta(days=1)
    matches_to_process = []

    for i in range(9):  # 1 pasado + hoy + 7 futuros
        current_date = (start_date + timedelta(days=i)).strftime('%Y%m%d')
        print(f"Consultando fecha: {current_date}")
        
        params = {'id': league_id, 'type': 'league', 'timezone': 'America/Mexico_City'}
        response = requests.get(base_url, params=params)
        
        if response.status_code == 200:
            data = response.json()
            # Navegamos en el JSON de FotMob para encontrar los partidos
            matches = data.get('matches', {}).get('allMatches', [])
            matches_to_process.extend(matches)
            
    return matches_to_process

def sync_to_supabase(matches):
    for m in matches:
        # 1. Upsert de Equipos (Para evitar errores de FK)
        teams = [
            {"id": m['home']['id'], "name": m['home']['name']},
            {"id": m['away']['id'], "name": m['away']['name']}
        ]
        supabase.table("teams").upsert(teams).execute()

        # 2. Preparar datos del partido
        match_data = {
            "id": m['id'],
            "home_team_id": m['home']['id'],
            "away_team_id": m['away']['id'],
            "start_time": m['status']['utcTime'],
            "status": m['status']['reason'] if 'reason' in m['status'] else "scheduled",
            "scores": {
                "home": m['home'].get('score'),
                "away": m['away'].get('score')
            }
        }
        
        # 3. Upsert del Partido
        supabase.table("matches").upsert(match_data).execute()
        print(f"Sincronizado: {m['home']['name']} vs {m['away']['name']}")

if __name__ == "__main__":
    print("Iniciando actualización de Liga MX...")
    matches = fetch_ligamx_matches()
    if matches:
        sync_to_supabase(matches)
        print("Sincronización completada con éxito.")
    else:
        print("No se encontraron partidos en el rango seleccionado.")
