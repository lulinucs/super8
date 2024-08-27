from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from pymongo import MongoClient
from pymongo.errors import PyMongoError
from typing import List, Dict, Optional
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from bson import ObjectId

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],  
    allow_headers=["*"],  
)

load_dotenv()
mongo_uri = os.getenv('MONGO_URI')
client = MongoClient(mongo_uri)
db = client['super8']
teams_collection = db['teams']
championships_collection = db['championships']

class Team(BaseModel):
    nome: str
    jogador1: str
    jogador2: str
    jogador3: str

class Championship(BaseModel):
    nome: str
    equipes: List[str]
    fases: List[Dict]

# Função auxiliar para converter ObjectId para string
def to_dict(item):
    item['_id'] = str(item['_id'])
    return item

class AddGroupStageRequest(BaseModel):
    championship_id: str


class MatchResult(BaseModel):
    team1: str
    team2: str
    score1: Optional[int] = Field(None, nullable=True)
    score2: Optional[int] = Field(None, nullable=True)

class UpdateGroupStageResultsRequest(BaseModel):
    championship_id: str
    results: List[MatchResult]

def calculate_pontuation(matches, team_ids):
    pontuation = {team_id: {"p": 0, "v": 0, "d": 0, "e": 0, "gp": 0, "gc": 0} for team_id in team_ids}
    
    for match in matches:
        score1 = match["score1"]
        score2 = match["score2"]
        team1 = match["team1"]
        team2 = match["team2"]

        if score1 is not None and score2 is not None:
            if score1 > score2:
                pontuation[team1]["p"] += 3
                pontuation[team1]["v"] += 1
                pontuation[team2]["d"] += 1
            elif score1 < score2:
                pontuation[team2]["p"] += 3
                pontuation[team2]["v"] += 1
                pontuation[team1]["d"] += 1
            else:
                pontuation[team1]["p"] += 1
                pontuation[team2]["p"] += 1
                pontuation[team1]["e"] += 1
                pontuation[team2]["e"] += 1

            pontuation[team1]["gp"] += score1
            pontuation[team1]["gc"] += score2
            pontuation[team2]["gp"] += score2
            pontuation[team2]["gc"] += score1
    
    return pontuation

class AddDoubleEliminationRequest(BaseModel):
    championship_id: str

@app.post("/add-double-elimination")
async def add_double_elimination(request: AddDoubleEliminationRequest):
    try:
        championship_id = ObjectId(request.championship_id)
        championship = championships_collection.find_one({"_id": championship_id})

        if not championship:
            raise HTTPException(status_code=404, detail="Campeonato não encontrado")

        # Verificar se já existe uma fase de grupos
        fase_grupos = next((fase for fase in championship.get("fases", []) if fase['nome'] == "Fase de Grupos"), None)

        if fase_grupos:
            # Verificar se todos os matches têm scores preenchidos
            incomplete_matches = [match for match in fase_grupos['matches'] if match['score1'] is None or match['score2'] is None]
            if incomplete_matches:
                raise HTTPException(status_code=400, detail="Termine a Fase de Grupos antes de gerar o Double Elimination")
            else:
                return {"message": "Double Elimination Criado"}
        else:
            # Fase de Grupos não encontrada, criar Double Elimination
            equipes = championship.get("equipes", [])
            if len(equipes) < 2:
                raise HTTPException(status_code=400, detail="Número insuficiente de equipes para Double Elimination")

            # Embaralhar a lista de equipes
            random.shuffle(equipes)

            # Criar a fase de Double Elimination
            fase_double_elimination = {
                "nome": "Double Elimination",
                "first_round": []
            }

            # Determinar se há um número ímpar de equipes
            if len(equipes) % 2 == 1:
                # Cabeça de chave
                cabeceia_chave = equipes.pop()
                matches = [
                    {"team1": equipes[i], "team2": equipes[i+1], "score1": None, "score2": None}
                    for i in range(0, len(equipes), 2)
                ]
                # Adicionar partida do Cabeça de Chave
                matches.append({"team1": cabeceia_chave, "team2": None, "score1": None, "score2": None})
            else:
                matches = [
                    {"team1": equipes[i], "team2": equipes[i+1], "score1": None, "score2": None}
                    for i in range(0, len(equipes), 2)
                ]

            fase_double_elimination["first_round"] = matches

            # Adicionar a nova fase ao campeonato
            update_result = championships_collection.update_one(
                {"_id": championship_id},
                {"$push": {"fases": fase_double_elimination}}
            )

            if update_result.modified_count == 1:
                return {"message": "Double Elimination criado com sucesso"}
            else:
                raise HTTPException(status_code=500, detail="Erro ao criar fase Double Elimination")

    except HTTPException as e:
        print(f"Erro: {e.detail}")
        raise
    except PyMongoError as e:
        print(f"Erro ao acessar o MongoDB: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao acessar o MongoDB: {str(e)}")

