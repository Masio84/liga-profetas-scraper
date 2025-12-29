import os
import requests
import json
from datetime import datetime
import pytz # Necesario para manejar la zona horaria de México
from supabase import create_client, Client

# --- CONFIGURACIÓN ---
# Asegúrate de que estas variables estén en tus GitHub Secrets
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")

if not url or not key:
    raise ValueError("Error: Faltan las credenciales SUPABASE_URL o SUPABASE_KEY")

supabase: Client = create_client(url, key)

def run_scraper():
    print("--- Iniciando Scraper de Liga de Profetas ---")
    
    # Usamos el ID 230 (Liga MX). Al no poner fecha, trae la temporada activa.
    league_id = 230
    api_url = f"https://www.fotmob.com/api/leagues?id={league_id}&ccode3=MEX"
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36"
    }

    try:
        # 1. Obtener datos de FotMob
        print(f"Consultando API: {api_url}")
        response = requests.get(api_url, headers=headers)
        response.raise_for_status()
        data = response.json()
        
        # FotMob devuelve los partidos en 'matches' -> 'allMatches'
        all_matches = data.get('matches', {}).get('allMatches', [])
        
        if not all_matches:
            print("ALERTA: FotMob no devolvió partidos. Verifica si cambió la temporada.")
            return

        print(f"Total de partidos encontrados en el calendario: {len(all_matches)}")
        
        # 2. Procesar y guardar en Supabase
        partidos_procesados = 0
        equipos_procesados = set() # Para no insertar el mismo equipo mil veces

        for match in all_matches:
            # Datos básicos
            match_id = match.get('id')
            home = match.get('home', {})
            away = match.get('away', {})
            status = match.get('status', {})
            
            # --- A. Guardar Equipos (Tabla 'teams') ---
            # Es vital insertar los equipos primero para evitar error de Foreign Key
            
            # Equipo Local
            if home.get('id') not in equipos_procesados:
                team_data = {
                    "id": home.get('id'),
                    "name": home.get('name'),
                    "logo_url": f"https://images.fotmob.com/image_resources/logo/teamlogo/{home.get('id')}.png"
                }
                # Upsert: Si existe no hace nada, si no existe lo crea
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

            # --- B. Guardar Partido (Tabla 'matches') ---
            
            # Determinar estado para nuestra BD (scheduled, live, finished)
            match_status = 'scheduled'
            if status.get('finished'):
                match_status = 'finished'
            elif status.get('started') and not status.get('finished'):
                match_status = 'live'
            if status.get('cancelled'):
                match_status = 'cancelled'

            # Marcadores (manejo de errores si vienen vacíos)
            try:
                # FotMob a veces manda el marcador como string "2" o int 2
                home_score = int(home.get('score', 0)) if home.get('score') is not None else 0
                away_score = int(away.get('score', 0)) if away.get('score') is not None else 0
            except ValueError:
                home_score = 0
                away_score = 0

            match_record = {
                "id": match_id,
                "home_team_id": home.get('id'),
                "away_team_id": away.get('id'),
                "start_time": status.get('utcTime'), # Supabase acepta formato ISO UTC directo
                "home_score": home_score,
                "away_score": away_score,
                "status": match_status,
                "round_name": match.get('roundName', '') # Ej: "Jornada 1"
            }

            # Upsert del partido
            supabase.table('matches').upsert(match_record).execute()
            partidos_procesados += 1

        print(f"¡Éxito! Se actualizaron/insertaron {partidos_procesados} partidos en Supabase.")

    except Exception as e:
        print(f"Error Crítico: {e}")
        exit(1) # Esto le avisa a GitHub Actions que hubo un error (X roja)

if __name__ == "__main__":
    run_scraper()
