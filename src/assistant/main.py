from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from firebase_admin import credentials, initialize_app
from .helpers.firebase import get_user_token
import os
import chromadb
from .helpers.chroma_loader import load_texts
from .helpers.qa_chain import get_qa_chain
from chromadb.utils import embedding_functions

PYTHON_ENV = os.getenv("PYTHON_ENV", "development")
DATA_DIR = os.getenv("DATA_DIR", "/data")

credential = credentials.Certificate(FIREBASE_KEY_PATH)
initialize_app(credential)

# INIT CHROMA DB CLIENT
chroma_client = chromadb.PersistentClient(path=DATA_DIR)

# CREATE OPENAI EMBEDDING FUNCTION
openai_ef = embedding_functions.OpenAIEmbeddingFunction(
    api_key=os.getenv("OPENAI_API_KEY"),
    model_name="text-embedding-ada-002"
)

# INIT FastAPI
app = FastAPI(debug=(PYTHON_ENV == "development"))

# CORS
origins = ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ROUTES

@app.get("/")
def read_root():
    return {"Hello": "World"}

# Create pod
@app.post("/pod")
async def create_pod(user = Depends(get_user_token)):
    return {"Hello": user}

# Create seed
@app.post("/seed/{pod_id}")
async def create_seed(pod_id: str):

    # CREATE COLLECTION
    print(f"Creating {pod_id} collection")
    collection = chroma_client.get_or_create_collection(pod_id, embedding_function=openai_ef)
    print(f"{pod_id} has {collection.count()} documents")

    # LOAD TEXTS AS DOCUMENTS
    print("Loading seed texts")
    raw_texts = [
        "When your are coming from the driveway and facing the building, the key box is found on the right facade of the building. This is also the facade where the covered terrace is. The key box is underneath the electricity installation.",
        "To turn on the shower you first need to open the valve located under the kitchen sink.",
        "A thermostat under the kitchen sink controls the water temperature in the outdoor shower.",
        "Before you use the toilet make sure that there is a plastic bag in the bucket. Open the toilet (not the lid, but the lower opening) to check the bucket."
    ]
    load_texts(collection, raw_texts)
    print(f"{pod_id} has {collection.count()} documents")

    return {"msg": f"Loaded seed documents in collection {pod_id}", "doc_count": collection.count()}

# Delete seed
@app.delete("/seed/{pod_id}")
async def delete_seed(pod_id: str):

    # CREATE COLLECTION
    print(f"Deleting {pod_id} collection")
    chroma_client.delete_collection(pod_id)

    return {"msg": f"Deleted collection {pod_id}"}
    

# Query pod
@app.get("/query/{pod_id}")
def ask_pod(pod_id: str, q: str):

    try:
        qa_chain = get_qa_chain(chroma_client, pod_id)
    except:
        raise HTTPException(status_code=500, detail="Couldn't establish QA chain for collection")
    
    # QUERY THE COLLECTION
    try:
        result = qa_chain({"query": q})
    except:
        raise HTTPException(status_code=500, detail="Couldn't query collection")
    
    return {"pod_id": pod_id, "result": result}