@app.put("/update-group-stage-results")
async def update_group_stage_results(request: UpdateGroupStageResultsRequest):
    try:
        print(f"Recebido: {request}")

        championship_id = ObjectId(request.championship_id)
        championship = championships_collection.find_one({"_id": championship_id})

        if not championship:
            raise HTTPException(status_code=404, detail="Campeonato não encontrado")

        fase_grupos = next((fase for fase in championship.get("fases", []) if fase['nome'] == "Fase de Grupos"), None)
        if not fase_grupos:
            raise HTTPException(status_code=400, detail="Fase de Grupos não encontrada")

        matches = fase_grupos['matches']

        # Atualizar os resultados das partidas
        for result in request.results:
            for match in matches:
                if match['team1'] == result.team1 and match['team2'] == result.team2:
                    match['score1'] = result.score1
                    match['score2'] = result.score2

        # Recalcular a pontuação
        team_ids = championship.get("equipes", [])
        pontuation = calculate_pontuation(matches, team_ids)

        # Atualizar o banco de dados
        championships_collection.update_one(
            {"_id": championship_id, "fases.nome": "Fase de Grupos"},
            {"$set": {"fases.$.matches": matches, "fases.$.pontuation": pontuation}}
        )

        return {"message": "Resultados da fase de grupos atualizados com sucesso", "pontuation": pontuation}

    except HTTPException as e:
        print(f"Erro: {e.detail}")
        raise
    except PyMongoError as e:
        print(f"Erro ao acessar o MongoDB: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao acessar o MongoDB: {str(e)}")

@app.post("/add-group-stage")
async def add_group_stage(request: AddGroupStageRequest):
    try:
        print(f"Recebido: {request}")

        championship_id = ObjectId(request.championship_id)
        championship = championships_collection.find_one({"_id": championship_id})
        
        if not championship:
            raise HTTPException(status_code=404, detail="Campeonato não encontrado")

        if any(fase['nome'] == "Fase de Grupos" for fase in championship.get("fases", [])):
            raise HTTPException(status_code=400, detail="A fase de grupos já foi adicionada")

        team_ids = championship.get("equipes", [])
        num_teams = len(team_ids)

        if num_teams < 2:
            raise HTTPException(status_code=400, detail="Número insuficiente de times para a fase de grupos")

        matches = []
        round_robin_schedule = []

        # Criar uma lista de times para round-robin
        teams = team_ids.copy()

        if num_teams % 2 == 1:
            teams.append(None)  # Adicionar um time fictício para o "bye"

        num_rounds = len(teams) - 1
        num_matches_per_round = len(teams) // 2

        for round_num in range(num_rounds):
            round_matches = []
            for match_num in range(num_matches_per_round):
                team1 = teams[match_num]
                team2 = teams[len(teams) - 1 - match_num]
                if team1 and team2:  # Ignorar partidas com o time fictício
                    round_matches.append({"team1": team1, "team2": team2, "score1": None, "score2": None})
            round_robin_schedule.append(round_matches)
            teams.insert(1, teams.pop())  # Rotacionar a lista de times

        matches = [match for round_matches in round_robin_schedule for match in round_matches]

        pontuation = {team_id: {"p": 0, "v": 0, "d": 0, "e": 0, "gp": 0, "gc": 0} for team_id in championship.get("equipes", [])}

        championships_collection.update_one(
            {"_id": championship_id},
            {"$push": {"fases": {"nome": "Fase de Grupos", "matches": matches, "pontuation": pontuation}}}
        )
        return {"message": "Fase de grupos adicionada com sucesso"}

    except HTTPException as e:
        print(f"Erro: {e.detail}")
        raise
    except PyMongoError as e:
        print(f"Erro ao acessar o MongoDB: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao acessar o MongoDB: {str(e)}")

    
# Rota para listar campeonatos
@app.get("/championships")
async def list_championships():
    championships = list(championships_collection.find())
    return JSONResponse(content=[to_dict(champ) for champ in championships])

# Rota para criar um novo campeonato
@app.post("/new-champ")
async def create_championship(championship: Championship):
    try:
        result = championships_collection.insert_one(championship.dict())
        return {"id": str(result.inserted_id)}
    except PyMongoError as e:
        raise HTTPException(status_code=500, detail=f"Erro ao inserir campeonato no MongoDB: {str(e)}")

@app.post("/create-team")
async def create_team(team: Team):
    try:
        result = teams_collection.insert_one(team.dict())
        return {"id": str(result.inserted_id)}
    except PyMongoError as e:
        raise HTTPException(status_code=500, detail=f"Erro ao inserir no MongoDB: {str(e)}")

@app.get("/teams")
async def get_teams():
    try:
        teams = list(teams_collection.find())
        for team in teams:
            team['_id'] = str(team['_id'])  # Converte ObjectId para string
        return teams
    except PyMongoError as e:
        raise HTTPException(status_code=500, detail=f"Erro ao buscar times: {str(e)}")

@app.get("/teams/{team_id}")
async def get_team(team_id: str):
    try:
        team = teams_collection.find_one({"_id": ObjectId(team_id)})
        if team:
            team['_id'] = str(team['_id'])  # Converte ObjectId para string
            return team
        else:
            raise HTTPException(status_code=404, detail="Time não encontrado")
    except PyMongoError as e:
        raise HTTPException(status_code=500, detail=f"Erro ao buscar time: {str(e)}")

@app.put("/update-team/{team_id}")
async def update_team(team_id: str, updated_team: Team):
    try:
        result = teams_collection.update_one({"_id": ObjectId(team_id)}, {"$set": updated_team.dict()})
        if result.matched_count:
            return {"message": "Time atualizado com sucesso"}
        else:
            raise HTTPException(status_code=404, detail="Time não encontrado")
    except PyMongoError as e:
        raise HTTPException(status_code=500, detail=f"Erro ao atualizar time: {str(e)}")

@app.delete("/delete-team/{team_id}")
async def delete_team(team_id: str):
    try:
        result = teams_collection.delete_one({"_id": ObjectId(team_id)})
        if result.deleted_count:
            return {"message": "Time excluído com sucesso"}
        else:
            raise HTTPException(status_code=404, detail="Time não encontrado")
    except PyMongoError as e:
        raise HTTPException(status_code=500, detail=f"Erro ao excluir time: {str(e)}")

# Nova rota para obter detalhes de um campeonato pelo ID
@app.get("/championships/{championship_id}")
async def get_championship(championship_id: str):
    try:
        championship = championships_collection.find_one({"_id": ObjectId(championship_id)})
        if championship:
            return JSONResponse(content=to_dict(championship))
        else:
            raise HTTPException(status_code=404, detail="Campeonato não encontrado")
    except PyMongoError as e:
        raise HTTPException(status_code=500, detail=f"Erro ao buscar campeonato: {str(e)}")
